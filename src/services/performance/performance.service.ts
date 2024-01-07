// performance.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private frameCount = 0;
  private lastTime = 0;
  private fpsCallback!: (fps: number) => void;

  constructor() {
    this.startRecordingFPS();
  }

  private startRecordingFPS() {
    this.fpsCallback = (fps: number) => {
      console.log(`FPS: ${fps}`);
    };

    this.lastTime = performance.now();
    this.requestAnimationFrame();
  }

  private requestAnimationFrame() {
    requestAnimationFrame(() => {
      this.frameCount++;
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastTime;

      if (deltaTime >= 1000) {
        const fps = (this.frameCount * 1000) / deltaTime;
        this.fpsCallback(fps);

        this.frameCount = 0;
        this.lastTime = currentTime;
      }

      this.requestAnimationFrame();
    });
  }

  async getMemoryUsage(): Promise<number | null> {
    if (crossOriginIsolated) {
      try {
        const memoryInfo = await (performance as any).measureUserAgentSpecificMemory();
        return memoryInfo.bytes / (1024 * 1024); // Convert to megabytes
      } catch (error) {
        console.error('Error measuring memory:', error);
        return null;
      }
    } else {
      console.error('Cross Origin Isolated', crossOriginIsolated)
      return null;
    }
  }

  async logMemoryUsage() {
    const memoryUsage = await this.getMemoryUsage();
    if (memoryUsage !== null) {
      console.log(`Memory Usage: ${memoryUsage} MB`);
    }
  }
}
