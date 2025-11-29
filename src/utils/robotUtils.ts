// Utility functions for robot data processing and analytics

import { Robot, ROBOT_CONFIG } from '@/types/robot';

// Calculate robot fleet metrics
export function getRobotMetrics(robots: Robot[]) {
  const total = robots.length;
  const online = robots.filter((r) => r.status === "online").length;
  const charging = robots.filter((r) => r.status === "charging").length;
  const offline = robots.filter((r) => r.status === "offline").length;
  const error = robots.filter((r) => r.status === "error").length;
  const active = online + charging;
  
  const avgBattery = robots.reduce((sum, r) => sum + r.battery, 0) / (total || 1);
  const avgTemperature = robots.reduce((sum, r) => sum + r.temperature, 0) / (total || 1);
  const avgSignal = robots.reduce((sum, r) => sum + r.signal, 0) / (total || 1);
  
  const criticalAlerts = robots.filter(
    (r) => r.status === "error" || r.battery < ROBOT_CONFIG.battery.critical || r.temperature > ROBOT_CONFIG.temperature.warning
  ).length;
  
  const fleetHealth = total > 0 ? Math.round((active / total) * 100) : 0;
  const uptime = total > 0 ? Number(((active / total) * 100).toFixed(1)) : 0;

  return {
    total,
    totalRobots: total,
    activeRobots: active,
    inactiveRobots: total - active,
    fleetHealth,
    uptime,
    criticalAlerts,
    statusCounts: {
      online,
      charging,
      offline,
      error,
    },
    averages: {
      battery: Math.round(avgBattery),
      temperature: Math.round(avgTemperature),
      signal: Math.round(avgSignal),
    },
    averageBattery: Math.round(avgBattery),
    averageTemperature: Math.round(avgTemperature),
    averageSignal: Math.round(avgSignal),
  };
}

// Get status distribution
export function getStatusDistribution(robots: Robot[]) {
  const statusMap: { [key: string]: number } = {};
  robots.forEach((robot) => {
    statusMap[robot.status] = (statusMap[robot.status] || 0) + 1;
  });
  
  const colors: { [key: string]: string } = {
    online: "#10b981",
    charging: "#3b82f6",
    offline: "#6b7280",
    error: "#ef4444",
  };

  return Object.entries(statusMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: colors[name] || "#6b7280",
  }));
}

// Get battery level distribution
export function getBatteryDistribution(robots: Robot[]) {
  const ranges = {
    "Critical (0-20%)": 0,
    "Low (21-40%)": 0,
    "Medium (41-70%)": 0,
    "Good (71-90%)": 0,
    "Excellent (91-100%)": 0,
  };

  robots.forEach((robot) => {
    if (robot.battery <= 20) ranges["Critical (0-20%)"]++;
    else if (robot.battery <= 40) ranges["Low (21-40%)"]++;
    else if (robot.battery <= 70) ranges["Medium (41-70%)"]++;
    else if (robot.battery <= 90) ranges["Good (71-90%)"]++;
    else ranges["Excellent (91-100%)"]++;
  });

  const colors: { [key: string]: string } = {
    "Critical (0-20%)": "#ef4444",
    "Low (21-40%)": "#f97316",
    "Medium (41-70%)": "#eab308",
    "Good (71-90%)": "#22c55e",
    "Excellent (91-100%)": "#10b981",
  };

  return Object.entries(ranges).map(([name, value]) => ({
    name,
    value,
    fill: colors[name] || "#6b7280",
  }));
}

