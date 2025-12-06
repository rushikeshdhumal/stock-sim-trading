export class RequestQueue {
  private queue: Array<{
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private processing = false;
  private delayMs: number;

  constructor(delayMs: number = 1000) {
    this.delayMs = delayMs;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    // Continue processing as long as there are items in the queue
    // This handles items added during processing without recursion
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
      if (this.queue.length > 0) {
        await this.delay(this.delayMs);
      }
    }
    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instances for each API
export const alphaVantageQueue = new RequestQueue(12000); // 12 sec (5 req/min)
export const yfinanceQueue = new RequestQueue(1000);      // 1 sec
export const finnhubQueue = new RequestQueue(1000);       // 1 sec (60 req/min)
