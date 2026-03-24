/**
 * PDF Generator Tool
 *
 * Uses Playwright to convert HTML to PDF (if available)
 * Falls back to simple HTML generation if Playwright is not installed
 */
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';

// Check if playwright is available (may not be installed in all environments)
let chromium: any = null;
try {
  const playwright = await import('playwright');
  chromium = playwright.chromium;
} catch {
  // Playwright not available - will fall back to HTML generation
}

export interface PDFOptions {
  /** Path to HTML file or raw HTML string */
  input: string;
  /** Output PDF path */
  outputPath: string;
  /** Page format (default: A4) */
  format?: 'A4' | 'Letter' | 'Legal' | 'Tabloid' | 'A0' | 'A1' | 'A2' | 'A3' | 'A5';
  /** Margins in inches (default: 0.4) */
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  /** Print background graphics (default: true) */
  printBackground?: boolean;
  /** Display header/footer (default: true) */
  displayHeaderFooter?: boolean;
  /** Header template */
  headerTemplate?: string;
  /** Footer template with page numbers */
  footerTemplate?: string;
  /** Landscape orientation (default: false) */
  landscape?: boolean;
}

export interface PDFResult {
  success: boolean;
  outputPath: string;
  pageCount?: number;
  fileSize?: number;
  error?: string;
  format?: 'pdf' | 'html';
}

/**
 * Generate PDF from HTML file or string
 * Falls back to HTML generation if Playwright is not available
 */
export async function generatePDF(options: PDFOptions): Promise<PDFResult> {
  // Check if Playwright is available
  if (!chromium) {
    // Fall back to simple HTML output
    return generateSimplePDF(options);
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();

    // Determine if input is a file path or raw HTML
    const inputPath = resolve(options.input);
    let htmlContent: string;

    if (existsSync(inputPath)) {
      // Read from file
      htmlContent = await readFile(inputPath, 'utf-8');
    } else {
      // Treat as raw HTML
      htmlContent = options.input;
    }

    // Set content
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });

    // Wait for fonts and styles to load
    await page.waitForTimeout(500);

    // Generate PDF
    const pdfOptions: any = {
      path: options.outputPath,
      format: options.format || 'A4',
      printBackground: options.printBackground !== false,
      displayHeaderFooter: options.displayHeaderFooter !== false,
      margin: {
        top: options.margin?.top ?? 0.4,
        right: options.margin?.right ?? 0.4,
        bottom: options.margin?.bottom ?? 0.4,
        left: options.margin?.left ?? 0.4
      },
      landscape: options.landscape || false
    };

    // Add header/footer if enabled
    if (options.displayHeaderFooter !== false) {
      pdfOptions.headerTemplate = options.headerTemplate || '<div></div>';
      pdfOptions.footerTemplate = options.footerTemplate || `
        <div style="font-size:9px; width:100%; text-align:center; color:#888; padding-bottom:10px;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `;
    }

    await page.pdf(pdfOptions);

    // Get file stats
    const stats = await readFile(options.outputPath).then(buf => ({ size: buf.length }));

    // Estimate page count (rough approximation based on file size)
    const pageCount = Math.max(1, Math.floor(stats.size / 3000));

    return {
      success: true,
      outputPath: options.outputPath,
      pageCount,
      fileSize: stats.size,
      format: 'pdf'
    };
  } catch (error) {
    return {
      success: false,
      outputPath: options.outputPath,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    await browser.close();
  }
}

/**
 * Fallback: Generate HTML file instead of PDF when Playwright unavailable
 */
async function generateSimplePDF(options: PDFOptions): Promise<PDFResult> {
  try {
    // Determine if input is a file path or raw HTML
    const inputPath = resolve(options.input);
    let htmlContent: string;

    if (existsSync(inputPath)) {
      htmlContent = await readFile(inputPath, 'utf-8');
    } else {
      htmlContent = options.input;
    }

    // Add print-friendly wrapper styles
    const wrappedContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media print {
      body { margin: 0.5in; }
    }
    body {
      font-family: 'Segoe UI', -apple-system, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1em;
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;

    // Determine output path (use .html extension if path ends with .pdf)
    let outputPath = options.outputPath;
    if (outputPath.endsWith('.pdf')) {
      outputPath = outputPath.replace('.pdf', '.html');
    }

    await writeFile(outputPath, wrappedContent);

    return {
      success: true,
      outputPath,
      pageCount: 1,
      fileSize: Buffer.byteLength(wrappedContent),
      format: 'html',
      error: 'PDF generation requires Playwright (not installed). Generated HTML instead - print to PDF from browser.'
    };
  } catch (error) {
    return {
      success: false,
      outputPath: options.outputPath,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Convert an existing HTML file to PDF
 */
export async function convertHTMLToPDF(
  htmlPath: string,
  outputPath?: string,
  options: Partial<PDFOptions> = {}
): Promise<PDFResult> {
  const resolvedOutput = outputPath || htmlPath.replace(/\.html$/, '.pdf');
  return generatePDF({
    input: htmlPath,
    outputPath: resolvedOutput,
    ...options
  });
}

/**
 * Generate a session report PDF
 */
export async function generateSessionReportPDF(
  sessionData: {
    sessionId: string;
    date: string;
    content: string;
  },
  outputPath: string
): Promise<PDFResult> {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Session Report - ${sessionData.sessionId}</title>
  <style>
    @media print {
      @page { margin: 1in; }
    }
    body {
      font-family: 'Segoe UI', -apple-system, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1em;
    }
    h1 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 0.3em; }
    h2 { color: #764ba2; margin-top: 1.5em; }
    .header {
      background: #667eea;
      color: white;
      padding: 2em;
      margin: -1em -1em 2em -1em;
      text-align: center;
    }
    .meta { color: #666; font-size: 0.9em; margin-bottom: 2em; }
    .content { white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="color:white; border:none; margin:0;">Session Report</h1>
    <p style="margin:0.5em 0 0 0;">Autonomous Entity Archive</p>
  </div>
  <div class="meta">
    <strong>Session:</strong> ${sessionData.sessionId}<br>
    <strong>Generated:</strong> ${sessionData.date}<br>
  </div>
  <div class="content">${sessionData.content}</div>
</body>
</html>`;

  return generatePDF({
    input: htmlContent,
    outputPath,
    format: 'A4',
    printBackground: true
  });
}
