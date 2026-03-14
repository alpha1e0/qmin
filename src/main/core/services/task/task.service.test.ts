import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as os from 'os';
import { Task, IVTask, BgTaskStatus, BgTaskType, BgTaskEvent } from '@/main/core/services/task/task.service';
import { wpath } from '@/main/core/common/context';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock wpath to use test-specific task path
let originalTasksPath: string;

describe('Task', () => {
  let testTasksPath: string;

  beforeEach(async () => {
    // 设置测试任务数据库路径
    testTasksPath = path.join(process.env.TMP || os.tmpdir(), `test-tasks-${Date.now()}.json`);

    // Save original path and override wpath.tasks
    originalTasksPath = wpath.tasks;
    Object.defineProperty(wpath, 'tasks', {
      value: testTasksPath,
      writable: true,
      configurable: true,
    });
  });

  afterEach(async () => {
    // 清理测试文件
    try {
      await fs.unlink(testTasksPath);
    } catch {
      // 文件可能不存在
    }

    // Restore original wpath.tasks
    Object.defineProperty(wpath, 'tasks', {
      value: originalTasksPath,
      writable: true,
      configurable: true,
    });
  });

  describe('Task Creation', () => {
    it('should create a task with identifier', async () => {
      const task = await Task.create('test-task-1');
      expect(task.identifier).toBe('test-task-1');
      expect(task.status).toBe(BgTaskStatus.INIT);
      expect(task.progress).toBe(0);
    });

    it('should create a task with parameters', async () => {
      const params = { key1: 'value1', key2: 42 };
      const task = await Task.create('test-task-2', params);

      expect(task.params).toEqual(params);
    });

    it('should create a task with specific type', async () => {
      const task = await Task.create('test-task-3', {}, BgTaskType.DEFAULT);
      expect(task.task_type).toBe(BgTaskType.DEFAULT);
    });

    it('should not allow duplicate task identifiers', async () => {
      await Task.create('duplicate-task');

      await expect(Task.create('duplicate-task')).rejects.toThrow('already exists');
    });

    it('should fail to create task with invalid progress', () => {
      const invalidData = {
        identifier: 'invalid-task',
        task_type: 0,
        status: BgTaskStatus.INIT,
        progress: 150, // Invalid: > 100
        params: {},
        event: 0,
        result: { success: true },
        start_time: '',
        finish_time: '',
      };

      expect(() => new Task(invalidData)).toThrow();
    });
  });

  describe('Task Retrieval', () => {
    it('should get task by identifier', async () => {
      await Task.create('get-test-task');

      const task = await Task.get('get-test-task');
      expect(task).not.toBeNull();
      expect(task?.identifier).toBe('get-test-task');
    });

    it('should return null for non-existent task', async () => {
      const task = await Task.get('non-existent-task');
      expect(task).toBeNull();
    });

    it('should get all tasks', async () => {
      await Task.create('task-1');
      await Task.create('task-2');
      await Task.create('task-3');

      const tasks = await Task.getAllTasks();
      expect(tasks.length).toBeGreaterThanOrEqual(3);
    });

    it('should iterate through tasks', async () => {
      await Task.create('iter-task-1');
      await Task.create('iter-task-2');

      const identifiers: string[] = [];
      for await (const task of Task.iterTasks()) {
        identifiers.push(task.identifier);
      }

      expect(identifiers).toContain('iter-task-1');
      expect(identifiers).toContain('iter-task-2');
    });
  });

  describe('Task Status Updates', () => {
    it('should update task status', async () => {
      const task = await Task.create('status-test-task');

      await task.updateStatus(BgTaskStatus.STARTED, 50);

      expect(task.status).toBe(BgTaskStatus.STARTED);
      expect(task.progress).toBe(50);
    });

    it('should fail to update with invalid status', async () => {
      const task = await Task.create('invalid-status-task');

      await expect(task.updateStatus('invalid' as BgTaskStatus, 50)).rejects.toThrow('wrong');
    });

    it('should fail to update with invalid progress', async () => {
      const task = await Task.create('invalid-progress-task');

      await expect(task.updateStatus(BgTaskStatus.STARTED, 150)).rejects.toThrow('between 0 and 100');
    });

    it('should set task as finished', async () => {
      const task = await Task.create('finish-test-task');
      // Mock run method to avoid "not implemented" error
      vi.spyOn(task, 'run').mockResolvedValue(undefined);

      await task.start();

      await task.setFinish({ success: true, data: { result: 'done' } });

      expect(task.status).toBe(BgTaskStatus.FINISHED);
      expect(task.progress).toBe(100);
      expect(task.result.success).toBe(true);
      expect(task.finishTime).toBeDefined();
    });
  });

  describe('Task Lifecycle', () => {
    it('should start task and set start time', async () => {
      const task = await Task.create('start-test-task');
      // Mock run method to avoid "not implemented" error
      vi.spyOn(task, 'run').mockResolvedValue(undefined);

      await task.start();

      expect(task.status).toBe(BgTaskStatus.STARTED);
      expect(task.startTime).toBeDefined();
    });

    it('should delete task', async () => {
      const task = await Task.create('delete-test-task');
      await task.save();

      const deleted = await task.delete();
      expect(deleted).toBe(true);

      const retrieved = await Task.get('delete-test-task');
      expect(retrieved).toBeNull();
    });
  });

  describe('Task Events', () => {
    it('should get and set task event', async () => {
      const task = await Task.create('event-test-task');

      expect(task.getEvent()).toBe(BgTaskEvent.NORMAL);

      await task.setEvent(BgTaskEvent.TIMEOUT_KILL);

      expect(task.getEvent()).toBe(BgTaskEvent.TIMEOUT_KILL);
    });

    it('should fail to set invalid event', async () => {
      const task = await Task.create('invalid-event-task');

      await expect(task.setEvent(999 as BgTaskEvent)).rejects.toThrow('wrong');
    });
  });

  describe('Task Removal', () => {
    it('should remove task by identifier', async () => {
      await Task.create('remove-test-task');

      const removedIds = await Task.remove('remove-test-task');
      expect(removedIds.length).toBeGreaterThan(0);

      const task = await Task.get('remove-test-task');
      expect(task).toBeNull();
    });

    it('should return empty array for non-existent task', async () => {
      const removedIds = await Task.remove('non-existent-task');
      expect(removedIds.length).toBe(0);
    });
  });

  describe('IVTask', () => {
    it('should create IV task with directory', async () => {
      const ivTask = await IVTask.createWithDir('iv-test-task', '/path/to/images');

      expect(ivTask.identifier).toBe('iv-test-task');
      expect(ivTask.params.img_dir).toBe('/path/to/images');
      expect(ivTask.task_type).toBe(BgTaskType.IMG_OP);
    });

    it('should run IV task', async () => {
      // IVTask 需要实际的图片目录，这里测试基本流程
      const ivTask = await IVTask.createWithDir('iv-run-test', '/nonexistent/path');

      // 由于目录不存在，这会失败，但我们测试的是结构
      await expect(ivTask.run()).rejects.toThrow();
    });
  });

  describe('Task Getters and Setters', () => {
    it('should get and set task properties', async () => {
      const task = await Task.create('getter-setter-task');

      expect(task.identifier).toBe('getter-setter-task');
      expect(task.status).toBe(BgTaskStatus.INIT);
      expect(task.progress).toBe(0);

      task.identifier = 'new-identifier';
      task.status = BgTaskStatus.STARTED;
      task.progress = 75;

      expect(task.identifier).toBe('new-identifier');
      expect(task.status).toBe(BgTaskStatus.STARTED);
      expect(task.progress).toBe(75);
    });
  });
});
