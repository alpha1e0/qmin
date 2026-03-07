import * as fs from 'fs/promises';
import * as path from 'path';

import { wpath } from '../common/context';
import { createLogger } from '../utils/logger';

const logger = createLogger('TaskManagerService');
import {
  BGTaskNotImplement,
  BGTaskNotFound,
  BGTaskDataFormatError,
  BGTaskAlreadyExists,
} from '../common/exceptions';
import { currentTimeObjToStr, timeStrToObj } from '../utils/common';
import { Task, TaskStatus, TaskType, IVTask } from './task.service';
import { readJsonFile, writeJsonFile } from '../utils/common';

/**
 * Task database structure
 */
interface TaskDatabase {
  bg_tasks: Task[];
}

/**
 * Task Manager Service
 * Manages background tasks with worker threads
 */
export class TaskManagerService {
  private maxWorkers: number = 10;
  private runningPeriod: number = 5; // seconds
  private autoCleanPeriod: number = 30; // seconds
  private taskStartTimeout: number = 3 * 60 * 60; // 3 hours in seconds
  private taskFinishTimeout: number = 30 * 60; // 30 minutes in seconds
  private taskTypeMap: Map<number, any>;
  private running: boolean = true;

  constructor() {
    this.taskTypeMap = new Map<number, any>([
      [TaskType.DEFAULT, Task],
      [TaskType.IMG_OP, IVTask],
    ] as any);
  }

  /**
   * Start task worker
   */
  startWorking(): void {
    // Node.js is single-threaded, we use setTimeout for task polling
    this.workerJob();
  }

  /**
   * Start auto-clean job
   */
  startAutoClean(): void {
    this.cleanJob();
  }

  /**
   * Stop all workers
   */
  stop(): void {
    this.running = false;
  }

  /**
   * Worker job - polls for tasks and executes them
   */
  private workerJob(): void {
    if (!this.running) return;

    this.getOneTask()
      .then((task) => {
        if (task) {
          logger.info(`Running task '${task.identifier}'`);
          // Run task in the next event loop iteration to avoid blocking
          setImmediate(() => this.runTask(task));
        }

        setTimeout(() => this.workerJob(), this.runningPeriod * 1000);
      })
      .catch((err) => {
        logger.error('Worker job error', err);
        setTimeout(() => this.workerJob(), this.runningPeriod * 1000);
      });
  }

  /**
   * Clean job - removes old finished tasks
   */
  private cleanJob(): void {
    if (!this.running) return;

    this.cleanTasks().catch((err) => {
      logger.error('Clean job error', err);
    });

    setTimeout(() => this.cleanJob(), this.autoCleanPeriod * 1000);
  }

  /**
   * Get one pending task to execute
   */
  private async getOneTask(): Promise<Task | null> {
    const tasks = await Task.getAllTasks();

    for (const taskData of tasks) {
      if (taskData.status === TaskStatus.INIT) {
        const TaskClass = this.taskTypeMap.get(taskData.task_type);

        if (!TaskClass) {
          throw new BGTaskNotFound(`Cannot find task of type '${taskData.task_type}'`);
        }

        return new TaskClass(taskData);
      }
    }

    return null;
  }

  /**
   * Run a task
   */
  private async runTask(task: Task): Promise<void> {
    try {
      await task.start();
    } catch (err) {
      logger.error(`Task '${task.identifier}' failed`, err);
      await task.updateStatus(TaskStatus.FAILED, task.progress);
    }
  }

  /**
   * Clean old tasks
   */
  private async cleanTasks(): Promise<void> {
    const toRemove: Task[] = [];
    const toSetTimeout: Task[] = [];

    const tasks = await Task.getAllTasks();
    const now = Date.now();

    for (const taskData of tasks) {
      const task = new Task(taskData);

      if (task.status === TaskStatus.FINISHED) {
        const finishTime = task.finishTime ? timeStrToObj(task.finishTime) : new Date(0);
        const diff = (now - finishTime.getTime()) / 1000;

        if (diff > this.taskFinishTimeout) {
          toRemove.push(task);
        }
      } else if (task.status === TaskStatus.STARTED) {
        const startTime = task.startTime ? timeStrToObj(task.startTime) : new Date(0);
        const diff = (now - startTime.getTime()) / 1000;

        if (diff > this.taskStartTimeout) {
          toSetTimeout.push(task);
        }
      }
    }

    // Remove old tasks
    for (const task of toRemove) {
      await Task.remove(task.identifier);
    }

    // Set timeout for stuck tasks
    for (const task of toSetTimeout) {
      await task.setEvent(1); // TIMEOUT_KILL
    }
  }
}
