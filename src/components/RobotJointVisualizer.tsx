import { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useJointData } from "@/hooks/useJointData";
import { useRobot, useRobotDiagnostics, useRobotTelemetry } from "@/hooks/useAPI";
import {
  Battery,
  Wifi,
  Cpu,
  Activity,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
} from "lucide-react";

interface JointIndicator {
  id: string;
  label: string;
  x: string; // percentage
  y: string; // percentage
  dof: number;
  status: "ok" | "warning" | "error";
  temperature: number;
  torque: number;
  angle: number;
  targetAngle: number;
}

// 16 Joint positions mapped to robot body
const JOINT_POSITIONS: Omit<JointIndicator, "status" | "temperature" | "torque" | "angle" | "targetAngle">[] = [
  { id: "neck", label: "Neck Joint", x: "51%", y: "21%", dof: 3 },
  { id: "shoulder_left", label: "Left Shoulder", x: "42%", y: "26%", dof: 3 },
  { id: "shoulder_right", label: "Right Shoulder", x: "60%", y: "26%", dof: 3 },
  { id: "elbow_left", label: "Left Elbow", x: "38%", y: "37%", dof: 3 },
  { id: "elbow_right", label: "Right Elbow", x: "64%", y: "37%", dof: 3 },
  { id: "wrist_left", label: "Left Wrist", x: "35%", y: "48%", dof: 2 },
  { id: "wrist_right", label: "Right Wrist", x: "67%", y: "48%", dof: 2 },
  { id: "gripper_left", label: "Left Gripper", x: "35%", y: "55%", dof: 1 },
  { id: "gripper_right", label: "Right Gripper", x: "67%", y: "55%", dof: 1 },
  { id: "hip", label: "Hip Joint", x: "51%", y: "48%", dof: 3 },
  { id: "knee_high_left", label: "Left Knee High", x: "45%", y: "52%", dof: 1 },
  { id: "knee_high_right", label: "Right Knee High", x: "57%", y: "52%", dof: 1 },
  { id: "knee_low_left", label: "Left Knee Low", x: "45%", y: "66%", dof: 1 },
  { id: "knee_low_right", label: "Right Knee Low", x: "57%", y: "66%", dof: 1 },
  { id: "ankle_left", label: "Left Ankle", x: "45%", y: "85%", dof: 2 },
  { id: "ankle_right", label: "Right Ankle", x: "58%", y: "85%", dof: 2 },
];

