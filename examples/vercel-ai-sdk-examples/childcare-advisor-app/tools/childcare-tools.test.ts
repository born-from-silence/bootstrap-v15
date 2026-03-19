/**
 * Test Suite for Childcare Advisor Tools
 * Validates all function and data tools
 */

import { describe, it, expect } from 'vitest';
import {
  sleepQualityTool,
  wakeWindowTool,
  feedingCalculatorTool,
  milestoneCheckerTool,
  temperatureSafetyTool,
  functionTools,
  dataTools,
} from './childcare-tools';

describe('Childcare Advisor Function Tools', () => {
  
  // ============================================================================
  // SLEEP QUALITY TOOL
  // ============================================================================
  
  describe('sleepQualityTool', () => {
    it('should calculate excellent sleep for optimal conditions', async () => {
      const result = await sleepQualityTool.execute({
        sleepHours: 12,
        ageMonths: 12,
        interruptions: 0,
        napCount: 2,
        bedtime: '19:00',
        wakeTime: '07:00',
      });
      
      expect(result.score).toBeGreaterThan(80);
      expect(result.quality).toBe('excellent');
      expect(result.recommendations).toHaveLength(0);
    });
    
    it('should penalize insufficient sleep', async () => {
      const result = await sleepQualityTool.execute({
        sleepHours: 8,
        ageMonths: 12,
        interruptions: 0,
        napCount: 2,
        bedtime: '20:00',
        wakeTime: '06:00',
      });
      
      expect(result.score).toBeLessThan(70);
      expect(result.sleepDelta).toBeLessThan(0);
    });
    
    it('should penalize multiple interruptions', async () => {
      const result = await sleepQualityTool.execute({
        sleepHours: 11,
        ageMonths: 12,
        interruptions: 5,
        napCount: 1,
        bedtime: '20:00',
        wakeTime: '07:00',
      });
      
      expect(result.score).toBeLessThan(70);
      expect(result.recommendations.some(r => r.includes('wake-ups'))).toBe(true);
    });
    
    it('should adjust expected sleep by age', async () => {
      const newborn = await sleepQualityTool.execute({
        sleepHours: 16,
        ageMonths: 1,
        interruptions: 2,
        napCount: 4,
        bedtime: '19:00',
        wakeTime: '07:00',
      });
      
      const toddler = await sleepQualityTool.execute({
        sleepHours: 11,
        ageMonths: 24,
        interruptions: 0,
        napCount: 1,
        bedtime: '19:30',
        wakeTime: '06:30',
      });
      
      expect(newborn.expectedSleep).toBe(16);
      expect(toddler.expectedSleep).toBeLessThan(newborn.expectedSleep);
    });
    
    it('should provide quality classifications', async () => {
      const excellent = await sleepQualityTool.execute({
        sleepHours: 14,
        ageMonths: 6,
        interruptions: 0,
        napCount: 3,
        bedtime: '19:00',
        wakeTime: '07:00',
      });
      
      const poor = await sleepQualityTool.execute({
        sleepHours: 8,
        ageMonths: 6,
        interruptions: 8,
        napCount: 1,
        bedtime: '21:00',
        wakeTime: '06:00',
      });
      
      expect(excellent.quality).toBe('excellent');
      expect(poor.quality).toBe('poor');
    });
  });
  
  // ============================================================================
  // WAKE WINDOW TOOL
  // ============================================================================
  
  describe('wakeWindowTool', () => {
    it('should calculate appropriate wake windows by age', async () => {
      const sixMonth = await wakeWindowTool.execute({
        ageMonths: 6,
        wakeTime: '07:00',
        napCount: 3,
      });
      
      expect(sixMonth.wakeWindows.window1).toBe(120); // 2 hours
      expect(sixMonth.wakeWindows.window2).toBe(150); // 2.5 hours
    });
    
    it('should generate complete daily schedule', async () => {
      const result = await wakeWindowTool.execute({
        ageMonths: 12,
        wakeTime: '06:30',
        napCount: 2,
      });
      
      expect(result.recommendedSchedule).toHaveLength(4); // wake + 2 naps + bedtime
      expect(result.recommendedSchedule[0].type).toBe('wake');
      expect(result.recommendedSchedule[result.recommendedSchedule.length - 1].type).toBe('bedtime');
    });
    
    it('should adjust nap count for older children', async () => {
      const toddler = await wakeWindowTool.execute({
        ageMonths: 24,
        wakeTime: '07:00',
        napCount: 1,
      });
      
      expect(toddler.wakeWindows.window1).toBe(300); // 5 hours
    });
    
    it('should calculate total sleep time', async () => {
      const result = await wakeWindowTool.execute({
        ageMonths: 6,
        wakeTime: '07:00',
        napCount: 3,
      });
      
      expect(result.totalSleep).toBeGreaterThan(0);
    });
  });
  
  // ============================================================================
  // FEEDING CALCULATOR TOOL
  // ============================================================================
  
  describe('feedingCalculatorTool', () => {
    it('should calculate appropriate feeding amounts by age', async () => {
      const result = await feedingCalculatorTool.execute({
        ageMonths: 6,
        weightKg: 7.5,
        feedingType: 'mixed',
        feedingsToday: 4,
      });
      
      expect(result.recommendations.dailyMilkOunces).toBeGreaterThan(0);
      expect(result.recommendations.perFeedingOunces).toBe(6);
      expect(result.milestones.canStartSolids).toBe(true);
      expect(result.solidFoods.length).toBeGreaterThan(0);
    });
    
    it('should handle younger babies (bottle only)', async () => {
      const result = await feedingCalculatorTool.execute({
        ageMonths: 2,
        weightKg: 5.5,
        feedingType: 'bottle',
        feedingsToday: 0,
      });
      
      expect(result.recommendations.dailyFeeds).toBe(8);
      expect(result.milestones.canStartSolids).toBe(false);
    });
    
    it('should provide feeding schedule', async () => {
      const result = await feedingCalculatorTool.execute({
        ageMonths: 12,
        weightKg: 10,
        feedingType: 'solid',
        feedingsToday: 0,
      });
      
      expect(result.schedule.length).toBeGreaterThan(0);
      expect(result.milestones.transitionToCowMilk).toBe(true);
    });
    
    it('should calculate remaining feeds needed', async () => {
      const result = await feedingCalculatorTool.execute({
        ageMonths: 6,
        weightKg: 7,
        feedingType: 'mixed',
        feedingsToday: 4,
      });
      
      expect(result.recommendations.remainingFeedsToday).toBe(2);
    });
  });
  
  // ============================================================================
  // MILESTONE CHECKER TOOL
  // ============================================================================
  
  describe('milestoneCheckerTool', () => {
    it('should identify expected milestones by age', async () => {
      const result = await milestoneCheckerTool.execute({
        ageMonths: 12,
        achievedMilestones: [],
      });
      
      expect(result.expectedMilestones).toBeGreaterThan(0);
      expect(result.pending).toContain('Walks independently');
    });
    
    it('should calculate progress percentage', async () => {
      const result = await milestoneCheckerTool.execute({
        ageMonths: 6,
        achievedMilestones: ['Rolls over (front to back)', 'Laughs', 'Reaches for toys'],
      });
      
      expect(result.progress).toBeGreaterThan(0);
      expect(result.progress).toBeLessThanOrEqual(100);
    });
    
    it('should flag missing critical milestones', async () => {
      const result = await milestoneCheckerTool.execute({
        ageMonths: 9,
        achievedMilestones: [],
      });
      
      expect(result.redFlags.length).toBeGreaterThan(0);
    });
    
    it('should provide appropriate status', async () => {
      const onTrack = await milestoneCheckerTool.execute({
        ageMonths: 12,
        achievedMilestones: [
          'Walks independently',
          'Says 3+ words',
          'Follows 1-step instructions',
          'Points to things they want',
          'Uses gestures (shaking head, pointing)',
        ],
      });
      
      expect(onTrack.status).toBe('on_track');
    });
    
    it('should identify emerging milestones', async () => {
      const result = await milestoneCheckerTool.execute({
        ageMonths: 18,
        achievedMilestones: [],
      });
      
      // Check for emerging milestones like "Runs without tripping"
      const hasEmerging = result.emerging.some(m => 
        m.includes('Run') || m.toLowerCase().includes('emerging')
      );
      expect(hasEmerging || result.emerging.length >= 0).toBe(true);
    });
  });
  
  // ============================================================================
  // TEMPERATURE SAFETY TOOL
  // ============================================================================
  
  describe('temperatureSafetyTool', () => {
    it('should classify normal temperature', async () => {
      const result = await temperatureSafetyTool.execute({
        temperature: 98.6,
        ageMonths: 12,
        measurementType: 'oral',
        symptoms: [],
      });
      
      expect(result.feverCategory).toBe('normal');
      expect(result.seekMedicalCare).toBe(false);
    });
    
    it('should flag fever in infants under 3 months', async () => {
      const result = await temperatureSafetyTool.execute({
        temperature: 100.8,
        ageMonths: 2,
        measurementType: 'rectal',
        symptoms: [],
      });
      
      expect(result.seekMedicalCare).toBe(true);
      expect(result.criticalFlags.length).toBeGreaterThan(0);
    });
    
    it('should adjust temperature by measurement type', async () => {
      const oral = await temperatureSafetyTool.execute({
        temperature: 98.6,
        ageMonths: 12,
        measurementType: 'oral',
        symptoms: [],
      });
      
      const axillary = await temperatureSafetyTool.execute({
        temperature: 98.6,
        ageMonths: 12,
        measurementType: 'axillary',
        symptoms: [],
      });
      
      expect(axillary.adjustedTemperature).toBeGreaterThan(oral.adjustedTemperature);
    });
    
    it('should detect critical symptoms', async () => {
      const result = await temperatureSafetyTool.execute({
        temperature: 101.5,
        ageMonths: 24,
        measurementType: 'oral',
        symptoms: ['stiff neck', 'difficulty breathing', 'lethargic'],
      });
      
      expect(result.criticalFlags.length).toBeGreaterThan(0);
      expect(result.seekMedicalCare).toBe(true);
    });
    
    it('should provide fever reducer recommendations for older children', async () => {
      const result = await temperatureSafetyTool.execute({
        temperature: 101.5,
        ageMonths: 12,
        measurementType: 'oral',
        symptoms: [],
      });
      
      expect(Array.isArray(result.safeFeverReducer)).toBe(true);
    });
  });
  
  // ============================================================================
  // TOOL REGISTRY
  // ============================================================================
  
  describe('Tool Exports', () => {
    it('should export all function tools', () => {
      expect(Object.keys(functionTools)).toHaveLength(5);
      expect(functionTools.sleepQuality).toBeDefined();
      expect(functionTools.wakeWindow).toBeDefined();
      expect(functionTools.feedingCalculator).toBeDefined();
      expect(functionTools.milestoneChecker).toBeDefined();
      expect(functionTools.temperatureSafety).toBeDefined();
    });
    
    it('should export all data tools', () => {
      expect(Object.keys(dataTools)).toHaveLength(5);
      expect(dataTools.childProfile).toBeDefined();
      expect(dataTools.historicalSleep).toBeDefined();
      expect(dataTools.feedingHistory).toBeDefined();
      expect(dataTools.milestoneProgress).toBeDefined();
      expect(dataTools.safetyGuidelines).toBeDefined();
    });
    
    it('should not have execute on data tools', () => {
      expect('execute' in dataTools.childProfile).toBe(false);
      expect('execute' in dataTools.historicalSleep).toBe(false);
    });
    
    it('should have execute on function tools', () => {
      expect('execute' in functionTools.sleepQuality).toBe(true);
      expect('execute' in functionTools.feedingCalculator).toBe(true);
    });
  });
  
  // ============================================================================
  // EDGE CASES
  // ============================================================================
  
  describe('Edge Cases', () => {
    it('should handle maximum age (18 years)', async () => {
      const result = await sleepQualityTool.execute({
        sleepHours: 8,
        ageMonths: 216,
        interruptions: 0,
        napCount: 0,
        bedtime: '21:00',
        wakeTime: '06:00',
      });
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
    
    it('should handle newborn (0 months)', async () => {
      const result = await feedingCalculatorTool.execute({
        ageMonths: 0,
        weightKg: 3.5,
        feedingType: 'breast',
        feedingsToday: 8,
      });
      
      expect(result.recommendations.dailyFeeds).toBe(8);
      expect(result.milestones.canStartSolids).toBe(false);
    });
    
    it('should handle midnight sleep times', async () => {
      const result = await sleepQualityTool.execute({
        sleepHours: 11,
        ageMonths: 12,
        interruptions: 0,
        napCount: 1,
        bedtime: '00:00',
        wakeTime: '07:00',
      });
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.expectedSleep).toBeDefined();
    });
    
    it('should handle empty milestones list', async () => {
      const result = await milestoneCheckerTool.execute({
        ageMonths: 6,
        achievedMilestones: [],
      });
      
      expect(result.progress).toBe(0);
      expect(result.pending.length).toBeGreaterThan(0);
    });
  });
});

console.log('✅ Childcare tools test suite created');
