/**
 * Browser Controller
 * Manages Playwright browser instance and executes actions
 */

import type { Browser, Page, ElementHandle } from 'playwright';
import {
  type BrowserState,
  type BrowserAction,
  type ActionResult,
  type PageElement,
  type AgentConfig,
  DEFAULT_CONFIG,
} from './types.js';

// Dynamic import for Playwright to avoid early requiring
type PlaywrightType = typeof import('playwright');

export class BrowserController {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: AgentConfig;
  private elementMap: Map<string, ElementHandle> = new Map();
  private elementCounter = 0;
  private playwright: PlaywrightType | null = null;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async initialize(): Promise<void> {
    // Dynamic import
    const { chromium } = await import('playwright');
    
    this.browser = await chromium.launch({
      headless: this.config.headless,
    });

    const context = await this.browser.newContext({
      viewport: this.config.viewport,
      userAgent: this.config.userAgent,
    });

    this.page = await context.newPage();
    this.page.setDefaultTimeout(this.config.timeout);

    if (this.config.debug) {
      console.log('[Browser] Initialized');
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  async getState(): Promise<BrowserState> {
    if (!this.page) throw new Error('Browser not initialized');

    await this.mapPageElements();

    let screenshot: string | undefined;
    if (this.config.screenshotOnStep) {
      const buffer = await this.page.screenshot({ type: 'jpeg', quality: 80 });
      screenshot = buffer.toString('base64');
    }

    const pageElements: PageElement[] = [];
    
    for (const [id, element] of this.elementMap) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const info = await element.evaluate((el: any) => {
        const inputEl = el as HTMLInputElement;
        const attrs: Record<string, string> = {};
        
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < el.attributes.length; i++) {
          const attr = el.attributes[i];
          attrs[attr.name] = attr.value;
        }
        
        return {
          tagName: el.tagName.toLowerCase(),
          text: el.textContent?.slice(0, 200) || '',
          type: inputEl.type || '',
          placeholder: inputEl.placeholder || '',
          ariaLabel: el.getAttribute('aria-label') || '',
          isVisible: true,
          isClickable: true,
          isInput: el.tagName === 'INPUT' || el.tagName === 'TEXTAREA',
          attributes: attrs,
        };
      });

      const selector = await this.buildSelector(element);
      
      pageElements.push({
        id,
        ...info,
        selector,
        xpath: `//${info.tagName}`,
      });
    }

    return {
      url: this.page.url(),
      title: await this.page.title(),
      screenshot,
      elements: pageElements,
      timestamp: Date.now(),
      previousActions: [],
    };
  }

  private async mapPageElements(): Promise<void> {
    if (!this.page) return;
    
    this.elementMap.clear();
    this.elementCounter = 0;

    const elements = await this.page.$$('button, a, input, textarea, select, [role="button"], [role="link"], [role="textbox"], [onclick]');
    
    for (const element of elements) {
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        this.elementCounter++;
        this.elementMap.set(`el-${this.elementCounter}`, element);
      }
    }

