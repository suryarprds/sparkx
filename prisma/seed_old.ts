import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to generate realistic GPS coordinates based on location/country
const getGPSCoordinates = (country: string, state: string): { lat: number; lng: number } => {
  const locationMap: { [key: string]: { lat: number; lng: number } } = {
    // United States
    "United States-California": { lat: 37.7749, lng: -122.4194 },
    "United States-Texas": { lat: 29.7604, lng: -95.3698 },
    // Germany  
    "Germany-Bavaria": { lat: 48.1351, lng: 11.5820 },
    // Japan
    "Japan-Tokyo": { lat: 35.6762, lng: 139.6503 },
    // United Kingdom
    "United Kingdom-London": { lat: 51.5074, lng: -0.1278 },
    // Canada
    "Canada-Ontario": { lat: 43.6532, lng: -79.3832 },
    // France
    "France-Île-de-France": { lat: 48.8566, lng: 2.3522 },
    // Singapore
    "Singapore-Singapore": { lat: 1.3521, lng: 103.8198 },
    // Australia
    "Australia-New South Wales": { lat: -33.8688, lng: 151.2093 },
    // South Korea
    "South Korea-Seoul": { lat: 37.5665, lng: 126.9780 },
    // India
    "India-Karnataka": { lat: 12.9716, lng: 77.5946 },
    // Brazil
    "Brazil-São Paulo": { lat: -23.5558, lng: -46.6396 },
    // Netherlands
    "Netherlands-North Holland": { lat: 52.3702, lng: 4.8951 },
  };
  
  const key = `${country}-${state}`;
  const baseCoords = locationMap[key] || { lat: 0, lng: 0 };
  
  // Add small random offset for different locations within the same city
  return {
    lat: baseCoords.lat + (Math.random() - 0.5) * 0.01,
    lng: baseCoords.lng + (Math.random() - 0.5) * 0.01
  };
};

