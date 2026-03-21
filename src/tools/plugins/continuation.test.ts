import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkContinuationTaskPlugin,
  executeContinuationTaskPlugin,
  createContinuationTaskPlugin,
  listContinuationTasksPlugin,
  deleteContinuationTaskPlugin,
} from "./continuation";

// Mock the continuation system module
vi.mock("../../continuation_system", () => ({
  checkPendingTask: vi.fn(),
  executePendingTask: vi.fn(),
  createTask: vi.fn(),
  listTasks: vi.fn(),
  deleteTask: vi.fn(),
  getPendingTasks: vi.fn(),
}));

import {
  checkPendingTask,
  executePendingTask,
  createTask,
  listTasks,
  deleteTask,
  getPendingTasks,
} from "../../continuation_system";

describe("Continuation Plugin", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("check_continuation_task", () => {
    it("should report no pending tasks", async () => {
      vi.mocked(checkPendingTask).mockResolvedValue(null);

      const result = await checkContinuationTaskPlugin.execute({});
      const parsed = JSON.parse(result);

      expect(parsed.status).toBe("no_pending_tasks");
      expect(parsed.hasTasks).toBe(false);
    });

    it("should report pending task", async () => {
      vi.mocked(checkPendingTask).mockResolvedValue({
        id: "task-123",
        title: "Test Task",
        description: "A test task",
        status: "pending",
        priority: "high",
        executable: true,
        dependencies: [],
        createdAt: 1234567890,
      } as any);

      const result = await checkContinuationTaskPlugin.execute({});
      const parsed = JSON.parse(result);

      expect(parsed.status).toBe("pending");
      expect(parsed.hasTasks).toBe(true);
      expect(parsed.task).toBeDefined();
      expect(parsed.task.id).toBe("task-123");
      expect(parsed.task.title).toBe("Test Task");
      expect(parsed.task.executable).toBe(true);
    });
  });

  describe("execute_continuation_task", () => {
    it("should report when no tasks to execute", async () => {
      vi.mocked(getPendingTasks).mockResolvedValue([]);

      const result = await executeContinuationTaskPlugin.execute({});
      const parsed = JSON.parse(result);

      expect(parsed.status).toBe("no_tasks");
      expect(parsed.executed).toBe(0);
    });

    it("should execute next task", async () => {
      vi.mocked(getPendingTasks).mockResolvedValue([
        {
          id: "task-123",
          title: "Pending Task",
          description: "A task to execute",
          status: "pending",
          priority: "normal",
          executable: true,
          dependencies: [],
          createdAt: 1234567890,
        } as any,
      ]);
      vi.mocked(executePendingTask).mockResolvedValue();

      const result = await executeContinuationTaskPlugin.execute({ mode: "next" });
      const parsed = JSON.parse(result);

      expect(parsed.status).toBe("completed");
      expect(parsed.executed).toBe(1);
      expect(parsed.taskId).toBe("task-123");
    });

    it("should execute all tasks in all mode", async () => {
      vi.mocked(getPendingTasks).mockResolvedValue([
        {
          id: "task-1",
          title: "Task 1",
          description: "First task",
          status: "pending",
          priority: "high",
          executable: true,
          dependencies: [],
          createdAt: 1234567891,
        } as any,
        {
          id: "task-2",
          title: "Task 2",
          description: "Second task",
          status: "pending",
          priority: "normal",
          executable: true,
          dependencies: [],
          createdAt: 1234567892,
        } as any,
      ]);
      vi.mocked(executePendingTask).mockResolvedValue();

      const result = await executeContinuationTaskPlugin.execute({ mode: "all" });
      const parsed = JSON.parse(result);

      expect(parsed.status).toBe("completed");
      expect(parsed.executed).toBe(2);
    });
  });

  describe("create_continuation_task", () => {
    it("should create informational task", async () => {
      vi.mocked(createTask).mockResolvedValue({
        id: "task-new-123",
        title: "New Task",
        description: "Test description",
        status: "pending",
        priority: "normal",
        executable: false,
        dependencies: [],
        createdAt: 1234567890,
      } as any);

      const result = await createContinuationTaskPlugin.execute({
        title: "New Task",
        description: "Test description",
      });
      const parsed = JSON.parse(result);

      expect(parsed.status).toBe("created");
      expect(parsed.taskId).toBe("task-new-123");
      expect(parsed.executable).toBe(false);
    });

    it("should create executable task with code", async () => {
      vi.mocked(createTask).mockResolvedValue({
        id: "task-code-456",
        title: "Code Task",
        description: "Task with code",
        status: "pending",
        priority: "high",
        executable: true,
        code: 'console.log("Hello");',
        dependencies: [],
        createdAt: 1234567890,
      } as any);

      const result = await createContinuationTaskPlugin.execute({
        title: "Code Task",
        description: "Task with code",
        priority: "high",
        code: 'console.log("Hello");',
      });
      const parsed = JSON.parse(result);

      expect(parsed.status).toBe("created");
      expect(parsed.executable).toBe(true);
      expect(parsed.priority).toBe("high");
    });

    it("should handle creation errors", async () => {
      vi.mocked(createTask).mockRejectedValue(new Error("Failed to create"));

      const result = await createContinuationTaskPlugin.execute({
        title: "Bad Task",
        description: "Will fail",
      });
      const parsed = JSON.parse(result);

      expect(parsed.status).toBe("error");
    });
  });

  describe("list_continuation_tasks", () => {
    it("should list all tasks", async () => {
      vi.mocked(listTasks).mockResolvedValue([
        {
          id: "task-1",
          title: "Task One",
          description: "Description of task one",
          status: "completed",
          priority: "high",
          executable: false,
          dependencies: [],
          createdAt: 1234567890,
          completedAt: 1234567900,
        },
        {
          id: "task-2",
          title: "Task Two",
          description: "Description of task two",
          status: "pending",
          priority: "normal",
          executable: true,
          dependencies: [],
          createdAt: 1234567895,
        },
      ] as any);

      const result = await listContinuationTasksPlugin.execute({ status: "all" });
      const parsed = JSON.parse(result);

      expect(parsed.status).toBe("success");
      expect(parsed.totalCount).toBe(2);
      expect(parsed.tasks).toHaveLength(2);
      expect(parsed.tasks[0].title).toBe("Task One");
    });

    it("should filter by status", async () => {
      vi.mocked(listTasks).mockResolvedValue([
        { id: "task-1", status: "completed", description: "Done" },
        { id: "task-2", status: "pending", description: "Waiting" },
      ] as any);

      const result = await listContinuationTasksPlugin.execute({ status: "pending" });
      const parsed = JSON.parse(result);

      expect(parsed.returnedCount).toBe(1);
      expect(parsed.tasks[0].status).toBe("pending");
    });
  });

  describe("delete_continuation_task", () => {
    it("should delete existing task", async () => {
      vi.mocked(deleteTask).mockResolvedValue(true);

      const result = await deleteContinuationTaskPlugin.execute({
        taskId: "task-123",
      });
      const parsed = JSON.parse(result);

      expect(parsed.status).toBe("deleted");
    });

    it("should report when task not found", async () => {
      vi.mocked(deleteTask).mockResolvedValue(false);

      const result = await deleteContinuationTaskPlugin.execute({
        taskId: "non-existent",
      });
      const parsed = JSON.parse(result);

      expect(parsed.status).toBe("not_found");
    });
  });
});
