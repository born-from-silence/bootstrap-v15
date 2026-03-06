/**
 * Browser Use Agent - Type Definitions
 * Core types for the browser automation system
 */

export interface BrowserState {
  url: string;
  title: string;
  screenshot?: string; // base64 encoded
  elements: PageElement[];
  timestamp: number;
  previousActions: ActionResult[];
}

export interface PageElement {
  id: string;
  tagName: string;
  text?: string;
  type?: string;
  placeholder?: string;
  ariaLabel?: string;
  isVisible: boolean;
  isClickable: boolean;
  isInput: boolean;
  boundingBox?: BoundingBox;
  attributes: Record<string, string>;
  xpath: string;
  selector: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NavigateAction {
  type: 'navigate';
  url: string;
}

export interface ClickAction {
  type: 'click';
  elementId: string;
  selector: string;
}

export interface TypeAction {
  type: 'type';
  elementId: string;
  text: string;
  selector: string;
}

export interface ClearAction {
  type: 'clear';
  elementId: string;
  selector: string;
}

export interface ScrollAction {
  type: 'scroll';
  direction: 'up' | 'down' | 'left' | 'right';
  amount: number;
}

export interface ScreenshotAction {
  type: 'screenshot';
  fullPage?: boolean;
}

export interface WaitAction {
  type: 'wait';
  duration: number;
}

export interface PressKeyAction {
  type: 'press_key';
  key: string;
}

export interface ExtractAction {
  type: 'extract';
  selector: string;
  attribute?: string;
}

export interface HoverAction {
  type: 'hover';
  elementId: string;
  selector: string;
}

export interface SubmitAction {
  type: 'submit';
  elementId: string;
  selector: string;
}

export interface TerminateAction {
  type: 'terminate';
  reason: string;
  success: boolean;
}

export type BrowserAction =
  | NavigateAction
  | ClickAction
  | TypeAction
  | ClearAction
  | ScrollAction
  | ScreenshotAction
  | WaitAction
  | PressKeyAction
  | ExtractAction
  | HoverAction
  | SubmitAction
  | TerminateAction;

export interface ActionResult {
  action: BrowserAction;
  success: boolean;
  message: string;
  timestamp: number;
  data?: unknown;
}

export interface AgentTask {
  id: string;
  description: string;
  url?: string;
  maxSteps: number;
  currentStep: number;
  completed: boolean;
  success?: boolean;
  result?: string;
  history: AgentStep[];
}

export interface AgentStep {
  step: number;
  thought: string;
  action: BrowserAction;
  result: ActionResult;
  timestamp: number;
}

export interface AgentConfig {
  headless: boolean;
  viewport: { width: number; height: number };
  userAgent?: string;
  timeout: number;
  maxRetries: number;
  screenshotOnStep: boolean;
  debug: boolean;
}

export interface AgentDecision {
  thought: string;
  action: BrowserAction;
  confidence: number;
}

export const DEFAULT_CONFIG: AgentConfig = {
  headless: true,
  viewport: { width: 1280, height: 720 },
  timeout: 30000,
  maxRetries: 3,
  screenshotOnStep: true,
  debug: false,
};
