import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Comprehensive location data with focus on India
const locations = [
  // India (60 locations - major focus)
  { country: "India", state: "Maharashtra", city: "Mumbai", region: "South Asia", lat: 19.0760, lng: 72.8777 },
  { country: "India", state: "Maharashtra", city: "Pune", region: "South Asia", lat: 18.5204, lng: 73.8567 },
  { country: "India", state: "Karnataka", city: "Bangalore", region: "South Asia", lat: 12.9716, lng: 77.5946 },
  { country: "India", state: "Karnataka", city: "Mysore", region: "South Asia", lat: 12.2958, lng: 76.6394 },
  { country: "India", state: "Tamil Nadu", city: "Chennai", region: "South Asia", lat: 13.0827, lng: 80.2707 },
  { country: "India", state: "Tamil Nadu", city: "Coimbatore", region: "South Asia", lat: 11.0168, lng: 76.9558 },
  { country: "India", state: "Delhi", city: "New Delhi", region: "South Asia", lat: 28.6139, lng: 77.2090 },
  { country: "India", state: "Haryana", city: "Gurugram", region: "South Asia", lat: 28.4595, lng: 77.0266 },
  { country: "India", state: "Haryana", city: "Faridabad", region: "South Asia", lat: 28.4089, lng: 77.3178 },
  { country: "India", state: "Uttar Pradesh", city: "Noida", region: "South Asia", lat: 28.5355, lng: 77.3910 },
  { country: "India", state: "Uttar Pradesh", city: "Lucknow", region: "South Asia", lat: 26.8467, lng: 80.9462 },
  { country: "India", state: "West Bengal", city: "Kolkata", region: "South Asia", lat: 22.5726, lng: 88.3639 },
  { country: "India", state: "Gujarat", city: "Ahmedabad", region: "South Asia", lat: 23.0225, lng: 72.5714 },
  { country: "India", state: "Gujarat", city: "Surat", region: "South Asia", lat: 21.1702, lng: 72.8311 },
  { country: "India", state: "Telangana", city: "Hyderabad", region: "South Asia", lat: 17.3850, lng: 78.4867 },
  { country: "India", state: "Rajasthan", city: "Jaipur", region: "South Asia", lat: 26.9124, lng: 75.7873 },
  { country: "India", state: "Punjab", city: "Chandigarh", region: "South Asia", lat: 30.7333, lng: 76.7794 },
  { country: "India", state: "Kerala", city: "Kochi", region: "South Asia", lat: 9.9312, lng: 76.2673 },
  { country: "India", state: "Madhya Pradesh", city: "Indore", region: "South Asia", lat: 22.7196, lng: 75.8577 },
  { country: "India", state: "Bihar", city: "Patna", region: "South Asia", lat: 25.5941, lng: 85.1376 },
  
  // USA (10 locations)
  { country: "United States", state: "California", city: "San Francisco", region: "North America", lat: 37.7749, lng: -122.4194 },
  { country: "United States", state: "California", city: "Los Angeles", region: "North America", lat: 34.0522, lng: -118.2437 },
  { country: "United States", state: "Texas", city: "Houston", region: "North America", lat: 29.7604, lng: -95.3698 },
  { country: "United States", state: "New York", city: "New York", region: "North America", lat: 40.7128, lng: -74.0060 },
  { country: "United States", state: "Illinois", city: "Chicago", region: "North America", lat: 41.8781, lng: -87.6298 },
  { country: "United States", state: "Washington", city: "Seattle", region: "North America", lat: 47.6062, lng: -122.3321 },
  { country: "United States", state: "Massachusetts", city: "Boston", region: "North America", lat: 42.3601, lng: -71.0589 },
  { country: "United States", state: "Colorado", city: "Denver", region: "North America", lat: 39.7392, lng: -104.9903 },
  { country: "United States", state: "Florida", city: "Miami", region: "North America", lat: 25.7617, lng: -80.1918 },
  { country: "United States", state: "Georgia", city: "Atlanta", region: "North America", lat: 33.7490, lng: -84.3880 },
  
  // China (8 locations)
  { country: "China", state: "Beijing", city: "Beijing", region: "East Asia", lat: 39.9042, lng: 116.4074 },
  { country: "China", state: "Shanghai", city: "Shanghai", region: "East Asia", lat: 31.2304, lng: 121.4737 },
  { country: "China", state: "Guangdong", city: "Shenzhen", region: "East Asia", lat: 22.5431, lng: 114.0579 },
  { country: "China", state: "Guangdong", city: "Guangzhou", region: "East Asia", lat: 23.1291, lng: 113.2644 },
  { country: "China", state: "Zhejiang", city: "Hangzhou", region: "East Asia", lat: 30.2741, lng: 120.1551 },
  { country: "China", state: "Sichuan", city: "Chengdu", region: "East Asia", lat: 30.5728, lng: 104.0668 },
  { country: "China", state: "Jiangsu", city: "Nanjing", region: "East Asia", lat: 32.0603, lng: 118.7969 },
  { country: "China", state: "Hubei", city: "Wuhan", region: "East Asia", lat: 30.5928, lng: 114.3055 },
  
  // Europe (10 locations)
  { country: "United Kingdom", state: "England", city: "London", region: "Europe", lat: 51.5074, lng: -0.1278 },
  { country: "Germany", state: "Bavaria", city: "Munich", region: "Europe", lat: 48.1351, lng: 11.5820 },
  { country: "Germany", state: "Berlin", city: "Berlin", region: "Europe", lat: 52.5200, lng: 13.4050 },
  { country: "France", state: "Île-de-France", city: "Paris", region: "Europe", lat: 48.8566, lng: 2.3522 },
  { country: "Spain", state: "Madrid", city: "Madrid", region: "Europe", lat: 40.4168, lng: -3.7038 },
  { country: "Italy", state: "Lazio", city: "Rome", region: "Europe", lat: 41.9028, lng: 12.4964 },
  { country: "Netherlands", state: "North Holland", city: "Amsterdam", region: "Europe", lat: 52.3676, lng: 4.9041 },
  { country: "Switzerland", state: "Zurich", city: "Zurich", region: "Europe", lat: 47.3769, lng: 8.5417 },
  { country: "Sweden", state: "Stockholm", city: "Stockholm", region: "Europe", lat: 59.3293, lng: 18.0686 },
  { country: "Poland", state: "Mazovia", city: "Warsaw", region: "Europe", lat: 52.2297, lng: 21.0122 },
  
  // Japan (4 locations)
  { country: "Japan", state: "Tokyo", city: "Tokyo", region: "East Asia", lat: 35.6762, lng: 139.6503 },
  { country: "Japan", state: "Osaka", city: "Osaka", region: "East Asia", lat: 34.6937, lng: 135.5023 },
  { country: "Japan", state: "Aichi", city: "Nagoya", region: "East Asia", lat: 35.1815, lng: 136.9066 },
  { country: "Japan", state: "Hokkaido", city: "Sapporo", region: "East Asia", lat: 43.0642, lng: 141.3469 },
  
  // Other Asian countries (8 locations)
  { country: "Singapore", state: "Singapore", city: "Singapore", region: "Southeast Asia", lat: 1.3521, lng: 103.8198 },
  { country: "South Korea", state: "Seoul", city: "Seoul", region: "East Asia", lat: 37.5665, lng: 126.9780 },
  { country: "Thailand", state: "Bangkok", city: "Bangkok", region: "Southeast Asia", lat: 13.7563, lng: 100.5018 },
  { country: "Malaysia", state: "Kuala Lumpur", city: "Kuala Lumpur", region: "Southeast Asia", lat: 3.1390, lng: 101.6869 },
  { country: "Indonesia", state: "Jakarta", city: "Jakarta", region: "Southeast Asia", lat: -6.2088, lng: 106.8456 },
  { country: "Vietnam", state: "Ho Chi Minh", city: "Ho Chi Minh City", region: "Southeast Asia", lat: 10.8231, lng: 106.6297 },
  { country: "Philippines", state: "Metro Manila", city: "Manila", region: "Southeast Asia", lat: 14.5995, lng: 120.9842 },
  { country: "UAE", state: "Dubai", city: "Dubai", region: "Middle East", lat: 25.2048, lng: 55.2708 },
];