// Get temperature distribution
export function getTemperatureDistribution(robots: Robot[]) {
  const ranges = {
    "Normal (<45°C)": 0,
    "Warm (45-60°C)": 0,
    "Hot (>60°C)": 0,
  };

  robots.forEach((robot) => {
    if (robot.temperature < 45) ranges["Normal (<45°C)"]++;
    else if (robot.temperature <= 60) ranges["Warm (45-60°C)"]++;
    else ranges["Hot (>60°C)"]++;
  });

  const colors: { [key: string]: string } = {
    "Normal (<45°C)": "#10b981",
    "Warm (45-60°C)": "#f59e0b",
    "Hot (>60°C)": "#ef4444",
  };

  return Object.entries(ranges).map(([name, value]) => ({
    name,
    value,
    fill: colors[name] || "#6b7280",
  }));
}

// Get regional distribution
export function getRegionalDistribution(robots: Robot[]) {
  const regionMap: { [key: string]: number } = {};
  robots.forEach((robot) => {
    regionMap[robot.region] = (regionMap[robot.region] || 0) + 1;
  });

  const colors: { [key: string]: string } = {
    "North America": "#3b82f6",
    "Europe": "#10b981",
    "Asia Pacific": "#f59e0b",
    "South America": "#ef4444",
  };

  return Object.entries(regionMap).map(([name, value]) => ({
    name,
    value,
    fill: colors[name] || "#6b7280",
  }));
}

// Get filter options
export function getFilterOptions(robots: Robot[]) {
  const locations = new Set<string>();
  const countries = new Set<string>();
  const states = new Set<string>();
  const regions = new Set<string>();

  robots.forEach((robot) => {
    if (robot.location) locations.add(robot.location);
    if (robot.country) countries.add(robot.country);
    if (robot.state) states.add(robot.state);
    if (robot.region) regions.add(robot.region);
  });

  return {
    locations: Array.from(locations).sort(),
    countries: Array.from(countries).sort(),
    states: Array.from(states).sort(),
    regions: Array.from(regions).sort(),
  };
}

// Get location statistics
export function getLocationStats(robots: Robot[]) {
  const locationMap: { [key: string]: number } = {};
  robots.forEach((robot) => {
    locationMap[robot.location] = (locationMap[robot.location] || 0) + 1;
  });

  return Object.entries(locationMap)
    .map(([location, count]) => ({
      location,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

// Get country statistics
export function getCountryStats(robots: Robot[]) {
  const countryMap: { [key: string]: number } = {};
  robots.forEach((robot) => {
    countryMap[robot.country] = (countryMap[robot.country] || 0) + 1;
  });

  return Object.entries(countryMap)
    .map(([country, count]) => ({
      country,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

// Color helper functions
export function getBatteryColors(battery: number) {
  if (battery >= ROBOT_CONFIG.battery.high) return { bg: "bg-success/20", text: "text-success", border: "border-success", badge: "text-success" };
  if (battery >= ROBOT_CONFIG.battery.medium) return { bg: "bg-primary/20", text: "text-primary", border: "border-primary", badge: "text-primary" };
  if (battery >= ROBOT_CONFIG.battery.low) return { bg: "bg-warning/20", text: "text-warning", border: "border-warning", badge: "text-warning" };
  return { bg: "bg-destructive/20", text: "text-destructive", border: "border-destructive", badge: "text-destructive" };
}

export function getTemperatureColors(temp: number) {
  if (temp < ROBOT_CONFIG.temperature.normal) return { bg: "bg-success/20", text: "text-success", border: "border-success" };
  if (temp < ROBOT_CONFIG.temperature.warning) return { bg: "bg-warning/20", text: "text-warning", border: "border-warning" };
  return { bg: "bg-destructive/20", text: "text-destructive", border: "border-destructive" };
}

export function getStatusColors(status: string) {
  const colorMap: { [key: string]: { bg: string; text: string } } = {
    online: { bg: "bg-success", text: "text-success-foreground" },
    charging: { bg: "bg-primary", text: "text-primary-foreground" },
    offline: { bg: "bg-muted", text: "text-muted-foreground" },
    error: { bg: "bg-destructive", text: "text-destructive-foreground" },
  };
  return colorMap[status] || { bg: "bg-muted", text: "text-muted-foreground" };
}
