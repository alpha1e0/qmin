import * as fs from 'fs/promises';
import { wpath } from '@/core/common/context';
import {
  BGTaskNotImplement,
  BGTaskNotFound,
  BGTaskDataFormatError,
  BGTaskAlreadyExists,
} from '@/core/common/exceptions';
import { generateThumbnailOfDir } from '@/core/utils/image';
import { currentTimeObjToStr, timeStrToObj, readJsonFile, writeJsonFile } from '@/core/utils/common';

/**
 * Background Task Status Enum
 */
export enum BgTaskStatus {
  INIT = 'init',
  STARTED = 'started',
  FINISHED = 'finished',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
}

/**
 * Background Task Type Enum
 */
export enum BgTaskType {
  DEFAULT = 0,
  IMG_OP = 1,
}

/**
 * Background Task Event Enum
 */
export enum BgTaskEvent {
  NORMAL = 0,
  TIMEOUT_KILL = 1,
}

/**
 * Task Result Interface
 */
export interface TaskResult {
  success: boolean;
  err_code?: string;
  err_msg?: string;
  data?: any;
}

/**
 * Task Data Interface
 */
export interface TaskData {
  task_id?: number;
  identifier: string;
  task_type: number;
  status: string;
  progress: number;
  params: Record<string, any>;
  event: BgTaskEvent;
  result: TaskResult;
  start_time: string;
  finish_time: string;
}

/**
 * Base Task Class
 */
export class Task {
  taskId: number = -1;
  protected data: TaskData;

  constructor(data: TaskData) {
    this.validateTaskFormat(data);
    this.data = data;

    if (data.task_id !== undefined) {
      this.taskId = data.task_id;
    }
  }

  /**
   * Start the task
   */
  async start(): Promise<void> {
    this.data.start_time = currentTimeObjToStr();
    await this.updateStatus(BgTaskStatus.STARTED, this.progress);
    await this.run();
  }

  /**
   * Run the task (to be implemented by subclasses)
   */
  async run(): Promise<void> {
    throw new BGTaskNotImplement('Run method of Task not implemented');
  }

  /**
   * Update task status and progress
   */
  async updateStatus(status: BgTaskStatus, progress: number): Promise<number> {
    if (!this.isValidStatus(status)) {
      throw new Error('Task status wrong');
    }

    if (progress > 100 || progress < 0) {
      throw new Error('Progress must be between 0 and 100');
    }

    this.data.status = status;
    this.data.progress = progress;

    return await this.save();
  }

  /**
   * Set task finish
   */
  async setFinish(result: TaskResult = { success: true }): Promise<number> {
    this.data.status = BgTaskStatus.FINISHED;
    this.data.progress = 100;

    if (Object.keys(result).length > 0) {
      this.data.result = result;
    }

    this.data.finish_time = currentTimeObjToStr();

    return await this.save();
  }

  /**
   * Save task to database
   */
  async save(): Promise<number> {
    if (this.taskId !== -1) {
      this.validateTaskFormat(this.data);
      await Task.updateInDb(this.taskId, this.data);
      return this.taskId;
    } else {
      const oldTask = await Task.get(this.identifier);
      if (oldTask) {
        throw new BGTaskAlreadyExists(`Background task '${this.identifier}' already exists`);
      }

      const ret = await Task.insertToDb(this.data);
      this.taskId = ret;
      return ret;
    }
  }

  /**
   * Delete task
   */
  async delete(): Promise<boolean> {
    const ret = await Task.remove(this.identifier);
    return ret.length > 0;
  }

  /**
   * Create a new task
   */
  static async create(
    identifier: string,
    params: Record<string, any> = {},
    taskType: BgTaskType = BgTaskType.DEFAULT
  ): Promise<Task> {
    const oldTask = await Task.get(identifier);
    if (oldTask) {
      throw new BGTaskAlreadyExists(`Background task '${identifier}' already exists`);
    }

    const taskRaw: TaskData = {
      identifier,
      task_type: taskType,
      status: BgTaskStatus.INIT,
      progress: 0,
      params,
      event: BgTaskEvent.NORMAL,
      result: { success: true },
      start_time: '',
      finish_time: '',
    };

    const task = new Task(taskRaw);
    await task.save();

    return task;
  }

  /**
   * Remove task by identifier
   */
  static async remove(identifier: string): Promise<number[]> {
    return await Task.removeFromDb(identifier);
  }

  /**
   * Get task by identifier
   */
  static async get(identifier: string): Promise<Task | null> {
    const tasks = await Task.getAllFromDb();
    const result = tasks.find((t) => t.identifier === identifier);

    if (!result) return null;

    return new Task(result);
  }

  /**
   * Get all tasks
   */
  static async getAllTasks(): Promise<TaskData[]> {
    return await Task.getAllFromDb();
  }

  /**
   * Iterate through tasks
   */
  static async *iterTasks(): AsyncGenerator<Task> {
    const tasks = await Task.getAllFromDb();
    for (const taskData of tasks) {
      yield new Task(taskData);
    }
  }

  /**
   * Get task event
   */
  getEvent(): BgTaskEvent {
    return this.data.event as BgTaskEvent;
  }

  /**
   * Set task event
   */
  async setEvent(event: BgTaskEvent): Promise<number> {
    if (!this.isValidEvent(event)) {
      throw new Error('Task event wrong');
    }

    this.data.event = event;
    return await this.save();
  }

  // Getters
  get identifier(): string {
    return this.data.identifier;
  }

  get task_type(): number {
    return this.data.task_type;
  }

  get status(): string {
    return this.data.status;
  }

  get progress(): number {
    return this.data.progress;
  }

