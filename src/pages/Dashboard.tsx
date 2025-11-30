import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Activity, Battery, Signal, Thermometer, MapPin, Eye, Search, X, Filter, ArrowUpDown, Wifi, WifiOff, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, TrendingUp, Zap, AlertTriangle, Radio } from "lucide-react";
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
  useResourceUsage,
  useRobotMapLocations,
  useAlerts
} from "@/hooks/useAPI";
import RobotWorldMap from "@/components/RobotWorldMap";
import { Robot, ROBOT_CONFIG } from "@/types/robot";
import {
  getRobotMetrics,
  getBatteryColors,
  getTemperatureColors,
  getStatusColors,
  getStatusDistribution,
  getBatteryDistribution,
  getTemperatureDistribution,
  getRegionalDistribution,
  getFilterOptions,
  getLocationStats,
  getCountryStats,
} from "@/utils/robotUtils";

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Map selection states
  const [selectedMapRegion, setSelectedMapRegion] = useState<string | null>(null);
  const [selectedMapCountry, setSelectedMapCountry] = useState<string | null>(null);
  
  // Fetch robots from API
  const { data: robots = [], isLoading, error } = useRobots();
  
  // Fetch alerts from API
  const { data: alerts = [] } = useAlerts();
  
  // Analytics filter params based on map selection
  const analyticsFilterParams = useMemo(() => {
    const params: { region?: string; country?: string } = {};
    if (selectedMapRegion) params.region = selectedMapRegion;
    if (selectedMapCountry) params.country = selectedMapCountry;
    return Object.keys(params).length > 0 ? params : undefined;
  }, [selectedMapRegion, selectedMapCountry]);
  
  // Fetch analytics data
  const { data: fleetSummary } = useFleetSummary();
  const { data: batteryTrendData = [] } = useBatteryTrends(analyticsFilterParams);
  const { data: temperatureTrendData = [] } = useTemperatureTrends(analyticsFilterParams);
  const { data: uptimeTrendData = [] } = useUptimeTrends();
  const { data: activeIdleData = [] } = useActiveIdleTrends(analyticsFilterParams);
  const { data: alertTrendData = [] } = useAlertTrends();
  const { data: sensorHealthData = [] } = useSensorHealth();
  const { data: firmwareData = [] } = useFirmwareDistribution();
  const { data: maintenanceData } = useMaintenanceStatus();
  const { data: networkLatencyData = [] } = useNetworkLatency();
  const { data: dataIngestionData = [] } = useDataIngestion();
  const { data: taskCompletionData = [] } = useTaskCompletion(analyticsFilterParams);
  const { data: resourceUsageData = [] } = useResourceUsage();
  const { data: robotMapLocations = [] } = useRobotMapLocations();
  
  // Data is always live with React Query auto-refetch
  const isLive = true;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [batteryFilter, setBatteryFilter] = useState<string>("all");
  const [temperatureFilter, setTemperatureFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Chart colors
  const COLORS = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#a855f7',
    cyan: '#06b6d4',
  };

  // Calculate KPI metrics dynamically from robot data
  const metrics = getRobotMetrics(robots);
  const filterOptions = getFilterOptions(robots);
  
  // Calculate total unresolved alerts and critical alerts from actual alerts data
  const totalUnresolvedAlerts = alerts.filter(alert => !alert.isResolved).length;
  const totalCriticalAlerts = alerts.filter(alert => !alert.isResolved && alert.severity === 'critical').length;

  // Filter robots based on map selection for analytics
  const filteredRobotsForAnalytics = useMemo(() => {
    let filtered = robots;
    if (selectedMapRegion) {
      filtered = filtered.filter(robot => robot.region === selectedMapRegion);
    }
    if (selectedMapCountry) {
      filtered = filtered.filter(robot => robot.country === selectedMapCountry);
    }
    return filtered;
  }, [robots, selectedMapRegion, selectedMapCountry]);
  
  // Compute filtered metrics for display
  const filteredMetrics = useMemo(() => {
    return getRobotMetrics(filteredRobotsForAnalytics);
  }, [filteredRobotsForAnalytics]);
  
  // Get filter description for display
  const filterDescription = useMemo(() => {
    if (selectedMapCountry) {
      return `Showing data for ${selectedMapCountry}`;
    }
    if (selectedMapRegion) {
      return `Showing data for ${selectedMapRegion} region`;
    }
    return null;
  }, [selectedMapRegion, selectedMapCountry]);

  // Get unique values for filters from filterOptions
  const { locations: uniqueLocations, countries: uniqueCountries, states: uniqueStates, regions: uniqueRegions } = filterOptions;

  // Apply all filters
  const filteredRobots = robots
    .filter((robot) => {
      // Search filter
      const matchesSearch =
        robot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        robot.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        robot.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        robot.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        robot.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        robot.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        robot.status.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter !== "all" && robot.status !== statusFilter) return false;

      // Battery filter using dynamic thresholds
      if (batteryFilter !== "all") {
        const battery = robot.battery;
        if (batteryFilter === "critical" && battery >= ROBOT_CONFIG.battery.critical) return false;
        if (batteryFilter === "low" && (battery < ROBOT_CONFIG.battery.critical || battery >= ROBOT_CONFIG.battery.low)) return false;
        if (batteryFilter === "medium" && (battery < ROBOT_CONFIG.battery.low || battery >= ROBOT_CONFIG.battery.medium)) return false;
        if (batteryFilter === "high" && battery < ROBOT_CONFIG.battery.medium) return false;
      }

      // Temperature filter using dynamic thresholds
      if (temperatureFilter !== "all") {
        const temp = robot.temperature;
        if (temperatureFilter === "normal" && temp >= ROBOT_CONFIG.temperature.normal) return false;
        if (temperatureFilter === "warning" && (temp < ROBOT_CONFIG.temperature.normal || temp >= ROBOT_CONFIG.temperature.warning)) return false;
        if (temperatureFilter === "critical" && temp < ROBOT_CONFIG.temperature.warning) return false;
      }

      // Location filter
      if (locationFilter !== "all" && robot.location !== locationFilter) return false;
      
      // Country filter
      if (countryFilter !== "all" && robot.country !== countryFilter) return false;
      
      // State filter  
      if (stateFilter !== "all" && robot.state !== stateFilter) return false;
      
      // Region filter
      if (regionFilter !== "all" && robot.region !== regionFilter) return false;

      return true;
    });

  // Sort filtered robots
  const sortedRobots = [...filteredRobots].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "battery-asc":
        return a.battery - b.battery;
      case "battery-desc":
        return b.battery - a.battery;
      case "status":
        return a.status.localeCompare(b.status);
      case "updated":
        return b.lastUpdated.getTime() - a.lastUpdated.getTime();
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedRobots.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRobots = sortedRobots.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Chart distributions using dynamic data
  const statusDistribution = useMemo(() => getStatusDistribution(robots), [robots]);

  const batteryDistribution = useMemo(() => getBatteryDistribution(robots), [robots]);

  const temperatureDistribution = useMemo(() => getTemperatureDistribution(robots), [robots]);

  const locationStats = useMemo(() => getLocationStats(robots), [robots]);

  const regionStats = useMemo(() => {
    const regionMap: { [key: string]: number } = {};
    robots.forEach((robot) => {
      regionMap[robot.region] = (regionMap[robot.region] || 0) + 1;
    });
    return Object.entries(regionMap).map(([region, count]) => ({ region, count })).sort((a, b) => b.count - a.count);
  }, [robots]);

  const countryStats = useMemo(() => getCountryStats(robots), [robots]);

  const regionalDistribution = useMemo(() => getRegionalDistribution(robots), [robots]);

  const getStatusColor = (status: Robot['status']) => {
    const colors = getStatusColors(status);
    return `${colors.bg} ${colors.text}`;
  };

  const getBatteryColorClass = (battery: number) => getBatteryColors(battery).badge;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Dashboard...</h1>
          <p className="text-muted-foreground">Fetching robot data from database</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center border-destructive">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Error Loading Data</h1>
          <p className="text-muted-foreground mb-4">{error instanceof Error ? error.message : 'Failed to connect to backend'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6">
      {/* KPI Cards */}
      <div className="mb-6 sm:mb-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
        {/* Fleet Health */}
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-card to-card/80 border-border">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Fleet Health</span>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary">{metrics.fleetHealth}%</p>
          </div>
        </Card>

        {/* Online Units */}
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-card to-card/80 border-border">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Online</span>
              <Wifi className="w-4 h-4 text-success" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-success">{metrics.statusCounts.online}/{metrics.total}</p>
          </div>
        </Card>

        {/* Critical Alerts */}
        <Card 
          className="p-3 sm:p-4 bg-gradient-to-br from-card to-card/80 border-border cursor-pointer hover:border-primary transition-colors"
          onClick={() => navigate("/alerts")}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Alerts</span>
              <AlertTriangle className={`w-4 h-4 ${totalUnresolvedAlerts > 0 ? 'text-destructive animate-pulse' : 'text-success'}`} />
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${totalUnresolvedAlerts > 0 ? 'text-destructive' : 'text-success'}`}>
              {totalUnresolvedAlerts}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalUnresolvedAlerts > 0 ? 'Unresolved' : 'All Clear'}
            </p>
          </div>
        </Card>

        {/* Offline Units */}
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-card to-card/80 border-border">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Offline</span>
              <WifiOff className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-muted-foreground">{metrics.statusCounts.offline}</p>
            <p className="text-xs text-muted-foreground">Disconnected</p>
          </div>
        </Card>
      </div>

      {/* Tabs for Table and Analytics */}
      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="analytics">Fleet Summary</TabsTrigger>
          <TabsTrigger value="table">Fleet Search</TabsTrigger>
        </TabsList>

        {/* Robot Table Tab */}
        <TabsContent value="table" className="space-y-4 mt-0">

      {/* Robot Table with Search */}
      <Card className="card-gradient border-border overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search robots by name, ID, location, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 py-2 text-sm sm:text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setBatteryFilter("all");
                  setTemperatureFilter("all");
                  setLocationFilter("all");
                  setCountryFilter("all");
                  setStateFilter("all");
                  setRegionFilter("all");
                  setSortBy("name");
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="h-9 text-xs whitespace-nowrap"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          {/* Results Summary */}
          <div className="text-xs text-muted-foreground mt-2">
            {sortedRobots.length === robots.length ? (
              <>Showing <span className="font-semibold text-foreground">{sortedRobots.length}</span> robots</>
            ) : (
              <>Showing <span className="font-semibold text-foreground">{sortedRobots.length}</span> of <span className="font-semibold">{robots.length}</span> robots</>
            )}
          </div>
        </div>

        {sortedRobots.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead>Robot</TableHead>
                    <TableHead className="w-[140px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-full justify-between px-2">
                            Status
                            <Filter className="ml-2 h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-2">
                          <div className="space-y-1">
                            <Button
                              variant={statusFilter === "all" ? "default" : "ghost"}
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => { setStatusFilter("all"); handleFilterChange(); }}
                            >
                              All Status
                            </Button>
                            <Button
                              variant={statusFilter === "online" ? "default" : "ghost"}
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => { setStatusFilter("online"); handleFilterChange(); }}
                            >
                              Online
                            </Button>
                            <Button
                              variant={statusFilter === "charging" ? "default" : "ghost"}
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => { setStatusFilter("charging"); handleFilterChange(); }}
                            >
                              Charging
                            </Button>
                            <Button
                              variant={statusFilter === "offline" ? "default" : "ghost"}
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => { setStatusFilter("offline"); handleFilterChange(); }}
                            >
                              Offline
                            </Button>
                            <Button
                              variant={statusFilter === "error" ? "default" : "ghost"}
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => { setStatusFilter("error"); handleFilterChange(); }}
                            >
                              Error
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="w-[140px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-full justify-between px-2">
                            Battery
                            <Filter className="ml-2 h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-2">
                          <div className="space-y-1">
                            <Button
                              variant={batteryFilter === "all" ? "default" : "ghost"}
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => { setBatteryFilter("all"); handleFilterChange(); }}
                            >
                              All Levels
                            </Button>
                            <Button
                              variant={batteryFilter === "critical" ? "default" : "ghost"}
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => { setBatteryFilter("critical"); handleFilterChange(); }}
                            >
                              Critical (&lt;30%)
                            </Button>
                            <Button
                              variant={batteryFilter === "low" ? "default" : "ghost"}
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => { setBatteryFilter("low"); handleFilterChange(); }}
                            >
                              Low (30-60%)
                            </Button>
                            <Button
                              variant={batteryFilter === "medium" ? "default" : "ghost"}
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => { setBatteryFilter("medium"); handleFilterChange(); }}
                            >
                              Medium (60-85%)
                            </Button>
                            <Button
                              variant={batteryFilter === "high" ? "default" : "ghost"}
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => { setBatteryFilter("high"); handleFilterChange(); }}
                            >
                              High (85%+)
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-full justify-between px-2">
                            Location
                            <Filter className="ml-2 h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-2 max-h-[300px] overflow-y-auto">
                          <div className="space-y-1">
                            <Button
                              variant={locationFilter === "all" ? "default" : "ghost"}
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => { setLocationFilter("all"); handleFilterChange(); }}
                            >
                              All Locations
                            </Button>
                            {uniqueLocations.map((location) => (
                              <Button
                                key={location}
                                variant={locationFilter === location ? "default" : "ghost"}
                                size="sm"
                                className="w-full justify-start text-xs"
                                onClick={() => { setLocationFilter(location); handleFilterChange(); }}
                              >
                                {location}
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRobots.map((robot, index) => (
                    <TableRow
                      key={robot.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/robot/${robot.id}`)}
                    >
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="font-semibold">{robot.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isLive && (
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse" title="Live data" />
                          )}
                          <Badge className={getStatusColor(robot.status)}>
                            {robot.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Battery className={`w-4 h-4 ${getBatteryColorClass(robot.battery)}`} />
                          <span className={`font-mono font-semibold ${getBatteryColorClass(robot.battery)}`}>
                            {robot.battery}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{robot.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{robot.country || 'N/A'}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/robot/${robot.id}`);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {paginatedRobots.map((robot, index) => (
                <div
                  key={robot.id}
                  className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/robot/${robot.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">#{startIndex + index + 1}</span>
                      <div>
                        <h3 className="font-semibold text-sm">{robot.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">{robot.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isLive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      )}
                      <Badge className={`${getStatusColor(robot.status)} text-xs py-0 px-1.5`}>{robot.status}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Battery className={`w-3.5 h-3.5 ${getBatteryColorClass(robot.battery)}`} />
                      <span className={`font-mono font-semibold ${getBatteryColorClass(robot.battery)}`}>
                        {robot.battery}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{robot.location} • {robot.country || 'N/A'}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/robot/${robot.id}`);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-t border-border">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {startIndex + 1}-{Math.min(endIndex, sortedRobots.length)} of {sortedRobots.length}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <ChevronsLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <div className="flex items-center gap-1 px-1 sm:px-2">
                    <span className="text-xs sm:text-sm font-medium">{currentPage}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">/</span>
                    <span className="text-xs sm:text-sm font-medium">{totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  >
                    <ChevronsRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No robots found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setBatteryFilter("all");
                setTemperatureFilter("all");
                setLocationFilter("all");
                setCountryFilter("all");
                setStateFilter("all");
                setRegionFilter("all");
                setCurrentPage(1);
              }}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 mt-0">
          <div className="space-y-6">
            {/* Fleet Geographic View */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Fleet Geographic View</h2>
              <RobotWorldMap 
                locations={robotMapLocations} 
                onRegionChange={setSelectedMapRegion}
                onCountryChange={setSelectedMapCountry}
              />
            </div>

            {/* Filter Badge */}
            {filterDescription && (
              <Card className="p-3 bg-primary/10 border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                      {filterDescription}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ({filteredRobotsForAnalytics.length} robots)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedMapRegion(null);
                      setSelectedMapCountry(null);
                    }}
                  >
                    Clear Filter
                  </Button>
                </div>
              </Card>
            )}

            {/* SECTION 2: OPERATIONAL PERFORMANCE */}
            <div className="mb-4 mt-8">
              <h3 className="text-lg font-semibold text-primary mb-3">⚡ Operational Performance</h3>
            </div>

            {/* Active/Idle Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="p-4 card-gradient border-border">
                <h3 className="font-semibold text-sm sm:text-base mb-4">Active vs Idle Status (24h)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={activeIdleData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Bar dataKey="active" stackId="a" fill={COLORS.success} name="Active" />
                    <Bar dataKey="idle" stackId="a" fill={COLORS.warning} name="Idle" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-4 card-gradient border-border">
                <h3 className="font-semibold text-sm sm:text-base mb-4">Task Completion Status (24h)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={taskCompletionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Bar dataKey="succeeded" stackId="a" fill={COLORS.success} name="Succeeded" />
                    <Bar dataKey="failed" stackId="a" fill={COLORS.danger} name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* SECTION 3: HEALTH MONITORING */}
            <div className="mb-4 mt-8">
              <h3 className="text-lg font-semibold text-primary mb-3">🏥 Health Monitoring</h3>
            </div>

            {/* Battery & Temperature Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="p-4 card-gradient border-border">
                <h3 className="font-semibold text-sm sm:text-base mb-4">Battery Level Trends (24h)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={batteryTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Line type="monotone" dataKey="avgBattery" stroke={COLORS.primary} strokeWidth={2} name="Avg" />
                    <Line type="monotone" dataKey="maxBattery" stroke={COLORS.success} strokeWidth={2} name="Max" />
                    <Line type="monotone" dataKey="minBattery" stroke={COLORS.danger} strokeWidth={2} name="Min" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-4 card-gradient border-border">
                <h3 className="font-semibold text-sm sm:text-base mb-4">Temperature Monitoring (24h)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={temperatureTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Line type="monotone" dataKey="avgTemp" stroke={COLORS.warning} strokeWidth={2} name="Avg Temp" />
                    <Line type="monotone" dataKey="maxTemp" stroke={COLORS.danger} strokeWidth={2} name="Max Temp" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* End of Analytics Sections */}

          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
