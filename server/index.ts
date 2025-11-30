import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
// Azure App Service provides PORT via environment variable (usually 8080)
const PORT = parseInt(process.env.PORT || process.env.WEBSITES_PORT || '3001', 10);
const isProduction = process.env.NODE_ENV === 'production';

console.log('🔧 Starting server with configuration:');
console.log(`   PORT: ${PORT}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   isProduction: ${isProduction}`);

// Middleware - CORS configuration for both dev and production
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://sparkx.azurewebsites.net',
  process.env.CORS_ORIGIN,
  process.env.AZURE_APP_URL,
].filter(Boolean);

app.use(cors({
  origin: isProduction && allowedOrigins.length > 3 ? allowedOrigins : '*',
  credentials: true,
}));

app.use(express.json());

// Serve static files from React app in production
if (isProduction) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  console.log(`📦 Serving static files from: ${distPath}`);
}

// BigInt serialization fix for JSON responses
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data: any) {
    const jsonString = JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
    res.setHeader('Content-Type', 'application/json');
    return res.send(jsonString);
  };
  next();
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// ROBOT ENDPOINTS
// ============================================================================

// Get all robots with optional filtering
app.get('/api/robots', async (req: Request, res: Response) => {
  try {
    const { status, country, region, location } = req.query;
    
    const where: {
      status?: string;
      country?: string;
      region?: string;
      location?: string;
    } = {};
    if (status) where.status = status as string;
    if (country) where.country = country as string;
    if (region) where.region = region as string;
    if (location) where.location = location as string;

    const robots = await prisma.robot.findMany({
      where,
      include: {
        telemetry: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    // Transform data to match frontend interface
    const transformedRobots = robots.map(robot => ({
      id: robot.id,
      name: robot.name,
      status: robot.status,
      battery: robot.telemetry[0]?.batteryPercentage || 0,
      signal: robot.telemetry[0]?.signalStrength || 0,
      temperature: robot.telemetry[0]?.temperatureC || 0,
      location: robot.location || '',
      country: robot.country || '',
      state: robot.state || '',
      region: robot.region || '',
      lastUpdated: robot.telemetry[0]?.recordedAt || robot.lastSeenAt || new Date(),
      cpuLoad: robot.telemetry[0]?.cpuLoadPercentage || 0,
      gpsCoordinates: {
        lat: robot.telemetry[0]?.latitude || 0,
        lng: robot.telemetry[0]?.longitude || 0,
      },
      connectivity: {
        wifi: robot.telemetry[0]?.wifiStrength || 'Fair',
        cellular: robot.telemetry[0]?.cellularStrength || 'Fair',
      },
    }));

    res.json(transformedRobots);
  } catch (error) {
    console.error('Error fetching robots:', error);
    res.status(500).json({ error: 'Failed to fetch robots' });
  }
});

// Get single robot by ID
app.get('/api/robots/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const robot = await prisma.robot.findUnique({
      where: { id },
      include: {
        telemetry: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
        sensors: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
        cameras: true,
        joints: {
          orderBy: { recordedAt: 'desc' },
          take: 16, // Get all 16 joints
        },
        alerts: {
          where: { isResolved: false },
          orderBy: { createdAt: 'desc' },
        },
        diagnostics: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
        maintenance: {
          orderBy: { scheduledDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!robot) {
      return res.status(404).json({ error: 'Robot not found' });
    }

    res.json(robot);
  } catch (error) {
    console.error('Error fetching robot:', error);
    res.status(500).json({ error: 'Failed to fetch robot' });
  }
});

// ============================================================================
// TELEMETRY ENDPOINTS
// ============================================================================

// Get telemetry history for a robot
app.get('/api/robots/:id/telemetry', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '100', hours = '24' } = req.query;

    const hoursAgo = new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000);

    const telemetry = await prisma.robotTelemetry.findMany({
      where: {
        robotId: id,
        recordedAt: { gte: hoursAgo },
      },
      orderBy: { recordedAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(telemetry);
  } catch (error) {
    console.error('Error fetching telemetry:', error);
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

// ============================================================================
// SENSOR ENDPOINTS
// ============================================================================

// Get sensor data for a robot
app.get('/api/robots/:id/sensors', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '50' } = req.query;

    const sensors = await prisma.robotSensor.findMany({
      where: { robotId: id },
      orderBy: { recordedAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(sensors);
  } catch (error) {
    console.error('Error fetching sensors:', error);
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

// ============================================================================
// ALERT ENDPOINTS
// ============================================================================

// Get all alerts
app.get('/api/alerts', async (req: Request, res: Response) => {
  try {
    const { severity, robotId, resolved } = req.query;
    
    const where: {
      severity?: string;
      robotId?: string;
      isResolved?: boolean;
    } = {};
    if (severity) where.severity = severity as string;
    if (robotId) where.robotId = robotId as string;
    if (resolved !== undefined) where.isResolved = resolved === 'true';

    const alerts = await prisma.robotAlert.findMany({
      where,
      include: {
        robot: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Acknowledge an alert
app.patch('/api/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { acknowledgedBy } = req.body;

    const alert = await prisma.robotAlert.update({
      where: { id: parseInt(id) },
      data: {
        isAcknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: acknowledgedBy || 'User',
      },
    });

    res.json(alert);
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Resolve an alert
app.patch('/api/alerts/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolvedBy, resolutionNotes } = req.body;

    const alert = await prisma.robotAlert.update({
      where: { id: parseInt(id) },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: resolvedBy || 'User',
        resolutionNotes,
      },
    });

    res.json(alert);
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// ============================================================================
// MAINTENANCE ENDPOINTS
// ============================================================================

// Get maintenance schedules
app.get('/api/maintenance', async (req: Request, res: Response) => {
  try {
    const { robotId, status } = req.query;
    
    const where: {
      robotId?: string;
      status?: string;
    } = {};
    if (robotId) where.robotId = robotId as string;
    if (status) where.status = status as string;

    const maintenance = await prisma.maintenanceSchedule.findMany({
      where,
      include: {
        robot: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    res.json(maintenance);
  } catch (error) {
    console.error('Error fetching maintenance:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance schedules' });
  }
});

// ============================================================================
// DIAGNOSTICS ENDPOINTS
// ============================================================================

// Get diagnostics for a robot
app.get('/api/robots/:id/diagnostics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const diagnostics = await prisma.robotDiagnostic.findMany({
      where: { robotId: id },
      orderBy: { recordedAt: 'desc' },
      take: 10,
    });

    res.json(diagnostics);
  } catch (error) {
    console.error('Error fetching diagnostics:', error);
    res.status(500).json({ error: 'Failed to fetch diagnostics' });
  }
});

// Get network handoffs for a robot
app.get('/api/robots/:id/network-handoffs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    const handoffs = await prisma.networkHandoff.findMany({
      where: { robotId: id },
      orderBy: { occurredAt: 'desc' },
      take: limit ? parseInt(limit as string) : 10,
    });

    res.json(handoffs);
  } catch (error) {
    console.error('Error fetching network handoffs:', error);
    res.status(500).json({ error: 'Failed to fetch network handoffs' });
  }
});

// Get battery health history for a robot
app.get('/api/robots/:id/battery-health-history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    const history = await prisma.batteryHealthHistory.findMany({
      where: { robotId: id },
      orderBy: { recordedAt: 'desc' },
      take: limit ? parseInt(limit as string) : 12,
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching battery health history:', error);
    res.status(500).json({ error: 'Failed to fetch battery health history' });
  }
});

// Get charge history for a robot
app.get('/api/robots/:id/charge-history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    const history = await prisma.chargeHistory.findMany({
      where: { robotId: id },
      orderBy: { chargedAt: 'desc' },
      take: limit ? parseInt(limit as string) : 10,
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching charge history:', error);
    res.status(500).json({ error: 'Failed to fetch charge history' });
  }
});

// Get component health for a robot
app.get('/api/robots/:id/component-health', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const components = await prisma.componentHealth.findMany({
      where: { robotId: id },
      orderBy: { recordedAt: 'desc' },
    });

    res.json(components);
  } catch (error) {
    console.error('Error fetching component health:', error);
    res.status(500).json({ error: 'Failed to fetch component health' });
  }
});

// Get predictive alerts for a robot
app.get('/api/robots/:id/predictive-alerts', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const alerts = await prisma.predictiveAlert.findMany({
      where: { robotId: id, isAcknowledged: false },
      orderBy: { createdAt: 'desc' },
    });

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching predictive alerts:', error);
    res.status(500).json({ error: 'Failed to fetch predictive alerts' });
  }
});

// ============================================================================
// STATISTICS ENDPOINTS
// ============================================================================

// Get fleet statistics
app.get('/api/stats/fleet', async (req: Request, res: Response) => {
  try {
    const totalRobots = await prisma.robot.count();
    
    const statusCounts = await prisma.robot.groupBy({
      by: ['status'],
      _count: true,
    });

    const unresolvedAlerts = await prisma.robotAlert.count({
      where: { isResolved: false },
    });

    const criticalAlerts = await prisma.robotAlert.count({
      where: {
        isResolved: false,
        severity: 'critical',
      },
    });

    // Get average battery from latest telemetry
    const latestTelemetry = await prisma.robotTelemetry.groupBy({
      by: ['robotId'],
      _avg: {
        batteryPercentage: true,
        temperatureC: true,
        signalStrength: true,
      },
      orderBy: {
        robotId: 'asc',
      },
    });

    const avgBattery = latestTelemetry.reduce((sum, t) => sum + (t._avg.batteryPercentage || 0), 0) / latestTelemetry.length;
    const avgTemp = latestTelemetry.reduce((sum, t) => sum + (t._avg.temperatureC || 0), 0) / latestTelemetry.length;
    const avgSignal = latestTelemetry.reduce((sum, t) => sum + (t._avg.signalStrength || 0), 0) / latestTelemetry.length;

    res.json({
      totalRobots,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      unresolvedAlerts,
      criticalAlerts,
      averages: {
        battery: Math.round(avgBattery * 100) / 100,
        temperature: Math.round(avgTemp * 100) / 100,
        signal: Math.round(avgSignal * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error fetching fleet stats:', error);
    res.status(500).json({ error: 'Failed to fetch fleet statistics' });
  }
});

// ============================================================================
// ANALYTICS / HISTORICAL DATA ENDPOINTS
// ============================================================================

// Get historical battery trends (last 24 hours)
app.get('/api/analytics/battery-trends', async (req: Request, res: Response) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const telemetryData = await prisma.robotTelemetry.findMany({
      where: {
        recordedAt: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: { recordedAt: 'asc' },
      select: {
        batteryPercentage: true,
        recordedAt: true,
      },
    });

    // Group by hour and calculate averages
    const hourlyData: Record<string, { total: number; count: number; min: number; max: number }> = {};
    
    telemetryData.forEach(item => {
      const hour = new Date(item.recordedAt).getHours();
      const hourKey = `${hour}:00`;
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = {
          total: 0,
          count: 0,
          min: item.batteryPercentage,
          max: item.batteryPercentage,
        };
      }
      
      hourlyData[hourKey].total += item.batteryPercentage;
      hourlyData[hourKey].count++;
      hourlyData[hourKey].min = Math.min(hourlyData[hourKey].min, item.batteryPercentage);
      hourlyData[hourKey].max = Math.max(hourlyData[hourKey].max, item.batteryPercentage);
    });

    // Convert to array format for charts
    const result = Array.from({ length: 24 }, (_, i) => {
      const hourKey = `${i}:00`;
      const data = hourlyData[hourKey];
      
      return {
        time: hourKey,
        avgBattery: data ? Math.round(data.total / data.count) : 0,
        minBattery: data ? data.min : 0,
        maxBattery: data ? data.max : 0,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching battery trends:', error);
    res.status(500).json({ error: 'Failed to fetch battery trends' });
  }
});

// Get historical temperature trends (last 24 hours)
app.get('/api/analytics/temperature-trends', async (req: Request, res: Response) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const telemetryData = await prisma.robotTelemetry.findMany({
      where: {
        recordedAt: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: { recordedAt: 'asc' },
      select: {
        temperatureC: true,
        recordedAt: true,
      },
    });

    // Group by hour and calculate averages
    const hourlyData: Record<string, { total: number; count: number; max: number }> = {};
    
    telemetryData.forEach(item => {
      if (item.temperatureC === null) return; // Skip null values
      
      const hour = new Date(item.recordedAt).getHours();
      const hourKey = `${hour}:00`;
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = {
          total: 0,
          count: 0,
          max: item.temperatureC,
        };
      }
      
      hourlyData[hourKey].total += item.temperatureC;
      hourlyData[hourKey].count++;
      hourlyData[hourKey].max = Math.max(hourlyData[hourKey].max, item.temperatureC);
    });

    // Convert to array format for charts
    const result = Array.from({ length: 24 }, (_, i) => {
      const hourKey = `${i}:00`;
      const data = hourlyData[hourKey];
      
      return {
        time: hourKey,
        avgTemp: data ? Math.round((data.total / data.count) * 10) / 10 : 0,
        maxTemp: data ? Math.round(data.max * 10) / 10 : 0,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching temperature trends:', error);
    res.status(500).json({ error: 'Failed to fetch temperature trends' });
  }
});

// Catch-all route for SPA - must be AFTER all API routes
if (isProduction) {
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at /api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Production Mode: ${isProduction}`);
  console.log(`🔒 CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log(`📁 Serving static files: ${isProduction ? 'YES (from dist/)' : 'NO (dev mode)'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
