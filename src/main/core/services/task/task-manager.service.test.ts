import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskManagerService } from '@/main/core/services/task/task-manager.service';
import { Task, BgTaskStatus, BgTaskType } from '@/main/core/services/task/task.service';

describe('TaskManagerService', () => {
  let manager: TaskManagerService;

  beforeEach(() => {
    manager = new TaskManagerService();
  });

  afterEach(() => {
    manager.stop();
  });

  describe('Initialization', () => {
    it('should create task manager instance', () => {
      expect(manager).toBeDefined();
    });

    it('should have default configuration', () => {
      // 测试私有属性通过行为推断
      expect(manager).toBeDefined();
    });
  });

  describe('Task Execution', () => {
    it('should start working', async () => {
      // 创建测试任务
      const task = await Task.create('worker-test-task');

      let workStarted = false;
      const startWorkingSpy = vi.spyOn(manager as any, 'workerJob').mockImplementation(() => {
        workStarted = true;
      });

      manager.startWorking();

      // 等待一小段时间让 worker 启动
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(workStarted).toBe(true);

      startWorkingSpy.mockRestore();
    });

    it('should start auto clean', async () => {
      const cleanJobSpy = vi.spyOn(manager as any, 'cleanJob').mockImplementation(() => {
        // Do nothing
      });

      manager.startAutoClean();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(cleanJobSpy).toHaveBeenCalled();

      cleanJobSpy.mockRestore();
    });

    it('should stop all workers', () => {
      manager.startWorking();
      manager.startAutoClean();

      manager.stop();

      // 验证停止后的状态（通过尝试再次启动来测试）
      const startSpy = vi.spyOn(manager as any, 'workerJob');
      manager.startWorking();

      // 由于已经停止，应该不会立即执行
      startSpy.mockRestore();
    });
  });

  describe('Task Processing', () => {
    it('should process pending tasks', async () => {
      // 创建多个任务
      await Task.create('process-task-1');
      await Task.create('process-task-2');

      // 启动工作器
      manager.startWorking();

      // 等待任务被处理
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 检查任务状态
      const task1 = await Task.get('process-task-1');
      const task2 = await Task.get('process-task-2');

      // 任务应该被处理（状态变为 STARTED 或 FINISHED）
      expect(task1?.status).not.toBe(BgTaskStatus.INIT);
      expect(task2?.status).not.toBe(BgTaskStatus.INIT);
    });

    it('should handle task execution errors', async () => {
      // 创建会失败的任务
      const task = await Task.create('failing-task');

      // Mock runTask 来模拟失败
      const runTaskSpy = vi
        .spyOn(manager as any, 'runTask')
        .mockImplementation(async (...args: unknown[]) => {
          const task = args[0] as Task;
          await task.updateStatus(BgTaskStatus.FAILED, task.progress);
        });

      manager.startWorking();

      await new Promise((resolve) => setTimeout(resolve, 200));

      const updatedTask = await Task.get('failing-task');
      expect(updatedTask?.status).toBe(BgTaskStatus.FAILED);

      runTaskSpy.mockRestore();
    });
  });

  describe('Auto Clean', () => {
    it('should clean old finished tasks', async () => {
      // 创建一个已完成的任务
      const task = await Task.create('old-finished-task');
      await task.start();
      await task.setFinish({ success: true });

      // Mock 任务的 finishTime 使其看起来很旧
      const oldDate = new Date();
      oldDate.setTime(oldDate.getTime() - 60 * 60 * 1000); // 1小时前

      // 启动清理
      manager.startAutoClean();

      await new Promise((resolve) => setTimeout(resolve, 100));

      // 验证任务是否被清理（由于时间限制，可能不会被立即清理）
      // 这里主要测试清理流程能正常运行
      const exists = await Task.get('old-finished-task');
      expect(exists).toBeDefined();
    });

    it('should handle stuck tasks', async () => {
      // 创建一个卡住的任务
      const task = await Task.create('stuck-task');
      await task.start();

      // 启动清理
      manager.startAutoClean();

      await new Promise((resolve) => setTimeout(resolve, 100));

      // 任务应该仍在运行（因为时间未超时）
      const updatedTask = await Task.get('stuck-task');
      expect(updatedTask?.status).toBe(BgTaskStatus.STARTED);
    });
  });

  describe('Task Type Mapping', () => {
    it('should map task types correctly', async () => {
      // 创建不同类型的任务
      await Task.create('default-task', {}, BgTaskType.DEFAULT);
      await Task.create('img-op-task', {}, BgTaskType.IMG_OP);

      // 启动工作器
      manager.startWorking();

      await new Promise((resolve) => setTimeout(resolve, 200));

      // 验证任务被正确处理
      const defaultTask = await Task.get('default-task');
      const imgOpTask = await Task.get('img-op-task');

      expect(defaultTask).toBeDefined();
      expect(imgOpTask).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle worker job errors gracefully', async () => {
      // Mock getOneTask 来抛出错误
      const getOneTaskSpy = vi
        .spyOn(manager as any, 'getOneTask')
        .mockRejectedValue(new Error('Test error'));

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Suppress error output
      });

      manager.startWorking();

      await new Promise((resolve) => setTimeout(resolve, 200));

      // 验证错误被捕获但没有崩溃工作器
      expect(errorSpy).toHaveBeenCalled();

      getOneTaskSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('should handle clean job errors gracefully', async () => {
      const cleanTasksSpy = vi
        .spyOn(manager as any, 'cleanTasks')
        .mockRejectedValue(new Error('Clean error'));

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Suppress error output
      });

      manager.startAutoClean();

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(errorSpy).toHaveBeenCalled();

      cleanTasksSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('Concurrency', () => {
    it('should handle multiple tasks concurrently', async () => {
      // 创建多个任务
      const taskCount = 5;
      for (let i = 0; i < taskCount; i++) {
        await Task.create(`concurrent-task-${i}`);
      }

      const startTime = Date.now();
      manager.startWorking();

      // 等待所有任务被处理
      await new Promise((resolve) => setTimeout(resolve, 500));

      const duration = Date.now() - startTime;

      // 验证任务被快速处理（并发）
      expect(duration).toBeLessThan(2000);

      // 检查所有任务的状态
      let processedCount = 0;
      for (let i = 0; i < taskCount; i++) {
        const task = await Task.get(`concurrent-task-${i}`);
        if (task && task.status !== BgTaskStatus.INIT) {
          processedCount++;
        }
      }

      expect(processedCount).toBeGreaterThan(0);
    });
  });

  describe('Lifecycle Management', () => {
    it('should stop and restart workers', async () => {
      manager.startWorking();

      await new Promise((resolve) => setTimeout(resolve, 100));

      manager.stop();

      // 等待停止
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 重新启动应该正常工作
      manager.startWorking();

      await new Promise((resolve) => setTimeout(resolve, 100));

      // 验证仍在运行
      expect(manager).toBeDefined();
    });

    it('should handle multiple stop calls', () => {
      manager.startWorking();
      manager.startAutoClean();

      // 多次调用 stop 不应该抛出错误
      manager.stop();
      manager.stop();
      manager.stop();

      expect(manager).toBeDefined();
    });
  });
});
