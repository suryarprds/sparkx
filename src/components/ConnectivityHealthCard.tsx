import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wifi,
  Signal,
  Activity,
  Clock,
  TrendingUp,
  Radio,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Zap,
} from "lucide-react";
import { useRobot, useRobotDiagnostics, useNetworkHandoffs } from "@/hooks/useAPI";

interface ConnectivityMetrics {
  lastSeen: Date;
  isOnline: boolean;
  uptimePercentage: number;
  latency: number;
  signalStrength: number;
  connectionType: string;
  heartbeatStatus: "healthy" | "degraded" | "missed" | "offline";
  lastHeartbeat: Date;
  packetLoss: number;
}

interface BandwidthMetrics {
  uploadRate: number;
  downloadRate: number;
  totalUploaded: number;
  totalDownloaded: number;
}

interface NetworkHandoff {
  from: string;
  to: string;
  timestamp: Date;
  reason: string;
  duration: number;
}

export function ConnectivityHealthCard() {
  const { id: robotId } = useParams();
  
  // Fetch real data from database
  const { data: robotData } = useRobot(robotId!);
  const { data: diagnosticsData } = useRobotDiagnostics(robotId!);
  const { data: networkHandoffsData } = useNetworkHandoffs(robotId!, 10);
  
  const [metrics, setMetrics] = useState<ConnectivityMetrics>({
    lastSeen: new Date(),
    isOnline: true,
    uptimePercentage: 99.0,
    latency: 0,
    signalStrength: 0,
    connectionType: "Unknown",
    heartbeatStatus: "healthy",
    lastHeartbeat: new Date(),
    packetLoss: 0,
  });

  const [bandwidth, setBandwidth] = useState<BandwidthMetrics>({
    uploadRate: 0,
    downloadRate: 0,
    totalUploaded: 0,
    totalDownloaded: 0,
  });

  const [recentHandoffs, setRecentHandoffs] = useState<NetworkHandoff[]>([]);

  // Update metrics from real database data
  useEffect(() => {
    if (robotData) {
      const latestTelemetry = robotData.telemetry?.[0];
      const latestDiagnostics = diagnosticsData?.[0];
      
      const isOnline = robotData.status === 'online';
      const lastSeen = robotData.lastSeenAt ? new Date(robotData.lastSeenAt) : new Date();
      const timeSinceLastSeen = (Date.now() - lastSeen.getTime()) / 1000; // seconds
      
      let heartbeatStatus: "healthy" | "degraded" | "missed" | "offline" = "healthy";
      if (!isOnline) heartbeatStatus = "offline";
      else if (timeSinceLastSeen > 60) heartbeatStatus = "missed";
      else if (timeSinceLastSeen > 30) heartbeatStatus = "degraded";
      
      // Determine connection type from signal strengths
      let connectionType = "Unknown";
      if (latestTelemetry?.wifiStrength && latestTelemetry.wifiStrength !== 'None') {
        connectionType = `WiFi (${latestTelemetry.wifiStrength})`;
      } else if (latestTelemetry?.cellularStrength && latestTelemetry.cellularStrength !== 'None') {
        connectionType = `Cellular (${latestTelemetry.cellularStrength})`;
      }
      
      setMetrics({
        lastSeen,
        isOnline,
        uptimePercentage: latestDiagnostics?.uptimePercentage || 95.0,
        latency: latestDiagnostics?.networkLatencyMs || latestTelemetry?.networkLatencyMs || 0,
        signalStrength: latestTelemetry?.signalStrength || 0,
        connectionType,
        heartbeatStatus,
        lastHeartbeat: lastSeen,
        packetLoss: latestDiagnostics?.packetLossPercent || 0,
      });
      
      // Update bandwidth from diagnostics
      if (latestDiagnostics) {
        setBandwidth({
          uploadRate: latestDiagnostics.uploadRateMbps || 0,
          downloadRate: latestDiagnostics.downloadRateMbps || 0,
          totalUploaded: Number(latestDiagnostics.totalUploadedBytes) || 0,
          totalDownloaded: Number(latestDiagnostics.totalDownloadedBytes) || 0,
        });
      }
    }
  }, [robotData, diagnosticsData]);
  
  // Update network handoffs from database
  useEffect(() => {
    if (networkHandoffsData) {
      const handoffs: NetworkHandoff[] = networkHandoffsData.map((handoff: any) => ({
        from: handoff.fromNetwork,
        to: handoff.toNetwork,
        timestamp: new Date(handoff.occurredAt),
        reason: handoff.reason || 'Network transition',
        duration: handoff.durationMs || 0,
      }));
      setRecentHandoffs(handoffs);
    }
  }, [networkHandoffsData]);

  const getSignalStrengthText = (dbm: number) => {
    if (dbm >= 90) return "Excellent";
    if (dbm >= 75) return "Very Good";
    if (dbm >= 60) return "Good";
    if (dbm >= 40) return "Fair";
    return "Poor";
  };

  const getSignalStrengthColor = (dbm: number) => {
    if (dbm >= 90) return "text-success";
    if (dbm >= 75) return "text-green-400";
    if (dbm >= 60) return "text-yellow-400";
    if (dbm >= 40) return "text-warning";
    return "text-destructive";
  };

  const getHeartbeatIcon = (status: ConnectivityMetrics["heartbeatStatus"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="w-4 h-4 text-success animate-pulse" />;
      case "degraded":
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case "missed":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "offline":
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getHeartbeatColor = (status: ConnectivityMetrics["heartbeatStatus"]) => {
    switch (status) {
      case "healthy":
        return "text-success";
      case "degraded":
        return "text-warning";
      case "missed":
        return "text-destructive";
      case "offline":
        return "text-slate-600 dark:text-muted-foreground";
    }
  };

  const getUptimeColor = (percentage: number) => {
    if (percentage >= 99) return "text-success";
    if (percentage >= 95) return "text-green-400";
    if (percentage >= 90) return "text-warning";
    return "text-destructive";
  };

  const formatTimeSince = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatBytes = (mb: number) => {
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-card/80 to-card/60 dark:from-card/80 dark:to-card/60 border-border/30 dark:border-border backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Signal className="w-5 h-5 text-success" />
          <div>
            <p className="text-xs text-muted-foreground">Network status & performance monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={metrics.isOnline ? "default" : "destructive"}
            className={metrics.isOnline ? "bg-success text-success-foreground" : ""}
          >
            <Activity className="w-3 h-3 mr-1 animate-pulse" />
            {metrics.isOnline ? "ONLINE" : "OFFLINE"}
          </Badge>
        </div>
      </div>

      {/* Connection Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-cyan-400" />
            <p className="text-xs text-muted-foreground">Last Seen</p>
          </div>
          <p className="text-sm font-bold text-cyan-400">{formatTimeSince(metrics.lastSeen)}</p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {metrics.lastSeen.toLocaleTimeString()}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <p className="text-xs text-muted-foreground">Uptime</p>
          </div>
          <p className={`text-xl font-bold ${getUptimeColor(metrics.uptimePercentage)}`}>
            {metrics.uptimePercentage.toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-blue-400" />
            <p className="text-xs text-muted-foreground">Latency</p>
          </div>
          <p
            className={`text-xl font-bold ${
              metrics.latency < 20
                ? "text-success"
                : metrics.latency < 50
                ? "text-yellow-400"
                : "text-warning"
            }`}
          >
            {metrics.latency.toFixed(0)}ms
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.latency < 20 ? "Excellent" : metrics.latency < 50 ? "Good" : "Fair"}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-warning" />
            <p className="text-xs text-muted-foreground">Packet Loss</p>
          </div>
          <p
            className={`text-xl font-bold ${
              metrics.packetLoss < 1
                ? "text-success"
                : metrics.packetLoss < 3
                ? "text-warning"
                : "text-destructive"
            }`}
          >
            {metrics.packetLoss.toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.packetLoss < 1 ? "Excellent" : metrics.packetLoss < 3 ? "Acceptable" : "Poor"}
          </p>
        </div>
      </div>

      {/* Heartbeat Status */}
      <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold">Heartbeat Status</span>
          </div>
          <div className="flex items-center gap-2">
            {getHeartbeatIcon(metrics.heartbeatStatus)}
            <span className={`text-sm font-bold uppercase ${getHeartbeatColor(metrics.heartbeatStatus)}`}>
              {metrics.heartbeatStatus}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Last Heartbeat:</span>
            <span className="ml-2 font-mono font-bold">{formatTimeSince(metrics.lastHeartbeat)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Interval:</span>
            <span className="ml-2 font-mono font-bold">Every {metrics.heartbeatInterval}s</span>
          </div>
        </div>
      </div>

      {/* Signal & Connection Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Signal className={`w-4 h-4 ${getSignalStrengthColor(metrics.signalStrength)}`} />
              <span className="text-sm font-semibold">Signal Strength</span>
            </div>
            <span className={`text-sm font-bold ${getSignalStrengthColor(metrics.signalStrength)}`}>
              {getSignalStrengthText(metrics.signalStrength)}
            </span>
          </div>
          <div className="mb-2">
            <Progress
              value={Math.min(100, ((metrics.signalStrength + 100) / 70) * 100)}
              className="h-2"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{metrics.signalStrength.toFixed(0)} dBm</span>
            <span>{metrics.connectionType}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="w-4 h-4 text-success" />
            <span className="text-sm font-semibold">Connection Type</span>
          </div>
          <p className="text-xl font-bold text-success mb-1">{metrics.connectionType}</p>
          <p className="text-xs text-muted-foreground">
            Primary connection • Auto-failover enabled
          </p>
        </div>
      </div>

      {/* Bandwidth Usage */}
      <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpDown className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold">Bandwidth Usage</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Upload</p>
            <p className="text-lg font-bold text-blue-400">{bandwidth.uploadRate.toFixed(1)} Mbps</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Download</p>
            <p className="text-lg font-bold text-purple-400">{bandwidth.downloadRate.toFixed(1)} Mbps</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Up</p>
            <p className="text-sm font-mono font-bold">{formatBytes(bandwidth.totalUploaded)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Down</p>
            <p className="text-sm font-mono font-bold">{formatBytes(bandwidth.totalDownloaded)}</p>
          </div>
        </div>
      </div>

      {/* Network Handoffs */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          Recent Network Handoffs ({recentHandoffs.length})
        </h4>
        <div className="space-y-2">
          {recentHandoffs.map((handoff, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs font-semibold">
                    {handoff.from} → {handoff.to}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{formatTimeSince(handoff.timestamp)}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{handoff.reason}</p>
              <p className="text-xs text-cyan-400">Transition: {handoff.duration}ms</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
