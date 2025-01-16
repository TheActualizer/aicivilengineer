import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, Cpu, Network, Database } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AgentMetricsData } from '@/types/agent';

const initialMetrics: AgentMetricsData = {
  cpuUsage: 0,
  memoryUsage: 0,
  networkLatency: 0,
  activeFlows: 0,
  successRate: 0,
  totalInteractions: 0,
  system_load: {
    cpu_threads: [],
    io_operations: [],
    memory_allocation: []
  },
  networkMetrics: {
    bandwidth_usage: [],
    connection_pool: [],
    latency_history: []
  },
  performanceIndicators: {
    error_rate: [],
    throughput: [],
    response_times: []
  }
};

export function AgentMetrics() {
  const [metrics, setMetrics] = useState<AgentMetricsData>(initialMetrics);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    console.log('Initializing metrics subscription...');
    
    const channel = supabase
      .channel('agent-metrics')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_metrics'
        },
        (payload) => {
          console.log('New metrics received:', payload);
          setLastUpdate(new Date().toISOString());
          
          const system_load = typeof payload.new.system_load === 'string' 
            ? JSON.parse(payload.new.system_load)
            : payload.new.system_load || initialMetrics.system_load;

          const networkMetrics = typeof payload.new.network_metrics === 'string'
            ? JSON.parse(payload.new.network_metrics)
            : payload.new.network_metrics || initialMetrics.networkMetrics;

          const performanceIndicators = typeof payload.new.performance_indicators === 'string'
            ? JSON.parse(payload.new.performance_indicators)
            : payload.new.performance_indicators || initialMetrics.performanceIndicators;

          const newMetrics: AgentMetricsData = {
            cpuUsage: payload.new.cpu_usage || 0,
            memoryUsage: payload.new.memory_usage || 0,
            networkLatency: payload.new.network_latency || 0,
            activeFlows: payload.new.active_flows || 0,
            successRate: payload.new.success_rate || 0,
            totalInteractions: payload.new.total_interactions || 0,
            system_load,
            networkMetrics,
            performanceIndicators
          };

          setMetrics(newMetrics);
          
          setHistoricalData(prev => [...prev, {
            timestamp: new Date().toISOString(),
            cpu: newMetrics.cpuUsage,
            memory: newMetrics.memoryUsage,
            network: newMetrics.networkLatency
          }].slice(-20));
        }
      )
      .subscribe();

    const fetchInitialMetrics = async () => {
      const { data, error } = await supabase
        .from('agent_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching metrics:', error);
        return;
      }

      if (data) {
        const system_load = typeof data.system_load === 'string' 
          ? JSON.parse(data.system_load)
          : data.system_load || initialMetrics.system_load;

        const networkMetrics = typeof data.network_metrics === 'string'
          ? JSON.parse(data.network_metrics)
          : data.network_metrics || initialMetrics.networkMetrics;

        const performanceIndicators = typeof data.performance_indicators === 'string'
          ? JSON.parse(data.performance_indicators)
          : data.performance_indicators || initialMetrics.performanceIndicators;

        const initialData: AgentMetricsData = {
          cpuUsage: data.cpu_usage || 0,
          memoryUsage: data.memory_usage || 0,
          networkLatency: data.network_latency || 0,
          activeFlows: data.active_flows || 0,
          successRate: data.success_rate || 0,
          totalInteractions: data.total_interactions || 0,
          system_load,
          networkMetrics,
          performanceIndicators
        };
        setMetrics(initialData);
      }
    };

    fetchInitialMetrics();

    return () => {
      console.log('Cleaning up metrics subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  const MetricSource = ({ metric, value, timestamp }: { metric: string; value: number; timestamp: string }) => (
    <TooltipProvider>
      <UITooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-gray-400 hover:text-primary cursor-help inline-block ml-2" />
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <p className="text-sm font-medium">Data Source: agent_metrics table</p>
            <p className="text-xs text-gray-500">Last updated: {new Date(timestamp).toLocaleTimeString()}</p>
            <p className="text-xs text-gray-500">Current value: {value.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Table: public.agent_metrics</p>
            <p className="text-xs text-gray-500">Column: {metric}</p>
          </div>
        </TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-200">
            <Cpu className="h-4 w-4 text-primary inline mr-2" />
            System Load
            <MetricSource 
              metric="cpu_usage" 
              value={metrics.cpuUsage} 
              timestamp={lastUpdate}
            />
          </CardTitle>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Badge 
              variant={metrics.cpuUsage > 80 ? "destructive" : "default"}
              className="bg-green-500/10 text-green-400"
            >
              {metrics.cpuUsage > 80 ? 'High' : 'Normal'}
            </Badge>
          </motion.div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">
                  CPU Usage
                  <MetricSource 
                    metric="cpu_usage" 
                    value={metrics.cpuUsage} 
                    timestamp={lastUpdate}
                  />
                </span>
                <motion.span 
                  key={metrics.cpuUsage}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-gray-400"
                  data-metric-name="cpu_usage"
                  data-metric-value={metrics.cpuUsage.toFixed(1)}
                >
                  {metrics.cpuUsage.toFixed(1)}%
                </motion.span>
              </div>
              <Progress value={metrics.cpuUsage} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">
                  Memory
                  <MetricSource 
                    metric="memory_usage" 
                    value={metrics.memoryUsage} 
                    timestamp={lastUpdate}
                  />
                </span>
                <motion.span
                  key={metrics.memoryUsage}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-gray-400"
                  data-metric-name="memory_usage"
                  data-metric-value={metrics.memoryUsage.toFixed(1)}
                >
                  {metrics.memoryUsage.toFixed(1)}%
                </motion.span>
              </div>
              <Progress value={metrics.memoryUsage} className="h-2" />
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={historicalData}>
                <XAxis dataKey="timestamp" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ background: '#1f2937', border: 'none' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-200">
            <Network className="h-4 w-4 text-primary inline mr-2" />
            Network Status
            <MetricSource 
              metric="network_latency" 
              value={metrics.networkLatency} 
              timestamp={lastUpdate}
            />
          </CardTitle>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Badge 
              variant={metrics.networkLatency > 150 ? "destructive" : "default"}
              className="bg-blue-500/10 text-blue-400"
            >
              {metrics.networkLatency > 150 ? 'High Latency' : 'Optimal'}
            </Badge>
          </motion.div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">
                Latency
                <MetricSource 
                  metric="network_latency" 
                  value={metrics.networkLatency} 
                  timestamp={lastUpdate}
                />
              </span>
              <motion.span
                key={metrics.networkLatency}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-lg font-semibold text-gray-200"
                data-metric-name="network_latency"
                data-metric-value={metrics.networkLatency.toFixed(0)}
              >
                {metrics.networkLatency.toFixed(0)}ms
              </motion.span>
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={historicalData}>
                <XAxis dataKey="timestamp" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ background: '#1f2937', border: 'none' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="network" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-200">
            <Activity className="h-4 w-4 text-primary inline mr-2" />
            Performance
          </CardTitle>
          <Badge 
            variant={metrics.successRate > 90 ? "default" : "secondary"}
            className="bg-yellow-500/10 text-yellow-400"
          >
            {metrics.successRate > 90 ? 'Excellent' : 'Good'}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Success Rate</span>
                <motion.span
                  key={metrics.successRate}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-gray-400"
                >
                  {metrics.successRate.toFixed(1)}%
                </motion.span>
              </div>
              <Progress value={metrics.successRate} className="h-2" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Interactions</span>
              <motion.span
                key={metrics.totalInteractions}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-lg font-semibold text-gray-200"
              >
                {metrics.totalInteractions.toLocaleString()}
              </motion.span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-200">
            <Database className="h-4 w-4 text-primary inline mr-2" />
            System Health
          </CardTitle>
          <Badge 
            variant="default"
            className="bg-emerald-500/10 text-emerald-400"
          >
            Healthy
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">Active Flows</span>
                <motion.span
                  key={metrics.activeFlows}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-lg font-semibold text-gray-200"
                >
                  {metrics.activeFlows}
                </motion.span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">Response Time</span>
                <motion.span
                  key={metrics.networkLatency}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-lg font-semibold text-gray-200"
                >
                  {metrics.networkLatency.toFixed(0)}ms
                </motion.span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
