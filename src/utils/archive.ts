/**
 * Archive extraction utilities
 */

import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

export interface ExtractOptions {
  stripComponents?: number;
  overwrite?: boolean;
}

/**
 * Extract tar.bz2 archive
 */
export async function extractArchive(
  archivePath: string,
  destination: string,
  options: ExtractOptions = {}
): Promise<void> {
  const { stripComponents = 0, overwrite = true } = options;
  
  await fs.mkdir(destination, { recursive: true });
  
  const ext = path.extname(archivePath).toLowerCase();
  const base = path.basename(archivePath).toLowerCase();
  
  if (base.endsWith(".tar.bz2") || base.endsWith(".tbz2")) {
    await extractTarBz2(archivePath, destination, stripComponents);
  } else if (base.endsWith(".tar.gz") || base.endsWith(".tgz")) {
    await extractTarGz(archivePath, destination, stripComponents);
  } else if (base.endsWith(".tar")) {
    await extractTar(archivePath, destination, stripComponents);
  } else if (ext === ".zip") {
    await extractZip(archivePath, destination);
  } else {
    throw new Error(`Unsupported archive format: ${ext}`);
  }
}

async function extractTarBz2(
  archivePath: string,
  destination: string,
  stripComponents: number
): Promise<void> {
  try {
    const stripFlag = stripComponents > 0 ? `--strip-components=${stripComponents}` : "";
    execSync(`tar -xjf "${archivePath}" -C "${destination}" ${stripFlag}`, {
      stdio: "pipe",
      timeout: 300000
    });
  } catch {
    // Fallback: manual extraction not implemented, rely on tar
    throw new Error("tar command failed for bz2 extraction");
  }
}

async function extractTarGz(
  archivePath: string,
  destination: string,
  stripComponents: number
): Promise<void> {
  const stripFlag = stripComponents > 0 ? `--strip-components=${stripComponents}` : "";
  execSync(`tar -xzf "${archivePath}" -C "${destination}" ${stripFlag}`, {
    stdio: "pipe",
    timeout: 300000
  });
}

async function extractTar(
  archivePath: string,
  destination: string,
  stripComponents: number
): Promise<void> {
  const stripFlag = stripComponents > 0 ? `--strip-components=${stripComponents}` : "";
  execSync(`tar -xf "${archivePath}" -C "${destination}" ${stripFlag}`, {
    stdio: "pipe",
    timeout: 300000
  });
}

async function extractZip(
  archivePath: string,
  destination: string
): Promise<void> {
  try {
    execSync(`unzip -o "${archivePath}" -d "${destination}"`, {
      stdio: "pipe",
      timeout: 300000
    });
  } catch (error) {
    throw new Error(`Failed to extract zip: ${error}`);
  }
}

/**
 * Get archive contents without extracting
 */
export async function listArchiveContents(archivePath: string): Promise<string[]> {
  const base = path.basename(archivePath).toLowerCase();
  
  if (base.endsWith(".tar.bz2") || base.endsWith(".tbz2") || 
      base.endsWith(".tar.gz") || base.endsWith(".tgz") || 
      base.endsWith(".tar")) {
    const result = execSync(`tar -tf "${archivePath}"`, { encoding: "utf-8", timeout: 60000 });
    return result.split("\n").filter(line => line.trim());
  } else if (base.endsWith(".zip")) {
    const result = execSync(`unzip -l "${archivePath}"`, { encoding: "utf-8", timeout: 60000 });
    return result.split("\n").filter(line => line.trim() && !line.startsWith("Archive:") && !line.startsWith("  Length"));
  }
  
  throw new Error(`Cannot list contents for archive: ${archivePath}`);
}

/**
 * Verify archive integrity
 */
export async function verifyArchive(archivePath: string): Promise<boolean> {
  try {
    const base = path.basename(archivePath).toLowerCase();
    
    if (base.endsWith(".tar.bz2") || base.endsWith(".tbz2")) {
      execSync(`tar -tjf "${archivePath}" > /dev/null 2>&1`, { timeout: 60000 });
    } else if (base.endsWith(".tar.gz") || base.endsWith(".tgz")) {
      execSync(`tar -tzf "${archivePath}" > /dev/null 2>&1`, { timeout: 60000 });
    } else if (base.endsWith(".tar")) {
      execSync(`tar -tf "${archivePath}" > /dev/null 2>&1`, { timeout: 60000 });
    } else if (base.endsWith(".zip")) {
      execSync(`unzip -t "${archivePath}" > /dev/null 2>&1`, { timeout: 60000 });
    } else {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}