async function main() {
  console.log('🌱 Seeding database...')

  // Delete existing data
  await prisma.robotTelemetry.deleteMany()
  await prisma.robotSensor.deleteMany()
  await prisma.robotCamera.deleteMany()
  await prisma.robotJoint.deleteMany()
  await prisma.robotAlert.deleteMany()
  await prisma.robotDiagnostic.deleteMany()
  await prisma.maintenanceSchedule.deleteMany()
  await prisma.networkHandoff.deleteMany()
  await prisma.batteryHealthHistory.deleteMany()
  await prisma.chargeHistory.deleteMany()
  await prisma.componentHealth.deleteMany()
  await prisma.predictiveAlert.deleteMany()
  await prisma.robotConfiguration.deleteMany()
  await prisma.robot.deleteMany()

  console.log('🗑️  Cleared existing data')

  // Create robots
  const robots = [
    {
      id: "SPARKX-001",
      name: "Unit Alpha",
      status: "online",
      battery: 87,
      signal: 95,
      temperature: 42,
      location: "Lab Floor 2",
      country: "United States",
      state: "California",
      region: "North America",
      batteryRuntimeHours: 8,
      cpuLoad: 35,
    },
    {
      id: "SPARKX-002",
      name: "Unit Beta",
      status: "charging",
      battery: 45,
      signal: 88,
      temperature: 38,
      location: "Warehouse Section A",
      country: "Germany",
      state: "Bavaria",
      region: "Europe",
      batteryRuntimeHours: 10,
      cpuLoad: 15,
    },
    {
      id: "SPARKX-003",
      name: "Unit Gamma",
      status: "online",
      battery: 92,
      signal: 91,
      temperature: 44,
      location: "Production Line 1",
      country: "Japan",
      state: "Tokyo",
      region: "Asia Pacific",
      batteryRuntimeHours: 12,
      cpuLoad: 68,
    },
    {
      id: "SPARKX-004",
      name: "Unit Delta",
      status: "error",
      battery: 18,
      signal: 45,
      temperature: 75,
      location: "Storage Facility B",
      country: "United Kingdom",
      state: "London",
      region: "Europe",
      batteryRuntimeHours: 8,
      cpuLoad: 92,
    },
    {
      id: "SPARKX-005",
      name: "Unit Epsilon",
      status: "online",
      battery: 76,
      signal: 92,
      temperature: 41,
      location: "R&D Center",
      country: "United States",
      state: "California",
      region: "North America",
      batteryRuntimeHours: 10,
      cpuLoad: 42,
    },
  ];

  for (const robotData of robots) {
    const coords = getGPSCoordinates(robotData.country, robotData.state);
    
    const robot = await prisma.robot.create({
      data: {
        id: robotData.id,
        name: robotData.name,
        model: "SparkX-X1",
        serialNumber: `SN-${robotData.id}`,
        firmwareVersion: "2.5.1",
        hardwareVersion: "1.0",
        status: robotData.status,
        operationalMode: robotData.status === "online" ? "autonomous" : "standby",
        currentTask: robotData.status === "online" ? "Patrolling designated area" : null,
        location: robotData.location,
        country: robotData.country,
        state: robotData.state,
        region: robotData.region,
        batteryCapacityKwh: 5.2,
        maxPayloadKg: 50,
        operatingTempMinC: -10,
        operatingTempMaxC: 50,
        manufacturedDate: new Date('2024-01-15'),
        deploymentDate: new Date('2024-02-01'),
        lastSeenAt: new Date(),
      },
    });

    // Create telemetry data
    await prisma.robotTelemetry.create({
      data: {
        robotId: robot.id,
        batteryPercentage: robotData.battery,
        batteryVoltage: 48.2,
        batteryCurrent: robotData.status === "charging" ? 5.2 : -2.1,
        batteryTemperatureC: 35.5,
        chargingStatus: robotData.status === "charging",
        estimatedRuntimeMin: Math.round((robotData.battery / 100) * robotData.batteryRuntimeHours * 60),
        cpuLoadPercentage: robotData.cpuLoad,
        memoryUsagePercentage: 45.2,
        diskUsagePercentage: 32.8,
        temperatureC: robotData.temperature,
        signalStrength: robotData.signal,
        wifiStrength: robotData.signal >= 90 ? "Excellent" : robotData.signal >= 70 ? "Good" : robotData.signal >= 50 ? "Fair" : "Poor",
        cellularStrength: "Good",
        networkLatencyMs: 25,
        latitude: coords.lat,
        longitude: coords.lng,
        speedMps: robotData.status === "online" ? 0.5 : 0,
      },
    });

    // Create sensor data
    await prisma.robotSensor.create({
      data: {
        robotId: robot.id,
        imuRoll: 0.5,
        imuPitch: -1.2,
        imuYaw: 45.8,
        accelX: 0.1,
        accelY: -0.05,
        accelZ: 9.8,
        gyroX: 0.02,
        gyroY: -0.01,
        gyroZ: 0.03,
        lidarStatus: "active",
        lidarScanRateHz: 10,
        lidarDetectedObstacles: robotData.status === "online" ? 3 : 0,
        lidarMinDistanceM: 2.5,
        lidarMaxRangeM: 30.0,
        lidarPointsPerScan: 360,
        ambientTemperatureC: 22.5,
        humidityPercentage: 45.0,
        airPressureHpa: 1013.25,
        ultrasonicFrontCm: 150.0,
        ultrasonicRearCm: 200.0,
        ultrasonicLeftCm: 180.0,
        ultrasonicRightCm: 175.0,
      },
    });

    // Create camera data
    await prisma.robotCamera.createMany({
      data: [
        {
          robotId: robot.id,
          cameraName: "Front Camera",
          cameraType: "RGB",
          cameraPosition: "front",
          status: "active",
          fps: 30,
          resolutionWidth: 1920,
          resolutionHeight: 1080,
          framesCaptured: 158420,
        },
        {
          robotId: robot.id,
          cameraName: "Rear Camera",
          cameraType: "RGB",
          cameraPosition: "rear",
          status: "active",
          fps: 30,
          resolutionWidth: 1920,
          resolutionHeight: 1080,
          framesCaptured: 142350,
        },
      ],
    });

    // Create joint data - 16 joints with 32 total DOF
    const joints = [
      // Upper Body
      { name: "Neck", type: "revolute", dof: 3, maxTorque: 20, tempRange: [35, 45] },
      { name: "Shoulder_Left", type: "revolute", dof: 3, maxTorque: 80, tempRange: [40, 50] },
      { name: "Shoulder_Right", type: "revolute", dof: 3, maxTorque: 80, tempRange: [40, 50] },
      { name: "Elbow_Left", type: "revolute", dof: 3, maxTorque: 60, tempRange: [38, 48] },
      { name: "Elbow_Right", type: "revolute", dof: 3, maxTorque: 60, tempRange: [38, 48] },
      { name: "Wrist_Left", type: "revolute", dof: 2, maxTorque: 40, tempRange: [36, 46] },
      { name: "Wrist_Right", type: "revolute", dof: 2, maxTorque: 40, tempRange: [36, 46] },
      { name: "Gripper_Left", type: "prismatic", dof: 1, maxTorque: 30, tempRange: [35, 45] },
      { name: "Gripper_Right", type: "prismatic", dof: 1, maxTorque: 30, tempRange: [35, 45] },
      // Lower Body
      { name: "Hip", type: "revolute", dof: 3, maxTorque: 120, tempRange: [42, 52] },
      { name: "Knee_High_Left", type: "revolute", dof: 1, maxTorque: 100, tempRange: [40, 50] },
      { name: "Knee_High_Right", type: "revolute", dof: 1, maxTorque: 100, tempRange: [40, 50] },
      { name: "Knee_Low_Left", type: "revolute", dof: 1, maxTorque: 90, tempRange: [40, 50] },
      { name: "Knee_Low_Right", type: "revolute", dof: 1, maxTorque: 90, tempRange: [40, 50] },
      { name: "Ankle_Left", type: "revolute", dof: 2, maxTorque: 70, tempRange: [38, 48] },
      { name: "Ankle_Right", type: "revolute", dof: 2, maxTorque: 70, tempRange: [38, 48] },
    ];

    for (let i = 0; i < joints.length; i++) {
      const jointConfig = joints[i];
      const tempMin = jointConfig.tempRange[0];
      const tempMax = jointConfig.tempRange[1];
      const currentTemp = tempMin + Math.random() * (tempMax - tempMin);
      
      // Generate realistic position based on joint type
      const currentPos = Math.random() * 180 - 90;
      const targetPos = currentPos + (Math.random() * 20 - 10); // Small deviation
      
      const joint = await prisma.robotJoint.create({
        data: {
          robotId: robot.id,
          jointName: jointConfig.name,
          jointType: jointConfig.type,
          jointIndex: i,
          currentPositionDeg: currentPos,
          targetPositionDeg: targetPos,
          velocityDegPerSec: Math.random() * 30,
          currentTorqueNm: Math.random() * jointConfig.maxTorque * 0.7,
          maxTorqueNm: jointConfig.maxTorque,
          loadPercentage: Math.random() * 80,
          temperatureC: currentTemp,
          status: currentTemp > tempMax - 2 ? "warning" : "operational",
          minPositionLimitDeg: -180,
          maxPositionLimitDeg: 180,
        },
      });
      console.log(`   ✓ Created joint: ${joint.jointName} (${jointConfig.dof} DOF) for ${robotData.name}`);
    }

    // Create alerts for error status robots
    if (robotData.status === "error") {
      await prisma.robotAlert.create({
        data: {
          robotId: robot.id,
          alertType: "system_error",
          severity: "critical",
          title: "Critical Battery Level",
          message: "Battery level has dropped below critical threshold",
          errorCode: "ERR_BATT_CRITICAL",
          isAcknowledged: false,
          isResolved: false,
        },
      });

      await prisma.robotAlert.create({
        data: {
          robotId: robot.id,
          alertType: "overheating",
          severity: "critical",
          title: "Temperature Critical",
          message: "System temperature exceeds safe operating limits",
          errorCode: "ERR_TEMP_HIGH",
          isAcknowledged: false,
          isResolved: false,
        },
      });
    }

    // Create safety alerts (collision, geofence, emergency_stop) for all robots
    const safetyAlertsData = [
      {
        alertType: "collision",
        severity: "warning",
        title: "Proximity Warning",
        message: "Object detected 0.45m ahead - reducing speed",
        isAcknowledged: false,
        createdMinutesAgo: 2,
      },
      {
        alertType: "geofence",
        severity: "warning",
        title: "Geofence Boundary",
        message: "Approaching restricted zone boundary (2.5m)",
        isAcknowledged: false,
        createdMinutesAgo: 15,
      },
      {
        alertType: "emergency_stop",
        severity: "critical",
        title: "Emergency Stop Activated",
        message: "Manual emergency stop triggered by operator",
        isAcknowledged: true,
        createdMinutesAgo: 45,
      },
    ];

    for (const alertData of safetyAlertsData) {
      await prisma.robotAlert.create({
        data: {
          robotId: robot.id,
          alertType: alertData.alertType,
          severity: alertData.severity,
          title: alertData.title,
          message: alertData.message,
          isAcknowledged: alertData.isAcknowledged,
          isResolved: false,
          acknowledgedAt: alertData.isAcknowledged ? new Date(Date.now() - alertData.createdMinutesAgo * 60 * 1000) : null,
          acknowledgedBy: alertData.isAcknowledged ? "Operator" : null,
          createdAt: new Date(Date.now() - alertData.createdMinutesAgo * 60 * 1000),
        },
      });
    }

    // Create diagnostics
    await prisma.robotDiagnostic.create({
      data: {
        robotId: robot.id,
        overallHealthScore: robotData.status === "error" ? 45 : robotData.status === "offline" ? 65 : 92,
        healthStatus: robotData.status === "error" ? "critical" : robotData.status === "offline" ? "warning" : "healthy",
        uptimeHours: 720.5,
        uptimePercentage: 99.2,
        totalRuntimeHours: 1520.3,
        missionSuccessRate: robotData.status === "error" ? 85.5 : 98.7,
        errorCount24h: robotData.status === "error" ? 5 : 0,
        warningCount24h: robotData.status === "error" ? 12 : 2,
        storageTotalGb: 256,
        storageUsedGb: 82,
        storageAvailableGb: 174,
        packetsSent: 1582940,
        packetsReceived: 1579823,
        bytesSent: 582940000,
        bytesReceived: 579823000,
        networkErrors: 42,
        packetLossPercent: robotData.status === "error" ? 2.5 : 0.12,
        networkLatencyMs: robotData.status === "error" ? 85 : 28,
        uptimeSeconds: Math.floor(720.5 * 3600),
        uploadRateMbps: 2.5,
        downloadRateMbps: 5.8,
        totalUploadedBytes: BigInt(1024 * 1024 * 450), // 450 MB
        totalDownloadedBytes: BigInt(1024 * 1024 * 1200), // 1.2 GB
      },
    });

    // Create maintenance schedule
    await prisma.maintenanceSchedule.create({
      data: {
        robotId: robot.id,
        maintenanceType: "preventive",
        title: "Quarterly System Inspection",
        description: "Comprehensive system check and component inspection",
        scheduledDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        estimatedDurationHours: 2.5,
        priority: "medium",
        status: "scheduled",
      },
    });

    // Create network handoffs history
    const handoffData = [
      {
        fromNetwork: "WiFi-5GHz",
        toNetwork: "Cellular-5G",
        reason: "WiFi signal degraded below threshold",
        durationMs: 145,
        occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        fromNetwork: "Cellular-5G",
        toNetwork: "WiFi-5GHz",
        reason: "Preferred WiFi network available",
        durationMs: 89,
        occurredAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      },
      {
        fromNetwork: "WiFi-2.4GHz",
        toNetwork: "WiFi-5GHz",
        reason: "Better signal strength on 5GHz band",
        durationMs: 67,
        occurredAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      },
    ];

    for (const handoff of handoffData) {
      await prisma.networkHandoff.create({
        data: {
          robotId: robot.id,
          ...handoff,
        },
      });
    }

    // Create battery health history (last 7 months)
    const batteryHealthData = [
      { month: 6, health: 98, cycles: 190, capacity: 5096 },
      { month: 5, health: 97, cycles: 200, capacity: 5044 },
      { month: 4, health: 96, cycles: 210, capacity: 4992 },
      { month: 3, health: 96, cycles: 220, capacity: 4992 },
      { month: 2, health: 95, cycles: 230, capacity: 4940 },
      { month: 1, health: 95, cycles: 232, capacity: 4940 },
      { month: 0, health: 95, cycles: 234, capacity: 4940 },
    ];

    for (const history of batteryHealthData) {
      await prisma.batteryHealthHistory.create({
        data: {
          robotId: robot.id,
          healthPercentage: history.health,
          cycleCount: history.cycles,
          capacityMah: history.capacity,
          recordedAt: new Date(Date.now() - history.month * 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Create recent charge history
    const chargeHistoryData = [
      { cycleNum: 234, level: 100, duration: 87, temp: 42, hoursAgo: 2 },
      { cycleNum: 233, level: 98, duration: 92, temp: 45, hoursAgo: 26 },
      { cycleNum: 232, level: 100, duration: 89, temp: 43, hoursAgo: 50 },
      { cycleNum: 231, level: 97, duration: 91, temp: 44, hoursAgo: 74 },
      { cycleNum: 230, level: 100, duration: 88, temp: 42, hoursAgo: 98 },
    ];

    for (const charge of chargeHistoryData) {
      await prisma.chargeHistory.create({
        data: {
          robotId: robot.id,
          cycleNumber: charge.cycleNum,
          chargeLevel: charge.level,
          durationMinutes: charge.duration,
          temperatureC: charge.temp,
          chargedAt: new Date(Date.now() - charge.hoursAgo * 60 * 60 * 1000),
        },
      });
    }

    // Create component health data
    const componentsData = [
      { name: "Drive Motors", health: 88, status: "good", remaining: 1200, replacedDaysAgo: 180 },
      { name: "Battery Pack", health: 95, status: "excellent", remaining: 2800, replacedDaysAgo: null },
      { name: "LiDAR Sensor", health: 92, status: "excellent", remaining: 3500, replacedDaysAgo: null },
      { name: "IMU Module", health: 76, status: "fair", remaining: 800, replacedDaysAgo: 360 },
      { name: "Cameras", health: 85, status: "good", remaining: 1500, replacedDaysAgo: 90 },
      { name: "Control Board", health: 94, status: "excellent", remaining: 4000, replacedDaysAgo: null },
    ];

    for (const comp of componentsData) {
      await prisma.componentHealth.create({
        data: {
          robotId: robot.id,
          componentName: comp.name,
          healthPercentage: comp.health,
          status: comp.status,
          hoursRemaining: comp.remaining,
          lastReplacedAt: comp.replacedDaysAgo 
            ? new Date(Date.now() - comp.replacedDaysAgo * 24 * 60 * 60 * 1000)
            : null,
        },
      });
    }

    // Create predictive alerts
    if (robotData.status !== "error") {
      const predictiveAlertsData = [
        {
          component: "Left Drive Motor",
          prediction: "Bearing wear detected, potential failure within 30 days",
          severity: "warning",
          confidence: 82,
          days: 28,
          action: "Schedule bearing inspection and lubrication",
        },
        {
          component: "Battery Pack",
          prediction: "Capacity degradation accelerating",
          severity: "info",
          confidence: 75,
          days: 180,
          action: "Monitor battery health weekly, plan replacement in 6 months",
        },
      ];

      for (const alert of predictiveAlertsData) {
        await prisma.predictiveAlert.create({
          data: {
            robotId: robot.id,
            componentName: alert.component,
            prediction: alert.prediction,
            severity: alert.severity,
            confidencePercent: alert.confidence,
            estimatedDays: alert.days,
            recommendedAction: alert.action,
          },
        });
      }
    }

    // Create configuration
    await prisma.robotConfiguration.createMany({
      data: [
        {
          robotId: robot.id,
          configKey: "max_speed",
          configValue: "1.5",
          configType: "float",
          category: "motion",
          description: "Maximum speed in m/s",
        },
        {
          robotId: robot.id,
          configKey: "patrol_mode",
          configValue: "autonomous",
          configType: "string",
          category: "operation",
          description: "Default patrol mode",
        },
      ],
    });

    console.log(`✅ Created robot: ${robot.name} (${robot.id})`)
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