// Robot models with specifications
const robotModels = [
  { model: "SparkX-X1", series: "SPARKX", maxPayload: 50, batteryCapacity: 5.2, basePrice: 45000 },
  { model: "SparkX-X2", series: "SPARKX", maxPayload: 75, batteryCapacity: 7.5, basePrice: 62000 },
  { model: "SparkX-X3", series: "SPARKX", maxPayload: 100, batteryCapacity: 10.0, basePrice: 78000 },
  { model: "TitanBot-T1", series: "TITAN", maxPayload: 150, batteryCapacity: 12.5, basePrice: 95000 },
  { model: "TitanBot-T2", series: "TITAN", maxPayload: 200, batteryCapacity: 15.0, basePrice: 125000 },
  { model: "NanoBot-N1", series: "NANO", maxPayload: 25, batteryCapacity: 3.5, basePrice: 28000 },
  { model: "AgilePro-A1", series: "AGILE", maxPayload: 60, batteryCapacity: 6.0, basePrice: 52000 },
  { model: "HeavyDuty-H1", series: "HEAVY", maxPayload: 250, batteryCapacity: 20.0, basePrice: 145000 },
];

// Task types for different industries
const taskTypes = [
  "Warehouse patrol", "Inventory scanning", "Package delivery", "Floor cleaning",
  "Security monitoring", "Material transport", "Quality inspection", "Assembly assistance",
  "Sorting operations", "Loading/Unloading", "Maintenance inspection", "Data collection",
  "Environmental monitoring", "Perimeter patrol", "Stock counting", "Order picking"
];

// Helper function to get random location
const getRandomLocation = (index: number) => {
  // First 60 robots are from India locations
  if (index < 60) {
    return locations[index % 20]; // Cycle through first 20 India locations
  }
  // Remaining 40 distributed across all locations
  return locations[20 + (index % (locations.length - 20))];
};

// Helper function to get random robot model
const getRandomModel = () => {
  return robotModels[Math.floor(Math.random() * robotModels.length)];
};

// Helper function to generate varied data
const getVariedValue = (base: number, variance: number) => {
  return base + (Math.random() - 0.5) * variance;
};

// Helper to add minutes to a date
const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60000);
};

// Helper to add hours to a date
const addHours = (date: Date, hours: number): Date => {
  return new Date(date.getTime() + hours * 3600000);
};

