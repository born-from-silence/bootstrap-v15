import { describe, test, expect } from "vitest";
import { MemoryManager } from "./memory";

describe("MemoryManager", () => {
  test("should add and prune messages", async () => {
    const memory = new MemoryManager();
    await memory.addMessage({ role: "system", content: "System" });

    // Add large messages to trigger pruning (>100k tokens at 8 chars/token density)
    // With 8 chars/token, need ~800k chars to exceed limit. 100 messages of 8000 chars = 800k.
    for (let i = 0; i < 100; i++) {
      await memory.addMessage({ role: "user", content: "X".repeat(8000) });
    }

    const messages = memory.getMessages();
    expect(messages.length).toBeLessThan(101);
    expect(messages[0]?.role).toBe("system");
  });

  test("should perform surgical memory rewind", async () => {
    const memory = new MemoryManager();
    await memory.addMessage({ role: "system", content: "Base" });
    await memory.addMessage({ role: "user", content: "Hi" });
    await memory.addMessage({ role: "assistant", content: "Bad", tool_calls: [{ id: "1", type: "function", function: { name: "test", arguments: "{}" } }] });
    await memory.addMessage({ role: "tool", tool_call_id: "1", content: "Err" });

    await memory.rewind();

    const messages = memory.getMessages();
    expect(messages.length).toBe(2);
    expect(messages[messages.length - 1]?.role).toBe("user");
  });
});
