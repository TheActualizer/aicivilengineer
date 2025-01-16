import { useEffect, useState } from 'react';
import { Brain, Activity, AlertCircle, Settings, FileText, Network, Cpu, Database, Workflow, Mic } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoiceControls } from "@/components/DebugPanel/VoiceControls";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { initializeAgentFlow, queryAgentContext, subscribeToAgentUpdates } from '@/utils/agentFlow';
import type { DifyAgent, AgentAction, AgentState, AgentsPanelProps } from './types';
import { AgentMetrics } from './AgentMetrics';
import { AgentNetwork } from './AgentNetwork';

const INITIAL_AGENTS: DifyAgent[] = [
  {
    id: 'data-ingestion',
    name: 'Data Ingestion Agent',
    role: 'Processes input data and prepares for analysis',
    status: 'idle',
    backstory: 'A meticulous data scientist with years of experience in processing complex datasets.',
    systemPrompt: 'You are a data processing expert. Your role is to clean, validate, and prepare data for analysis.',
    model: 'gemini'
  },
  {
    id: 'parcel-analysis',
    name: 'Parcel Analysis Agent',
    role: 'Analyzes property boundaries and geometry',
    status: 'idle',
    backstory: 'A veteran land surveyor who has mapped thousands of properties across the country.',
    systemPrompt: 'You are an expert land surveyor. Your role is to analyze property boundaries and geometric characteristics.',
    model: 'gemini-vision'
  },
  {
    id: 'setback-calculation',
    name: 'Setback Calculation Agent',
    role: 'Calculates required setbacks and buffers',
    status: 'idle',
    backstory: 'A precise mathematician specializing in spatial calculations and zoning regulations.',
    systemPrompt: 'You are a zoning expert. Your role is to calculate required setbacks and buffers for properties.',
    model: 'grok'
  },
  {
    id: 'computer-assistant',
    name: 'Computer Assistant Agent',
    role: 'Assists with computer-related tasks and automation',
    status: 'idle',
    backstory: 'An AI assistant with deep knowledge of computer systems and automation capabilities.',
    systemPrompt: 'You are a computer expert. Your role is to assist with computer-related tasks and automation.',
    model: 'claude'
  },
];

