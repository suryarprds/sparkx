import { describe, it, expect } from 'vitest';
import { ROBOT_CONFIG } from '@/types/robot';

describe('Robot Configuration', () => {
  describe('Battery thresholds', () => {
    it('has correct battery threshold values', () => {
      expect(ROBOT_CONFIG.battery.critical).toBe(20);
      expect(ROBOT_CONFIG.battery.low).toBe(40);
      expect(ROBOT_CONFIG.battery.medium).toBe(70);
      expect(ROBOT_CONFIG.battery.high).toBe(90);
    });

    it('has ascending battery threshold order', () => {
      expect(ROBOT_CONFIG.battery.critical).toBeLessThan(ROBOT_CONFIG.battery.low);
      expect(ROBOT_CONFIG.battery.low).toBeLessThan(ROBOT_CONFIG.battery.medium);
      expect(ROBOT_CONFIG.battery.medium).toBeLessThan(ROBOT_CONFIG.battery.high);
    });
  });

  describe('Temperature thresholds', () => {
    it('has correct temperature threshold values', () => {
      expect(ROBOT_CONFIG.temperature.normal).toBe(45);
      expect(ROBOT_CONFIG.temperature.warning).toBe(60);
      expect(ROBOT_CONFIG.temperature.critical).toBe(75);
    });

    it('has ascending temperature threshold order', () => {
      expect(ROBOT_CONFIG.temperature.normal).toBeLessThan(ROBOT_CONFIG.temperature.warning);
      expect(ROBOT_CONFIG.temperature.warning).toBeLessThan(ROBOT_CONFIG.temperature.critical);
    });
  });

  describe('Signal thresholds', () => {
    it('has correct signal threshold values', () => {
      expect(ROBOT_CONFIG.signal.poor).toBe(30);
      expect(ROBOT_CONFIG.signal.fair).toBe(60);
      expect(ROBOT_CONFIG.signal.good).toBe(80);
    });

    it('has ascending signal threshold order', () => {
      expect(ROBOT_CONFIG.signal.poor).toBeLessThan(ROBOT_CONFIG.signal.fair);
      expect(ROBOT_CONFIG.signal.fair).toBeLessThan(ROBOT_CONFIG.signal.good);
    });
  });

  describe('Uptime configuration', () => {
    it('has reasonable uptime target', () => {
      expect(ROBOT_CONFIG.uptime.target).toBe(99.5);
      expect(ROBOT_CONFIG.uptime.target).toBeGreaterThan(0);
      expect(ROBOT_CONFIG.uptime.target).toBeLessThanOrEqual(100);
    });
  });

  describe('Simulation ranges', () => {
    it('has valid battery simulation range', () => {
      expect(ROBOT_CONFIG.simulation.battery.min).toBe(15);
      expect(ROBOT_CONFIG.simulation.battery.max).toBe(100);
      expect(ROBOT_CONFIG.simulation.battery.min).toBeLessThan(ROBOT_CONFIG.simulation.battery.max);
    });

    it('has valid CPU simulation range', () => {
      expect(ROBOT_CONFIG.simulation.cpu.min).toBe(10);
      expect(ROBOT_CONFIG.simulation.cpu.max).toBe(95);
      expect(ROBOT_CONFIG.simulation.cpu.min).toBeLessThan(ROBOT_CONFIG.simulation.cpu.max);
    });

    it('has valid temperature simulation range', () => {
      expect(ROBOT_CONFIG.simulation.temperature.min).toBe(35);
      expect(ROBOT_CONFIG.simulation.temperature.max).toBe(85);
      expect(ROBOT_CONFIG.simulation.temperature.min).toBeLessThan(ROBOT_CONFIG.simulation.temperature.max);
    });
  });
});
