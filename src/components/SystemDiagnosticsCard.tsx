import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  HardDrive,
  Cpu,
  WifiIcon,
  AlertTriangle,
  CheckCircle2,
  Database,
  Clock,
} from "lucide-react";
import { useRobotDiagnostics } from "@/hooks/useAPI";

interface SystemMetrics {
  cpuUsage: number;
  memoryUsed: number;
  memoryTotal: number;
  storageUsed: number;
  storageTotal: number;
  networkLatency: number;
  errorCount: number;
  uptime: number;
  healthScore: number;
}

interface SystemDiagnosticsCardProps {
  robotId: string;
}

export function SystemDiagnosticsCard({ robotId }: SystemDiagnosticsCardProps) {
  // Fetch real diagnostics data from API
  const { data: diagnosticsData } = useRobotDiagnostics(robotId);
  
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsed: 0,
    memoryTotal: 8.0,
    storageUsed: 0,
    storageTotal: 128,
    networkLatency: 0,
    errorCount: 0,
    uptime: 0,
    healthScore: 100,
  });

  // Update metrics from API data
  useEffect(() => {
    if (diagnosticsData && diagnosticsData.length > 0) {
      const latest = diagnosticsData[0];
      setMetrics({
        cpuUsage: latest.cpuUsagePercent || 0,
        memoryUsed: latest.memoryUsedGB || 0,
        memoryTotal: latest.memoryTotalGB || 8.0,
        storageUsed: latest.storageUsedGB || 0,
        storageTotal: latest.storageTotalGB || 128,
        networkLatency: latest.networkLatencyMs || 0,
        errorCount: latest.errorCount || 0,
        uptime: latest.uptimeSeconds || 0,
        healthScore: latest.healthScore || 100,
      });
    }
  }, [diagnosticsData]);

  const memoryPercentage = (metrics.memoryUsed / metrics.memoryTotal) * 100;
  const storagePercentage = (metrics.storageUsed / metrics.storageTotal) * 100;

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getHealthStatus = () => {
    if (metrics.healthScore >= 90) return { label: "Excellent", color: "text-success", variant: "default" as const };
    if (metrics.healthScore >= 75) return { label: "Good", color: "text-success", variant: "default" as const };
    if (metrics.healthScore >= 60) return { label: "Fair", color: "text-warning", variant: "secondary" as const };
    return { label: "Poor", color: "text-destructive", variant: "destructive" as const };
  };

  const healthStatus = getHealthStatus();

  const getLatencyStatus = () => {
    if (metrics.networkLatency < 20) return "Excellent";
    if (metrics.networkLatency < 50) return "Good";
    if (metrics.networkLatency < 100) return "Fair";
    return "Poor";
  };

  const getLatencyColor = () => {
    if (metrics.networkLatency < 20) return "text-success";
    if (metrics.networkLatency < 50) return "text-yellow-500";
    if (metrics.networkLatency < 100) return "text-warning";
    return "text-destructive";
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-card/80 to-card/60 dark:from-card/80 dark:to-card/60 border-border/30 dark:border-border backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Real-time system health metrics</p>
        </div>
        <div className="flex items-center gap-2">
          {metrics.healthScore >= 75 ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-warning" />
          )}
          <Badge variant={healthStatus.variant} className="text-sm">
            {healthStatus.label}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {/* Overall Health Score */}
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium">System Health Score</span>
            </div>
            <span className={`text-2xl font-bold ${healthStatus.color}`}>
              {metrics.healthScore.toFixed(0)}%
            </span>
          </div>
          <Progress value={metrics.healthScore} className="h-2" />
        </div>

        {/* CPU & Memory */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium">CPU Usage</span>
            </div>
            <p className="text-xl font-bold mb-1">{metrics.cpuUsage.toFixed(1)}%</p>
            <Progress value={metrics.cpuUsage} className="h-1.5" />
          </div>

          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium">Memory</span>
            </div>
            <p className="text-xl font-bold mb-1">
              {metrics.memoryUsed.toFixed(1)} / {metrics.memoryTotal.toFixed(1)} GB
            </p>
            <Progress value={memoryPercentage} className="h-1.5" />
          </div>
        </div>

        {/* Storage */}
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">Storage</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-muted-foreground">
              {metrics.storageUsed} / {metrics.storageTotal} GB
            </span>
            <span className="text-sm font-bold">{storagePercentage.toFixed(1)}%</span>
          </div>
          <Progress value={storagePercentage} className="h-1.5" />
        </div>

        {/* Network & Errors */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <WifiIcon className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium">Network Latency</span>
            </div>
            <p className={`text-xl font-bold ${getLatencyColor()}`}>{metrics.networkLatency}ms</p>
            <p className="text-xs text-muted-foreground mt-1">{getLatencyStatus()}</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-medium">Error Count</span>
            </div>
            <p
              className={`text-xl font-bold ${
                metrics.errorCount > 10
                  ? "text-destructive"
                  : metrics.errorCount > 5
                  ? "text-warning"
                  : "text-success"
              }`}
            >
              {metrics.errorCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Last 24h</p>
          </div>
        </div>

        {/* Uptime */}
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">System Uptime</span>
            </div>
            <span className="text-lg font-bold text-cyan-400">{formatUptime(metrics.uptime)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
