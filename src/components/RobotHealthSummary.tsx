import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
} from "lucide-react";
import { useRobot, useRobotDiagnostics } from "@/hooks/useAPI";

interface RobotHealthData {
  overallHealth: number;
  healthStatus: "excellent" | "good" | "fair" | "poor";
  currentTask: string;
  taskStatus: "active" | "idle" | "charging" | "error";
  location: string;
  coordinates: string;
  uptime: number; // hours
  lastSync: Date;
}

export function RobotHealthSummary() {
  const { id: robotId } = useParams();
  
  // Fetch real data from database
  const { data: robotData } = useRobot(robotId!);
  const { data: diagnosticsData } = useRobotDiagnostics(robotId!);
  
  const [healthData, setHealthData] = useState<RobotHealthData>({
    overallHealth: 94,
    healthStatus: "excellent",
    currentTask: "Standby Mode",
    taskStatus: "idle",
    location: "San Francisco Lab - Floor 2",
    coordinates: "37.7749° N, 122.4194° W",
    uptime: 72.47, // 72 hours 28 minutes
    lastSync: new Date(),
  });

  // Update from real database data
  useEffect(() => {
    if (robotData && diagnosticsData && diagnosticsData.length > 0) {
      const latestDiagnostics = diagnosticsData[0];
      
      // Determine health status based on score
      let healthStatus: RobotHealthData["healthStatus"] = "excellent";
      const healthScore = latestDiagnostics.overallHealthScore || 94;
      if (healthScore < 60) healthStatus = "poor";
      else if (healthScore < 75) healthStatus = "fair";
      else if (healthScore < 90) healthStatus = "good";
      
      // Determine task status from robot status
      let taskStatus: RobotHealthData["taskStatus"] = "idle";
      if (robotData.status === "error") taskStatus = "error";
      else if (robotData.status === "charging") taskStatus = "charging";
      else if (robotData.status === "active") taskStatus = "active";
      
      setHealthData({
        overallHealth: healthScore,
        healthStatus,
        currentTask: robotData.currentTask || "Standby Mode",
        taskStatus,
        location: robotData.location || "San Francisco Lab - Floor 2",
        coordinates: "37.7749° N, 122.4194° W",
        uptime: latestDiagnostics.uptimeHours || 72.47,
        lastSync: robotData.lastSeenAt ? new Date(robotData.lastSeenAt) : new Date(),
      });
    }
  }, [robotData, diagnosticsData]);

  const getHealthColor = (health: number) => {
    if (health >= 90) return "text-success";
    if (health >= 75) return "text-green-400";
    if (health >= 60) return "text-warning";
    return "text-destructive";
  };

  const getHealthIcon = (health: number) => {
    if (health >= 90) return <CheckCircle2 className="w-5 h-5 text-success" />;
    if (health >= 75) return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    if (health >= 60) return <AlertTriangle className="w-5 h-5 text-warning" />;
    return <XCircle className="w-5 h-5 text-destructive" />;
  };

  const getHealthLabel = (status: string) => {
    switch (status) {
      case "excellent":
        return "Excellent";
      case "good":
        return "Good";
      case "fair":
        return "Fair";
      case "poor":
        return "Poor";
      default:
        return "Unknown";
    }
  };

  const getTaskIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Activity className="w-4 h-4 text-cyan-500 dark:text-cyan-400 animate-pulse" />;
      case "charging":
        return <Zap className="w-4 h-4 text-amber-500 dark:text-yellow-400 animate-pulse" />;
      case "error":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Activity className="w-4 h-4 text-slate-600 dark:text-muted-foreground" />;
    }
  };

  const getTaskBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-cyan-500/10 dark:bg-cyan-400/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 dark:border-cyan-400/30";
      case "charging":
        return "bg-amber-500/10 dark:bg-yellow-400/10 text-amber-600 dark:text-yellow-400 border-amber-500/30 dark:border-yellow-400/30";
      case "idle":
        return "bg-slate-100 dark:bg-muted text-slate-700 dark:text-muted-foreground border-slate-300 dark:border-border";
      case "error":
        return "bg-destructive/10 text-destructive border-destructive/30";
      default:
        return "bg-slate-100 dark:bg-muted text-slate-700 dark:text-muted-foreground border-slate-300 dark:border-border";
    }
  };

  const formatUptime = (hours: number) => {
    const totalMinutes = Math.floor(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  const formatLastSync = (date: Date) => {
    const secondsAgo = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secondsAgo < 5) return "Just now";
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    return `${hoursAgo}h ago`;
  };

  return (
    <Card className="p-4 card-gradient border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary animate-pulse" />
          <h3 className="font-semibold text-base">Robot Health Summary</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          Updated {formatLastSync(healthData.lastSync)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Health */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall Health</span>
            {getHealthIcon(healthData.overallHealth)}
          </div>
          <div>
            <p className={`text-3xl font-bold font-mono ${getHealthColor(healthData.overallHealth)}`}>
              {healthData.overallHealth.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {getHealthLabel(healthData.healthStatus)}
            </p>
          </div>
        </div>

        {/* Current Task */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Task</span>
            {getTaskIcon(healthData.taskStatus)}
          </div>
          <div>
            <p className="text-lg font-semibold truncate">{healthData.currentTask}</p>
            <Badge
              variant="outline"
              className={`mt-2 ${getTaskBadgeColor(healthData.taskStatus)}`}
            >
              {healthData.taskStatus.charAt(0).toUpperCase() + healthData.taskStatus.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Location</span>
            <MapPin className="w-4 h-4 text-red-500 dark:text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold truncate text-foreground">{healthData.location}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
              {healthData.coordinates}
            </p>
            <Badge variant="outline" className="mt-2 text-xs border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10">
              GPS Active
            </Badge>
          </div>
        </div>

        {/* Uptime */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">System Uptime</span>
            <Clock className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          </div>
          <div>
            <p className="text-3xl font-bold font-mono text-cyan-500 dark:text-cyan-400">
              {formatUptime(healthData.uptime)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Continuous operation
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
