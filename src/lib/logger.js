const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;
const isProduction = process.env.NODE_ENV === 'production';

function formatLogEntry(level, message, meta = {}) {
  const timestamp = new Date().toISOString();

  if (isProduction) {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
    });
  } else {
    const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }
}

function log(level, levelValue, message, meta = {}) {
  if (levelValue > currentLogLevel) return;

  const entry = formatLogEntry(level, message, meta);

  if (levelValue === LOG_LEVELS.ERROR) {
    console.error(entry);
  } else if (levelValue === LOG_LEVELS.WARN) {
    console.warn(entry);
  } else {
    console.log(entry);
  }
}

export const logger = {
  error(message, meta = {}) {
    log('ERROR', LOG_LEVELS.ERROR, message, meta);
  },

  warn(message, meta = {}) {
    log('WARN', LOG_LEVELS.WARN, message, meta);
  },

  info(message, meta = {}) {
    log('INFO', LOG_LEVELS.INFO, message, meta);
  },

  debug(message, meta = {}) {
    log('DEBUG', LOG_LEVELS.DEBUG, message, meta);
  },

  apiRequest(method, endpoint, meta = {}) {
    this.info(`API Request: ${method} ${endpoint}`, {
      type: 'api_request',
      method,
      endpoint,
      ...meta,
    });
  },

  apiResponse(method, endpoint, status, duration, meta = {}) {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    this[level](`API Response: ${method} ${endpoint} - ${status} (${duration}ms)`, {
      type: 'api_response',
      method,
      endpoint,
      status,
      duration,
      ...meta,
    });
  },

  dbQuery(operation, table, meta = {}) {
    this.debug(`DB Query: ${operation} on ${table}`, {
      type: 'db_query',
      operation,
      table,
      ...meta,
    });
  },

  security(event, meta = {}) {
    this.warn(`Security Event: ${event}`, {
      type: 'security',
      event,
      ...meta,
    });
  },

  business(event, meta = {}) {
    this.info(`Business Event: ${event}`, {
      type: 'business',
      event,
      ...meta,
    });
  },
};
