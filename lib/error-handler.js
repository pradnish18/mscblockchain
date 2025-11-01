import { logger } from './logger';

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export function asyncHandler(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (error) {
      return handleApiError(error, request);
    }
  };
}

export function handleApiError(error, request = null) {
  if (error instanceof AppError) {
    logger.warn('Operational error', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      path: request?.url,
    });

    const response = {
      error: {
        code: error.code,
        message: error.message,
      },
    };

    if (error.details) {
      response.error.details = error.details;
    }

    return Response.json(response, { status: error.statusCode });
  }

  logger.error('Unexpected error', {
    message: error.message,
    stack: error.stack,
    path: request?.url,
  });

  const isDevelopment = process.env.NODE_ENV !== 'production';

  return Response.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: isDevelopment ? error.message : 'An unexpected error occurred',
        ...(isDevelopment && { stack: error.stack }),
      },
    },
    { status: 500 }
  );
}

export function validateRequest(schema, data) {
  const result = schema.safeParse(data);

  if (!result.success) {
    const details = result.error.errors.reduce((acc, err) => {
      const path = err.path.join('.');
      acc[path] = err.message;
      return acc;
    }, {});

    throw new ValidationError('Validation failed', details);
  }

  return result.data;
}

export function requireAuth(session) {
  if (!session || !session.user) {
    throw new AuthenticationError();
  }
  return session.user;
}

export function requireRole(session, role) {
  const user = requireAuth(session);

  if (user.role !== role && user.role !== 'admin') {
    throw new AuthorizationError(`Required role: ${role}`);
  }

  return user;
}

const rateLimitStore = new Map();

export function checkRateLimit(identifier, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const key = `${identifier}`;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  const record = rateLimitStore.get(key);

  if (now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    throw new RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil((record.resetAt - now) / 1000)} seconds`);
  }

  record.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);
