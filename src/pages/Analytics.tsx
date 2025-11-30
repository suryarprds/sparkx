import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  ArrowLeft, 
  TrendingUp, 
  Activity, 
  Zap, 
  Thermometer, 
  AlertTriangle,
  Radio,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useRobots, 
  useBatteryTrends, 
  useTemperatureTrends,
  useFleetSummary,
  useUptimeTrends,
  useActiveIdleTrends,
  useAlertTrends,
  useSensorHealth,
  useFirmwareDistribution,
  useMaintenanceStatus,
  useNetworkLatency,
  useDataIngestion,
  useTaskCompletion,
  useResourceUsage
} from "@/hooks/useAPI";

const AnalyticsPage = () => {
  const navigate = useNavigate();
  
  // Fetch all analytics data
  const { data: robots = [], isLoading: robotsLoading } = useRobots();
  const { data: fleetSummary, isLoading: summaryLoading } = useFleetSummary();
  const { data: batteryTrendData = [], isLoading: batteryLoading } = useBatteryTrends();
  const { data: temperatureTrendData = [], isLoading: tempLoading } = useTemperatureTrends();
  const { data: uptimeTrendData = [] } = useUptimeTrends();
  const { data: activeIdleData = [] } = useActiveIdleTrends();
  const { data: alertTrendData = [] } = useAlertTrends();
  const { data: sensorHealthData = [] } = useSensorHealth();
  const { data: firmwareData = [] } = useFirmwareDistribution();
  const { data: maintenanceData } = useMaintenanceStatus();
  const { data: networkLatencyData = [] } = useNetworkLatency();
  const { data: dataIngestionData = [] } = useDataIngestion();
  const { data: taskCompletionData = [] } = useTaskCompletion();
  const { data: resourceUsageData = [] } = useResourceUsage();

  // Calculate regional and country distribution from robots
  const regionStats = useMemo(() => {
    const regionMap: { [key: string]: number } = {};
    robots.forEach((robot) => {
      regionMap[robot.region] = (regionMap[robot.region] || 0) + 1;
    });
    return Object.entries(regionMap)
      .map(([region, count]) => ({
        region,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [robots]);

  const countryStats = useMemo(() => {
    const countryMap: { [key: string]: number } = {};
    robots.forEach((robot) => {
      countryMap[robot.country] = (countryMap[robot.country] || 0) + 1;
    });
    return Object.entries(countryMap)
      .map(([country, count]) => ({
        country: country.length > 12 ? country.substring(0, 12) + "..." : country,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [robots]);

  const isLoading = robotsLoading || summaryLoading || batteryLoading || tempLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Loading Analytics...</h2>
          <p className="text-muted-foreground">Fetching fleet analytics data</p>
        </Card>
      </div>
    );
  }

  const COLORS = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#a855f7',
    cyan: '#06b6d4',
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/dashboard")}
          className="h-9 w-9 sm:h-10 sm:w-10"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Robot Fleet Monitor
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Live status of {fleetSummary?.totalRobots || 0} robots • Last updated: {new Date(fleetSummary?.lastUpdated || Date.now()).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Row 1: Health at a Glance - Live Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Active Robots</span>
              <Activity className="w-4 h-4 text-success" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-success">
              {fleetSummary?.activeRobots || 0}/{fleetSummary?.totalRobots || 0}
            </p>
            {fleetSummary && fleetSummary.activeRobots > (fleetSummary.totalRobots * 0.9) && (
              <Badge variant="outline" className="text-xs border-success text-success">+2 today</Badge>
            )}
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Fleet Uptime</span>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary">
              {fleetSummary?.fleetUptime.toFixed(1) || 0}%
            </p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-gradient-to-br from-danger/10 to-danger/5 border-danger/20">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Alerts</span>
              <AlertTriangle className="w-4 h-4 text-danger" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-danger">
              {fleetSummary?.totalAlerts || 0}
            </p>
            <div className="flex gap-2 text-xs">
              <span className="text-danger">{fleetSummary?.criticalAlerts || 0} critical</span>
              <span className="text-warning">{fleetSummary?.highAlerts || 0} high</span>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-gradient-to-br from-cyan/10 to-cyan/5 border-cyan/20">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Data Ingestion</span>
              <Radio className="w-4 h-4 text-cyan" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-cyan">
              {fleetSummary?.messagesPerMinute || 0}
            </p>
            <span className="text-xs text-muted-foreground">msg/min</span>
          </div>
        </Card>
      </div>

      {/* Row 2: Uptime & Active/Idle Robots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Robot Uptime / Availability */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Fleet Uptime % (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={uptimeTrendData}>
              <defs>
                <linearGradient id="colorAvailability" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                formatter={(value: any) => `${value}%`}
              />
              <Legend />
              <Area type="monotone" dataKey="availability" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorAvailability)" name="Availability %" />
              <Line type="monotone" dataKey="downtimeMinutes" stroke={COLORS.danger} dot={false} name="Downtime (min)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Active vs Idle Robots */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Active vs. Idle Robots (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activeIdleData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Bar dataKey="active" stackId="a" fill={COLORS.success} name="Active" radius={[4, 4, 0, 0]} />
              <Bar dataKey="idle" stackId="a" fill={COLORS.warning} name="Idle" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 3: Alert Trends & Sensor Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Alert / Incident Count */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Alert Count by Severity (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={alertTrendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Line type="monotone" dataKey="critical" stroke={COLORS.danger} strokeWidth={2} dot={{ r: 3 }} name="Critical" />
              <Line type="monotone" dataKey="high" stroke={COLORS.warning} strokeWidth={2} dot={{ r: 3 }} name="High" />
              <Line type="monotone" dataKey="medium" stroke={COLORS.primary} strokeWidth={2} dot={false} name="Medium" />
              <Line type="monotone" dataKey="low" stroke={COLORS.success} strokeWidth={2} dot={false} name="Low" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Sensor Health */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Sensor Health Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sensorHealthData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="sensor" type="category" width={100} />
              <Tooltip 
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                formatter={(value: any, name: string) => {
                  if (name === 'percentage') return `${value}%`;
                  return value;
                }}
              />
              <Bar dataKey="percentage" fill={COLORS.success} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 4: Firmware & Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Firmware Version Distribution */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Firmware Version Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={firmwareData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="version" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Robot Count" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Maintenance Status */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Maintenance Window Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'In Window', value: maintenanceData?.inWindow || 0, fill: COLORS.success },
                  { name: 'Overdue', value: maintenanceData?.overdue || 0, fill: COLORS.danger },
                  { name: 'Scheduled', value: maintenanceData?.scheduled || 0, fill: COLORS.primary },
                  { name: 'Completed', value: maintenanceData?.completed || 0, fill: COLORS.cyan },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                label={(entry) => `${entry.name}: ${entry.value}`}
              >
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 5: Network & Data Ingestion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Network Latency by Region */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Network Latency by Region</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={networkLatencyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="region" angle={-45} textAnchor="end" height={80} />
              <YAxis label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                formatter={(value: any, name: string) => {
                  if (name === 'avgLatency') return `${value}ms`;
                  return value;
                }}
              />
              <Bar 
                dataKey="avgLatency" 
                fill={COLORS.primary} 
                radius={[4, 4, 0, 0]} 
                name="Avg Latency"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Data Ingestion Volume */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Data Ingestion (msgs/min - Last Hour)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dataIngestionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="messagesPerMinute" 
                stroke={COLORS.cyan} 
                strokeWidth={3} 
                dot={{ r: 4 }} 
                name="Msg/Min (5-min avg)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 6: Task Completion & CPU/Memory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Task Completion Rate */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Task Success / Failure (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskCompletionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Bar dataKey="succeeded" stackId="a" fill={COLORS.success} name="Succeeded" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" stackId="a" fill={COLORS.danger} name="Failed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Overall Success Rate: <span className="font-bold text-success">
                {taskCompletionData.length > 0 
                  ? (taskCompletionData.reduce((sum, d) => sum + d.successRate, 0) / taskCompletionData.filter(d => d.total > 0).length).toFixed(1)
                  : 0}%
              </span>
            </p>
          </div>
        </Card>

        {/* CPU / Memory Usage */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">CPU / Memory Usage (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={resourceUsageData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" label={{ value: 'CPU %', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Memory %', angle: 90, position: 'insideRight' }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="avgCpu" 
                stroke={COLORS.warning} 
                strokeWidth={2} 
                dot={false} 
                name="CPU %"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="avgMemory" 
                stroke={COLORS.purple} 
                strokeWidth={2} 
                dot={false} 
                name="Memory %"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 7: Battery & Temperature Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Battery Level Trends */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Battery Level Trends (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={batteryTrendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Line type="monotone" dataKey="avgBattery" stroke={COLORS.primary} strokeWidth={2} dot={false} name="Average Battery" />
              <Line type="monotone" dataKey="maxBattery" stroke={COLORS.success} strokeWidth={2} dot={false} name="Max Battery" />
              <Line type="monotone" dataKey="minBattery" stroke={COLORS.danger} strokeWidth={2} dot={false} name="Min Battery" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Temperature Trends */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Temperature Trends (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={temperatureTrendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Line type="monotone" dataKey="avgTemp" stroke={COLORS.warning} strokeWidth={2} dot={false} name="Average Temp" />
              <Line type="monotone" dataKey="maxTemp" stroke={COLORS.danger} strokeWidth={2} dot={false} name="Max Temp" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 8: Regional Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
        {/* Regional Distribution Bar Chart */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Robot Deployment by Region</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={regionStats}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="region" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Robot Count" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Country Distribution Bar Chart */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Robot Deployment by Country</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={countryStats}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="country" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" fill={COLORS.success} radius={[4, 4, 0, 0]} name="Robot Count" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
