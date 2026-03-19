/**
 * Tests for Tool Schemas Example
 * Validates function tools execute correctly
 */

import { describe, it, expect } from 'vitest';
import {
  temperatureTool,
  validatorTool,
  dateTimeTool,
  jsonParserTool,
  functionTools,
  dataTools,
} from './tool-schemas-example';

describe('Function Tools', () => {
  describe('temperatureTool', () => {
    it('converts Celsius to Fahrenheit', async () => {
      const result = await temperatureTool.execute({
        value: 0,
        from: 'celsius',
        to: 'fahrenheit',
      });
      
      expect(result.converted.value).toBe(32);
      expect(result.converted.unit).toBe('fahrenheit');
    });
    
    it('provides conversion formula', async () => {
      const result = await temperatureTool.execute({
        value: 25,
        from: 'celsius',
        to: 'fahrenheit',
      });
      
      expect(result.formula).toBe('(C × 9/5) + 32');
    });
  });
  
  describe('validatorTool', () => {
    it('validates email addresses', async () => {
      const result = await validatorTool.execute({
        type: 'email',
        value: 'test@example.com',
      });
      
      expect(result.isValid).toBe(true);
    });
    
    it('rejects invalid emails', async () => {
      const result = await validatorTool.execute({
        type: 'email',
        value: 'invalid-email',
      });
      
      expect(result.isValid).toBe(false);
    });
  });
  
  describe('dateTimeTool', () => {
    it('returns current time', async () => {
      const result = await dateTimeTool.execute({
        operation: 'now',
      });
      
      expect(result.now).toBeDefined();
      expect(new Date(result.now).getTime()).toBeGreaterThan(0);
    });
    
    it('calculates time difference', async () => {
      const result = await dateTimeTool.execute({
        operation: 'diff',
        date1: '2024-01-01T00:00:00Z',
        date2: '2024-01-02T00:00:00Z',
      });
      
      expect(result.days).toBe(1);
      expect(result.hours).toBe(24);
    });
  });
  
  describe('jsonParserTool', () => {
    it('parses valid JSON', async () => {
      const result = await jsonParserTool.execute({
        jsonString: '{"name": "Alice", "age": 30}',
      });
      
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Alice');
    });
    
    it('catches invalid JSON', async () => {
      const result = await jsonParserTool.execute({
        jsonString: '{invalid json}',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    it('validates expected type', async () => {
      const result = await jsonParserTool.execute({
        jsonString: '[1, 2, 3]',
        expectedType: 'array',
      });
      
      expect(result.success).toBe(true);
      expect(result.typeMatch).toBe(true);
    });
  });
});

describe('Tool Registries', () => {
  it('exports all function tools', () => {
    expect(Object.keys(functionTools)).toHaveLength(6);
    expect(functionTools.temperature).toBeDefined();
    expect(functionTools.validator).toBeDefined();
  });
  
  it('exports all data tools', () => {
    expect(Object.keys(dataTools)).toHaveLength(6);
    expect(dataTools.userProfile).toBeDefined();
    expect(dataTools.documentSearch).toBeDefined();
  });
});

describe('Data Tools Structure', () => {
  it('do not have execute function', () => {
    // Data tools don't auto-execute
    expect('execute' in dataTools.userProfile).toBe(false);
    expect('execute' in dataTools.productCatalog).toBe(false);
  });
  
  it('have describe function', () => {
    // All tools use Zod for type safety
    expect(dataTools.userProfile.description).toBeDefined();
    expect(dataTools.userProfile.parameters).toBeDefined();
  });
});
