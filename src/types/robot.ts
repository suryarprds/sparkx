// Robot type definitions and interfaces

export interface Robot {
  id: string;
  name: string;
  status: "online" | "charging" | "offline" | "error";
  battery: number;
  signal: number;
  temperature: number;
  location: string;
  country: string;
  state: string;
  region: string;
  lastUpdated: Date;
  cpuLoad: number;
  gpsCoordinates: { lat: number; lng: number };
  connectivity: {
    wifi: "Poor" | "Fair" | "Good" | "Excellent";
    cellular: "Poor" | "Fair" | "Good" | "Excellent";
  };
}

// Configuration constants
export const ROBOT_CONFIG = {
  battery: {
    critical: 20,
    low: 40,
    medium: 70,
    high: 90,
  },
  temperature: {
    normal: 45,
    warning: 60,
    critical: 75,
  },
  signal: {
    poor: 30,
    fair: 60,
    good: 80,
  },
  uptime: {
    target: 99.5,
  },
  simulation: {
    battery: { min: 15, max: 100 },
    cpu: { min: 10, max: 95 },
    temperature: { min: 35, max: 85 },
  },
};
