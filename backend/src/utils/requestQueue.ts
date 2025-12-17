/**
 * Request Queue for API Rate Limiting
 *
 * Implements a FIFO queue with configurable delays between requests
 * to prevent API rate limit violations.
 *
 * USAGE:
 * - Enqueue async functions that make API requests
 * - Queue automatically processes requests one at a time
 * - Configurable delay enforced between consecutive requests
 *
 * EXAMPLE:
 * ```typescript
 * const queue = new RequestQueue(1000); // 1 second delay
 * const result = await queue.add(() => fetchDataFromAPI());
 * ```
 */
export class RequestQueue {
  // Queue storing pending API requests with their promise handlers
  private queue: Array<{
    fn: () => Promise<any>;        // The async function to execute
    resolve: (value: any) => void; // Promise resolve callback
    reject: (error: any) => void;  // Promise reject callback
  }> = [];

  private processing = false;  // Flag to prevent concurrent processing
  private delayMs: number;     // Delay in milliseconds between requests

  /**
   * Create a Request Queue
   *
   * @param {number} delayMs - Delay in milliseconds between consecutive requests
   */
  constructor(delayMs: number = 1000) {
    this.delayMs = delayMs;
  }

  /**
   * Add Request to Queue
   *
   * Enqueues an async function and returns a promise that resolves
   * when the function is executed.
   *
   * @param {() => Promise<T>} fn - Async function to execute (e.g., API call)
   * @returns {Promise<T>} Promise that resolves with function result
   */
  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue(); // Start processing if not already running
    });
  }

  /**
   * Process Queue
   *
   * Processes queued requests one at a time with configured delay.
   * Uses iterative approach (while loop) instead of recursion to handle
   * requests added during processing without stack overflow.
   *
   * @private
   */
  private async processQueue() {
    // Prevent concurrent processing
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    // Continue processing as long as there are items in the queue
    // This handles items added during processing without recursion
    while (this.queue.length > 0) {
      const item = this.queue.shift()!; // Get next request (FIFO)

      try {
        const result = await item.fn(); // Execute the API call
        item.resolve(result);           // Resolve the promise with result
      } catch (error) {
        item.reject(error);             // Reject the promise on error
      }

      // Wait before processing next request (if queue not empty)
      if (this.queue.length > 0) {
        await this.delay(this.delayMs);
      }
    }

    this.processing = false;
  }

  /**
   * Delay Helper
   *
   * Creates a promise that resolves after specified milliseconds.
   *
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>} Promise that resolves after delay
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Singleton Request Queue Instances
 *
 * Pre-configured queues for different external APIs:
 * - alphaVantageQueue: 12-second delay (5 requests/minute free tier limit)
 * - finnhubQueue: 1-second delay (60 requests/minute free tier limit)
 */
export const alphaVantageQueue = new RequestQueue(12000); // 12 sec (5 req/min)
export const finnhubQueue = new RequestQueue(1000);       // 1 sec (60 req/min)
