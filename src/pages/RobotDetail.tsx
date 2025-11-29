import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Robot, ROBOT_CONFIG } from "@/types/robot";
import { useRobot } from "@/hooks/useAPI";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RobotSimulation } from "@/components/RobotSimulation";
import { OTAUpdateManager } from "@/components/OTAUpdateManager";
import { JointStatusPanel } from "@/components/JointStatusPanel";
import { RobotJointVisualizer } from "@/components/RobotJointVisualizer";
import { SystemDiagnosticsCard } from "@/components/SystemDiagnosticsCard";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { SensorDashboard } from "@/components/SensorDashboard";
import { SafetyAlertsPanel } from "@/components/SafetyAlertsPanel";
import { BatteryHealthLifecycle } from "@/components/BatteryHealthLifecycle";
import { ConnectivityHealthCard } from "@/components/ConnectivityHealthCard";
import { MaintenancePredictionPanel } from "@/components/MaintenancePredictionPanel";

import { RobotHealthSummary } from "@/components/RobotHealthSummary";
import {
  ArrowLeft,
  Activity,
  Battery,
  Signal,
  Wifi,
  Cpu,
  Thermometer,
  MapPin,
  Video,
  Gamepad2,
  BarChart3,
  Download,
  Wrench,
} from "lucide-react";

const RobotDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Fetch robot data from API
  const { data: robotData, isLoading } = useRobot(id!);
  
  // All hooks must be called before any conditional returns
  const [battery, setBattery] = useState(87);
  const [cpuLoad, setCpuLoad] = useState(42);
  const [temperature, setTemperature] = useState(42);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [batteryTrend, setBatteryTrend] = useState<"up" | "down" | "stable">("down");
  const [cpuTrend, setCpuTrend] = useState<"up" | "down" | "stable">("stable");
  const [tempTrend, setTempTrend] = useState<"up" | "down" | "stable">("stable");
  const [robotLocation, setRobotLocation] = useState({ 
    lat: 37.7749, 
    lng: -122.4194, 
    speed: 0.5 
  });
  
  // Transform API data to match Robot interface
  const robot: Robot | undefined = robotData ? {
    id: robotData.id,
    name: robotData.name,
    status: robotData.status,
    battery: robotData.telemetry?.[0]?.batteryPercentage || 0,
    signal: robotData.telemetry?.[0]?.signalStrength || 0,
    temperature: robotData.telemetry?.[0]?.temperatureC || 0,
    location: robotData.location || '',
    country: robotData.country || '',
    state: robotData.state || '',
    region: robotData.region || '',
    lastUpdated: new Date(robotData.telemetry?.[0]?.recordedAt || robotData.lastSeenAt),
    cpuLoad: robotData.telemetry?.[0]?.cpuLoadPercentage || 0,
    gpsCoordinates: {
      lat: robotData.telemetry?.[0]?.latitude || 0,
      lng: robotData.telemetry?.[0]?.longitude || 0,
    },
    connectivity: {
      wifi: robotData.telemetry?.[0]?.wifiStrength || 'Fair',
      cellular: robotData.telemetry?.[0]?.cellularStrength || 'Fair',
    },
  } : undefined;
  
  // Initialize with actual robot data - MUST be before conditional returns
  useEffect(() => {
    if (robotData) {
      const telemetry = robotData.telemetry?.[0];
      setBattery(telemetry?.batteryPercentage || 0);
      setCpuLoad(telemetry?.cpuLoadPercentage || 0);
      setTemperature(telemetry?.temperatureC || 0);
      setLastUpdated(new Date(telemetry?.recordedAt || robotData.lastSeenAt));
      setRobotLocation({
        lat: telemetry?.latitude || 0,
        lng: telemetry?.longitude || 0,
        speed: 0.5
      });
    }
  }, [robotData]);

  // Update live data from API - React Query auto-refetches every 3 seconds
  useEffect(() => {
    if (robotData) {
      // Calculate trends based on API data changes
      const newBattery = robotData.telemetry?.[0]?.batteryPercentage || robotData.battery || 0;
      const newCpuLoad = robotData.telemetry?.[0]?.cpuLoadPercentage || 0;
      const newTemperature = robotData.telemetry?.[0]?.temperatureC || 0;
      
      const batteryChange = newBattery - (battery || 0);
      const cpuChange = newCpuLoad - (cpuLoad || 0);
      const tempChange = newTemperature - (temperature || 0);
      
      setBattery(newBattery);
      setCpuLoad(newCpuLoad);
      setTemperature(newTemperature);
      
      setBatteryTrend(batteryChange < -0.5 ? "down" : batteryChange > 0.5 ? "up" : "stable");
      setCpuTrend(cpuChange > 2 ? "up" : cpuChange < -2 ? "down" : "stable");
      setTempTrend(tempChange > 1 ? "up" : tempChange < -1 ? "down" : "stable");
      
      setLastUpdated(new Date());
    }
  }, [robotData, battery, cpuLoad, temperature]);
  
  // Calculate estimated runtime from telemetry or estimate from battery capacity
  const calculateRuntime = (batteryPercent: number) => {
    // Use estimatedRuntimeMin from telemetry if available, otherwise estimate from battery capacity
    const telemetryRuntime = robotData?.telemetry?.[0]?.estimatedRuntimeMin;
    if (telemetryRuntime) {
      const hours = Math.floor(telemetryRuntime / 60);
      const minutes = Math.round(telemetryRuntime % 60);
      return hours === 0 ? `${minutes}m` : `${hours}h ${minutes}m`;
    }
    // Fallback: estimate 8-12 hours from full battery based on capacity
    const maxRuntimeHours = (robotData?.batteryCapacityKwh || 5.2) * 1.5; // ~1.5 hours per kWh
    const totalMinutes = (batteryPercent / 100) * maxRuntimeHours * 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    if (hours === 0) {
      return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  };
  
  // If robot not found, show error
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Robot Data...</h1>
        </Card>
      </div>
    );
  }

  if (!robot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Robot Not Found</h1>
          <p className="text-muted-foreground mb-4">Robot with ID "{id}" does not exist.</p>
          <Button onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Data-driven color functions
  const getBatteryColor = (battery: number) => {
    if (battery >= ROBOT_CONFIG.battery.medium) return "text-success";
    if (battery >= ROBOT_CONFIG.battery.low) return "text-warning";
    return "text-destructive";
  };

  const getTempColor = (temp: number) => {
    if (temp < ROBOT_CONFIG.temperature.normal) return "text-success";
    if (temp < ROBOT_CONFIG.temperature.warning) return "text-warning";
    return "text-destructive";
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return "↑";
    if (trend === "down") return "↓";
    return "→";
  };

  const getTrendColor = (trend: "up" | "down" | "stable", isGood: "up" | "down") => {
    if (trend === "stable") return "text-muted-foreground";
    if (trend === isGood) return "text-success";
    return "text-warning";
  };

  const formatLastUpdated = (date: Date) => {
    const secondsAgo = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secondsAgo < 5) return "Just now";
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    return `${Math.floor(secondsAgo / 60)}m ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4 flex-wrap">
          <Button variant="outline" size="icon" onClick={() => navigate("/")} className="h-9 w-9 sm:h-10 sm:w-10">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">
              {robot.name}
            </h1>
          </div>
          <Badge className={`flex-shrink-0 ${
            robot.status === "online" ? "bg-success text-success-foreground" :
            robot.status === "charging" ? "bg-warning text-warning-foreground" :
            robot.status === "error" ? "bg-destructive text-destructive-foreground" :
            "bg-muted text-muted-foreground"
          }`}>
            <Activity className="w-3 h-3 mr-1 animate-pulse" />
            <span className="hidden xs:inline capitalize">{robot.status}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="w-3 h-3" />
          <span>Last updated: {formatLastUpdated(lastUpdated)}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Tabs */}
        <div className="card-gradient border border-border rounded-lg overflow-hidden">
          <Tabs defaultValue="monitor" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 bg-secondary/10 p-1 rounded-lg h-auto">
              <TabsTrigger value="monitor" className="text-xs sm:text-sm rounded-md bg-slate-800/50 data-[state=active]:bg-green-600/20 data-[state=active]:text-green-300 data-[state=active]:border-green-500 border border-transparent py-3 sm:py-4 transition-all duration-200 hover:bg-slate-700/50">
                <Activity className="w-4 h-4 mr-1 sm:mr-2 text-green-400" />
                <span className="font-medium">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="control" className="text-xs sm:text-sm rounded-md bg-slate-800/50 data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 data-[state=active]:border-blue-500 border border-transparent py-3 sm:py-4 transition-all duration-200 hover:bg-slate-700/50">
                <Gamepad2 className="w-4 h-4 mr-1 sm:mr-2 text-blue-400" />
                <span className="font-medium">Control</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm rounded-md bg-slate-800/50 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300 data-[state=active]:border-purple-500 border border-transparent py-3 sm:py-4 transition-all duration-200 hover:bg-slate-700/50">
                <BarChart3 className="w-4 h-4 mr-1 sm:mr-2 text-purple-400" />
                <span className="font-medium">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="updates" className="text-xs sm:text-sm rounded-md bg-slate-800/50 data-[state=active]:bg-orange-600/20 data-[state=active]:text-orange-300 data-[state=active]:border-orange-500 border border-transparent py-3 sm:py-4 transition-all duration-200 hover:bg-slate-700/50">
                <Download className="w-4 h-4 mr-1 sm:mr-2 text-orange-400" />
                <span className="font-medium">Updates</span>
              </TabsTrigger>
            </TabsList>

          <TabsContent value="monitor" className="space-y-3 sm:space-y-4 p-3 sm:p-4">
            {/* Joint Health Visualization - Direct content without accordion */}
            <div>
              <RobotJointVisualizer />
            </div>

            <Accordion type="multiple" className="space-y-3">
              {/* Safety & Alerts Section - PRIORITY 2 */}
              <AccordionItem value="safety" className="border-0 card-gradient border border-border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-800/50 transition-colors [&[data-state=open]]:bg-slate-800/30">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-destructive" />
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Safety & Alerts</h3>
                        <p className="text-xs text-muted-foreground">Real-time safety monitoring & alert management</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div className="text-xs">
                        <div className="text-warning font-semibold">2 Active</div>
                        <div className="text-muted-foreground">1 Critical</div>
                      </div>
                      <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <SafetyAlertsPanel />
                </AccordionContent>
              </AccordionItem>

              {/* Sensors & Environmental - PRIORITY 3 for operators */}
              <AccordionItem value="sensors" className="border-0 card-gradient border border-border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-800/50 transition-colors [&[data-state=open]]:bg-slate-800/30">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Signal className="w-5 h-5 text-green-400" />
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Sensors & Environmental</h3>
                        <p className="text-xs text-muted-foreground">IMU, cameras, LiDAR, environmental monitoring</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div className="text-xs">
                        <div className="text-success font-semibold">15/16 Active</div>
                        <div className="text-muted-foreground">{temperature.toFixed(0)}°C Ambient</div>
                      </div>
                      <div className="w-2 h-2 bg-warning rounded-full" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <SensorDashboard robotId={id!} />
                </AccordionContent>
              </AccordionItem>

              {/* Battery Health & Lifecycle */}
              <AccordionItem value="battery" className="border-0 card-gradient border border-border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-800/50 transition-colors [&[data-state=open]]:bg-slate-800/30">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Battery className="w-5 h-5 text-green-400" />
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Battery Health & Lifecycle</h3>
                        <p className="text-xs text-muted-foreground">Battery management & replacement planning</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div className="text-xs">
                        <div className="text-success font-semibold">87% Charge</div>
                        <div className="text-muted-foreground">94% Health</div>
                      </div>
                      <div className="w-2 h-2 bg-success rounded-full" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <BatteryHealthLifecycle />
                </AccordionContent>
              </AccordionItem>

              {/* Connectivity Health */}
              <AccordionItem value="connectivity" className="border-0 card-gradient border border-border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-800/50 transition-colors [&[data-state=open]]:bg-slate-800/30">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-5 h-5 text-cyan-400" />
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Connectivity Health</h3>
                        <p className="text-xs text-muted-foreground">Network status & communication monitoring</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div className="text-xs">
                        <div className="text-success font-semibold">12ms Latency</div>
                        <div className="text-muted-foreground">99.4% Uptime</div>
                      </div>
                      <div className="w-2 h-2 bg-success rounded-full" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <ConnectivityHealthCard />
                </AccordionContent>
              </AccordionItem>

              {/* Predictive Maintenance */}
              <AccordionItem value="maintenance" className="border-0 card-gradient border border-border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-800/50 transition-colors [&[data-state=open]]:bg-slate-800/30">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-orange-400" />
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Predictive Maintenance</h3>
                        <p className="text-xs text-muted-foreground">AI-powered failure prediction & scheduling</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div className="text-xs">
                        <div className="text-success font-semibold">Next: 12 days</div>
                        <div className="text-muted-foreground">Score: 87%</div>
                      </div>
                      <div className="w-2 h-2 bg-success rounded-full" />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <MaintenancePredictionPanel />
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </TabsContent>

          <TabsContent value="control" className="p-3 sm:p-4 space-y-4">
            <RobotSimulation robotId={id} />
            
            {/* Visual & Location Control Panel */}
            <div className="border-0 card-gradient border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-pink-400" />
                  <div className="text-left">
                    <h3 className="font-semibold text-base">Visual & Location Control</h3>
                    <p className="text-xs text-muted-foreground">Camera feeds & geolocation tracking for robot control</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  {/* Camera Feed */}
                  <Card className="p-3 sm:p-4 card-gradient border-border">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
                      <Video className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
                      <h3 className="font-semibold text-sm sm:text-base">Intel RealSense Camera Feed</h3>
                      <Badge variant="outline" className="ml-auto text-xs sm:text-sm">
                        <div className="w-2 h-2 rounded-full bg-destructive animate-pulse mr-1 sm:mr-2" />
                        LIVE
                      </Badge>
                    </div>
                    <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
                      <div className="relative z-10 text-center">
                        <Video className="w-12 h-12 mx-auto mb-2 text-primary animate-pulse-glow" />
                        <p className="text-sm text-muted-foreground">Live Camera Stream</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1">1920x1080 @ 30fps</p>
                      </div>
                    </div>
                  </Card>

                  {/* Location Map */}
                  <Card className="p-3 sm:p-4 card-gradient border-border">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
                      <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-destructive" />
                      <h3 className="font-semibold text-sm sm:text-base">Live Location</h3>
                      <Badge variant="outline" className="text-xs sm:text-sm">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse mr-1 sm:mr-2" />
                        GPS Active
                      </Badge>
                    </div>
                    <div className="aspect-video bg-secondary rounded-lg relative overflow-hidden border">
                      {/* Google Maps - Non-interactive overlay */}
                      <iframe
                        src={`https://maps.google.com/maps?q=${robotLocation.lat},${robotLocation.lng}&t=h&z=18&ie=UTF8&iwloc=&output=embed`}
                        width="100%"
                        height="100%"
                        className="rounded-lg border-0"
                        allowFullScreen={false}
                        loading="lazy"
                        title="Robot GPS location map"
                      />
                      {/* Interaction blocker overlay */}
                      <div className="absolute inset-0 bg-transparent cursor-not-allowed" 
                           title="Map interaction disabled - Locked to robot position" />
                      
                      {/* Fixed coordinate display */}
                      <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded font-mono">
                        📍 {robotLocation.lat.toFixed(6)}, {robotLocation.lng.toFixed(6)}
                      </div>
                      
                      {/* Map locked notice */}
                      <div className="absolute top-3 right-3 bg-green-600/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        🔒 Position Locked
                      </div>
                      {/* Precise Robot Position Marker */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative">
                          <div className="w-6 h-6 bg-red-500 rounded-full border-3 border-white shadow-lg animate-pulse flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded font-bold shadow-lg">
                            🤖 ROBOT
                          </div>
                          {/* Accuracy circle */}
                          <div className="absolute inset-0 w-12 h-12 border-2 border-red-300 rounded-full animate-ping opacity-30 -translate-x-3 -translate-y-3" />
                        </div>
                      </div>
                      {/* Robot status overlay */}
                      <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm p-2 rounded text-xs">
                        <p className="font-mono text-primary">{robotLocation.lat.toFixed(6)}° N, {robotLocation.lng.toFixed(6)}° W</p>
                        <p className="text-muted-foreground">Accuracy: ±2m • Speed: {robotLocation.speed.toFixed(1)} m/s</p>
                        <p className="text-xs text-green-400 mt-1">🔒 Fixed Position View</p>
                        <p className="text-xs text-yellow-400">Map locked to robot location</p>
                      </div>
                      {/* Status indicators */}
                      <div className="absolute bottom-12 right-3 flex flex-col gap-1">
                        <Badge variant="secondary" className="text-xs bg-green-600">
                          <MapPin className="w-3 h-3 mr-1" />
                          GPS Active
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-red-600/80 text-white">
                          🔒 No Pan/Zoom
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="p-3 sm:p-4">
            <AnalyticsCharts robotId={id} />
          </TabsContent>

          <TabsContent value="updates" className="p-3 sm:p-4">
            <OTAUpdateManager robotId={id || ""} />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
};

export default RobotDetail;