export function AgentsPanel({ onMessage, onVoiceInput, messages }: AgentsPanelProps) {
  const { toast } = useToast();
  const [state, setState] = useState<AgentState>({
    agents: INITIAL_AGENTS,
    actions: [],
    currentPhase: 'initialization',
    isProcessing: false
  });
  const [selectedAgent, setSelectedAgent] = useState<DifyAgent | null>(null);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [threadAnalysis, setThreadAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoAnalysis, setAutoAnalysis] = useState(false);
  const [analysisInterval, setAnalysisInterval] = useState<number | null>(null);

  useEffect(() => {
    console.log('Initializing thread analysis subscription...');
    const channel = supabase
      .channel('thread-analysis')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'debug_thread_analysis',
          filter: `page_path=eq.ai-civil-engineer`
        },
        (payload) => {
          console.log('Thread analysis update:', payload);
          setThreadAnalysis(payload.new);
          
          if (payload.new.connection_score > (payload.old?.connection_score || 0)) {
            toast({
              title: "Thread Connection Achievement! 🎯",
              description: `New connection score: ${payload.new.connection_score}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up thread analysis subscription');
      supabase.removeChannel(channel);
    };
  }, [toast]);

  useEffect(() => {
    if (autoAnalysis && !analysisInterval) {
      const interval = window.setInterval(startClaudeAnalysis, 300000); // Run every 5 minutes
      setAnalysisInterval(interval);
      console.log('Started automated Claude analysis');
    } else if (!autoAnalysis && analysisInterval) {
      window.clearInterval(analysisInterval);
      setAnalysisInterval(null);
      console.log('Stopped automated Claude analysis');
    }

    return () => {
      if (analysisInterval) {
        window.clearInterval(analysisInterval);
      }
    };
  }, [autoAnalysis]);

  const startClaudeAnalysis = async () => {
    console.log('Starting Claude analysis...');
    setIsAnalyzing(true);
    
    try {
      const { data: analysisData, error } = await supabase.functions.invoke('claude-compute', {
        body: {
          messages: [{ 
            role: 'user', 
            content: 'Analyze the current page state and identify potential issues or improvements.' 
          }],
          systemPrompt: 'You are an expert system analyzer. Identify UI/UX issues, data inconsistencies, and potential improvements.',
          pageContext: {
            route: 'ai-civil-engineer',
            agents: state.agents,
            actions: state.actions
          }
        }
      });

      if (error) throw error;

      const { data: threadUpdate, error: updateError } = await supabase
        .from('debug_thread_analysis')
        .upsert({
          page_path: 'ai-civil-engineer',
          thread_type: 'claude-analysis',
          analysis_data: analysisData,
          analysis_status: 'completed',
          last_analysis_timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (updateError) throw updateError;

      setThreadAnalysis(threadUpdate);
      
      toast({
        title: "Analysis Complete",
        description: "Claude has analyzed the current page state.",
      });
    } catch (error) {
      console.error('Error in Claude analysis:', error);
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: "Failed to complete Claude analysis.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCompute = async (message: string, agent: DifyAgent) => {
    try {
      const flowId = await initializeAgentFlow(agent, 'compute', { message });
      console.log(`Initialized flow ${flowId} for agent:`, agent.name);

      const context = await queryAgentContext(message);
      console.log('Retrieved context for computation:', context);

      const unsubscribe = await subscribeToAgentUpdates(agent.id, (update) => {
        console.log(`Received update for agent ${agent.name}:`, update);
        setState(prev => ({
          ...prev,
          agents: prev.agents.map(a => 
            a.id === agent.id 
              ? { ...a, status: update.new.status }
              : a
          )
        }));
      });

      const response = await handleModelCompute(agent, message, context);
      console.log(`Compute response from ${agent.model}:`, response);

      unsubscribe();

      return response;
    } catch (error) {
      console.error('Error in handleCompute:', error);
      throw error;
    }
  };

  const handleModelCompute = async (
    agent: DifyAgent, 
    message: string, 
    context: any[]
  ) => {
    const systemPrompt = `${agent.systemPrompt || `You are ${agent.name}. ${agent.backstory}`}\n\nRelevant context:\n${
      context.map(c => `${c.content} (${c.source})`).join('\n')
    }`;

    if (agent.model === 'claude') {
      console.log('Calling claude-compute for agent:', agent.name);
      const { data, error } = await supabase.functions.invoke('claude-compute', {
        body: {
          messages: [{ role: 'user', content: message }],
          systemPrompt
        }
      });

      if (error) {
        console.error('Error calling claude-compute:', error);
        throw error;
      }

      return data.content;
    }

    const functionName = `${agent.model || 'claude'}-compute`;
    console.log(`Calling ${functionName} for agent:`, agent.name);

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        messages: [{ role: 'user', content: message }],
        systemPrompt,
        multimodal: agent.model === 'gemini-vision'
      }
    });

    if (error) {
      console.error(`Error calling ${functionName}:`, error);
      throw error;
    }

    return agent.model === 'perplexity' 
      ? data.choices[0].message.content 
      : data.content;
  };

  const handleCustomInstructions = async () => {
    if (!selectedAgent) return;
    
    setState(prev => ({
      ...prev,
      agents: prev.agents.map(agent => 
        agent.id === selectedAgent.id 
          ? { ...agent, status: 'processing' }
          : agent
      )
    }));

    try {
      const response = await handleCompute(customInstructions, selectedAgent);
      await onMessage(response, selectedAgent.name);

      const newAction: AgentAction = {
        id: crypto.randomUUID(),
        description: `Processed instructions for ${selectedAgent.name}`,
        timestamp: new Date().toISOString(),
        agentId: selectedAgent.id,
        status: 'success'
      };

      setState(prev => ({
        ...prev,
        actions: [newAction, ...prev.actions],
        agents: prev.agents.map(agent => 
          agent.id === selectedAgent.id 
            ? { ...agent, status: 'completed' }
            : agent
        )
      }));

      toast({
        title: "Instructions Processed",
        description: `${selectedAgent.name} has processed the instructions.`,
      });
    } catch (error) {
      console.error('Error processing instructions:', error);
      
      setState(prev => ({
        ...prev,
        agents: prev.agents.map(agent => 
          agent.id === selectedAgent.id 
            ? { ...agent, status: 'error' }
            : agent
        )
      }));
    }
  };

  const getStatusColor = (status: DifyAgent['status']) => {
    switch (status) {
      case 'processing':
        return 'text-yellow-500';
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const handleSpeakingChange = (speaking: boolean) => {
    setIsSpeaking(speaking);
    if (speaking) {
      toast({
        title: "Agent is speaking",
        description: "Listening to agent response...",
      });
    }
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-gray-100">AI Agent Network</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="lg"
              className={`rounded-full p-4 transition-all duration-200 ${
                isSpeaking ? 'bg-green-500/20 border-green-500' : 'hover:bg-primary/20'
              }`}
              onClick={() => setIsSpeaking(!isSpeaking)}
            >
              <Mic className={`h-6 w-6 ${isSpeaking ? 'text-green-500 animate-pulse' : 'text-primary'}`} />
              <span className="sr-only">Toggle voice input</span>
            </Button>
            <VoiceControls onSpeakingChange={handleSpeakingChange} />
            {state.isProcessing && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-400/50">
                Processing
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="claude-analysis">Claude Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AgentMetrics />
          </TabsContent>

          <TabsContent value="metrics">
            <div className="space-y-4">
              <AgentMetrics />
              <AgentNetwork />
            </div>
          </TabsContent>

          <TabsContent value="agents">
            <ScrollArea className="h-[500px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.agents.map(agent => (
                  <div 
                    key={agent.id} 
                    className="p-4 border border-gray-700 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors cursor-pointer"
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Brain className={`h-5 w-5 ${getStatusColor(agent.status)}`} />
                        <h3 className="font-medium text-gray-200">{agent.name}</h3>
                      </div>
                      <Badge 
                        variant={agent.status === 'completed' ? 'default' : 'secondary'}
                        className={`${getStatusColor(agent.status)}`}
                      >
                        {agent.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{agent.role}</p>
                    {agent.progress !== undefined && (
                      <Progress value={agent.progress} className="h-1" />
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-gray-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAgent(agent);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      {agent.documents && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-gray-300"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Docs
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="network">
            <AgentNetwork />
          </TabsContent>

          <TabsContent value="logs">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {state.actions.map((action) => (
                  <div 
                    key={action.id}
                    className="flex items-center gap-2 text-sm p-2 rounded-md bg-gray-800/30"
                  >
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{action.description}</span>
                    <span className="text-gray-500 text-xs ml-auto">
                      {new Date(action.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="claude-analysis">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-200">Thread Analysis</h3>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setAutoAnalysis(!autoAnalysis)}
                      className={autoAnalysis ? 'bg-green-500/20 border-green-500' : ''}
                    >
                      {autoAnalysis ? 'Stop Auto Analysis' : 'Start Auto Analysis'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={startClaudeAnalysis}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Run Analysis Now'}
                    </Button>
                  </div>
                </div>
                {threadAnalysis && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400">
                        Score: {threadAnalysis.connection_score}
                      </Badge>
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-400">
                        Status: {threadAnalysis.analysis_status}
                      </Badge>
                      {autoAnalysis && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-400">
                          Auto Analysis Active
                        </Badge>
                      )}
                    </div>
                    {threadAnalysis.analysis_data && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-300">Analysis Results</h4>
                        <pre className="p-4 bg-gray-800/50 rounded-lg overflow-x-auto text-sm text-gray-300">
                          {JSON.stringify(threadAnalysis.analysis_data, null, 2)}
                        </pre>
                      </div>
                    )}
                    {threadAnalysis.suggested_connections?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-300">Suggested Connections</h4>
                        <div className="grid gap-2">
                          {threadAnalysis.suggested_connections.map((connection: any, index: number) => (
                            <div 
                              key={index}
                              className="p-3 bg-gray-800/30 rounded-lg border border-gray-700"
                            >
                              <p className="text-sm text-gray-300">{connection.description}</p>
                              {connection.score && (
                                <Badge className="mt-2" variant="outline">
                                  Score: {connection.score}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {selectedAgent && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="mt-4">Configure Agent</Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 text-gray-100">
              <DialogHeader>
                <DialogTitle>{selectedAgent.name} Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Backstory</h4>
                  <p className="text-sm text-gray-400">{selectedAgent.backstory}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Custom Instructions</h4>
                  <Textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Enter custom instructions for this agent..."
                    className="h-32"
                  />
                </div>
                <Button onClick={handleCustomInstructions}>
                  Update Instructions
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}