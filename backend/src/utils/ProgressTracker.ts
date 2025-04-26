import { EventEmitter } from 'events';
import { logger } from './logger';

export interface ProgressUpdate {
  stage: string;
  progress: number;
  message: string;
  estimatedTimeRemaining?: number;
  startTime?: number;
  endTime?: number;
}

export interface ProgressTrackerConfig {
  taskId: string;
  totalStages: number;
  onProgress?: (update: ProgressUpdate) => void;
  estimateTimeRemaining?: boolean;
}

export class ProgressTracker extends EventEmitter {
  private readonly taskId: string;
  private readonly totalStages: number;
  private currentStage: number = 0;
  private stageProgress: number = 0;
  private startTime: number;
  private stageTimes: Map<string, number> = new Map();
  private readonly estimateTimeRemaining: boolean;
  private lastUpdate: number = Date.now();
  private readonly minUpdateInterval: number = 1000; // Minimum 1 second between updates

  constructor(config: ProgressTrackerConfig) {
    super();
    this.taskId = config.taskId;
    this.totalStages = config.totalStages;
    this.estimateTimeRemaining = config.estimateTimeRemaining ?? true;
    this.startTime = Date.now();

    if (config.onProgress) {
      this.on('progress', config.onProgress);
    }
  }

  public startStage(stageName: string): void {
    this.currentStage++;
    this.stageProgress = 0;
    this.stageTimes.set(stageName, Date.now());
    
    this.emitProgress({
      stage: stageName,
      progress: 0,
      message: `Rozpoczęto etap: ${stageName}`,
      startTime: Date.now(),
    });

    logger.info(`Started stage ${stageName} for task ${this.taskId}`);
  }

  public updateProgress(stageName: string, progress: number, message?: string): void {
    const now = Date.now();
    if (now - this.lastUpdate < this.minUpdateInterval) {
      return; // Zbyt częste aktualizacje
    }

    this.stageProgress = Math.min(Math.max(progress, 0), 100);
    this.lastUpdate = now;

    const update: ProgressUpdate = {
      stage: stageName,
      progress: this.calculateOverallProgress(),
      message: message || `Postęp: ${Math.round(this.stageProgress)}%`,
    };

    if (this.estimateTimeRemaining) {
      update.estimatedTimeRemaining = this.calculateEstimatedTimeRemaining();
    }

    this.emitProgress(update);
  }

  public completeStage(stageName: string): void {
    const stageStartTime = this.stageTimes.get(stageName);
    const duration = stageStartTime ? Date.now() - stageStartTime : 0;

    this.stageProgress = 100;
    
    this.emitProgress({
      stage: stageName,
      progress: this.calculateOverallProgress(),
      message: `Zakończono etap: ${stageName}`,
      endTime: Date.now(),
    });

    logger.info(`Completed stage ${stageName} for task ${this.taskId}`, {
      duration,
      overallProgress: this.calculateOverallProgress(),
    });
  }

  public complete(): void {
    const duration = Date.now() - this.startTime;
    
    this.emitProgress({
      stage: 'complete',
      progress: 100,
      message: 'Zadanie zakończone',
      endTime: Date.now(),
    });

    logger.info(`Task ${this.taskId} completed`, {
      duration,
      stages: Array.from(this.stageTimes.entries()),
    });

    this.removeAllListeners();
  }

  private calculateOverallProgress(): number {
    const stageWeight = 100 / this.totalStages;
    const completedStagesProgress = (this.currentStage - 1) * stageWeight;
    const currentStageProgress = (this.stageProgress / 100) * stageWeight;
    return Math.min(Math.round(completedStagesProgress + currentStageProgress), 100);
  }

  private calculateEstimatedTimeRemaining(): number {
    if (this.stageProgress === 0) return 0;

    const elapsed = Date.now() - this.startTime;
    const progressPercent = this.calculateOverallProgress() / 100;
    
    if (progressPercent === 0) return 0;
    
    const estimatedTotal = elapsed / progressPercent;
    return Math.max(0, estimatedTotal - elapsed);
  }

  private emitProgress(update: ProgressUpdate): void {
    this.emit('progress', update);
    logger.debug(`Progress update for task ${this.taskId}`, update);
  }

  public getTaskId(): string {
    return this.taskId;
  }

  public getCurrentStage(): number {
    return this.currentStage;
  }

  public getTotalStages(): number {
    return this.totalStages;
  }

  public getElapsedTime(): number {
    return Date.now() - this.startTime;
  }
} 