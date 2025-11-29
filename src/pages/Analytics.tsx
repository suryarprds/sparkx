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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ArrowLeft, TrendingUp, Activity, Zap, Thermometer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Robot } from "@/types/robot";
import {
  getRobotMetrics,
  getStatusDistribution,
  getBatteryDistribution,
  getTemperatureDistribution,
  getRegionalDistribution,
} from "@/utils/robotUtils";
import { useRobots, useBatteryTrends, useTemperatureTrends } from "@/hooks/useAPI";

const AnalyticsPage = () => {
  const navigate = useNavigate();
  
  // Fetch robots from API
  const { data: robots = [], isLoading: robotsLoading } = useRobots();
  
  // Fetch historical trends from API
  const { data: batteryTrendData = [], isLoading: batteryLoading } = useBatteryTrends();
  const { data: temperatureTrendData = [], isLoading: tempLoading } = useTemperatureTrends();

  const statusDistribution = useMemo(() => getStatusDistribution(robots), [robots]);
  
  const batteryDistribution = useMemo(() => getBatteryDistribution(robots), [robots]);
  
  const temperatureDistribution = useMemo(() => getTemperatureDistribution(robots), [robots]);

  // Calculate location-based robot count
  const locationStats = useMemo(() => {
    const locationMap: { [key: string]: number } = {};
    robots.forEach((robot) => {
      locationMap[robot.location] = (locationMap[robot.location] || 0) + 1;
    });
    return Object.entries(locationMap)
      .map(([location, count]) => ({
        location: location.substring(0, 15),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [robots]);

  // Regional distribution stats
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

  // Country distribution stats  
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

  // Regional distribution for pie chart
  const regionalDistribution = useMemo(() => {
    const regionColors: { [key: string]: string } = {
      "North America": "#3b82f6",
      "Europe": "#10b981", 
      "Asia Pacific": "#f59e0b",
      "South America": "#ef4444"
    };
    
    return regionStats.map((region) => ({
      name: region.region,
      value: region.count,
      fill: regionColors[region.region] || "#6b7280"
    }));
  }, [regionStats]);

  // Calculate key metrics
  const metrics = getRobotMetrics(robots);
  
  // Show loading state
  const isLoading = robotsLoading || batteryLoading || tempLoading;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Loading Analytics...</h2>
          <p className="text-muted-foreground">Fetching robot data and historical trends from database</p>
        </Card>
      </div>
    );
  }

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
            Analytics Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time fleet performance metrics and trends
          </p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-card to-card/80 border-border">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Avg Battery</span>
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${metrics.averages.battery > 60 ? 'text-success' : metrics.averages.battery > 30 ? 'text-warning' : 'text-destructive'}`}>
              {metrics.averages.battery}%
            </p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-gradient-to-br from-card to-card/80 border-border">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Avg Temp</span>
              <Thermometer className="w-4 h-4 text-primary" />
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${metrics.averages.temperature < 50 ? 'text-success' : metrics.averages.temperature < 65 ? 'text-warning' : 'text-destructive'}`}>
              {metrics.averages.temperature}°C
            </p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-gradient-to-br from-card to-card/80 border-border">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Online</span>
              <Activity className="w-4 h-4 text-success" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-success">{metrics.statusCounts.online}/{metrics.total}</p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-gradient-to-br from-card to-card/80 border-border">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Avg Signal</span>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary">{metrics.averages.signal}%</p>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Status Distribution */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Robot Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Battery Level Distribution */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Battery Level Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={batteryDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {batteryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Battery Trend Chart */}
      <Card className="p-4 card-gradient border-border mb-6">
        <h3 className="font-semibold text-sm sm:text-base mb-4">Battery Level Trends (24h)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={batteryTrendData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
            <Legend />
            <Line type="monotone" dataKey="avgBattery" stroke="#3b82f6" strokeWidth={2} dot={false} name="Average Battery" />
            <Line type="monotone" dataKey="maxBattery" stroke="#10b981" strokeWidth={2} dot={false} name="Max Battery" />
            <Line type="monotone" dataKey="minBattery" stroke="#ef4444" strokeWidth={2} dot={false} name="Min Battery" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Temperature Distribution & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Temperature Distribution */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Temperature Ranges</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={temperatureDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {temperatureDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Temperature Trend */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Temperature Trends (24h)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={temperatureTrendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Line type="monotone" dataKey="avgTemp" stroke="#f59e0b" strokeWidth={2} dot={false} name="Average Temp" />
              <Line type="monotone" dataKey="maxTemp" stroke="#ef4444" strokeWidth={2} dot={false} name="Max Temp" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Regional Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
        {/* Regional Distribution Pie Chart */}
        <Card className="p-4 card-gradient border-border">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Fleet Distribution by Region</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={regionalDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {regionalDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
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
                height={80}
              />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
