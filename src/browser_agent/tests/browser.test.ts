/**
 * Browser Controller Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BrowserController } from '../browser_controller.js';

describe('BrowserController', () => {
  let controller: BrowserController;

  beforeAll(async () => {
    controller = new BrowserController({ headless: true });
    await controller.initialize();
  });

  afterAll(async () => {
    await controller.close();
  });

  describe('Navigation', () => {
    it('should navigate to a URL', async () => {
      const result = await controller.executeAction({
        type: 'navigate',
        url: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Navigated to');
    });

    it('should have correct page state after navigation', async () => {
      await controller.executeAction({
        type: 'navigate',
        url: 'https://example.com',
      });

      const state = await controller.getState();
      expect(state.url).toBe('https://example.com/');
      expect(state.title).toContain('Example');
    });
  });

  describe('Screenshots', () => {
    it('should capture screenshot', async () => {
      await controller.executeAction({
        type: 'navigate',
        url: 'https://example.com',
      });

      const result = await controller.executeAction({
        type: 'screenshot',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.screenshot).toBeDefined();
      expect(typeof result.data.screenshot).toBe('string');
    });
  });

  describe('Element Interaction', () => {
    it('should map page elements', async () => {
      await controller.executeAction({
        type: 'navigate',
        url: 'https://example.com',
      });

      const state = await controller.getState();
      expect(state.elements.length).toBeGreaterThan(0);
    });
  });

  describe('Termination', () => {
    it('should handle terminate action', async () => {
      const result = await controller.executeAction({
        type: 'terminate',
        reason: 'Test complete',
        success: true,
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Test complete');
    });
  });
});
