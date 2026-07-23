type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = __DEV__ ? "debug" : "warn";

function log(level: LogLevel, message: string, ...args: any[]) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) {
    return;
  }

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  switch (level) {
    case "error":
      console.error(prefix, message, ...args);
      break;
    case "warn":
      console.warn(prefix, message, ...args);
      break;
    case "debug":
      console.debug(prefix, message, ...args);
      break;
    default:
      console.log(prefix, message, ...args);
  }
}

export const logger = {
  debug: (message: string, ...args: any[]) => log("debug", message, ...args),
  info: (message: string, ...args: any[]) => log("info", message, ...args),
  warn: (message: string, ...args: any[]) => log("warn", message, ...args),
  error: (message: string, ...args: any[]) => log("error", message, ...args),
};