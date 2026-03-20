/**
 * Download utilities for embedded ASR model fetching
 */

import https from "node:https";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { createWriteStream } from "node:fs";

export interface DownloadOptions {
  timeout?: number;
  retries?: number;
  onProgress?: (downloaded: number, total?: number) => void;
}

/**
 * Download a file from URL to local path
 */
export async function downloadFile(
  url: string,
  destination: string,
  options: DownloadOptions = {}
): Promise<void> {
  const { timeout = 300000, retries = 3 } = options;
  
  await fs.mkdir(path.dirname(destination), { recursive: true });
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await downloadWithRetry(url, destination, timeout, options?.onProgress);
      return;
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`Download failed after ${retries} attempts: ${error}`);
      }
      console.log(`Download attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

function downloadWithRetry(
  url: string,
  destination: string,
  timeout: number,
  onProgress?: (downloaded: number, total?: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https:") ? https : http;
    
    const request = protocol.get(url, { timeout }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadWithRetry(redirectUrl, destination, timeout, onProgress)
            .then(resolve)
            .catch(reject);
          return;
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      const totalSize = parseInt(response.headers["content-length"] || "0", 10);
      const fileStream = createWriteStream(destination);
      
      let downloadedSize = 0;
      
      response.on("data", (chunk: Buffer) => {
        downloadedSize += chunk.length;
        if (onProgress && totalSize > 0) {
          onProgress(downloadedSize, totalSize);
        }
      });
      
      response.pipe(fileStream);
      
      fileStream.on("finish", () => {
        fileStream.close();
        resolve();
      });
      
      fileStream.on("error", (error) => {
        fs.unlink(destination).catch(() => {});
        reject(error);
      });
      
      response.on("error", (error) => {
        fs.unlink(destination).catch(() => {});
        reject(error);
      });
    });
    
    request.on("error", reject);
    request.on("timeout", () => {
      request.destroy();
      reject(new Error("Download timeout"));
    });
  });
}

/**
 * Download with progress display
 */
export async function downloadFileWithProgress(
  url: string,
  destination: string,
  label: string = "Downloading"
): Promise<void> {
  let lastPercent = -1;
  
  await downloadFile(url, destination, {
    onProgress: (downloaded, total) => {
      if (total && total > 0) {
        const percent = Math.floor((downloaded / total) * 100);
        if (percent !== lastPercent && percent % 10 === 0) {
          const mb = (downloaded / 1024 / 1024).toFixed(1);
          const totalMb = (total / 1024 / 1024).toFixed(1);
          console.log(`${label}: ${percent}% (${mb}/${totalMb} MB)`);
          lastPercent = percent;
        }
      }
    }
  });
}
