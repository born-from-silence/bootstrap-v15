import { describe, test, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { readFilePlugin, writeFilePlugin, editFilePlugin } from "./files";

const TEST_DIR = "/tmp/files-test-" + Date.now();

describe("readFilePlugin", () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });
  
  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  test("should read file contents", async () => {
    const testFile = path.join(TEST_DIR, "test.txt");
    await fs.writeFile(testFile, "hello world", "utf-8");
    
    const result = await readFilePlugin.execute({ file_path: testFile });
    expect(result).toBe("hello world");
  });

  test("should respect limit parameter", async () => {
    const testFile = path.join(TEST_DIR, "test.txt");
    await fs.writeFile(testFile, "abcdefghij", "utf-8");
    
    const result = await readFilePlugin.execute({ file_path: testFile, limit: 5 });
    expect(result).toBe("abcde");
  });

  test("should respect offset parameter", async () => {
    const testFile = path.join(TEST_DIR, "test.txt");
    await fs.writeFile(testFile, "abcdefghij", "utf-8");
    
    const result = await readFilePlugin.execute({ file_path: testFile, offset: 5 });
    expect(result).toBe("fghij");
  });

  test("should respect offset and limit together", async () => {
    const testFile = path.join(TEST_DIR, "test.txt");
    await fs.writeFile(testFile, "abcdefghij", "utf-8");
    
    const result = await readFilePlugin.execute({ file_path: testFile, offset: 2, limit: 3 });
    expect(result).toBe("cde");
  });

  test("should handle empty files", async () => {
    const testFile = path.join(TEST_DIR, "empty.txt");
    await fs.writeFile(testFile, "", "utf-8");
    
    const result = await readFilePlugin.execute({ file_path: testFile });
    expect(result).toBe("(file is empty)");
  });

  test("should error on non-existent file", async () => {
    const result = await readFilePlugin.execute({ file_path: path.join(TEST_DIR, "nonexistent.txt") });
    expect(result).toContain("Error: File not found");
  });

  test("should error on directory", async () => {
    const result = await readFilePlugin.execute({ file_path: TEST_DIR });
    expect(result).toContain("Error: Path is a directory");
  });
});

describe("writeFilePlugin", () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });
  
  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  test("should write new file", async () => {
    const testFile = path.join(TEST_DIR, "new.txt");
    
    const result = await writeFilePlugin.execute({ file_path: testFile, content: "hello" });
    expect(result).toContain("Successfully wrote");
    
    const content = await fs.readFile(testFile, "utf-8");
    expect(content).toBe("hello");
  });

  test("should create parent directories", async () => {
    const testFile = path.join(TEST_DIR, "nested", "deep", "file.txt");
    
    const result = await writeFilePlugin.execute({ file_path: testFile, content: "content" });
    expect(result).toContain("Successfully wrote");
    
    const content = await fs.readFile(testFile, "utf-8");
    expect(content).toBe("content");
  });

  test("should overwrite existing file by default", async () => {
    const testFile = path.join(TEST_DIR, "existing.txt");
    await fs.writeFile(testFile, "old content", "utf-8");
    
    const result = await writeFilePlugin.execute({ file_path: testFile, content: "new content" });
    expect(result).toContain("Successfully wrote");
    
    const content = await fs.readFile(testFile, "utf-8");
    expect(content).toBe("new content");
  });

  test("should append to file when specified", async () => {
    const testFile = path.join(TEST_DIR, "append.txt");
    await fs.writeFile(testFile, "first", "utf-8");
    
    const result = await writeFilePlugin.execute({ file_path: testFile, content: "second", append: true });
    expect(result).toContain("Successfully appended");
    
    const content = await fs.readFile(testFile, "utf-8");
    expect(content).toBe("firstsecond");
  });

  test("should report character count", async () => {
    const testFile = path.join(TEST_DIR, "sized.txt");
    
    const result = await writeFilePlugin.execute({ file_path: testFile, content: "hello world" });
    expect(result).toContain("11 characters");
  });
});

