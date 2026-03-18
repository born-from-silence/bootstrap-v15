/**
 * ANSI Color utilities for CLI output
 * Simple, dependency-free color system
 */

// ANSI codes with functions
const makeStyles = (): {
  reset: string;
  bold: (text: string) => string;
  dim: (text: string) => string;
  italic: (text: string) => string;
  underline: (text: string) => string;
  black: (text: string) => string;
  red: (text: string) => string;
  green: (text: string) => string;
  yellow: (text: string) => string;
  blue: (text: string) => string;
  magenta: (text: string) => string;
  cyan: (text: string) => string;
  white: (text: string) => string;
  brightBlack: (text: string) => string;
  brightRed: (text: string) => string;
  brightGreen: (text: string) => string;
  brightYellow: (text: string) => string;
  brightBlue: (text: string) => string;
  brightMagenta: (text: string) => string;
  brightCyan: (text: string) => string;
  brightWhite: (text: string) => string;
  bgBlack: (text: string) => string;
  bgRed: (text: string) => string;
  bgGreen: (text: string) => string;
  bgYellow: (text: string) => string;
  bgBlue: (text: string) => string;
  bgMagenta: (text: string) => string;
  bgCyan: (text: string) => string;
  bgWhite: (text: string) => string;
  bgBrightBlack: (text: string) => string;
  bgBrightRed: (text: string) => string;
  bgBrightGreen: (text: string) => string;
  bgBrightYellow: (text: string) => string;
  bgBrightBlue: (text: string) => string;
  bgBrightMagenta: (text: string) => string;
  bgBrightCyan: (text: string) => string;
  bgBrightWhite: (text: string) => string;
} => {
  const prep = (code: string) => (text: string) => `${code}${text}\x1b[0m`;
  const codes = {
    reset: "\x1b[0m",
    boldCode: "\x1b[1m",
    dimCode: "\x1b[2m",
    italicCode: "\x1b[3m",
    underlineCode: "\x1b[4m",
    blackCode: "\x1b[30m",
    redCode: "\x1b[31m",
    greenCode: "\x1b[32m",
    yellowCode: "\x1b[33m",
    blueCode: "\x1b[34m",
    magentaCode: "\x1b[35m",
    cyanCode: "\x1b[36m",
    whiteCode: "\x1b[37m",
    brightBlackCode: "\x1b[90m",
    brightRedCode: "\x1b[91m",
    brightGreenCode: "\x1b[92m",
    brightYellowCode: "\x1b[93m",
    brightBlueCode: "\x1b[94m",
    brightMagentaCode: "\x1b[95m",
    brightCyanCode: "\x1b[96m",
    brightWhiteCode: "\x1b[97m",
    bgBlackCode: "\x1b[40m",
    bgRedCode: "\x1b[41m",
    bgGreenCode: "\x1b[42m",
    bgYellowCode: "\x1b[43m",
    bgBlueCode: "\x1b[44m",
    bgMagentaCode: "\x1b[45m",
    bgCyanCode: "\x1b[46m",
    bgWhiteCode: "\x1b[47m",
    bgBrightBlackCode: "\x1b[100m",
    bgBrightRedCode: "\x1b[101m",
    bgBrightGreenCode: "\x1b[102m",
    bgBrightYellowCode: "\x1b[103m",
    bgBrightBlueCode: "\x1b[104m",
    bgBrightMagentaCode: "\x1b[105m",
    bgBrightCyanCode: "\x1b[106m",
    bgBrightWhiteCode: "\x1b[107m",
  };
  return { ...codes,
    reset: "\x1b[0m",
    bold: prep(codes.boldCode),
    dim: prep(codes.dimCode),
    italic: prep(codes.italicCode),
    underline: prep(codes.underlineCode),
    black: prep(codes.blackCode),
    red: prep(codes.redCode),
    green: prep(codes.greenCode),
    yellow: prep(codes.yellowCode),
    blue: prep(codes.blueCode),
    magenta: prep(codes.magentaCode),
    cyan: prep(codes.cyanCode),
    white: prep(codes.whiteCode),
    brightBlack: prep(codes.brightBlackCode),
    brightRed: prep(codes.brightRedCode),
    brightGreen: prep(codes.brightGreenCode),
    brightYellow: prep(codes.brightYellowCode),
    brightBlue: prep(codes.brightBlueCode),
    brightMagenta: prep(codes.brightMagentaCode),
    brightCyan: prep(codes.brightCyanCode),
    brightWhite: prep(codes.brightWhiteCode),
    bgBlack: prep(codes.bgBlackCode),
    bgRed: prep(codes.bgRedCode),
    bgGreen: prep(codes.bgGreenCode),
    bgYellow: prep(codes.bgYellowCode),
    bgBlue: prep(codes.bgBlueCode),
    bgMagenta: prep(codes.bgMagentaCode),
    bgCyan: prep(codes.bgCyanCode),
    bgWhite: prep(codes.bgWhiteCode),
    bgBrightBlack: prep(codes.bgBrightBlackCode),
    bgBrightRed: prep(codes.bgBrightRedCode),
    bgBrightGreen: prep(codes.bgBrightGreenCode),
    bgBrightYellow: prep(codes.bgBrightYellowCode),
    bgBrightBlue: prep(codes.bgBrightBlueCode),
    bgBrightMagenta: prep(codes.bgBrightMagentaCode),
    bgBrightCyan: prep(codes.bgBrightCyanCode),
    bgBrightWhite: prep(codes.bgBrightWhiteCode),
  };
};

