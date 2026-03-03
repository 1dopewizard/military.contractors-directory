/**
 * @file Client logger composable using pino
 * @usage const log = useLogger('IntakeForm'); log.info({ foo: 'bar' }, 'message')
 * @description Provides a browser-compatible pino instance with component-scoped child loggers.
 */
import pino, { type Logger, type LoggerOptions } from "pino";

let rootLogger: Logger | null = null;

function getRootLogger(): Logger {
  if (rootLogger) return rootLogger;
  const options: LoggerOptions = {
    level: import.meta.dev ? "debug" : "info",
    browser: {
      asObject: true,
    },
  } as any;
  rootLogger = pino(options);
  return rootLogger;
}

export function useLogger(component: string) {
  const logger = getRootLogger().child({ component });
  return logger;
}