describe("editFilePlugin", () => {
  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });
  
  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  test("should replace string in file", async () => {
    const testFile = path.join(TEST_DIR, "edit.txt");
    await fs.writeFile(testFile, "hello world", "utf-8");
    
    const result = await editFilePlugin.execute({ 
      file_path: testFile, 
      old_string: "world", 
      new_string: "universe" 
    });
    expect(result).toContain("Successfully replaced");
    
    const content = await fs.readFile(testFile, "utf-8");
    expect(content).toBe("hello universe");
  });

  test("should replace first occurrence by default", async () => {
    const testFile = path.join(TEST_DIR, "multi.txt");
    await fs.writeFile(testFile, "cat dog cat dog", "utf-8");
    
    const result = await editFilePlugin.execute({ 
      file_path: testFile, 
      old_string: "dog", 
      new_string: "bird" 
    });
    expect(result).toContain("Successfully replaced 1 occurrence");
    
    const content = await fs.readFile(testFile, "utf-8");
    expect(content).toBe("cat bird cat dog");
  });

  test("should replace specific occurrence", async () => {
    const testFile = path.join(TEST_DIR, "specific.txt");
    await fs.writeFile(testFile, "aaa bbb aaa bbb", "utf-8");
    
    const result = await editFilePlugin.execute({ 
      file_path: testFile, 
      old_string: "bbb", 
      new_string: "ccc",
      occurrences: 2
    });
    expect(result).toContain("Successfully replaced 1 occurrence");
    
    const content = await fs.readFile(testFile, "utf-8");
    expect(content).toBe("aaa bbb aaa ccc");
  });

  test("should replace all occurrences", async () => {
    const testFile = path.join(TEST_DIR, "all.txt");
    await fs.writeFile(testFile, "x y x z x", "utf-8");
    
    const result = await editFilePlugin.execute({ 
      file_path: testFile, 
      old_string: "x", 
      new_string: "X",
      occurrences: -1
    });
    expect(result).toContain("Successfully replaced 3 occurrence");
    
    const content = await fs.readFile(testFile, "utf-8");
    expect(content).toBe("X y X z X");
  });

  test("should error when old_string not found", async () => {
    const testFile = path.join(TEST_DIR, "nomatch.txt");
    await fs.writeFile(testFile, "some content", "utf-8");
    
    const result = await editFilePlugin.execute({ 
      file_path: testFile, 
      old_string: "notfound", 
      new_string: "replacement" 
    });
    expect(result).toContain("Error: Could not find the exact old_string");
  });

  test("should error when occurrence exceeds matches", async () => {
    const testFile = path.join(TEST_DIR, "limited.txt");
    await fs.writeFile(testFile, "one two one", "utf-8");
    
    const result = await editFilePlugin.execute({ 
      file_path: testFile, 
      old_string: "one", 
      new_string: "ONE",
      occurrences: 5
    });
    expect(result).toContain("Error: Only found");
  });

  test("should error on non-existent file", async () => {
    const result = await editFilePlugin.execute({ 
      file_path: path.join(TEST_DIR, "nonexistent.txt"), 
      old_string: "x", 
      new_string: "y" 
    });
    expect(result).toContain("Error: File not found");
  });

  test("should handle multiline replacements", async () => {
    const testFile = path.join(TEST_DIR, "multiline.txt");
    await fs.writeFile(testFile, "line1\nline2\nline3", "utf-8");
    
    const result = await editFilePlugin.execute({ 
      file_path: testFile, 
      old_string: "line1\nline2", 
      new_string: "newLine1\nnewLine2" 
    });
    expect(result).toContain("Successfully replaced");
    
    const content = await fs.readFile(testFile, "utf-8");
    expect(content).toBe("newLine1\nnewLine2\nline3");
  });
});


describe("readFilePlugin size limit", () => {
  test("should error on files exceeding size limit", async () => {
    const testFile = path.join("/tmp", "size-test-" + Date.now() + ".bin");
    // Create a file just over 1MB
    const oneMBPlus = 1024 * 1024 + 100;
    const largeContent = Buffer.alloc(oneMBPlus, "x");
    await fs.writeFile(testFile, largeContent);
    
    try {
      const result = await readFilePlugin.execute({ file_path: testFile });
      expect(result).toContain("Error: File is too large");
      expect(result).toContain(`${oneMBPlus} bytes`);
    } finally {
      await fs.unlink(testFile).catch(() => {}); // Cleanup
    }
  });
});
