export class PerformanceMonitor {
  private static thresholds: Record<string, number> = {
    render: 16,
    step_validation: 10,
    generator: 20
  };

  public static measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    const threshold = this.thresholds[name] || 50;
    if (duration > threshold) {
      console.warn(`[PerformanceMonitor] ${name} took ${duration.toFixed(2)}ms (Threshold: ${threshold}ms)`);
    }

    return result;
  }

  public static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    const threshold = this.thresholds[name] || 50;
    if (duration > threshold) {
      console.warn(`[PerformanceMonitor] ${name} took ${duration.toFixed(2)}ms (Threshold: ${threshold}ms)`);
    }

    return result;
  }
}