  get params(): Record<string, any> {
    return this.data.params;
  }

  get result(): TaskResult {
    return this.data.result;
  }

  get start_time(): string {
    return this.data.start_time;
  }

  get finish_time(): string {
    return this.data.finish_time;
  }

  get finishTime(): string {
    return this.data.finish_time;
  }

  get startTime(): string {
    return this.data.start_time;
  }

  // Setters
  set identifier(value: string) {
    this.data.identifier = value;
  }

  set task_type(value: number) {
    this.data.task_type = value;
  }

  set status(value: string) {
    this.data.status = value;
  }

  set progress(value: number) {
    this.data.progress = value;
  }

  set params(value: Record<string, any>) {
    this.data.params = value;
  }

  set result(value: TaskResult) {
    this.data.result = value;
  }

  set start_time(value: string) {
    this.data.start_time = value;
  }

  set finish_time(value: string) {
    this.data.finish_time = value;
  }

  /**
   * Check if status is valid
   */
  private isValidStatus(status: BgTaskStatus | string): boolean {
    return Object.values(BgTaskStatus).includes(status as BgTaskStatus);
  }

  /**
   * Check if event is valid
   */
  private isValidEvent(event: BgTaskEvent | number): boolean {
    return Object.values(BgTaskEvent).includes(event as BgTaskEvent);
  }

  /**
   * Validate task format
   */
  private validateTaskFormat(data: any): void {
    const requiredFields = [
      'identifier',
      'task_type',
      'status',
      'progress',
      'params',
      'event',
      'result',
      'start_time',
      'finish_time',
    ];

    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new BGTaskDataFormatError(`Missing required field: ${field}`);
      }
    }

    if (typeof data.progress !== 'number' || data.progress < 0 || data.progress > 100) {
      throw new BGTaskDataFormatError('Progress must be a number between 0 and 100');
    }
  }

  // Database methods
  private static async getAllFromDb(): Promise<TaskData[]> {
    const db = await Task.loadDb();

    if (!db.bg_tasks) {
      db.bg_tasks = [];
      await Task.saveDb(db);
    }

    return db.bg_tasks;
  }

  private static async insertToDb(data: TaskData): Promise<number> {
    const db = await Task.loadDb();

    if (!db.bg_tasks) {
      db.bg_tasks = [];
    }

    // Check if identifier already exists
    const exists = db.bg_tasks.some((t) => t.identifier === data.identifier);
    if (exists) {
      throw new BGTaskAlreadyExists(`Task '${data.identifier}' already exists`);
    }

    // Generate new task_id
    const newId =
      db.bg_tasks.length > 0 ? Math.max(...db.bg_tasks.map((t) => t.task_id || 0)) + 1 : 1;
    data.task_id = newId;

    db.bg_tasks.push(data);
    await Task.saveDb(db);

    return newId;
  }

  private static async updateInDb(taskId: number, data: TaskData): Promise<void> {
    const db = await Task.loadDb();

    if (!db.bg_tasks) {
      throw new BGTaskNotFound('No tasks found in database');
    }

    const index = db.bg_tasks.findIndex((t) => t.task_id === taskId);
    if (index === -1) {
      throw new BGTaskNotFound(`Task with id ${taskId} not found`);
    }

    db.bg_tasks[index] = { ...db.bg_tasks[index], ...data };
    await Task.saveDb(db);
  }

  private static async removeFromDb(identifier: string): Promise<number[]> {
    const db = await Task.loadDb();

    if (!db.bg_tasks) {
      return [];
    }

    const removedIds: number[] = [];
    db.bg_tasks = db.bg_tasks.filter((t) => {
      if (t.identifier === identifier) {
        removedIds.push(t.task_id || -1);
        return false;
      }
      return true;
    });

    await Task.saveDb(db);
    return removedIds;
  }

  private static async loadDb(): Promise<TaskDatabase> {
    const dbPath = wpath.tasks;

    try {
      await fs.access(dbPath);
      const content = await fs.readFile(dbPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { bg_tasks: [] };
    }
  }

  private static async saveDb(db: TaskDatabase): Promise<void> {
    const dbPath = wpath.tasks;
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
  }
}

/**
 * Task Database Interface
 */
interface TaskDatabase {
  bg_tasks: TaskData[];
}

/**
 * Image Viewer Task - generates thumbnails for a directory
 */
export class IVTask extends Task {
  // Don't override the static create method to avoid signature conflicts
  // Use a different static method name for creating IVTask instances
  /**
   * Run IV task
   */
  async run(): Promise<void> {
    const imgPath = this.params.get('img_path');
    if (!imgPath) {
      throw new BGTaskNotImplement('Missing img_path parameter');
    }

    await this.generateThumbnail(imgPath);
  }

  /**
   * Create IV task with image directory
   */
  static async createWithDir(identifier: string, imgDir: string): Promise<IVTask> {
    // Create the task data directly instead of using Task.create
    const taskData: TaskData = {
      identifier,
      task_type: BgTaskType.IMG_OP,
      status: BgTaskStatus.INIT,
      progress: 0,
      params: { img_dir: imgDir },
      event: BgTaskEvent.NORMAL,
      result: { success: true },
      start_time: '',
      finish_time: '',
    };

    const ivTask = new IVTask(taskData);
    // Save to database to get taskId
    await ivTask.save();
    return ivTask;
  }

  /**
   * Generate thumbnails for directory
   */
  private async generateThumbnail(imgDir: string): Promise<void> {
    const processed = await generateThumbnailOfDir(imgDir);
    await this.updateStatus(BgTaskStatus.FINISHED, 100);

    this.data.result = {
      success: true,
      data: { processed },
    };
  }
}