    if (this.config.debug) {
      console.log(`[Browser] Mapped ${this.elementMap.size} elements`);
    }
  }

  private async buildSelector(element: ElementHandle): Promise<string> {
    // Try to build a selector
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await element.evaluate((el: any) => {
      if (el.id) return `#${el.id}`;
      if (el.className) return `.${el.className.split(' ')[0]}`;
      return el.tagName.toLowerCase();
    }).catch(() => 'unknown');
  }

  async executeAction(action: BrowserAction): Promise<ActionResult> {
    if (!this.page) {
      return {
        action,
        success: false,
        message: 'Browser not initialized',
        timestamp: Date.now(),
      };
    }

    try {
      const result = await this.performAction(action);
      
      if (this.config.debug) {
        console.log(`[Action] ${action.type}: ${result.success ? '✓' : '✗'} ${result.message}`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        action,
        success: false,
        message: errorMessage,
        timestamp: Date.now(),
      };
    }
  }

  private async performAction(action: BrowserAction): Promise<ActionResult> {
    const timestamp = Date.now();
    
    switch (action.type) {
      case 'navigate':
        await this.page!.goto(action.url, { waitUntil: 'networkidle' });
        return {
          action,
          success: true,
          message: `Navigated to ${action.url}`,
          timestamp,
          data: { url: this.page!.url() },
        };

      case 'click': {
        const clickEl = this.elementMap.get(action.elementId);
        if (!clickEl && action.selector) {
          await this.page!.click(action.selector);
        } else if (clickEl) {
          await clickEl.click();
        } else {
          throw new Error(`Element ${action.elementId} not found`);
        }
        return {
          action,
          success: true,
          message: 'Clicked element',
          timestamp,
        };
      }

      case 'type': {
        const typeEl = this.elementMap.get(action.elementId);
        if (!typeEl && action.selector) {
          await this.page!.fill(action.selector, action.text);
        } else if (typeEl) {
          await typeEl.fill(action.text);
        } else {
          throw new Error(`Element ${action.elementId} not found`);
        }
        return {
          action,
          success: true,
          message: `Typed "${action.text.slice(0, 50)}${action.text.length > 50 ? '...' : ''}"`,
          timestamp,
        };
      }

      case 'clear': {
        const clearEl = this.elementMap.get(action.elementId);
        if (!clearEl && action.selector) {
          await this.page!.fill(action.selector, '');
        } else if (clearEl) {
          await clearEl.fill('');
        } else {
          throw new Error(`Element ${action.elementId} not found`);
        }
        return {
          action,
          success: true,
          message: 'Cleared input',
          timestamp,
        };
      }

      case 'scroll': {
        const direction = action.direction;
        const amount = action.amount;
        
        if (direction === 'down') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await this.page!.evaluate((amt: number) => window.scrollBy(0, amt), amount);
        } else if (direction === 'up') {
          await this.page!.evaluate((amt: number) => window.scrollBy(0, -amt), amount);
        } else if (direction === 'right') {
          await this.page!.evaluate((amt: number) => window.scrollBy(amt, 0), amount);
        } else if (direction === 'left') {
          await this.page!.evaluate((amt: number) => window.scrollBy(-amt, 0), amount);
        }
        
        return {
          action,
          success: true,
          message: `Scrolled ${direction} by ${amount}px`,
          timestamp,
        };
      }

      case 'screenshot': {
        const buffer = await this.page!.screenshot({
          fullPage: action.fullPage,
          type: 'jpeg',
          quality: 80,
        });
        return {
          action,
          success: true,
          message: 'Screenshot captured',
          timestamp,
          data: { screenshot: buffer.toString('base64') },
        };
      }

      case 'wait':
        await this.page!.waitForTimeout(action.duration);
        return {
          action,
          success: true,
          message: `Waited ${action.duration}ms`,
          timestamp,
        };

      case 'press_key':
        await this.page!.keyboard.press(action.key);
        return {
          action,
          success: true,
          message: `Pressed key: ${action.key}`,
          timestamp,
        };

      case 'extract': {
        const elements = await this.page!.$$(action.selector);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const texts = await Promise.all(
          elements.map(async (el: ElementHandle) => {
            if (action.attribute) {
              return await el.getAttribute(action.attribute);
            }
            return await el.textContent();
          })
        );
        
        return {
          action,
          success: true,
          message: `Extracted ${texts.length} elements`,
          timestamp,
          data: { values: texts.filter((t): t is string => t !== null) },
        };
      }

      case 'hover': {
        const hoverEl = this.elementMap.get(action.elementId);
        if (!hoverEl && action.selector) {
          await this.page!.hover(action.selector);
        } else if (hoverEl) {
          await hoverEl.hover();
        } else {
          throw new Error(`Element ${action.elementId} not found`);
        }
        return {
          action,
          success: true,
          message: 'Hovered over element',
          timestamp,
        };
      }

      case 'submit': {
        const submitEl = this.elementMap.get(action.elementId);
        if (!submitEl && action.selector) {
          await this.page!.press(action.selector, 'Enter');
        } else if (submitEl) {
          await submitEl.press('Enter');
        } else {
          throw new Error(`Element ${action.elementId} not found`);
        }
        return {
          action,
          success: true,
          message: 'Submitted form',
          timestamp,
        };
      }

      case 'terminate':
        return {
          action,
          success: action.success,
          message: action.reason,
          timestamp,
        };

      default:
        return {
          action,
          success: false,
          message: `Unknown action type`,
          timestamp,
        };
    }
  }

  getPage(): Page | null {
    return this.page;
  }

  isInitialized(): boolean {
    return this.browser !== null && this.page !== null;
  }
}
