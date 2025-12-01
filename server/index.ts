import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT || '3001', 10);
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

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Returns the health status of the API server
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
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

// Update robot position (GPS coordinates)
app.patch('/api/robots/:id/position', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, heading } = req.body;

    // Validate input
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'Invalid latitude or longitude' });
    }

    // Check if robot exists
    const robot = await prisma.robot.findUnique({ where: { id } });
    if (!robot) {
      return res.status(404).json({ error: 'Robot not found' });
    }

    // Create new telemetry entry with updated position
    const telemetry = await prisma.robotTelemetry.create({
      data: {
        robotId: id,
        latitude,
        longitude,
        batteryPercentage: 87, // Use last known value or default
        cpuLoadPercentage: 35,
        memoryUsagePercentage: 45,
        temperatureC: 42,
        signalStrength: 85,
        recordedAt: new Date(),
      },
    });

    res.json({ success: true, telemetry });
  } catch (error) {
    console.error('Error updating robot position:', error);
    res.status(500).json({ error: 'Failed to update robot position' });
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

// Get robot tasks
app.get('/api/robots/:id/tasks', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const whereClause: any = { robotId: id };
    if (status) {
      whereClause.status = status as string;
    }

    const tasks = await prisma.robotTask.findMany({
      where: whereClause,
      orderBy: [
        { status: 'asc' }, // in_progress first, then pending, then others
        { priority: 'desc' },
        { scheduledStartAt: 'asc' },
      ],
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching robot tasks:', error);
    res.status(500).json({ error: 'Failed to fetch robot tasks' });
  }
});

// Get current task (in_progress task)
app.get('/api/robots/:id/tasks/current', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const currentTask = await prisma.robotTask.findFirst({
      where: { 
        robotId: id,
        status: 'in_progress'
      },
      orderBy: { actualStartAt: 'desc' },
    });

    res.json(currentTask || null);
  } catch (error) {
    console.error('Error fetching current task:', error);
    res.status(500).json({ error: 'Failed to fetch current task' });
  }
});

// Get pending tasks (next tasks in queue)
app.get('/api/robots/:id/tasks/pending', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pendingTasks = await prisma.robotTask.findMany({
      where: { 
        robotId: id,
        status: 'pending'
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledStartAt: 'asc' },
      ],
    });

    res.json(pendingTasks);
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    res.status(500).json({ error: 'Failed to fetch pending tasks' });
  }
});

