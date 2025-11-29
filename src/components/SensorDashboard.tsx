import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Compass,
  Camera,
  Radar,
  Activity,
  Eye,
  Thermometer,
  CheckCircle2,
  AlertCircle,
  Radio,
  Wind,
  Droplets,
  Gauge,
  CloudRain,
  Sun,
  Volume2,
} from "lucide-react";
import { useRobotSensors, useRobot } from "@/hooks/useAPI";

interface IMUData {
  roll: number;
  pitch: number;
  yaw: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
}

interface CameraStatus {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive" | "error";
  fps: number;
  resolution: string;
}

interface LiDARData {
  status: "active" | "inactive" | "error";
  scanRate: number;
  detectedObstacles: number;
  minDistance: number;
  maxRange: number;
  pointsPerScan: number;
}

interface EnvironmentalData {
  ambientTemp: number;
  humidity: number;
  pressure: number;
  airQuality: number; // AQI 0-500
  lightLevel: number; // Lux
  soundLevel: number; // dB
}

interface SensorDashboardProps {
  robotId: string;
}

export function SensorDashboard({ robotId }: SensorDashboardProps) {
  // Fetch real sensor data from API
  const { data: sensorData } = useRobotSensors(robotId, 1);
  const { data: robotData } = useRobot(robotId);
  
  const [imuData, setImuData] = useState<IMUData>({
    roll: 0,
    pitch: 0,
    yaw: 0,
    accelX: 0,
    accelY: 0,
    accelZ: 9.81,
    gyroX: 0,
    gyroY: 0,
    gyroZ: 0,
  });

  const [cameras, setCameras] = useState<CameraStatus[]>([]);

  const [lidarData, setLidarData] = useState<LiDARData>({
    status: "active",
    scanRate: 20,
    detectedObstacles: 0,
    minDistance: 2.0,
    maxRange: 25.0,
    pointsPerScan: 1024,
  });

  const [envData, setEnvData] = useState<EnvironmentalData>({
    ambientTemp: 22,
    humidity: 50,
    pressure: 1013.25,
    airQuality: 35,
    lightLevel: 300,
    soundLevel: 40,
  });

  // Update sensor data from API
  useEffect(() => {
    if (sensorData && sensorData.length > 0) {
      const latest = sensorData[0];
      
      // Update IMU data
      if (latest.imuRollDeg !== undefined) {
        setImuData({
          roll: latest.imuRollDeg || 0,
          pitch: latest.imuPitchDeg || 0,
          yaw: latest.imuYawDeg || 0,
          accelX: latest.imuAccelX || 0,
          accelY: latest.imuAccelY || 0,
          accelZ: latest.imuAccelZ || 9.81,
          gyroX: latest.imuGyroX || 0,
          gyroY: latest.imuGyroY || 0,
          gyroZ: latest.imuGyroZ || 0,
        });
      }
      
      // Update LiDAR data
      if (latest.lidarScanRateHz !== undefined) {
        setLidarData(prev => ({
          ...prev,
          scanRate: latest.lidarScanRateHz || 20,
          detectedObstacles: latest.lidarDetectedObstacles || 0,
          minDistance: latest.lidarMinDistanceM || 2.0,
          maxRange: latest.lidarMaxRangeM || 25.0,
          pointsPerScan: latest.lidarPointsPerScan || 1024,
        }));
      }
      
      // Update environmental data
      if (latest.envAmbientTempC !== undefined) {
        setEnvData({
          ambientTemp: latest.envAmbientTempC || 22,
          humidity: latest.envHumidityPercent || 50,
          pressure: latest.envPressureHPa || 1013.25,
          airQuality: latest.envAirQualityIndex || 35,
          lightLevel: latest.envLightLevelLux || 300,
          soundLevel: latest.envSoundLevelDb || 40,
        });
      }
    }
  }, [sensorData]);
  
  // Load cameras from robot data
  useEffect(() => {
    if (robotData?.cameras) {
      const cameraStatuses: CameraStatus[] = robotData.cameras.map((cam: any, idx: number) => ({
        id: cam.id || `camera-${idx}`,
        name: cam.name || `Camera ${idx + 1}`,
        type: cam.cameraType || 'RGB',
        status: cam.isActive ? 'active' : 'inactive',
        fps: cam.fps || 30,
        resolution: cam.resolution || '1920x1080',
      }));
      setCameras(cameraStatuses);
    }
  }, [robotData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="w-3 h-3 text-success" />;
      case "inactive":
        return <Radio className="w-3 h-3 text-muted-foreground" />;
      case "error":
        return <AlertCircle className="w-3 h-3 text-destructive" />;
      default:
        return <Activity className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: CameraStatus["status"]) => {
    switch (status) {
      case "active":
        return "text-success";
      case "inactive":
        return "text-slate-600 dark:text-muted-foreground";
      case "error":
        return "text-destructive";
      default:
        return "text-slate-600 dark:text-muted-foreground";
    }
  };

  const activeCameras = cameras.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-4">
      {/* IMU Sensor */}
      <Card className="p-4 bg-gradient-to-br from-card/80 to-card/60 dark:from-card/80 dark:to-card/60 border-border/30 dark:border-border backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
            <div>
              <h3 className="font-semibold text-lg text-foreground">IMU (Inertial Measurement Unit)</h3>
              <p className="text-xs text-muted-foreground">Orientation & motion sensing</p>
            </div>
          </div>
          <Badge variant="default" className="bg-success text-success-foreground">
            <Activity className="w-3 h-3 mr-1 animate-pulse" />
            ACTIVE
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Orientation */}
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <h4 className="text-xs font-semibold text-cyan-400 mb-3">Orientation (deg)</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Roll</span>
                <span className="text-sm font-mono font-bold">{imuData.roll.toFixed(2)}°</span>
              </div>
              <Progress value={50 + imuData.roll} className="h-1.5" />
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Pitch</span>
                <span className="text-sm font-mono font-bold">{imuData.pitch.toFixed(2)}°</span>
              </div>
              <Progress value={50 + imuData.pitch} className="h-1.5" />
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Yaw</span>
                <span className="text-sm font-mono font-bold">{imuData.yaw.toFixed(2)}°</span>
              </div>
              <Progress value={(imuData.yaw % 360) / 3.6} className="h-1.5" />
            </div>
          </div>

          {/* Acceleration */}
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <h4 className="text-xs font-semibold text-blue-400 mb-3">Acceleration (m/s²)</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">X-Axis</span>
                  <span className="text-sm font-mono font-bold">{imuData.accelX.toFixed(3)}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Y-Axis</span>
                  <span className="text-sm font-mono font-bold">{imuData.accelY.toFixed(3)}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Z-Axis</span>
                  <span className="text-sm font-mono font-bold text-success">{imuData.accelZ.toFixed(3)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gyroscope */}
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <h4 className="text-xs font-semibold text-purple-400 mb-3">Gyroscope (rad/s)</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">X-Axis</span>
                  <span className="text-sm font-mono font-bold">{imuData.gyroX.toFixed(4)}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Y-Axis</span>
                  <span className="text-sm font-mono font-bold">{imuData.gyroY.toFixed(4)}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">Z-Axis</span>
                  <span className="text-sm font-mono font-bold">{imuData.gyroZ.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Camera Systems */}
      <Card className="p-4 card-gradient border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-semibold text-lg">Camera Systems</h3>
              <p className="text-xs text-muted-foreground">{activeCameras} of {cameras.length} cameras active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span className="text-sm font-bold">{activeCameras}/{cameras.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cameras.map((camera) => (
            <div
              key={camera.id}
              className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-blue-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {camera.type === "RGB" && <Eye className="w-4 h-4 text-blue-400" />}
                  {camera.type === "Depth" && <Activity className="w-4 h-4 text-purple-400" />}
                  {camera.type === "Thermal" && <Thermometer className="w-4 h-4 text-orange-400" />}
                  {camera.type === "Stereo" && <Camera className="w-4 h-4 text-cyan-400" />}
                  <span className="text-xs font-semibold">{camera.name}</span>
                </div>
                {getStatusIcon(camera.status)}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-mono">{camera.type}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Resolution</span>
                  <span className="font-mono">{camera.resolution}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Frame Rate</span>
                  <span className={`font-mono font-bold ${getStatusColor(camera.status)}`}>
                    {camera.status === "active" ? `${camera.fps} fps` : "—"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* LiDAR System */}
      <Card className="p-4 card-gradient border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-green-400" />
            <div>
              <h3 className="font-semibold text-lg">LiDAR System</h3>
              <p className="text-xs text-muted-foreground">3D obstacle detection & mapping</p>
            </div>
          </div>
          <Badge variant="default" className="bg-success text-success-foreground">
            <Activity className="w-3 h-3 mr-1 animate-pulse" />
            SCANNING
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <p className="text-xs text-muted-foreground mb-1">Scan Rate</p>
            <p className="text-lg font-bold text-green-400">{lidarData.scanRate} Hz</p>
          </div>
          
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <p className="text-xs text-muted-foreground mb-1">Obstacles</p>
            <p className={`text-lg font-bold ${lidarData.detectedObstacles > 5 ? "text-warning" : "text-success"}`}>
              {Math.round(lidarData.detectedObstacles)}
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <p className="text-xs text-muted-foreground mb-1">Min Distance</p>
            <p className={`text-lg font-bold font-mono ${lidarData.minDistance < 0.5 ? "text-destructive" : "text-cyan-400"}`}>
              {lidarData.minDistance.toFixed(2)}m
            </p>
          </div>
          
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <p className="text-xs text-muted-foreground mb-1">Max Range</p>
            <p className="text-lg font-bold font-mono text-cyan-400">{lidarData.maxRange.toFixed(1)}m</p>
          </div>
          
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <p className="text-xs text-muted-foreground mb-1">Points/Scan</p>
            <p className="text-lg font-bold font-mono">{lidarData.pointsPerScan}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <div className="flex items-center gap-1">
              {getStatusIcon(lidarData.status)}
              <p className={`text-xs font-bold uppercase ${getStatusColor(lidarData.status)}`}>
                {lidarData.status}
              </p>
            </div>
          </div>
        </div>

        {/* Distance visualization */}
        <div className="mt-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-green-400">Closest Obstacle Distance</span>
            <span className="text-sm font-mono font-bold">{lidarData.minDistance.toFixed(2)}m</span>
          </div>
          <Progress 
            value={Math.min(100, (lidarData.minDistance / 2.0) * 100)} 
            className="h-2"
          />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>0m (Critical)</span>
            <span>2m+ (Safe)</span>
          </div>
        </div>
      </Card>

      {/* Environmental Sensors */}
      <Card className="p-4 card-gradient border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-semibold text-lg">Environmental Sensors</h3>
              <p className="text-xs text-muted-foreground">Ambient conditions monitoring</p>
            </div>
          </div>
          <Badge variant="default" className="bg-success text-success-foreground">
            <Activity className="w-3 h-3 mr-1 animate-pulse" />
            ACTIVE
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Ambient Temperature */}
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-4 h-4 text-orange-400" />
              <p className="text-xs text-muted-foreground">Ambient Temp</p>
            </div>
            <p className="text-xl font-bold text-orange-400">{envData.ambientTemp.toFixed(1)}°C</p>
            <p className="text-xs text-muted-foreground mt-1">
              {envData.ambientTemp < 20 ? "Cool" : envData.ambientTemp < 25 ? "Comfortable" : "Warm"}
            </p>
          </div>

          {/* Humidity */}
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-blue-400" />
              <p className="text-xs text-muted-foreground">Humidity</p>
            </div>
            <p className="text-xl font-bold text-blue-400">{envData.humidity.toFixed(0)}%</p>
            <Progress value={envData.humidity} className="h-1.5 mt-2" />
          </div>

          {/* Atmospheric Pressure */}
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-purple-400" />
              <p className="text-xs text-muted-foreground">Pressure</p>
            </div>
            <p className="text-xl font-bold text-purple-400">{envData.pressure.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-1">hPa</p>
          </div>

          {/* Air Quality Index */}
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Wind className="w-4 h-4 text-green-400" />
              <p className="text-xs text-muted-foreground">Air Quality</p>
            </div>
            <p className={`text-xl font-bold ${
              envData.airQuality < 50 ? "text-success" :
              envData.airQuality < 100 ? "text-yellow-400" :
              envData.airQuality < 150 ? "text-warning" : "text-destructive"
            }`}>
              {envData.airQuality.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {envData.airQuality < 50 ? "Good" :
               envData.airQuality < 100 ? "Moderate" :
               envData.airQuality < 150 ? "Unhealthy" : "Poor"}
            </p>
          </div>

          {/* Light Level */}
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-4 h-4 text-yellow-400" />
              <p className="text-xs text-muted-foreground">Light Level</p>
            </div>
            <p className="text-xl font-bold text-yellow-400">{envData.lightLevel.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground mt-1">lux</p>
          </div>

          {/* Sound Level */}
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <p className="text-xs text-muted-foreground">Sound Level</p>
            </div>
            <p className={`text-xl font-bold ${
              envData.soundLevel < 50 ? "text-success" :
              envData.soundLevel < 70 ? "text-yellow-400" : "text-warning"
            }`}>
              {envData.soundLevel.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {envData.soundLevel < 50 ? "Quiet" :
               envData.soundLevel < 70 ? "Moderate" : "Loud"} dB
            </p>
          </div>
        </div>

        {/* Environmental Status Summary */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-emerald-400">Environmental Comfort Index</span>
              <span className="text-sm font-bold">
                {(((100 - Math.abs(envData.ambientTemp - 22)) / 100 * 50) + 
                  ((100 - Math.abs(envData.humidity - 50)) / 100 * 50)).toFixed(0)}%
              </span>
            </div>
            <Progress 
              value={(((100 - Math.abs(envData.ambientTemp - 22)) / 100 * 50) + 
                      ((100 - Math.abs(envData.humidity - 50)) / 100 * 50))} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Based on temperature and humidity
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-green-400">Air Quality Index</span>
              <span className={`text-sm font-bold ${
                envData.airQuality < 50 ? "text-success" :
                envData.airQuality < 100 ? "text-yellow-400" : "text-warning"
              }`}>
                {envData.airQuality.toFixed(0)} AQI
              </span>
            </div>
            <Progress value={(envData.airQuality / 150) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              0-50: Good, 51-100: Moderate, 101-150: Unhealthy
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
