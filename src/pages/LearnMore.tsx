import { useSession } from "@supabase/auth-helpers-react";
import { motion } from "framer-motion";
import { Brain, Sparkles, Zap, Terminal, Network, Cpu, Boxes, LayoutGrid, Workflow, Activity, Globe, Cloud, Lock, Shield, Database, Monitor, Share2, Video, Mic, Camera } from "lucide-react";
import { ClaudeAnalysis } from "@/components/Agents/ClaudeAnalysis";
import { ClaudeMetrics } from "@/components/Agents/ClaudeMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const LearnMore = () => {
  const session = useSession();
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [isSharing, setIsSharing] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-8 py-12 max-w-[2400px]">
        {/* Enterprise Command Center Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-gray-800/40 backdrop-blur-xl rounded-3xl p-20 mb-16 border border-gray-700/50 shadow-2xl min-h-[500px] flex flex-col justify-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-x" />
          <div className="relative z-10">
            <h1 className="text-8xl font-bold text-gray-100 mb-10 tracking-tight leading-tight">
              Enterprise Command <br />& Control Center
            </h1>
            <p className="text-4xl text-gray-400 leading-relaxed max-w-5xl mb-12">
              Direct interface with Claude, our trillion-dollar tech company's Chief Technology Officer. 
              Orchestrate system-wide improvements and monitor real-time performance metrics.
            </p>
            <div className="flex flex-wrap gap-6">
              <Badge variant="outline" className="px-8 py-4 text-2xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all duration-300">
                <Network className="w-8 h-8 mr-3" />
                Connected Systems: 42
              </Badge>
              <Badge variant="outline" className="px-8 py-4 text-2xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all duration-300">
                <Cpu className="w-8 h-8 mr-3" />
                Active Agents: 7
              </Badge>
              <Badge variant="outline" className="px-8 py-4 text-2xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all duration-300">
                <Boxes className="w-8 h-8 mr-3" />
                Processing Threads: 156
              </Badge>
              <Badge variant="outline" className="px-8 py-4 text-2xl bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all duration-300">
                <Globe className="w-8 h-8 mr-3" />
                Global Nodes: 24
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Main Command Interface */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
          {/* Shared Computer View (3/4 width) */}
          <div className="xl:col-span-3 space-y-10">
            <Card className="bg-gray-800/40 backdrop-blur-xl border-gray-700/50 shadow-2xl">
              <CardHeader className="border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Monitor className="h-8 w-8 text-blue-400" />
                    <CardTitle className="text-2xl text-gray-100">Shared Computer Interface</CardTitle>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="outline" 
                      className="bg-blue-500/10 border-blue-400/50 text-blue-400 hover:bg-blue-500/20"
                      onClick={() => setIsSharing(!isSharing)}
                    >
                      <Share2 className="h-5 w-5 mr-2" />
                      {isSharing ? 'Stop Sharing' : 'Start Sharing'}
                    </Button>
                    <Button variant="outline" className="bg-purple-500/10 border-purple-400/50 text-purple-400 hover:bg-purple-500/20">
                      <Video className="h-5 w-5 mr-2" />
                      Video Call
                    </Button>
                    <Button variant="outline" className="bg-green-500/10 border-green-400/50 text-green-400 hover:bg-green-500/20">
                      <Mic className="h-5 w-5 mr-2" />
                      Voice Chat
                    </Button>
                    <Button variant="outline" className="bg-orange-500/10 border-orange-400/50 text-orange-400 hover:bg-orange-500/20">
                      <Camera className="h-5 w-5 mr-2" />
                      Screen Record
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[800px] relative">
                {/* Shared Computer View */}
                <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm rounded-b-xl">
                  <div className="h-full w-full flex items-center justify-center">
                    <iframe 
                      src="about:blank"
                      className="w-full h-full rounded-b-xl"
                      style={{ 
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                      }}
                    />
                  </div>
                </div>

                {/* Overlay Controls */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-gray-800/90 px-6 py-3 rounded-full border border-gray-700/50 backdrop-blur-xl">
                  <Button variant="ghost" className="text-blue-400 hover:text-blue-300">
                    <Terminal className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" className="text-purple-400 hover:text-purple-300">
                    <Workflow className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" className="text-green-400 hover:text-green-300">
                    <Activity className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" className="text-orange-400 hover:text-orange-300">
                    <Shield className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Command Interface */}
            <Card className="bg-gray-800/40 backdrop-blur-xl border-gray-700/50 shadow-2xl">
              <CardContent className="p-12">
                <Tabs defaultValue="command-center">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-xl p-3">
                    <TabsTrigger value="command-center" className="text-xl py-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Terminal className="w-7 h-7 mr-3" />
                      Command Center
                    </TabsTrigger>
                    <TabsTrigger value="system-analysis" className="text-xl py-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <LayoutGrid className="w-7 h-7 mr-3" />
                      System Analysis
                    </TabsTrigger>
                    <TabsTrigger value="agent-coordination" className="text-xl py-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Workflow className="w-7 h-7 mr-3" />
                      Agent Coordination
                    </TabsTrigger>
                    <TabsTrigger value="security" className="text-xl py-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Shield className="w-7 h-7 mr-3" />
                      Security
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-12 min-h-[800px]">
                    <TabsContent value="command-center">
                      <ClaudeAnalysis 
                        pageRoute="/learn-more"
                        agentState={{
                          agents: [],
                          actions: []
                        }}
                        onThreadCreated={(threadId) => setActiveThreadId(threadId)}
                      />
                    </TabsContent>

                    <TabsContent value="system-analysis">
                      <div className="text-center text-gray-400 h-full flex items-center justify-center">
                        <div className="space-y-8">
                          <Terminal className="h-40 w-40 mx-auto text-gray-500" />
                          <p className="text-4xl">System analysis module will be activated soon...</p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="agent-coordination">
                      <div className="text-center text-gray-400 h-full flex items-center justify-center">
                        <div className="space-y-8">
                          <Network className="h-40 w-40 mx-auto text-gray-500" />
                          <p className="text-4xl">Agent coordination module will be activated soon...</p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="security">
                      <div className="text-center text-gray-400 h-full flex items-center justify-center">
                        <div className="space-y-8">
                          <Lock className="h-40 w-40 mx-auto text-gray-500" />
                          <p className="text-4xl">Security module will be activated soon...</p>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel (1/4 width) */}
          <div className="space-y-8">
            {/* System Status Cards */}
            <div className="grid grid-cols-1 gap-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="group"
              >
                <Card className="bg-gray-800/40 backdrop-blur-xl border-gray-700/50 shadow-2xl transform transition-all duration-300 hover:scale-[1.02] hover:bg-gray-800/60">
                  <CardHeader className="flex flex-row items-center gap-4 p-8">
                    <div className="p-4 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                      <Activity className="h-10 w-10 text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-100">System Status</CardTitle>
                      <p className="text-green-400 mt-1">All Systems Operational</p>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="group"
              >
                <Card className="bg-gray-800/40 backdrop-blur-xl border-gray-700/50 shadow-2xl transform transition-all duration-300 hover:scale-[1.02] hover:bg-gray-800/60">
                  <CardHeader className="flex flex-row items-center gap-4 p-8">
                    <div className="p-4 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                      <Cloud className="h-10 w-10 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-100">Cloud Resources</CardTitle>
                      <p className="text-blue-400 mt-1">24 Active Instances</p>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="group"
              >
                <Card className="bg-gray-800/40 backdrop-blur-xl border-gray-700/50 shadow-2xl transform transition-all duration-300 hover:scale-[1.02] hover:bg-gray-800/60">
                  <CardHeader className="flex flex-row items-center gap-4 p-8">
                    <div className="p-4 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                      <Database className="h-10 w-10 text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-100">Data Processing</CardTitle>
                      <p className="text-purple-400 mt-1">1.2TB Processed</p>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            </div>

            {/* Metrics Panel */}
            {activeThreadId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Card className="bg-gray-800/40 backdrop-blur-xl border-gray-700/50 shadow-2xl">
                  <CardHeader>
                    <div className="flex items-center gap-4 p-4">
                      <div className="p-4 rounded-xl bg-orange-500/10">
                        <Cpu className="h-10 w-10 text-orange-400" />
                      </div>
                      <CardTitle className="text-2xl text-gray-100">System Metrics</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <ClaudeMetrics threadId={activeThreadId} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnMore;