// Helper to add days to a date
const addDays = (date: Date, days: number): Date => {
  return new Date(date.getTime() + days * 86400000);
};

async function main() {
  console.log('🌱 Seeding database with 100 diverse robot fleets...')

  // Delete existing data in correct order
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

  const now = new Date();
  const allRobots = [];

  // ============================================================================
  // CREATE 100 DIVERSE ROBOTS
  // ============================================================================

  for (let i = 0; i < 100; i++) {
    const location = getRandomLocation(i);
    const robotModel = getRandomModel();
    const robotId = `${robotModel.series}-${String(i + 1).padStart(3, '0')}`;
    const serialNumber = `SN-${robotModel.series}-${String(i + 1).padStart(4, '0')}`;
    
    // Varied operational parameters
    const statuses = ["online", "offline", "maintenance", "charging", "idle"];
    const modes = ["autonomous", "manual", "semi-autonomous", "remote"];
    const status = i < 80 ? "online" : statuses[Math.floor(Math.random() * statuses.length)];
    const operationalMode = modes[Math.floor(Math.random() * modes.length)];
    const currentTask = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    
    // Varied dates
    const manufacturedDate = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const deploymentDate = new Date(manufacturedDate.getTime() + (30 + Math.random() * 90) * 86400000);
    const lastMaintenanceDays = Math.floor(Math.random() * 60);
    const nextMaintenanceDays = 30 + Math.floor(Math.random() * 90);
    
    // Varied firmware versions
    const firmwareVersions = ["2.5.1", "2.5.0", "2.4.8", "2.6.0", "3.0.0", "2.3.9"];
    const firmwareVersion = firmwareVersions[Math.floor(Math.random() * firmwareVersions.length)];
    
    const robot = await prisma.robot.create({
      data: {
        id: robotId,
        name: `Unit ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1}`,
        model: robotModel.model,
        serialNumber: serialNumber,
        firmwareVersion: firmwareVersion,
        hardwareVersion: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 5)}.0`,
        status: status,
        operationalMode: operationalMode,
        currentTask: `${currentTask} - ${location.city}`,
        location: `${location.city} - ${location.state}`,
        country: location.country,
        state: location.state,
        region: location.region,
        batteryCapacityKwh: robotModel.batteryCapacity,
        maxPayloadKg: robotModel.maxPayload,
        operatingTempMinC: -10 + Math.floor(Math.random() * 10),
        operatingTempMaxC: 45 + Math.floor(Math.random() * 15),
        manufacturedDate: manufacturedDate,
        deploymentDate: deploymentDate,
        lastMaintenanceDate: addDays(now, -lastMaintenanceDays),
        nextMaintenanceDate: addDays(now, nextMaintenanceDays),
        warrantyExpiryDate: new Date(manufacturedDate.getFullYear() + 3, manufacturedDate.getMonth(), manufacturedDate.getDate()),
        lastSeenAt: status === "online" ? now : addHours(now, -Math.random() * 48),
        isActive: status !== "maintenance",
      },
    });

    allRobots.push({ robot, location, robotModel });
    
    if ((i + 1) % 10 === 0) {
      console.log(`✅ Created ${i + 1}/100 robots`);
    }
  }

  console.log(`\n🤖 All 100 robots created!`);

  // ============================================================================
  // CREATE TIME-SERIES DATA FOR ALL ROBOTS
  // ============================================================================

  console.log('\n📊 Creating time-series telemetry data for all robots...');
  
  for (let robotIndex = 0; robotIndex < allRobots.length; robotIndex++) {
    const { robot, location, robotModel } = allRobots[robotIndex];
    const robotId = robot.id;
    
    // Create telemetry data - last 24 hours with varied intervals
    const telemetryRecords = [];
    const startTime = addHours(now, -24);
    const recordCount = 48 + Math.floor(Math.random() * 96); // 48-144 records per robot
    const interval = (24 * 60) / recordCount;
    
    for (let i = 0; i < recordCount; i++) {
      const timestamp = addMinutes(startTime, i * interval);
      const hour = timestamp.getHours();
      
      // Varied operational patterns based on robot index
      const isActiveHour = hour >= (6 + (robotIndex % 4)) && hour < (20 + (robotIndex % 5));
      const baseLoad = 30 + (robotIndex % 40);
      const baseBattery = 100 - ((hour - 6) * (3 + robotIndex % 5));
      
      let batteryPercentage = Math.max(20, Math.min(100, baseBattery + getVariedValue(0, 15)));
      let chargingStatus = !isActiveHour && batteryPercentage < 95;
      let cpuLoad = isActiveHour ? baseLoad + getVariedValue(20, 30) : baseLoad + getVariedValue(0, 15);
      let temperature = 38 + (cpuLoad / 10) + getVariedValue(0, 5);
      let speed = isActiveHour ? 0.3 + getVariedValue(0.3, 0.4) : 0;
      
      if (chargingStatus) {
        batteryPercentage = Math.min(100, batteryPercentage + 0.5);
        speed = 0;
      }
      
      const signalStrength = 75 + getVariedValue(10, 20);
      
      telemetryRecords.push({
        robotId: robotId,
        batteryPercentage: Math.round(batteryPercentage * 10) / 10,
        batteryVoltage: 48.0 + (batteryPercentage / 100) * 4.5,
        batteryCurrent: chargingStatus ? 4.5 + getVariedValue(0, 2) : -1.8 - getVariedValue(0, 1.5),
        batteryTemperatureC: 30 + (temperature - 35) * 0.4,
        chargingStatus,
        estimatedRuntimeMin: Math.round((batteryPercentage / 100) * (robotModel.batteryCapacity * 90)),
        cpuLoadPercentage: Math.round(cpuLoad * 10) / 10,
        memoryUsagePercentage: 35 + getVariedValue(10, 20),
        diskUsagePercentage: 25 + (robotIndex % 50),
        temperatureC: Math.round(temperature * 10) / 10,
        signalStrength: Math.round(signalStrength * 10) / 10,
        wifiStrength: signalStrength >= 90 ? "Excellent" : signalStrength >= 70 ? "Good" : "Fair",
        cellularStrength: signalStrength >= 85 ? "Excellent" : signalStrength >= 65 ? "Good" : "Fair",
        networkLatencyMs: Math.round(15 + getVariedValue(20, 40)),
        latitude: location.lat + (Math.sin(i / 50) * 0.002),
        longitude: location.lng + (Math.cos(i / 50) * 0.002),
        altitudeM: 5.0 + getVariedValue(5, 10),
        speedMps: chargingStatus ? 0 : speed,
        headingDegrees: (i * (2 + robotIndex % 5)) % 360,
        recordedAt: timestamp,
      });
    }
    
    await prisma.robotTelemetry.createMany({ data: telemetryRecords });
    
    // Create sensor data
    const sensorRecords = [];
    const sensorRecordCount = 24 + Math.floor(Math.random() * 48);
    const sensorInterval = (24 * 60) / sensorRecordCount;
    
    for (let i = 0; i < sensorRecordCount; i++) {
      const timestamp = addMinutes(startTime, i * sensorInterval);
      const hour = timestamp.getHours();
      const isActiveHour = hour >= 6 && hour < 21;
      
      const ambientTemp = 18 + getVariedValue(10, 15) + Math.sin((hour / 24) * Math.PI * 2) * 5;
      const humidity = 40 + getVariedValue(15, 20);
      const obstacleCount = isActiveHour ? Math.floor(Math.random() * 8) : 0;
      
      sensorRecords.push({
        robotId: robotId,
        imuRoll: Math.sin(i / 15) * (1 + robotIndex % 3),
        imuPitch: Math.cos(i / 20) * (1 + robotIndex % 3),
        imuYaw: (i * (2 + robotIndex % 3)) % 360,
        accelX: getVariedValue(0, 0.5),
        accelY: getVariedValue(0, 0.5),
        accelZ: 9.8 + getVariedValue(0, 0.3),
        gyroX: getVariedValue(0, 0.08),
        gyroY: getVariedValue(0, 0.08),
        gyroZ: getVariedValue(0, 0.08),
        lidarStatus: Math.random() > 0.05 ? "active" : "standby",
        lidarScanRateHz: 10 + Math.floor(robotIndex % 5),
        lidarDetectedObstacles: obstacleCount,
        lidarMinDistanceM: 1.0 + Math.random() * 4,
        lidarMaxRangeM: 25.0 + (robotIndex % 15),
        lidarPointsPerScan: 360,
        ambientTemperatureC: Math.round(ambientTemp * 10) / 10,
        humidityPercentage: Math.round(humidity * 10) / 10,
        airPressureHpa: 1010 + getVariedValue(5, 10),
        airQualityIndex: 40 + Math.floor(Math.random() * 40),
        ambientLightLux: hour >= 6 && hour < 20 ? 250 + Math.sin((hour - 6) / 14 * Math.PI) * 600 : 5 + Math.random() * 15,
        soundLevelDb: isActiveHour ? 50 + Math.random() * 30 : 35 + Math.random() * 15,
        ultrasonicFrontCm: 80 + Math.random() * 150,
        ultrasonicRearCm: 100 + Math.random() * 150,
        ultrasonicLeftCm: 90 + Math.random() * 150,
        ultrasonicRightCm: 95 + Math.random() * 150,
        recordedAt: timestamp,
      });
    }
    
    await prisma.robotSensor.createMany({ data: sensorRecords });
    
    if ((robotIndex + 1) % 10 === 0) {
      console.log(`✅ Created telemetry & sensor data for ${robotIndex + 1}/100 robots`);
    }
  }

  console.log('\n📷 Creating camera configurations...');
  
  // Create cameras for all robots
  const allCameras = [];
  for (const { robot } of allRobots) {
    const cameraCount = 2 + Math.floor(Math.random() * 3); // 2-4 cameras
    const positions = ["front", "rear", "left", "right"];
    const cameraTypes = ["RGB", "Thermal", "Depth"];
    
    for (let c = 0; c < cameraCount; c++) {
      allCameras.push({
        robotId: robot.id,
        cameraName: `${positions[c]} Camera`,
        cameraType: cameraTypes[Math.floor(Math.random() * cameraTypes.length)],
        cameraPosition: positions[c],
        status: Math.random() > 0.1 ? "active" : "standby",
        fps: [15, 30, 60][Math.floor(Math.random() * 3)],
        resolutionWidth: [1280, 1920, 3840][Math.floor(Math.random() * 3)],
        resolutionHeight: [720, 1080, 2160][Math.floor(Math.random() * 3)],
        exposureTimeMs: 33.3 + getVariedValue(0, 20),
        gain: 1.0 + getVariedValue(0.5, 1),
        whiteBalance: 5000 + Math.floor(Math.random() * 1500),
        framesCaptured: Math.floor(1000000 + Math.random() * 5000000),
        lastFrameAt: now,
      });
    }
  }
  
  await prisma.robotCamera.createMany({ data: allCameras });
  console.log(`✅ Created ${allCameras.length} cameras`);

  console.log('\n🦾 Creating joint data for all robots...');
  
  // Create joint data for all robots
  const joints = [
    { name: "Neck", type: "revolute", index: 0, maxTorque: 20, baseTemp: 40 },
    { name: "Shoulder_Left", type: "revolute", index: 1, maxTorque: 80, baseTemp: 45 },
    { name: "Shoulder_Right", type: "revolute", index: 2, maxTorque: 80, baseTemp: 45 },
    { name: "Elbow_Left", type: "revolute", index: 3, maxTorque: 60, baseTemp: 43 },
    { name: "Elbow_Right", type: "revolute", index: 4, maxTorque: 60, baseTemp: 43 },
    { name: "Wrist_Left", type: "revolute", index: 5, maxTorque: 40, baseTemp: 41 },
    { name: "Wrist_Right", type: "revolute", index: 6, maxTorque: 40, baseTemp: 41 },
    { name: "Hip", type: "revolute", index: 7, maxTorque: 120, baseTemp: 47 },
  ];

  const allJointRecords = [];
  
  for (let robotIndex = 0; robotIndex < allRobots.length; robotIndex++) {
    const { robot } = allRobots[robotIndex];
    const jointRecordCount = 12 + Math.floor(Math.random() * 24); // 12-36 records per joint
    const startTime = addHours(now, -24);
    const jointInterval = (24 * 60) / jointRecordCount;
    
    for (const joint of joints) {
      for (let i = 0; i < jointRecordCount; i++) {
        const timestamp = addMinutes(startTime, i * jointInterval);
        const hour = timestamp.getHours();
        const isActiveHour = hour >= 6 && hour < 21;
        
        const basePosition = Math.sin(i / 5) * (30 + robotIndex % 30);
        const velocity = isActiveHour ? 10 + getVariedValue(15, 20) : 3 + getVariedValue(5, 10);
        const loadFactor = isActiveHour ? 0.3 + getVariedValue(0.2, 0.4) : 0.1 + getVariedValue(0.1, 0.2);
        const tempIncrease = isActiveHour ? 2 + getVariedValue(3, 6) : getVariedValue(1, 3);
        
        allJointRecords.push({
          robotId: robot.id,
          jointName: joint.name,
          jointType: joint.type,
          jointIndex: joint.index,
          currentPositionDeg: Math.round(basePosition * 10) / 10,
          targetPositionDeg: Math.round((basePosition + getVariedValue(0, 10)) * 10) / 10,
          velocityDegPerSec: Math.round(velocity * 10) / 10,
          accelerationDegPerSec2: Math.round(getVariedValue(15, 20) * 10) / 10,
          currentTorqueNm: Math.round(joint.maxTorque * loadFactor * 10) / 10,
          maxTorqueNm: joint.maxTorque,
          loadPercentage: Math.round(loadFactor * 100 * 10) / 10,
          temperatureC: Math.round((joint.baseTemp + tempIncrease) * 10) / 10,
          status: "operational",
          errorCode: null,
          minPositionLimitDeg: -180,
          maxPositionLimitDeg: 180,
          recordedAt: timestamp,
        });
      }
    }
    
    if ((robotIndex + 1) % 10 === 0) {
      console.log(`✅ Created joint data for ${robotIndex + 1}/100 robots`);
    }
  }
  
  await prisma.robotJoint.createMany({ data: allJointRecords });
  console.log(`✅ Created ${allJointRecords.length} joint records total`);

  console.log('\n🚨 Creating alerts for all robots...');
  
  const allAlerts = [];
  const alertTypes = ["proximity_warning", "battery_low", "maintenance_due", "geofence", "temperature_high", "connection_lost"];
  const severities = ["info", "warning", "critical"];
  
  for (let robotIndex = 0; robotIndex < allRobots.length; robotIndex++) {
    const { robot } = allRobots[robotIndex];
    const alertCount = Math.floor(Math.random() * 5); // 0-4 alerts per robot
    
    for (let a = 0; a < alertCount; a++) {
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const isResolved = Math.random() > 0.3;
      const createdAt = addHours(now, -(Math.random() * 72));
      
      allAlerts.push({
        robotId: robot.id,
        alertType: alertType,
        severity: severity,
        title: `${alertType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        message: `Alert condition detected - ${alertType}`,
        errorCode: severity === "critical" ? `ERR_${alertType.toUpperCase()}` : null,
        isAcknowledged: isResolved || Math.random() > 0.5,
        acknowledgedAt: isResolved ? addMinutes(createdAt, 10) : null,
        acknowledgedBy: isResolved ? "Operator" : null,
        isResolved: isResolved,
        resolvedAt: isResolved ? addHours(createdAt, 1 + Math.random() * 3) : null,
        resolvedBy: isResolved ? "Auto" : null,
        resolutionNotes: isResolved ? "Issue resolved automatically" : null,
        createdAt: createdAt,
      });
    }
  }
  
  await prisma.robotAlert.createMany({ data: allAlerts });
  console.log(`✅ Created ${allAlerts.length} alerts`);

  console.log('\n🔧 Creating diagnostics for all robots...');
  
  const allDiagnostics = [];
  
  for (const { robot } of allRobots) {
    const diagCount = 3 + Math.floor(Math.random() * 5); // 3-7 diagnostic records
    
    for (let d = 0; d < diagCount; d++) {
      const timestamp = addDays(now, -(d * (7 + Math.floor(Math.random() * 7))));
      const healthScore = 85 + getVariedValue(8, 15);
      
      allDiagnostics.push({
        robotId: robot.id,
        overallHealthScore: Math.round(healthScore * 10) / 10,
        healthStatus: healthScore > 95 ? "excellent" : healthScore > 85 ? "good" : "fair",
        uptimeHours: 500 + Math.floor(Math.random() * 1000),
        uptimePercentage: 96 + getVariedValue(2, 4),
        totalRuntimeHours: 1000 + Math.floor(Math.random() * 2000),
        missionSuccessRate: 93 + getVariedValue(4, 7),
        errorCount24h: Math.floor(Math.random() * 5),
        warningCount24h: Math.floor(Math.random() * 10),
        storageTotalGb: 256,
        storageUsedGb: 50 + Math.floor(Math.random() * 150),
        storageAvailableGb: 56 + Math.floor(Math.random() * 150),
        packetsSent: Math.floor(1000000 + Math.random() * 2000000),
        packetsReceived: Math.floor(980000 + Math.random() * 1950000),
        bytesSent: Math.floor(400000000 + Math.random() * 300000000),
        bytesReceived: Math.floor(390000000 + Math.random() * 290000000),
        networkErrors: Math.floor(30 + Math.random() * 50),
        packetLossPercent: 0.1 + Math.random() * 0.3,
        networkLatencyMs: 20 + Math.floor(Math.random() * 30),
        uptimeSeconds: Math.floor((500 + Math.random() * 1000) * 3600),
        uploadRateMbps: 1.5 + Math.random() * 2,
        downloadRateMbps: 4.0 + Math.random() * 3,
        totalUploadedBytes: BigInt(Math.floor((300 + Math.random() * 500) * 1024 * 1024)),
        totalDownloadedBytes: BigInt(Math.floor((800 + Math.random() * 800) * 1024 * 1024)),
        recordedAt: timestamp,
      });
    }
  }
  
  await prisma.robotDiagnostic.createMany({ data: allDiagnostics });
  console.log(`✅ Created ${allDiagnostics.length} diagnostic records`);

  console.log('\n🔨 Creating maintenance schedules...');
  
  const allMaintenance = [];
  const maintenanceTypes = ["preventive", "corrective", "predictive"];
  
  for (const { robot } of allRobots) {
    const maintCount = 1 + Math.floor(Math.random() * 3); // 1-3 maintenance records
    
    for (let m = 0; m < maintCount; m++) {
      const mType = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];
      const isCompleted = Math.random() > 0.6;
      const scheduledDate = isCompleted ? addDays(now, -(10 + Math.random() * 50)) : addDays(now, 5 + Math.random() * 60);
      
      allMaintenance.push({
        robotId: robot.id,
        maintenanceType: mType,
        title: `${mType.charAt(0).toUpperCase() + mType.slice(1)} Maintenance`,
        description: `Scheduled ${mType} maintenance procedure`,
        scheduledDate: scheduledDate,
        estimatedDurationHours: 1 + Math.random() * 4,
        priority: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
        status: isCompleted ? "completed" : "scheduled",
        startedAt: isCompleted ? scheduledDate : null,
        completedAt: isCompleted ? addHours(scheduledDate, 2 + Math.random() * 3) : null,
        performedBy: isCompleted ? `Technician ${Math.floor(Math.random() * 20) + 1}` : null,
        actualDurationHours: isCompleted ? 1.5 + Math.random() * 3 : null,
        partsReplaced: isCompleted && Math.random() > 0.5 ? "Various components" : "None",
        totalCost: isCompleted ? 100 + Math.random() * 500 : null,
        notes: isCompleted ? "Maintenance completed successfully" : null,
      });
    }
  }
  
  await prisma.maintenanceSchedule.createMany({ data: allMaintenance });
  console.log(`✅ Created ${allMaintenance.length} maintenance records`);

  console.log('\n📶 Creating network handoffs...');
  
  const allHandoffs = [];
  const networks = ["WiFi-5GHz", "WiFi-2.4GHz", "Cellular-5G", "Cellular-4G", "Ethernet"];
  
  for (const { robot } of allRobots) {
    const handoffCount = Math.floor(Math.random() * 8); // 0-7 handoffs
    
    for (let h = 0; h < handoffCount; h++) {
      const fromNet = networks[Math.floor(Math.random() * networks.length)];
      let toNet = networks[Math.floor(Math.random() * networks.length)];
      while (toNet === fromNet) {
        toNet = networks[Math.floor(Math.random() * networks.length)];
      }
      
      allHandoffs.push({
        robotId: robot.id,
        fromNetwork: fromNet,
        toNetwork: toNet,
        reason: "Network optimization",
        durationMs: Math.floor(50 + Math.random() * 200),
        occurredAt: addHours(now, -(Math.random() * 48)),
      });
    }
  }
  
  await prisma.networkHandoff.createMany({ data: allHandoffs });
  console.log(`✅ Created ${allHandoffs.length} network handoff records`);

  console.log('\n🔋 Creating battery health history...');
  
  const allBatteryHealth = [];
  
  for (const { robot } of allRobots) {
    const months = 6 + Math.floor(Math.random() * 7); // 6-12 months of data
    
    for (let m = 0; m < months; m++) {
      const healthPercentage = 100 - (months - m) * (0.3 + Math.random() * 0.4);
      const cycleCount = 100 + (months - m) * (5 + Math.floor(Math.random() * 8));
      
      allBatteryHealth.push({
        robotId: robot.id,
        healthPercentage: Math.round(healthPercentage * 10) / 10,
        cycleCount: cycleCount,
        capacityMah: Math.floor(5000 - (months - m) * (10 + Math.random() * 20)),
        recordedAt: addDays(now, -m * 30),
      });
    }
  }
  
  await prisma.batteryHealthHistory.createMany({ data: allBatteryHealth });
  console.log(`✅ Created ${allBatteryHealth.length} battery health records`);

  console.log('\n⚡ Creating charge history...');
  
  const allChargeHistory = [];
  
  for (const { robot } of allRobots) {
    const charges = 10 + Math.floor(Math.random() * 25); // 10-34 charge cycles
    
    for (let c = 0; c < charges; c++) {
      allChargeHistory.push({
        robotId: robot.id,
        cycleNumber: 150 + c,
        chargeLevel: 92 + Math.random() * 8,
        durationMinutes: 70 + Math.floor(Math.random() * 40),
        temperatureC: 35 + Math.random() * 10,
        chargedAt: addHours(now, -c * (20 + Math.random() * 10)),
      });
    }
  }
  
  await prisma.chargeHistory.createMany({ data: allChargeHistory });
  console.log(`✅ Created ${allChargeHistory.length} charge history records`);

  console.log('\n⚙️  Creating component health data...');
  
  const allComponentHealth = [];
  const components = [
    "Drive Motors", "Battery Pack", "LiDAR Sensor", "IMU Module",
    "Camera System", "Control Board", "Joint Actuators", "Power Supply"
  ];
  
  for (const { robot } of allRobots) {
    const compCount = 4 + Math.floor(Math.random() * 5); // 4-8 components
    
    for (let c = 0; c < compCount; c++) {
      const healthPercent = 70 + Math.random() * 30;
      const status = healthPercent > 90 ? "excellent" : healthPercent > 75 ? "good" : "fair";
      
      allComponentHealth.push({
        robotId: robot.id,
        componentName: components[c],
        healthPercentage: Math.round(healthPercent * 10) / 10,
        status: status,
        hoursRemaining: Math.floor(500 + Math.random() * 3000),
        lastReplacedAt: Math.random() > 0.5 ? addDays(now, -(30 + Math.random() * 300)) : null,
      });
    }
  }
  
  await prisma.componentHealth.createMany({ data: allComponentHealth });
  console.log(`✅ Created ${allComponentHealth.length} component health records`);

  console.log('\n🔮 Creating predictive alerts...');
  
  const allPredictiveAlerts = [];
  
  for (const { robot } of allRobots) {
    if (Math.random() > 0.4) { // 60% of robots have predictive alerts
      const alertCount = 1 + Math.floor(Math.random() * 3);
      
      for (let p = 0; p < alertCount; p++) {
        const component = components[Math.floor(Math.random() * components.length)];
        const severity = ["info", "warning", "critical"][Math.floor(Math.random() * 3)];
        
        allPredictiveAlerts.push({
          robotId: robot.id,
          componentName: component,
          prediction: `Potential ${component} degradation detected`,
          severity: severity,
          confidencePercent: 60 + Math.floor(Math.random() * 35),
          estimatedDays: 15 + Math.floor(Math.random() * 120),
          recommendedAction: `Schedule ${component} inspection`,
          isAcknowledged: Math.random() > 0.5,
          acknowledgedAt: Math.random() > 0.5 ? addDays(now, -Math.random() * 5) : null,
        });
      }
    }
  }
  
  await prisma.predictiveAlert.createMany({ data: allPredictiveAlerts });
  console.log(`✅ Created ${allPredictiveAlerts.length} predictive alerts`);

  console.log('\n⚙️  Creating robot configurations...');
  
  const allConfigs = [];
  const configTemplates = [
    { key: "max_speed", value: "1.5", type: "float", category: "motion", description: "Maximum movement speed in meters per second" },
    { key: "patrol_mode", value: "autonomous", type: "string", category: "operation", description: "Default operational mode" },
    { key: "battery_low_threshold", value: "25", type: "integer", category: "power", description: "Battery low alert threshold" },
    { key: "obstacle_detection_sensitivity", value: "high", type: "string", category: "safety", description: "Obstacle detection sensitivity" },
  ];
  
  for (const { robot } of allRobots) {
    for (const template of configTemplates) {
      let value = template.value;
      if (template.type === "float") value = String(1.0 + Math.random() * 1.5);
      if (template.type === "integer") value = String(20 + Math.floor(Math.random() * 20));
      
      allConfigs.push({
        robotId: robot.id,
        configKey: template.key,
        configValue: value,
        configType: template.type,
        category: template.category,
        description: template.description,
        isEditable: true,
        requiresRestart: Math.random() > 0.7,
      });
    }
  }
  
  await prisma.robotConfiguration.createMany({ data: allConfigs });
  console.log(`✅ Created ${allConfigs.length} configuration entries`);

  console.log('\n📋 Creating robot tasks...');
  
  const allTasks = [];
  const taskTypesList = [
    { name: "Warehouse Patrol", type: "navigation", duration: 45 },
    { name: "Inventory Scanning", type: "inspection", duration: 60 },
    { name: "Package Delivery", type: "delivery", duration: 30 },
    { name: "Floor Cleaning", type: "maintenance", duration: 90 },
    { name: "Security Monitoring", type: "navigation", duration: 120 },
    { name: "Material Transport", type: "delivery", duration: 25 },
    { name: "Quality Inspection", type: "inspection", duration: 40 },
    { name: "Battery Charging", type: "charging", duration: 180 },
  ];
  
  const priorities = ["low", "medium", "high", "critical"];
  const statuses = ["pending", "in_progress", "completed", "failed"];
  
  for (const { robot } of allRobots) {
    const numTasks = 3 + Math.floor(Math.random() * 5); // 3-7 tasks per robot
    
    for (let i = 0; i < numTasks; i++) {
      const taskTemplate = taskTypesList[Math.floor(Math.random() * taskTypesList.length)];
      const status = i === 0 ? "in_progress" : 
                     i === 1 ? "pending" : 
                     statuses[Math.floor(Math.random() * statuses.length)];
      
      const now = new Date();
      const createdAt = new Date(now.getTime() - (numTasks - i) * 3600000); // Stagger creation times
      const scheduledStart = new Date(createdAt.getTime() + (i * 3600000)); // Hour intervals
      const actualStart = status === "in_progress" || status === "completed" || status === "failed" 
        ? new Date(scheduledStart.getTime() + Math.random() * 600000) // Within 10 min of schedule
        : null;
      const estimatedEnd = actualStart 
        ? new Date(actualStart.getTime() + taskTemplate.duration * 60000)
        : null;
      const actualEnd = status === "completed" || status === "failed"
        ? new Date(actualStart!.getTime() + (taskTemplate.duration + (Math.random() * 20 - 10)) * 60000)
        : null;
      
      const progress = status === "completed" ? 100 :
                       status === "failed" ? Math.floor(Math.random() * 80) :
                       status === "in_progress" ? Math.floor(Math.random() * 90) + 10 :
                       0;
      
      const result = status === "completed" ? "success" :
                     status === "failed" ? "failed" :
                     null;
      
      const failureReason = status === "failed" 
        ? ["Obstacle detected", "Battery low", "Sensor malfunction", "Communication loss", "Task timeout"][Math.floor(Math.random() * 5)]
        : null;
      
      allTasks.push({
        robotId: robot.id,
        taskName: taskTemplate.name,
        taskType: taskTemplate.type,
        description: `${taskTemplate.name} task assigned to ${robot.name}`,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status,
        progress,
        scheduledStartAt: scheduledStart,
        actualStartAt: actualStart,
        estimatedEndAt: estimatedEnd,
        actualEndAt: actualEnd,
        sourceLocation: robot.location,
        targetLocation: `Zone ${String.fromCharCode(65 + Math.floor(Math.random() * 6))}-${Math.floor(Math.random() * 20) + 1}`,
        payload: JSON.stringify({ 
          taskId: `TASK-${Date.now()}-${i}`,
          parameters: { speed: 1.2, accuracy: "high" }
        }),
        result,
        failureReason,
        outputData: status === "completed" 
          ? JSON.stringify({ itemsProcessed: Math.floor(Math.random() * 100), duration: taskTemplate.duration })
          : null,
        assignedBy: "System",
        createdAt,
        updatedAt: actualEnd || actualStart || createdAt,
      });
    }
  }
  
  await prisma.robotTask.createMany({ data: allTasks });
  console.log(`✅ Created ${allTasks.length} robot tasks`);

  console.log('\n🎉 Database seeding completed successfully!')
  console.log('📊 Summary:')
  console.log(`   - ${allRobots.length} Robots (60+ from India, rest from global locations)`)
  console.log(`   - Varied telemetry & sensor data for each robot`)
  console.log(`   - ${allCameras.length} Cameras`)
  console.log(`   - ${allJointRecords.length} Joint records`)
  console.log(`   - ${allAlerts.length} Alerts`)
  console.log(`   - ${allDiagnostics.length} Diagnostic records`)
  console.log(`   - ${allMaintenance.length} Maintenance schedules`)
  console.log(`   - ${allHandoffs.length} Network handoffs`)
  console.log(`   - ${allBatteryHealth.length} Battery health records`)
  console.log(`   - ${allChargeHistory.length} Charge history records`)
  console.log(`   - ${allComponentHealth.length} Component health records`)
  console.log(`   - ${allPredictiveAlerts.length} Predictive alerts`)
  console.log(`   - ${allConfigs.length} Configuration entries`)
  console.log(`   - ${allTasks.length} Robot tasks`)
}
main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    // process.exit(1) // Removed to avoid type errors in some environments
  })
  .finally(async () => {
    await prisma.$disconnect()
  })