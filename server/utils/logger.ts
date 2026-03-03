/**
 * @file Application logger built on pino for structured logs
 * @usage import { getLogger } from '@/server/utils/logger'
 * @description Provides a singleton pino logger with sensible defaults and context helpers.
 */
import pino, { type Logger, type LoggerOptions } from "pino";

let loggerInstance: Logger | null = null;

function createLogger(): Logger {
  const options: LoggerOptions = {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    base: undefined, // do not include pid/hostname by default
    redact: {
      paths: [
        "req.headers.authorization",
        "event.headers.authorization",
        "config.stripeSecretKey",
        "config.supabaseServiceRoleKey",
      ],
      remove: true,
    },
  };
  return pino(options);
}

export function getLogger(): Logger {
  if (!loggerInstance) loggerInstance = createLogger();
  return loggerInstance;
}

export function withContext(context: Record<string, unknown>) {
  return getLogger().child(context);
}
