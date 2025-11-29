import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Wrench,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Activity,
  Timer,
  Settings,
} from "lucide-react";
import { useRobot, useMaintenance, useRobotDiagnostics, useComponentHealth, usePredictiveAlerts } from "@/hooks/useAPI";

interface MaintenanceMetrics {
  currentUptime: number;
  totalOperatingHours: number;
  nextServiceDate: Date | null;
  daysUntilService: number;
  lastMaintenanceDate: Date | null;
  maintenanceScore: number;
  mtbf: number; // Mean Time Between Failures
}

export function MaintenancePredictionPanel() {
  const { id: robotId } = useParams();
  
  // Fetch real data from database
  const { data: robotData } = useRobot(robotId!);
  const { data: maintenanceData } = useMaintenance({ robotId });
  const { data: diagnosticsData } = useRobotDiagnostics(robotId!);
  const { data: componentHealthData } = useComponentHealth(robotId!);
  const { data: predictiveAlertsData } = usePredictiveAlerts(robotId!);
  
  const [metrics, setMetrics] = useState<MaintenanceMetrics>({
    currentUptime: 0,
    totalOperatingHours: 0,
    nextServiceDate: null,
    daysUntilService: 0,
    lastMaintenanceDate: null,
    maintenanceScore: 85,
    mtbf: 2400, // Default 2400 hours MTBF
  });

  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveAlert[]>([]);
  const [componentHealth, setComponentHealth] = useState<ComponentHealth[]>([]);

  // Update metrics from real database data
  useEffect(() => {
    if (robotData && diagnosticsData) {
      const latestDiagnostics = diagnosticsData[0];
      const currentUptimeHours = latestDiagnostics?.uptimeSeconds 
        ? latestDiagnostics.uptimeSeconds / 3600 
        : 0;
      
      const nextServiceDate = robotData.nextMaintenanceDate 
        ? new Date(robotData.nextMaintenanceDate)
        : null;
      
      const daysUntilService = nextServiceDate
        ? Math.max(0, Math.floor((nextServiceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;
      
      const lastMaintenanceDate = robotData.lastMaintenanceDate
        ? new Date(robotData.lastMaintenanceDate)
        : null;
      
      // Calculate maintenance score based on health and uptime
      const healthScore = latestDiagnostics?.healthScore || 85;
      const maintenanceScore = Math.min(100, healthScore);
      
      // Calculate MTBF from diagnostics (Mean Time Between Failures)
      const mtbf = latestDiagnostics?.mtbf || 2400;
      
      setMetrics({
        currentUptime: currentUptimeHours,
        totalOperatingHours: currentUptimeHours, // In production, track cumulative hours
        nextServiceDate,
        daysUntilService,
        lastMaintenanceDate,
        maintenanceScore,
        mtbf,
      });
    }
  }, [robotData, diagnosticsData]);

  // Update component health from database
  useEffect(() => {
    if (componentHealthData && componentHealthData.length > 0) {
      const components: ComponentHealth[] = componentHealthData.map((item: any) => ({
        component: item.componentName,
        health: item.healthPercentage,
        status: item.status as ComponentHealth["status"],
        hoursRemaining: item.hoursRemaining,
        lastReplaced: item.lastReplacedAt ? new Date(item.lastReplacedAt) : null,
      }));
      setComponentHealth(components);
    }
  }, [componentHealthData]);

  // Update predictive alerts from database
  useEffect(() => {
    if (predictiveAlertsData && predictiveAlertsData.length > 0) {
      const alerts: PredictiveAlert[] = predictiveAlertsData.map((item: any) => ({
        id: item.id.toString(),
        component: item.componentName,
        prediction: item.prediction,
        severity: item.severity as PredictiveAlert["severity"],
        confidence: item.confidencePercent,
        estimatedDays: item.estimatedDays,
        recommendedAction: item.recommendedAction,
      }));
      setPredictiveAlerts(alerts);
    }
  }, [predictiveAlertsData]);

  const getHealthColor = (health: number) => {
    if (health >= 85) return "text-success";
    if (health >= 70) return "text-green-400";
    if (health >= 50) return "text-warning";
    return "text-destructive";
  };

  const getHealthBgColor = (status: ComponentHealth["status"]) => {
    switch (status) {
      case "excellent":
        return "bg-success/10 border-success/30";
      case "good":
        return "bg-green-500/10 border-green-500/30";
      case "fair":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "replace_soon":
        return "bg-warning/10 border-warning/30";
      case "critical":
        return "bg-destructive/10 border-destructive/30";
      default:
        return "bg-slate-100/80 dark:bg-slate-900/50 border-slate-300 dark:border-slate-800";
    }
  };

  const getSeverityColor = (severity: PredictiveAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return "text-destructive";
      case "warning":
        return "text-warning";
      case "info":
        return "text-blue-500 dark:text-blue-400";
      default:
        return "text-slate-600 dark:text-muted-foreground";
    }
  };

  const getSeverityIcon = (severity: PredictiveAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "info":
        return <Activity className="w-4 h-4 text-blue-400" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatHoursToReadable = (hours: number) => {
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    const months = Math.floor(days / 30);
    return `${months}mo`;
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-card/80 to-card/60 dark:from-card/80 dark:to-card/60 border-border/30 dark:border-border backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
          <div>
            <p className="text-xs text-muted-foreground">AI-powered failure prediction & scheduling</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={metrics.maintenanceScore >= 80 ? "default" : "secondary"}
            className={
              metrics.maintenanceScore >= 80
                ? "bg-success text-success-foreground"
                : "bg-warning text-warning-foreground"
            }
          >
            Health: {metrics.maintenanceScore}%
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <p className="text-xs text-muted-foreground">MTBF</p>
          </div>
          <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{metrics.mtbf.toLocaleString()}h</p>
          <p className="text-xs text-muted-foreground mt-1">
            ~{Math.round(metrics.mtbf / 24)} days avg
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-green-400" />
            <p className="text-xs text-muted-foreground">Uptime</p>
          </div>
          <p className="text-xl font-bold text-success">{metrics.currentUptime.toFixed(1)}h</p>
          <p className="text-xs text-muted-foreground mt-1">Current run</p>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="w-4 h-4 text-purple-400" />
            <p className="text-xs text-muted-foreground">Total Hours</p>
          </div>
          <p className="text-xl font-bold text-purple-400">
            {metrics.totalOperatingHours.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Lifetime</p>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-orange-400" />
            <p className="text-xs text-muted-foreground">Next Service</p>
          </div>
          <p
            className={`text-xl font-bold ${
              metrics.daysUntilService < 7 ? "text-warning" : "text-orange-400"
            }`}
          >
            {Math.round(metrics.daysUntilService)}d
          </p>
          <p className="text-xs text-muted-foreground mt-1">{formatDate(metrics.nextServiceDate)}</p>
        </div>
      </div>

      {/* Service Progress */}
      <div className="mb-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">Service Interval Progress</span>
          <span className="text-sm font-mono">
            {Math.round(((30 - metrics.daysUntilService) / 30) * 100)}%
          </span>
        </div>
        <Progress value={((30 - metrics.daysUntilService) / 30) * 100} className="h-2 mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Last: {formatDate(metrics.lastMaintenanceDate)}</span>
          <span>Next: {formatDate(metrics.nextServiceDate)}</span>
        </div>
      </div>

      {/* Predictive Alerts */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          Predictive Alerts ({predictiveAlerts.length})
        </h4>
        <div className="space-y-2">
          {predictiveAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-sm font-semibold">{alert.component}</h5>
                    <Badge variant="outline" className="text-xs h-5">
                      {alert.confidence}% confidence
                    </Badge>
                  </div>
                  <p className={`text-xs mb-2 ${getSeverityColor(alert.severity)}`}>
                    {alert.prediction}
                  </p>
                  <p className="text-xs text-muted-foreground mb-1">
                    <Settings className="w-3 h-3 inline mr-1" />
                    {alert.recommendedAction}
                  </p>
                  <p className="text-xs text-cyan-400">
                    Estimated: {alert.estimatedDays} days remaining
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Component Health */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Component Health Status</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {componentHealth.map((comp) => (
            <div
              key={comp.component}
              className={`p-3 rounded-lg border ${getHealthBgColor(comp.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold">{comp.component}</span>
                {comp.health >= 85 ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : comp.health < 60 ? (
                  <AlertTriangle className="w-4 h-4 text-warning" />
                ) : (
                  <Activity className="w-4 h-4 text-green-400" />
                )}
              </div>
              <div className="mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Health</span>
                  <span className={`text-sm font-bold ${getHealthColor(comp.health)}`}>
                    {comp.health.toFixed(0)}%
                  </span>
                </div>
                <Progress value={comp.health} className="h-1.5" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Est. Remaining</span>
                  <span className="font-mono font-bold">
                    {formatHoursToReadable(comp.hoursRemaining)}
                  </span>
                </div>
                {comp.lastReplaced && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Last Replaced</span>
                    <span className="font-mono">{formatDate(comp.lastReplaced)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
