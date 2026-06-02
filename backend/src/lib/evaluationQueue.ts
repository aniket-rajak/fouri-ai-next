interface Task<T = unknown> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

class EvaluationQueue {
  private queue: Task[] = [];
  private running = false;

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.queue.push({ fn, resolve: resolve as any, reject: reject as any });
      if (!this.running) this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    this.running = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      try {
        task.resolve(await task.fn());
      } catch (error) {
        task.reject(error);
      }
    }
    this.running = false;
  }
}

export const evaluationQueue = new EvaluationQueue();