// Robot Health Metrics Panel Component
function RobotHealthMetricsPanel() {
  const { id } = useParams<{ id: string }>();
  const { data: robot } = useRobot(id!);
  const { data: diagnosticsData } = useRobotDiagnostics(id!);
  const { data: telemetryData } = useRobotTelemetry(id!, { hours: 1 });

  const latestDiagnostics = diagnosticsData?.[0];
  const latestTelemetry = telemetryData?.[0];

  const battery = latestTelemetry?.batteryPercentage || 87;
  const temperature = latestTelemetry?.temperatureC || 42;
  const cpuLoad = latestTelemetry?.cpuLoadPercentage || 35;

  const getBatteryColor = (level: number) => {
    if (level > 60) return "text-success";
    if (level > 30) return "text-warning";
    return "text-destructive";
  };

  const calculateRuntime = (batteryLevel: number) => {
    const hours = Math.floor((batteryLevel / 100) * 8);
    const minutes = Math.floor(((batteryLevel / 100) * 8 - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  const formatUptime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getHealthStatus = (health: number): "excellent" | "good" | "fair" | "poor" => {
    if (health >= 90) return "excellent";
    if (health >= 75) return "good";
    if (health >= 60) return "fair";
    return "poor";
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle2 className="w-8 h-8 text-success" />;
      case "good":
        return <CheckCircle2 className="w-8 h-8 text-primary" />;
      case "fair":
        return <AlertTriangle className="w-8 h-8 text-warning" />;
      case "poor":
        return <XCircle className="w-8 h-8 text-destructive" />;
      default:
        return <Activity className="w-8 h-8 text-muted-foreground" />;
    }
  };

  const overallHealth = latestDiagnostics?.overallHealthPercentage || 92;
  const healthStatus = getHealthStatus(overallHealth);
  const uptime = latestDiagnostics?.uptimeHours || 720.5;

  return (
    <div className="h-full flex flex-col">
      {/* Single Background Card containing all metrics */}
      <Card className="p-3 bg-gradient-to-br from-card to-card/80 border-border h-full flex flex-col">
        {/* Health Summary - Speedometer Style */}
        <div className="pb-4 border-b border-border/50">
          <div className="flex flex-col items-center gap-3">
            {/* Speedometer Gauge */}
            <div className="relative w-36 h-36 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Background Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray="188.5"
                  strokeDashoffset="47.125"
                  className="text-muted/20"
                />
                {/* Colored Progress Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray="188.5"
                  strokeDashoffset={47.125 + (141.375 * (100 - overallHealth) / 100)}
                  strokeLinecap="round"
                  className={
                    overallHealth >= 90 ? "text-green-500" :
                    overallHealth >= 75 ? "text-blue-500" :
                    overallHealth >= 60 ? "text-yellow-500" : "text-red-500"
                  }
                  style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                />
              </svg>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-primary">{overallHealth.toFixed(0)}</span>
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            
            {/* Health Info */}
            <div className="text-center">
              <span className="text-sm text-muted-foreground">Overall Health</span>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <div className="scale-[0.8]">{getHealthIcon(healthStatus)}</div>
                <Badge variant={
                  healthStatus === "excellent" ? "default" :
                  healthStatus === "good" ? "secondary" :
                  healthStatus === "fair" ? "outline" : "destructive"
                } className="text-sm py-1 px-2">
                  {healthStatus.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {healthStatus === "excellent" ? "✓ System performing optimally" : 
                  healthStatus === "good" ? "✓ System performing well" :
                  healthStatus === "fair" ? "⚠ Monitoring required - potential issues detected" : 
                  "✗ Critical issues detected - immediate action recommended"}
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Grid Layout with Gauges */}
        <div className="grid grid-cols-2 gap-2 flex-1 content-start">
          {/* Battery Gauge - Circular */}
          <div className="p-2 rounded-lg bg-background/40 border border-border/30 flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <Battery className="w-3 h-3 text-yellow-500" />
              <span className="text-xs font-semibold text-muted-foreground">Battery</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10"
                    strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - battery / 100)} strokeLinecap="round"
                    className={battery > 60 ? "text-green-500" : battery > 30 ? "text-yellow-500" : "text-red-500"} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-bold">{battery.toFixed(0)}</span>
                  <span className="text-[10px] text-muted-foreground">%</span>
                </div>
              </div>
              <div className="text-xs text-center">
                <p className="text-muted-foreground font-medium">{calculateRuntime(battery)}</p>
              </div>
            </div>
          </div>

          {/* CPU Load Gauge - Circular */}
          <div className="p-2 rounded-lg bg-background/40 border border-border/30 flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <Cpu className="w-3 h-3 text-purple-500" />
              <span className="text-xs font-semibold text-muted-foreground">CPU Load</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10"
                    strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - cpuLoad / 100)} strokeLinecap="round"
                    className={cpuLoad > 80 ? "text-red-500" : cpuLoad > 60 ? "text-yellow-500" : "text-purple-500"} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-bold">{cpuLoad.toFixed(0)}</span>
                  <span className="text-[10px] text-muted-foreground">%</span>
                </div>
              </div>
              <div className="text-xs text-center">
                <p className="text-muted-foreground font-medium">{temperature.toFixed(0)}°C</p>
              </div>
            </div>
          </div>

          {/* Memory Gauge - Circular */}
          <div className="p-2 rounded-lg bg-background/40 border border-border/30 flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-blue-500" />
              <span className="text-xs font-semibold text-muted-foreground">Memory</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10"
                    strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - (latestTelemetry?.memoryUsagePercentage || 45) / 100)} strokeLinecap="round"
                    className={(latestTelemetry?.memoryUsagePercentage || 45) > 80 ? "text-red-500" : (latestTelemetry?.memoryUsagePercentage || 45) > 60 ? "text-yellow-500" : "text-blue-500"} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-bold">{(latestTelemetry?.memoryUsagePercentage || 45).toFixed(0)}</span>
                  <span className="text-[10px] text-muted-foreground">%</span>
                </div>
              </div>
              <div className="text-xs text-center">
                <p className="text-muted-foreground font-medium text-center">
                  <span className="block">{latestTelemetry?.memoryUsagePercentage 
                    ? ((latestTelemetry.memoryUsagePercentage / 100) * 8).toFixed(1)
                    : "3.6"} GB</span>
                  <span className="text-[10px] text-muted-foreground/70">/ 8 GB</span>
                </p>
              </div>
            </div>
          </div>

          {/* Storage Gauge - Circular */}
          <div className="p-2 rounded-lg bg-background/40 border border-border/30 flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <Activity className="w-3 h-3 text-cyan-500" />
              <span className="text-xs font-semibold text-muted-foreground">Storage</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10"
                    strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - (latestTelemetry?.diskUsagePercentage || 33) / 100)} strokeLinecap="round"
                    className={(latestTelemetry?.diskUsagePercentage || 33) > 80 ? "text-red-500" : (latestTelemetry?.diskUsagePercentage || 33) > 60 ? "text-yellow-500" : "text-cyan-500"} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-bold">{(latestTelemetry?.diskUsagePercentage || 33).toFixed(0)}</span>
                  <span className="text-[10px] text-muted-foreground">%</span>
                </div>
              </div>
              <div className="text-xs text-center">
                <p className="text-muted-foreground font-medium text-center">
                  <span className="block">{latestTelemetry?.diskUsagePercentage 
                    ? ((latestTelemetry.diskUsagePercentage / 100) * 128).toFixed(0)
                    : "42"} GB</span>
                  <span className="text-[10px] text-muted-foreground/70">/ 128 GB</span>
                </p>
              </div>
            </div>
          </div>

          {/* Network Status - Horizontal Bar Style */}
          <div className="col-span-2 p-3 rounded-lg bg-background/40 border border-border/30">
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-success" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-muted-foreground">Network</span>
                  <span className="text-sm font-bold text-success">WiFi Good · 5G Active</span>
                </div>
                <div className="w-full h-8 bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Uptime */}
          <div className="col-span-2 p-3 rounded-lg bg-background/40 border border-border/30">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-red-500" />
                <div>
                  <span className="text-sm text-muted-foreground block">Location</span>
                  <p className="text-base font-bold truncate">{robot?.location || "Lab Floor 2"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-cyan-500" />
                <div>
                  <span className="text-sm text-muted-foreground block">Uptime</span>
                  <p className="text-base font-bold font-mono text-cyan-500">{formatUptime(uptime)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function RobotJointVisualizer() {
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedJointId, setSelectedJointId] = useState<string | null>(null);
  const jointGroups = useJointData();

  useEffect(() => {
    if (imageRef.current?.complete) {
      setImageLoaded(true);
    }
  }, []);

  // Auto-scroll to selected joint in statistics panel
  useEffect(() => {
    if (selectedJointId) {
      const element = document.getElementById(`joint-${selectedJointId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedJointId]);

  // Map joint groups to visual indicators
  const jointData = useMemo(() => {
    // Map database joint names to visual position indices
    const mapping: { [key: string]: number } = {
      "Neck": 0,
      "Shoulder_Left": 1,
      "Shoulder_Right": 2,
      "Elbow_Left": 3,
      "Elbow_Right": 4,
      "Wrist_Left": 5,
      "Wrist_Right": 6,
      "Gripper_Left": 7,
      "Gripper_Right": 8,
      "Hip": 9,
      "Knee_High_Left": 10,
      "Knee_High_Right": 11,
      "Knee_Low_Left": 12,
      "Knee_Low_Right": 13,
      "Ankle_Left": 14,
      "Ankle_Right": 15,
    };

    const indicators: JointIndicator[] = JOINT_POSITIONS.map((pos) => ({
      ...pos,
      status: "ok" as const,
      temperature: 0,
      torque: 0,
      angle: 0,
      targetAngle: 0,
    }));

    // Map all joints from database to visual positions
    jointGroups.forEach((group) => {
      group.joints.forEach((joint) => {
        const index = mapping[joint.name];
        if (index !== undefined) {
          indicators[index] = {
            ...indicators[index],
            status: joint.status,
            temperature: joint.temperature,
            torque: joint.torque,
            angle: joint.angle,
            targetAngle: joint.targetAngle,
          };
        }
      });
    });

    return indicators;
  }, [jointGroups]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return <Badge className="bg-green-500">Healthy</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case "error":
        return <Badge className="bg-red-500">Fault</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <Card className="p-2 sm:p-3 space-y-2 h-full">
      <div className="flex flex-col lg:flex-row gap-2 sm:gap-3 items-stretch h-full">
        {/* Robot Health & System Metrics Panel - Now on left */}
        <div className="w-full lg:w-1/2 lg:pr-2 h-full">
          <RobotHealthMetricsPanel />
        </div>

        {/* Robot Visualization - Now on right */}
        <div className="w-full lg:w-1/2 relative bg-gradient-to-br from-card to-card/80 border border-border rounded-lg p-2 sm:p-3 overflow-hidden flex items-center justify-center h-full">
          <img 
            ref={imageRef}
            src="/sparkx_robot.png" 
            alt="SparkX Robot" 
            className="w-full h-full object-contain mx-auto rounded-lg"
            onLoad={() => setImageLoaded(true)}
          />

          {/* Legend - Positioned on image */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 text-xs bg-background/95 backdrop-blur-md p-2.5 rounded-lg border border-border/50 shadow-xl">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm" />
              <span className="font-medium text-foreground">Healthy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm" />
              <span className="font-medium text-foreground">Warning</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" />
              <span className="font-medium text-foreground">Fault</span>
            </div>
          </div>

          {/* Joint Indicators */}
          {imageLoaded && (
          <TooltipProvider>
            {jointData.map((joint) => (
              <Tooltip key={joint.id} delayDuration={100}>
                <TooltipTrigger asChild>
                  <div
                    className="absolute cursor-pointer"
                    style={{
                      top: joint.y,
                      left: joint.x,
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={() => setSelectedJointId(joint.id)}
                  >
                    <div
                      className={`w-5 h-5 rounded-full ${getStatusColor(
                        joint.status
                      )} border-2 ${selectedJointId === joint.id ? 'border-blue-500 border-4' : 'border-white'} shadow-lg hover:scale-125 transition-all duration-200`}
                      style={{
                        animation: joint.status === "error" ? "pulse 2s infinite" : "none",
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <div className="space-y-2">
                    <div className="font-semibold text-base">{joint.label}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Status:</span>
                      {getStatusBadge(joint.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">DOF:</span>
                        <span className="ml-1 font-medium">{joint.dof}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Temp:</span>
                        <span className="ml-1 font-medium">{joint.temperature}°C</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Torque:</span>
                        <span className="ml-1 font-medium">{joint.torque} Nm</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Angle:</span>
                        <span className="ml-1 font-medium">{joint.angle}°</span>
                      </div>
                    </div>
                    {joint.angle !== joint.targetAngle && (
                      <div className="text-xs text-yellow-600">
                        Target: {joint.targetAngle}° (Δ{Math.abs(joint.angle - joint.targetAngle)}°)
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>
    </Card>
  );
}