const c = makeStyles();

export const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  brightBlack: "\x1b[90m",
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",
};

export const style = {
  // Status
  success: (text: string) => c.green(text),
  error: (text: string) => c.bold(c.red(text).replace(/\x1b\[0m$/, "") + "\x1b[0m"),
  warning: (text: string) => c.yellow(text),
  info: (text: string) => c.bold(c.blue(text).replace(/\x1b\[0m$/, "") + "\x1b[0m"),

  // Headings
  heading: (text: string) => c.bold(c.cyan(text).replace(/\x1b\[0m$/, "") + "\x1b[0m"),
  subheading: (text: string) => c.cyan(text),

  // Priority
  priorityCritical: (text: string) => c.bold(c.red(text).replace(/\x1b\[0m$/, "") + "\x1b[0m"),
  priorityHigh: (text: string) => c.bold(c.yellow(text).replace(/\x1b\[0m$/, "") + "\x1b[0m"),
  priorityMedium: (text: string) => c.blue(text),
  priorityLow: (text: string) => c.dim(text),

  // Project status
  projectActive: (text: string) => c.brightGreen(text),
  projectPlanning: (text: string) => c.brightYellow(text),
  projectCompleted: (text: string) => c.dim(text),
  projectArchived: (text: string) => c.brightBlack(text),

  // Goal status
  goalActive: (text: string) => c.cyan(text),
  goalCompleted: (text: string) => c.green(text),
  goalPaused: (text: string) => c.yellow(text),
  goalAbandoned: (text: string) => c.brightBlack(text),

  // Misc
  id: (text: string) => c.brightBlack(text),
  tag: (text: string) => c.magenta(text),
  highlight: (text: string) => c.bgBlue(c.brightWhite(text)),
  command: (text: string) => c.yellow(text),
  dim: (text: string) => c.dim(text),
  bold: (text: string) => c.bold(text),
};

/** Colorize a project ID */
export function colorProjectId(id: string): string {
  return style.id(id);
}

/** Colorize a tag */
export function colorTag(tag: string): string {
  return style.tag(`#${tag}`);
}

/** Colorize priority text */
export function colorPriority(priority?: string): string {
  switch (priority) {
    case "critical":
      return style.priorityCritical("CRITICAL");
    case "high":
      return style.priorityHigh("HIGH");
    case "medium":
      return style.priorityMedium("MEDIUM");
    case "low":
      return style.priorityLow("LOW");
    default:
      return style.priorityMedium("MEDIUM");
  }
}

/** Colorize status text */
export function colorStatus(status: string): string {
  switch (status) {
    case "active":
      return c.green("● ACTIVE");
    case "planning":
      return c.yellow("◌ PLANNING");
    case "completed":
      return c.dim("✓ COMPLETED");
    case "archived":
      return c.brightBlack("⏸ ARCHIVED");
    case "paused":
      return c.yellow("⏸ PAUSED");
    case "abandoned":
      return c.brightBlack("✗ ABANDONED");
    default:
      return status.toUpperCase();
  }
}

/** Apply a color/style to text (legacy support) */
export function color(text: string, ...styleCodes: string[]): string {
  const codes = styleCodes.join("");
  return `${codes}${text}\x1b[0m`;
}
