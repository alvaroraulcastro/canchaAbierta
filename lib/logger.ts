type LogLevel = "debug" | "info" | "warn" | "error";

type LogEntry = {
  level: LogLevel;
  module: string;
  message: string;
  error?: unknown;
  [key: string]: unknown;
};

function formatEntry(entry: LogEntry): string {
  const data: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level: entry.level,
    module: entry.module,
    message: entry.message,
  };
  for (const [key, value] of Object.entries(entry)) {
    if (key === "error" || key === "level" || key === "module" || key === "message") continue;
    data[key] = value;
  }
  if (entry.error instanceof Error) {
    data.errorName = entry.error.name;
    data.errorMessage = entry.error.message;
    data.errorStack = entry.error.stack;
  } else if (entry.error !== undefined) {
    data.error = String(entry.error);
  }
  return JSON.stringify(data);
}

function log(level: LogLevel, module: string, message: string, extra?: Record<string, unknown>) {
  const entry: LogEntry = { level, module, message, ...extra };
  const formatted = formatEntry(entry);
  if (level === "error") {
    console.error(formatted);
  } else if (level === "warn") {
    console.warn(formatted);
  } else if (level === "debug") {
    console.debug(formatted);
  } else {
    console.info(formatted);
  }
}

export function createLogger(module: string) {
  return {
    debug(message: string, extra?: Record<string, unknown>) {
      log("debug", module, message, extra);
    },
    info(message: string, extra?: Record<string, unknown>) {
      log("info", module, message, extra);
    },
    warn(message: string, extra?: Record<string, unknown>) {
      log("warn", module, message, extra);
    },
    error(message: string, error?: unknown, extra?: Record<string, unknown>) {
      log("error", module, message, { ...extra, error });
    },
  };
}
