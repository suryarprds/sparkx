import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Battery, Cpu, Thermometer, Activity, TrendingUp } from "lucide-react";
import { useRobotTelemetry } from "@/hooks/useAPI";

interface DataPoint {
  time: string;
  battery: number;
  cpu: number;
  temperature: number;
  memoryUsed: number;
  networkLatency: number;
}

interface AnalyticsChartsProps {
  robotId?: string;
}

export function AnalyticsCharts({ robotId }: AnalyticsChartsProps) {
  // Fetch real telemetry data from database (last 24 hours)
  const { data: telemetryData } = useRobotTelemetry(robotId!, { hours: 24 });
  
  const [historicalData, setHistoricalData] = useState<DataPoint[]>([]);

  // Load historical data from telemetry
  useEffect(() => {
    if (telemetryData && telemetryData.length > 0) {
      const data: DataPoint[] = telemetryData
        .slice(0, 48) // Last 48 points
        .reverse()
        .map((t: any) => {
          const timestamp = new Date(t.recordedAt);
          const hours = timestamp.getHours();
          const minutes = timestamp.getMinutes();
          
          return {
            time: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
            battery: t.batteryPercentage || 0,
            cpu: t.cpuLoadPercentage || 0,
            temperature: t.temperatureC || 0,
            memoryUsed: t.memoryUsedGb || 0,
            networkLatency: t.networkLatencyMs || 0,
          };
        });
      setHistoricalData(data);
    }
  }, [telemetryData]);

  // Generate joint wear data from robot specifications (static for now)
  const jointWearData = [
    { joint: "Hip", cycles: 12000, wear: 7, health: 93 },
    { joint: "Knee_High_L", cycles: 12000, wear: 10, health: 90 },
    { joint: "Knee_High_R", cycles: 12000, wear: 12, health: 88 },
    { joint: "Ankle_Left", cycles: 12000, wear: 5, health: 95 },
    { joint: "Ankle_Right", cycles: 12000, wear: 6, health: 94 },
    { joint: "Shoulder_L", cycles: 8000, wear: 3, health: 97 },
    { joint: "Shoulder_R", cycles: 8000, wear: 4, health: 96 },
    { joint: "Elbow_Left", cycles: 7800, wear: 2, health: 98 },
    { joint: "Elbow_Right", cycles: 7800, wear: 2, health: 98 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-primary mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}
              {entry.name === "Battery" ? "%" : ""}
              {entry.name === "CPU" ? "%" : ""}
              {entry.name === "Temperature" ? "°C" : ""}
              {entry.name === "Memory" ? " GB" : ""}
              {entry.name === "Latency" ? "ms" : ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="battery" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-secondary/20 h-auto p-1">
          <TabsTrigger value="battery" className="data-[state=active]:bg-background">
            <Battery className="w-4 h-4 mr-2" />
            Battery
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-background">
            <Cpu className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="temperature" className="data-[state=active]:bg-background">
            <Thermometer className="w-4 h-4 mr-2" />
            Temperature
          </TabsTrigger>
          <TabsTrigger value="joints" className="data-[state=active]:bg-background">
            <Activity className="w-4 h-4 mr-2" />
            Joint Wear
          </TabsTrigger>
        </TabsList>

        <TabsContent value="battery" className="space-y-4">
          <Card className="p-4 card-gradient border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Battery Discharge Curve</h3>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-cyan-400">
                  {historicalData[historicalData.length - 1]?.battery.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Current Level</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="batteryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="battery"
                  name="Battery"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#batteryGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="p-4 card-gradient border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">CPU & Memory Usage</h3>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-400">
                  {historicalData[historicalData.length - 1]?.cpu.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Current CPU</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  name="CPU"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="memoryUsed"
                  name="Memory"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="networkLatency"
                  name="Latency"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="temperature" className="space-y-4">
          <Card className="p-4 card-gradient border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">System Temperature Trends</h3>
                <p className="text-xs text-muted-foreground">CPU/System temperature - Last 24 hours</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-400">
                  {historicalData[historicalData.length - 1]?.temperature.toFixed(1)}°C
                </p>
                <p className="text-xs text-muted-foreground">Current System Temp</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} domain={[30, 80]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature"
                  stroke="#f97316"
                  fillOpacity={1}
                  fill="url(#tempGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="joints" className="space-y-4">
          <Card className="p-4 card-gradient border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Joint Wear Analysis</h3>
                <p className="text-xs text-muted-foreground">Cycle count & health metrics</p>
              </div>
              <div className="text-right flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <p className="text-sm text-muted-foreground">Sorted by wear level</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jointWearData.sort((a, b) => b.wear - a.wear)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="joint" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="health" name="Health %" fill="#22c55e" />
                <Bar dataKey="wear" name="Wear %" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {jointWearData.map((joint) => (
                <div
                  key={joint.joint}
                  className="p-2 rounded-lg bg-muted border border-border"
                >
                  <p className="text-xs font-semibold text-primary">{joint.joint}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {joint.cycles.toLocaleString()} cycles
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