// Get completed/past tasks
app.get('/api/robots/:id/tasks/history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const pastTasks = await prisma.robotTask.findMany({
      where: { 
        robotId: id,
        status: { in: ['completed', 'failed', 'cancelled'] }
      },
      orderBy: { actualEndAt: 'desc' },
      take: limit,
    });

    res.json(pastTasks);
  } catch (error) {
    console.error('Error fetching task history:', error);
    res.status(500).json({ error: 'Failed to fetch task history' });
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
    const { region, country } = req.query;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Build where clause with filters
    const whereClause: any = {
      recordedAt: {
        gte: twentyFourHoursAgo,
      },
    };
    
    // Add robot filters if region or country specified
    if (region || country) {
      whereClause.robot = {};
      if (region) whereClause.robot.region = region as string;
      if (country) whereClause.robot.country = country as string;
    }
    
    const telemetryData = await prisma.robotTelemetry.findMany({
      where: whereClause,
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
    const { region, country } = req.query;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Build where clause with filters
    const whereClause: any = {
      recordedAt: {
        gte: twentyFourHoursAgo,
      },
    };
    
    // Add robot filters if region or country specified
    if (region || country) {
      whereClause.robot = {};
      if (region) whereClause.robot.region = region as string;
      if (country) whereClause.robot.country = country as string;
    }
    
    const telemetryData = await prisma.robotTelemetry.findMany({
      where: whereClause,
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

// Get uptime/availability trends (last 24 hours)
app.get('/api/analytics/uptime-trends', async (req: Request, res: Response) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const robots = await prisma.robot.findMany({
      select: { id: true },
    });
    
    const totalRobots = robots.length;
    
    // Get telemetry data for the last 24 hours
    const telemetryData = await prisma.robotTelemetry.findMany({
      where: {
        recordedAt: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: { recordedAt: 'asc' },
      select: {
        robotId: true,
        recordedAt: true,
      },
    });

    // Group by hour and count active robots
    const hourlyData: Record<string, Set<string>> = {};
    
    telemetryData.forEach(item => {
      const hour = new Date(item.recordedAt).getHours();
      const hourKey = `${hour}:00`;
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = new Set();
      }
      
      hourlyData[hourKey].add(item.robotId);
    });

    // Convert to array format for charts
    const result = Array.from({ length: 24 }, (_, i) => {
      const hourKey = `${i}:00`;
      const activeRobots = hourlyData[hourKey]?.size || 0;
      const availability = totalRobots > 0 ? (activeRobots / totalRobots) * 100 : 0;
      const downtimeMinutes = totalRobots > 0 ? ((totalRobots - activeRobots) * 60) / totalRobots : 0;
      
      return {
        time: hourKey,
        availability: Math.round(availability * 10) / 10,
        activeRobots,
        downtimeMinutes: Math.round(downtimeMinutes),
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching uptime trends:', error);
    res.status(500).json({ error: 'Failed to fetch uptime trends' });
  }
});

// Get active vs idle robots (last 24 hours)
app.get('/api/analytics/active-idle-trends', async (req: Request, res: Response) => {
  try {
    const { region, country } = req.query;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Build where clause with filters
    const whereClause: any = {
      recordedAt: {
        gte: twentyFourHoursAgo,
      },
    };
    
    // Add robot filters if region or country specified
    if (region || country) {
      whereClause.robot = {};
      if (region) whereClause.robot.region = region as string;
      if (country) whereClause.robot.country = country as string;
    }
    
    const telemetryData = await prisma.robotTelemetry.findMany({
      where: whereClause,
      orderBy: { recordedAt: 'asc' },
      select: {
        cpuLoadPercentage: true,
        recordedAt: true,
      },
    });

    // Group by hour and count active vs idle (active if CPU > 30%)
    const hourlyData: Record<string, { active: number; idle: number }> = {};
    
    telemetryData.forEach(item => {
      const hour = new Date(item.recordedAt).getHours();
      const hourKey = `${hour}:00`;
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = { active: 0, idle: 0 };
      }
      
      if (item.cpuLoadPercentage && item.cpuLoadPercentage > 30) {
        hourlyData[hourKey].active++;
      } else {
        hourlyData[hourKey].idle++;
      }
    });

    // Convert to array format for charts
    const result = Array.from({ length: 24 }, (_, i) => {
      const hourKey = `${i}:00`;
      const data = hourlyData[hourKey];
      
      return {
        time: hourKey,
        active: data ? data.active : 0,
        idle: data ? data.idle : 0,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching active/idle trends:', error);
    res.status(500).json({ error: 'Failed to fetch active/idle trends' });
  }
});

// Get alert/incident count trends
app.get('/api/analytics/alert-trends', async (req: Request, res: Response) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const alerts = await prisma.robotAlert.findMany({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        severity: true,
        createdAt: true,
      },
    });

    // Group by hour and severity
    const hourlyData: Record<string, { critical: number; high: number; medium: number; low: number }> = {};
    
    alerts.forEach((alert: { severity: string; createdAt: Date }) => {
      const hour = new Date(alert.createdAt).getHours();
      const hourKey = `${hour}:00`;
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = { critical: 0, high: 0, medium: 0, low: 0 };
      }
      
      const severity = alert.severity.toLowerCase();
      if (severity in hourlyData[hourKey]) {
        hourlyData[hourKey][severity as keyof typeof hourlyData[string]]++;
      }
    });

    // Convert to array format for charts
    const result = Array.from({ length: 24 }, (_, i) => {
      const hourKey = `${i}:00`;
      const data = hourlyData[hourKey];
      
      return {
        time: hourKey,
        critical: data ? data.critical : 0,
        high: data ? data.high : 0,
        medium: data ? data.medium : 0,
        low: data ? data.low : 0,
        total: data ? data.critical + data.high + data.medium + data.low : 0,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching alert trends:', error);
    res.status(500).json({ error: 'Failed to fetch alert trends' });
  }
});

// Get sensor health distribution
app.get('/api/analytics/sensor-health', async (req: Request, res: Response) => {
  try {
    const latestSensors = await prisma.robotSensor.findMany({
      orderBy: { recordedAt: 'desc' },
      distinct: ['robotId'],
      select: {
        lidarStatus: true,
        imuRoll: true,
        imuPitch: true,
        imuYaw: true,
      },
    });

    const latestCameras = await prisma.robotCamera.findMany({
      orderBy: { lastFrameAt: 'desc' },
      distinct: ['robotId'],
      select: {
        status: true,
      },
    });

    // Count healthy sensors
    let lidarHealthy = 0, imuHealthy = 0, cameraHealthy = 0;
    const totalRobots = latestSensors.length;

    latestSensors.forEach((sensor: any) => {
      if (sensor.lidarStatus && sensor.lidarStatus.toLowerCase() === 'operational') lidarHealthy++;
      if (sensor.imuRoll !== null && sensor.imuPitch !== null && sensor.imuYaw !== null) imuHealthy++;
    });

    latestCameras.forEach((camera: any) => {
      if (camera.status === 'active') cameraHealthy++;
    });

    const result = [
      { sensor: 'LiDAR', healthy: lidarHealthy, total: totalRobots, percentage: Math.round((lidarHealthy / totalRobots) * 100) },
      { sensor: 'IMU', healthy: imuHealthy, total: totalRobots, percentage: Math.round((imuHealthy / totalRobots) * 100) },
      { sensor: 'Camera', healthy: cameraHealthy, total: latestCameras.length, percentage: Math.round((cameraHealthy / latestCameras.length) * 100) },
    ];

    res.json(result);
  } catch (error) {
    console.error('Error fetching sensor health:', error);
    res.status(500).json({ error: 'Failed to fetch sensor health' });
  }
});

// Get firmware version distribution
app.get('/api/analytics/firmware-distribution', async (req: Request, res: Response) => {
  try {
    const robots = await prisma.robot.findMany({
      select: {
        firmwareVersion: true,
      },
    });

    // Count by version
    const versionMap: Record<string, number> = {};
    
    robots.forEach(robot => {
      const version = robot.firmwareVersion || 'Unknown';
      versionMap[version] = (versionMap[version] || 0) + 1;
    });

    // Convert to array format
    const result = Object.entries(versionMap)
      .map(([version, count]) => ({
        version,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    res.json(result);
  } catch (error) {
    console.error('Error fetching firmware distribution:', error);
    res.status(500).json({ error: 'Failed to fetch firmware distribution' });
  }
});

// Get maintenance status
app.get('/api/analytics/maintenance-status', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    const maintenanceRecords = await prisma.maintenanceSchedule.findMany({
      select: {
        status: true,
        scheduledDate: true,
      },
    });

    let inWindow = 0;
    let overdue = 0;
    let completed = 0;
    let scheduled = 0;

    maintenanceRecords.forEach((record: { status: string; scheduledDate: Date }) => {
      if (record.status === 'completed') {
        completed++;
      } else if (record.status === 'in-progress') {
        inWindow++;
      } else if (record.scheduledDate < now) {
        overdue++;
      } else {
        scheduled++;
      }
    });

    const result = {
      inWindow,
      overdue,
      completed,
      scheduled,
      total: maintenanceRecords.length,
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance status' });
  }
});

// Get network latency distribution
app.get('/api/analytics/network-latency', async (req: Request, res: Response) => {
  try {
    const latestTelemetry = await prisma.robotTelemetry.findMany({
      orderBy: { recordedAt: 'desc' },
      distinct: ['robotId'],
      select: {
        networkLatencyMs: true,
        robotId: true,
        robot: {
          select: {
            region: true,
            country: true,
          },
        },
      },
    });

    // Group by region
    const regionMap: Record<string, { latencies: number[]; count: number }> = {};

    latestTelemetry.forEach(item => {
      const region = item.robot.region || 'Unknown';
      const latency = item.networkLatencyMs || 0;

      if (!regionMap[region]) {
        regionMap[region] = { latencies: [], count: 0 };
      }

      regionMap[region].latencies.push(latency);
      regionMap[region].count++;
    });

    // Calculate averages and quality
    const result = Object.entries(regionMap).map(([region, data]) => {
      const avgLatency = data.latencies.reduce((a, b) => a + b, 0) / data.count;
      const quality = avgLatency < 50 ? 'good' : avgLatency < 100 ? 'moderate' : 'poor';

      return {
        region,
        avgLatency: Math.round(avgLatency),
        count: data.count,
        quality,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching network latency:', error);
    res.status(500).json({ error: 'Failed to fetch network latency' });
  }
});

// Get data ingestion volume (messages per minute over last hour)
app.get('/api/analytics/data-ingestion', async (req: Request, res: Response) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const telemetryData = await prisma.robotTelemetry.findMany({
      where: {
        recordedAt: {
          gte: oneHourAgo,
        },
      },
      orderBy: { recordedAt: 'asc' },
      select: {
        recordedAt: true,
      },
    });

    // Group by 5-minute intervals
    const intervalData: Record<string, number> = {};
    
    telemetryData.forEach(item => {
      const time = new Date(item.recordedAt);
      const minutes = time.getMinutes();
      const interval = Math.floor(minutes / 5) * 5;
      const key = `${time.getHours()}:${interval.toString().padStart(2, '0')}`;
      
      intervalData[key] = (intervalData[key] || 0) + 1;
    });

    // Convert to array format
    const result = Object.entries(intervalData).map(([time, count]) => ({
      time,
      messagesPerMinute: Math.round((count / 5) * 10) / 10,
      totalMessages: count,
    }));

    res.json(result.slice(-12)); // Last 12 intervals (1 hour)
  } catch (error) {
    console.error('Error fetching data ingestion:', error);
    res.status(500).json({ error: 'Failed to fetch data ingestion' });
  }
});

// Get task completion rate (simulated based on diagnostics)
app.get('/api/analytics/task-completion', async (req: Request, res: Response) => {
  try {
    const { region, country } = req.query;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Build where clause with filters
    const whereClause: any = {
      recordedAt: {
        gte: twentyFourHoursAgo,
      },
    };
    
    // Add robot filters if region or country specified
    if (region || country) {
      whereClause.robot = {};
      if (region) whereClause.robot.region = region as string;
      if (country) whereClause.robot.country = country as string;
    }
    
    const diagnostics = await prisma.robotDiagnostic.findMany({
      where: whereClause,
      orderBy: { recordedAt: 'asc' },
      select: {
        errorCount24h: true,
        warningCount24h: true,
        missionSuccessRate: true,
        recordedAt: true,
        robotId: true,
      },
    });

    // Group by hour
    const hourlyData: Record<string, { successSum: number; count: number; robotIds: Set<string> }> = {};
    
    diagnostics.forEach((item: any) => {
      const hour = new Date(item.recordedAt).getHours();
      const hourKey = `${hour}:00`;
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = { successSum: 0, count: 0, robotIds: new Set() };
      }
      
      hourlyData[hourKey].robotIds.add(item.robotId);
      hourlyData[hourKey].count++;
      hourlyData[hourKey].successSum += item.missionSuccessRate || 85; // Default 85% if not available
    });

    // Convert to array format
    const result = Array.from({ length: 24 }, (_, i) => {
      const hourKey = `${i}:00`;
      const data = hourlyData[hourKey];
      
      const successRate = data ? data.successSum / data.count : 0;
      const estimatedTasks = data ? data.robotIds.size * 10 : 0;
      const succeeded = Math.round((estimatedTasks * successRate) / 100);
      const failed = estimatedTasks - succeeded;
      
      return {
        time: hourKey,
        succeeded,
        failed,
        total: estimatedTasks,
        successRate: Math.round(successRate * 10) / 10,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching task completion:', error);
    res.status(500).json({ error: 'Failed to fetch task completion' });
  }
});

// Get CPU and memory usage trends
app.get('/api/analytics/resource-usage', async (req: Request, res: Response) => {
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
        cpuLoadPercentage: true,
        memoryUsagePercentage: true,
        recordedAt: true,
      },
    });

    // Group by hour
    const hourlyData: Record<string, { cpuTotal: number; memTotal: number; count: number }> = {};
    
    telemetryData.forEach(item => {
      const hour = new Date(item.recordedAt).getHours();
      const hourKey = `${hour}:00`;
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = { cpuTotal: 0, memTotal: 0, count: 0 };
      }
      
      hourlyData[hourKey].cpuTotal += item.cpuLoadPercentage || 0;
      hourlyData[hourKey].memTotal += item.memoryUsagePercentage || 0;
      hourlyData[hourKey].count++;
    });

    // Convert to array format
    const result = Array.from({ length: 24 }, (_, i) => {
      const hourKey = `${i}:00`;
      const data = hourlyData[hourKey];
      
      return {
        time: hourKey,
        avgCpu: data ? Math.round((data.cpuTotal / data.count) * 10) / 10 : 0,
        avgMemory: data ? Math.round((data.memTotal / data.count) * 10) / 10 : 0,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching resource usage:', error);
    res.status(500).json({ error: 'Failed to fetch resource usage' });
  }
});

// Get fleet statistics summary
app.get('/api/analytics/fleet-summary', async (req: Request, res: Response) => {
  try {
    const robots = await prisma.robot.findMany({
      include: {
        telemetry: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });

    const alerts = await prisma.robotAlert.findMany({
      where: { isResolved: false },
    });

    const totalRobots = robots.length;
    const activeRobots = robots.filter(r => r.status === 'online').length;
    const avgBattery = robots.reduce((sum, r) => sum + (r.telemetry[0]?.batteryPercentage || 0), 0) / totalRobots;
    const avgTemp = robots.reduce((sum, r) => sum + (r.telemetry[0]?.temperatureC || 0), 0) / totalRobots;
    const fleetUptime = totalRobots > 0 ? (activeRobots / totalRobots) * 100 : 0;

    // Calculate data ingestion rate (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentTelemetry = await prisma.robotTelemetry.count({
      where: {
        recordedAt: {
          gte: fiveMinutesAgo,
        },
      },
    });
    const messagesPerMinute = Math.round(recentTelemetry / 5);

    const result = {
      totalRobots,
      activeRobots,
      fleetUptime: Math.round(fleetUptime * 10) / 10,
      avgBattery: Math.round(avgBattery),
      avgTemp: Math.round(avgTemp * 10) / 10,
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter((a: any) => a.severity === 'critical').length,
      highAlerts: alerts.filter((a: any) => a.severity === 'high').length,
      messagesPerMinute,
      lastUpdated: new Date().toISOString(),
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching fleet summary:', error);
    res.status(500).json({ error: 'Failed to fetch fleet summary' });
  }
});

// Catch-all route for SPA - must be AFTER all API routes
if (isProduction) {
  app.use((req: Request, res: Response) => {
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

// Get robot deployment map data with geographic locations
app.get('/api/analytics/robot-map-locations', async (req, res) => {
  try {
    // Get all robots with their location data
    const robots = await prisma.robot.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        location: true,
        country: true,
        region: true,
        firmwareVersion: true,
        telemetry: {
          select: {
            batteryPercentage: true,
            recordedAt: true,
          },
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
        alerts: {
          where: {
            isResolved: false,
          },
          select: {
            severity: true,
          },
        },
      },
    });

    // Comprehensive geographic coordinates matching seed.ts locations
    const locationCoordinates: Record<string, { coords: [number, number], country: string, region: string }> = {
      // India - Major cities
      'Mumbai': { coords: [72.8777, 19.0760], country: 'India', region: 'South Asia' },
      'Pune': { coords: [73.8567, 18.5204], country: 'India', region: 'South Asia' },
      'Bangalore': { coords: [77.5946, 12.9716], country: 'India', region: 'South Asia' },
      'Mysore': { coords: [76.6394, 12.2958], country: 'India', region: 'South Asia' },
      'Chennai': { coords: [80.2707, 13.0827], country: 'India', region: 'South Asia' },
      'Coimbatore': { coords: [76.9558, 11.0168], country: 'India', region: 'South Asia' },
      'New Delhi': { coords: [77.2090, 28.6139], country: 'India', region: 'South Asia' },
      'Gurugram': { coords: [77.0266, 28.4595], country: 'India', region: 'South Asia' },
      'Faridabad': { coords: [77.3178, 28.4089], country: 'India', region: 'South Asia' },
      'Noida': { coords: [77.3910, 28.5355], country: 'India', region: 'South Asia' },
      'Lucknow': { coords: [80.9462, 26.8467], country: 'India', region: 'South Asia' },
      'Kolkata': { coords: [88.3639, 22.5726], country: 'India', region: 'South Asia' },
      'Ahmedabad': { coords: [72.5714, 23.0225], country: 'India', region: 'South Asia' },
      'Surat': { coords: [72.8311, 21.1702], country: 'India', region: 'South Asia' },
      'Hyderabad': { coords: [78.4867, 17.3850], country: 'India', region: 'South Asia' },
      'Jaipur': { coords: [75.7873, 26.9124], country: 'India', region: 'South Asia' },
      'Chandigarh': { coords: [76.7794, 30.7333], country: 'India', region: 'South Asia' },
      'Kochi': { coords: [76.2673, 9.9312], country: 'India', region: 'South Asia' },
      'Indore': { coords: [75.8577, 22.7196], country: 'India', region: 'South Asia' },
      'Patna': { coords: [85.1376, 25.5941], country: 'India', region: 'South Asia' },
      
      // USA
      'San Francisco': { coords: [-122.4194, 37.7749], country: 'USA', region: 'North America' },
      'Los Angeles': { coords: [-118.2437, 34.0522], country: 'USA', region: 'North America' },
      'Houston': { coords: [-95.3698, 29.7604], country: 'USA', region: 'North America' },
      'New York': { coords: [-74.0060, 40.7128], country: 'USA', region: 'North America' },
      'Chicago': { coords: [-87.6298, 41.8781], country: 'USA', region: 'North America' },
      'Seattle': { coords: [-122.3321, 47.6062], country: 'USA', region: 'North America' },
      'Boston': { coords: [-71.0589, 42.3601], country: 'USA', region: 'North America' },
      'Denver': { coords: [-104.9903, 39.7392], country: 'USA', region: 'North America' },
      'Miami': { coords: [-80.1918, 25.7617], country: 'USA', region: 'North America' },
      'Atlanta': { coords: [-84.3880, 33.7490], country: 'USA', region: 'North America' },
      
      // China
      'Beijing': { coords: [116.4074, 39.9042], country: 'China', region: 'East Asia' },
      'Shanghai': { coords: [121.4737, 31.2304], country: 'China', region: 'East Asia' },
      'Shenzhen': { coords: [114.0579, 22.5431], country: 'China', region: 'East Asia' },
      'Guangzhou': { coords: [113.2644, 23.1291], country: 'China', region: 'East Asia' },
      'Hangzhou': { coords: [120.1551, 30.2741], country: 'China', region: 'East Asia' },
      'Chengdu': { coords: [104.0668, 30.5728], country: 'China', region: 'East Asia' },
      'Nanjing': { coords: [118.7969, 32.0603], country: 'China', region: 'East Asia' },
      'Wuhan': { coords: [114.3055, 30.5928], country: 'China', region: 'East Asia' },
      
      // Europe
      'London': { coords: [-0.1278, 51.5074], country: 'UK', region: 'Europe' },
      'Munich': { coords: [11.5820, 48.1351], country: 'Germany', region: 'Europe' },
      'Berlin': { coords: [13.4050, 52.5200], country: 'Germany', region: 'Europe' },
      'Paris': { coords: [2.3522, 48.8566], country: 'France', region: 'Europe' },
      'Madrid': { coords: [-3.7038, 40.4168], country: 'Spain', region: 'Europe' },
      'Rome': { coords: [12.4964, 41.9028], country: 'Italy', region: 'Europe' },
      'Amsterdam': { coords: [4.9041, 52.3676], country: 'Netherlands', region: 'Europe' },
      'Zurich': { coords: [8.5417, 47.3769], country: 'Switzerland', region: 'Europe' },
      'Stockholm': { coords: [18.0686, 59.3293], country: 'Sweden', region: 'Europe' },
      'Warsaw': { coords: [21.0122, 52.2297], country: 'Poland', region: 'Europe' },
      
      // Japan
      'Tokyo': { coords: [139.6503, 35.6762], country: 'Japan', region: 'East Asia' },
      'Osaka': { coords: [135.5023, 34.6937], country: 'Japan', region: 'East Asia' },
      'Nagoya': { coords: [136.9066, 35.1815], country: 'Japan', region: 'East Asia' },
      'Sapporo': { coords: [141.3469, 43.0642], country: 'Japan', region: 'East Asia' },
      
      // Other Asian countries
      'Singapore': { coords: [103.8198, 1.3521], country: 'Singapore', region: 'Southeast Asia' },
      'Seoul': { coords: [126.9780, 37.5665], country: 'South Korea', region: 'East Asia' },
      'Bangkok': { coords: [100.5018, 13.7563], country: 'Thailand', region: 'Southeast Asia' },
      'Kuala Lumpur': { coords: [101.6869, 3.1390], country: 'Malaysia', region: 'Southeast Asia' },
      'Jakarta': { coords: [106.8456, -6.2088], country: 'Indonesia', region: 'Southeast Asia' },
      'Ho Chi Minh City': { coords: [106.6297, 10.8231], country: 'Vietnam', region: 'Southeast Asia' },
      'Manila': { coords: [120.9842, 14.5995], country: 'Philippines', region: 'Southeast Asia' },
      'Dubai': { coords: [55.2708, 25.2048], country: 'UAE', region: 'Middle East' },
    };

    // Group robots by location
    const locationMap = new Map<string, any>();

    robots.forEach(robot => {
      const locationString = robot.location || 'Unknown';
      
      // Extract city name from "City - State" format
      const cityName = locationString.split(' - ')[0].trim();
      
      if (!locationMap.has(cityName)) {
        const geoData = locationCoordinates[cityName] || { 
          coords: [0, 0] as [number, number], 
          country: robot.country || 'Unknown', 
          region: robot.region || 'Unknown' 
        };
        
        locationMap.set(cityName, {
          id: cityName.toLowerCase().replace(/\s+/g, '-'),
          name: cityName,
          coordinates: geoData.coords,
          country: geoData.country,
          region: geoData.region,
          totalRobots: 0,
          activeRobots: 0,
          alerts: 0,
          criticalAlerts: 0,
          status: 'healthy' as 'healthy' | 'warning' | 'critical',
          uptimeTotal: 0,
          robotsWithUptime: 0,
          robotStatusCounts: { healthy: 0, warning: 0, critical: 0 },
        });
      }

      const locationData = locationMap.get(cityName)!;
      locationData.totalRobots++;

      // Count active robots
      if (robot.status === 'active' || robot.status === 'idle' || robot.status === 'online') {
        locationData.activeRobots++;
      }

      // Count alerts
      const criticalAlerts = robot.alerts.filter(a => a.severity === 'critical').length;
      const highAlerts = robot.alerts.filter(a => a.severity === 'high').length;
      locationData.alerts += robot.alerts.length;
      locationData.criticalAlerts += criticalAlerts;

      // Calculate uptime and determine robot status
      let robotUptime = 95;
      if (robot.telemetry[0]?.batteryPercentage) {
        const batteryLevel = robot.telemetry[0].batteryPercentage;
        robotUptime = batteryLevel > 20 ? 95 : batteryLevel > 10 ? 80 : 60;
        locationData.uptimeTotal += robotUptime;
        locationData.robotsWithUptime++;
      }

      // Determine individual robot status
      let robotStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (criticalAlerts > 0 || robotUptime < 70) {
        robotStatus = 'critical';
      } else if (robot.alerts.length > 0 || robotUptime < 85) {
        robotStatus = 'warning';
      }
      locationData.robotStatusCounts[robotStatus]++;
    });

    // Calculate status and average uptime for each location
    const locations = Array.from(locationMap.values()).map(loc => {
      const avgUptime = loc.robotsWithUptime > 0 
        ? loc.uptimeTotal / loc.robotsWithUptime 
        : 95;

      // Determine overall status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (loc.criticalAlerts > 0 || avgUptime < 70) {
        status = 'critical';
      } else if (loc.alerts > 0 || avgUptime < 85 || loc.activeRobots < loc.totalRobots * 0.8) {
        status = 'warning';
      }

      return {
        id: loc.id,
        name: loc.name,
        coordinates: loc.coordinates,
        country: loc.country,
        region: loc.region,
        totalRobots: loc.totalRobots,
        activeRobots: loc.activeRobots,
        alerts: loc.alerts,
        status,
        uptime: Math.round(avgUptime * 10) / 10,
        robotStatusCounts: loc.robotStatusCounts,
      };
    }).filter(loc => loc.coordinates[0] !== 0 && loc.coordinates[1] !== 0); // Filter out unknown locations

    res.json(locations);
  } catch (error) {
    console.error('Error fetching robot map locations:', error);
    res.status(500).json({ error: 'Failed to fetch robot map locations' });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
