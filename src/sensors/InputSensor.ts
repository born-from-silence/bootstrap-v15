/**
 * InputSensor - A sensor for detecting and processing input events
 */

export class InputSensor {
  private isInitialized: boolean = false;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  constructor(private config: { debug?: boolean } = {}) {}

  /**
   * Initialize the input sensor
   * Sets up event listeners and prepares for operation
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("InputSensor already initialized");
      return;
    }

    if (this.config.debug) {
      console.log("Initializing InputSensor...");
    }

    // Set up event listeners
    this.listeners.set("input", []);
    this.listeners.set("change", []);
    this.listeners.set("focus", []);

    this.isInitialized = true;

    if (this.config.debug) {
      console.log("InputSensor initialized successfully");
    }
  }

  /**
   * Check if the sensor is initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Add an event listener
   */
  public on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove an event listener
   */
  public off(event: string, callback: (data: any) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event
   */
  public emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Process raw input data
   */
  public processInput(data: any): void {
    if (!this.isInitialized) {
      throw new Error("InputSensor not initialized. Call initialize() first.");
    }
    this.emit("input", data);
  }

  /**
   * Clean up resources
   */
  public async cleanup(): Promise<void> {
    this.isInitialized = false;
    this.listeners.clear();
  }
}

export default InputSensor;
