import { describe, it, expect } from 'vitest';
import { getRobotMetrics, getStatusDistribution, getBatteryDistribution } from '@/utils/robotUtils';
import type { Robot } from '@/types/robot';

describe('Robot Utils', () => {
  const mockRobots: Robot[] = [
    {
      id: 'ROBOT-001',
      name: 'Robot 1',
      status: 'online',
      battery: 85,
      signal: 90,
      temperature: 42,
      location: 'Warehouse A',
      country: 'USA',
      state: 'California',
      region: 'West',
      lastUpdated: new Date(),
      cpuLoad: 45,
      gpsCoordinates: { lat: 37.7749, lng: -122.4194 },
      connectivity: { wifi: 'Good', cellular: 'Excellent' },
    },
    {
      id: 'ROBOT-002',
      name: 'Robot 2',
      status: 'offline',
      battery: 15,
      signal: 30,
      temperature: 65,
      location: 'Warehouse B',
      country: 'USA',
      state: 'Texas',
      region: 'South',
      lastUpdated: new Date(),
      cpuLoad: 10,
      gpsCoordinates: { lat: 29.7604, lng: -95.3698 },
      connectivity: { wifi: 'Poor', cellular: 'Fair' },
    },
    {
      id: 'ROBOT-003',
      name: 'Robot 3',
      status: 'charging',
      battery: 55,
      signal: 75,
      temperature: 38,
      location: 'Warehouse C',
      country: 'Germany',
      state: 'Bavaria',
      region: 'Europe',
      lastUpdated: new Date(),
      cpuLoad: 25,
      gpsCoordinates: { lat: 48.1351, lng: 11.5820 },
      connectivity: { wifi: 'Excellent', cellular: 'Good' },
    },
  ];

  describe('getRobotMetrics', () => {
    it('calculates correct total robots', () => {
      const metrics = getRobotMetrics(mockRobots);
      expect(metrics.totalRobots).toBe(3);
    });

    it('calculates correct active robots', () => {
      const metrics = getRobotMetrics(mockRobots);
      expect(metrics.activeRobots).toBe(2); // online + charging
    });

    it('calculates correct average battery level (rounded)', () => {
      const metrics = getRobotMetrics(mockRobots);
      expect(metrics.averageBattery).toBe(52); // Math.round((85 + 15 + 55) / 3)
    });

    it('calculates correct average temperature (rounded)', () => {
      const metrics = getRobotMetrics(mockRobots);
      expect(metrics.averageTemperature).toBe(48); // Math.round((42 + 65 + 38) / 3)
    });

    it('calculates correct average signal strength (rounded)', () => {
      const metrics = getRobotMetrics(mockRobots);
      expect(metrics.averageSignal).toBe(65); // Math.round((90 + 30 + 75) / 3)
    });

    it('calculates correct fleet health percentage', () => {
      const metrics = getRobotMetrics(mockRobots);
      expect(metrics.fleetHealth).toBe(67); // Math.round((2 / 3) * 100)
    });

    it('calculates correct status counts', () => {
      const metrics = getRobotMetrics(mockRobots);
      expect(metrics.statusCounts.online).toBe(1);
      expect(metrics.statusCounts.charging).toBe(1);
      expect(metrics.statusCounts.offline).toBe(1);
      expect(metrics.statusCounts.error).toBe(0);
    });

    it('handles empty array', () => {
      const metrics = getRobotMetrics([]);
      expect(metrics.totalRobots).toBe(0);
      expect(metrics.averageBattery).toBe(0);
      expect(metrics.fleetHealth).toBe(0);
    });
  });

  describe('getStatusDistribution', () => {
    it('correctly counts robots by status', () => {
      const distribution = getStatusDistribution(mockRobots);
      expect(distribution).toHaveLength(3); // online, offline, charging
      
      const online = distribution.find(d => d.name === 'Online');
      const offline = distribution.find(d => d.name === 'Offline');
      const charging = distribution.find(d => d.name === 'Charging');
      
      expect(online?.value).toBe(1);
      expect(offline?.value).toBe(1);
      expect(charging?.value).toBe(1);
    });

    it('includes color codes for statuses', () => {
      const distribution = getStatusDistribution(mockRobots);
      distribution.forEach(status => {
        expect(status).toHaveProperty('fill');
        expect(status.fill).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('handles empty array', () => {
      const distribution = getStatusDistribution([]);
      expect(distribution).toHaveLength(0);
    });
  });

  describe('getBatteryDistribution', () => {
    it('correctly categorizes battery levels', () => {
      const distribution = getBatteryDistribution(mockRobots);
      expect(distribution.length).toBeGreaterThan(0);
      
      const critical = distribution.find(d => d.name === 'Critical (0-20%)');
      const good = distribution.find(d => d.name === 'Good (71-90%)');
      
      expect(critical?.value).toBe(1);  // 15%
      expect(good?.value).toBe(1);      // 85%
    });

    it('includes all battery range categories', () => {
      const distribution = getBatteryDistribution(mockRobots);
      const categories = distribution.map(d => d.name);
      
      expect(categories).toContain('Critical (0-20%)');
      expect(categories).toContain('Low (21-40%)');
      expect(categories).toContain('Medium (41-70%)');
      expect(categories).toContain('Good (71-90%)');
      expect(categories).toContain('Excellent (91-100%)');
    });

    it('includes color codes for each category', () => {
      const distribution = getBatteryDistribution(mockRobots);
      distribution.forEach(category => {
        expect(category).toHaveProperty('fill');
        expect(category.fill).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('handles empty array', () => {
      const distribution = getBatteryDistribution([]);
      const totalRobots = distribution.reduce((sum, d) => sum + d.value, 0);
      expect(totalRobots).toBe(0);
    });
  });
});
