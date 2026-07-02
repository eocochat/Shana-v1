import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// ==========================================
// API STANDARDS: RESPONSE & ERROR SCHEMAS
// ==========================================

export interface StandardResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  metadata?: Record<string, any>;
}

export interface StandardErrorResponse {
  success: false;
  error_code: string;
  message: string;
}

// Extends Express response with helper methods
export interface GatewayResponse extends Response {
  success: (data: any, message?: string, metadata?: Record<string, any>) => void;
  error: (errorCode: string, message: string, statusCode?: number) => void;
}

export function responseStandardizerMiddleware(req: Request, res: Response, next: NextFunction) {
  const gatewayRes = res as unknown as GatewayResponse;

  gatewayRes.success = function (data: any, message?: string, metadata?: Record<string, any>) {
    const response: StandardResponse = {
      success: true,
      message,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        ...metadata
      }
    };
    res.status(200).json(response);
  };

  gatewayRes.error = function (errorCode: string, message: string, statusCode = 400) {
    const response: StandardErrorResponse = {
      success: false,
      error_code: errorCode,
      message
    };
    res.status(statusCode).json(response);
  };

  next();
}

// ==========================================
// REQUEST LOGGING
// ==========================================

export interface ApiLog {
  requestId: string;
  userId?: string;
  endpoint: string;
  method: string;
  executionTimeMs: number;
  statusCode: number;
  serviceCalled: string;
  timestamp: string;
}

const auditLogs: ApiLog[] = [];

export function requestLoggerMiddleware(serviceName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    
    // Add request ID to headers
    res.setHeader("X-Request-ID", requestId);

    res.on("finish", () => {
      const executionTimeMs = Date.now() - startTime;
      const userId = req.cookies?.shana_sid || req.body?.userId || (req.query?.userId as string) || "anonymous";
      
      const logEntry: ApiLog = {
        requestId,
        userId,
        endpoint: req.originalUrl,
        method: req.method,
        executionTimeMs,
        statusCode: res.statusCode,
        serviceCalled: serviceName,
        timestamp: new Date().toISOString()
      };

      auditLogs.push(logEntry);
      
      // Print micro logs in developer-friendly format
      console.log(
        `[SHANA GATEWAY] [${requestId.slice(0, 8)}] ${req.method} ${req.originalUrl} - ` +
        `Status: ${res.statusCode} | Service: ${serviceName} | User: ${userId} | Duration: ${executionTimeMs}ms`
      );
    });

    next();
  };
}

export function getGatewayAuditLogs(): ApiLog[] {
  return auditLogs;
}

// ==========================================
// RATE LIMITER
// ==========================================

export interface RateLimitRule {
  windowMs: number;
  max: number;
}

export const rateLimitConfigs: Record<string, RateLimitRule> = {
  login: { 
    windowMs: Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS) || 15 * 60 * 1000, 
    max: Number(process.env.RATE_LIMIT_LOGIN_MAX) || 20 
  },
  ai: { 
    windowMs: Number(process.env.RATE_LIMIT_AI_WINDOW_MS) || 1 * 60 * 1000, 
    max: Number(process.env.RATE_LIMIT_AI_MAX) || 10 
  },
  uploads: { 
    windowMs: Number(process.env.RATE_LIMIT_UPLOADS_WINDOW_MS) || 5 * 60 * 1000, 
    max: Number(process.env.RATE_LIMIT_UPLOADS_MAX) || 15 
  },
  reports: {
    windowMs: Number(process.env.RATE_LIMIT_REPORTS_WINDOW_MS) || 10 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_REPORTS_MAX) || 5
  },
  password_reset: {
    windowMs: Number(process.env.RATE_LIMIT_RESET_WINDOW_MS) || 30 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_RESET_MAX) || 3
  },
  default: { 
    windowMs: Number(process.env.RATE_LIMIT_DEFAULT_WINDOW_MS) || 1 * 60 * 1000, 
    max: Number(process.env.RATE_LIMIT_DEFAULT_MAX) || 100 
  }
};

export function updateRateLimitConfig(type: string, windowMs: number, max: number): void {
  rateLimitConfigs[type] = { windowMs, max };
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimiterMiddleware(type: keyof typeof rateLimitConfigs = "default") {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers["x-forwarded-for"] as string || "unknown-ip";
    const userId = req.cookies?.shana_sid || "anonymous";
    const key = `ratelimit:${type}:${userId}:${ip}`;
    const rule = rateLimitConfigs[type];

    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + rule.windowMs
      });
      res.setHeader("X-RateLimit-Limit", rule.max);
      res.setHeader("X-RateLimit-Remaining", rule.max - 1);
      res.setHeader("X-RateLimit-Reset", new Date(now + rule.windowMs).toISOString());
      return next();
    }

    if (record.count >= rule.max) {
      const gatewayRes = res as unknown as GatewayResponse;
      res.setHeader("Retry-After", Math.ceil((record.resetTime - now) / 1000));
      return gatewayRes.error(
        "RATE_LIMIT_EXCEEDED",
        `Too many requests for security bucket: ${type}. Please slow down.`,
        429
      );
    }

    record.count++;
    res.setHeader("X-RateLimit-Limit", rule.max);
    res.setHeader("X-RateLimit-Remaining", rule.max - record.count);
    res.setHeader("X-RateLimit-Reset", new Date(record.resetTime).toISOString());
    next();
  };
}

// ==========================================
// REQUEST VALIDATION
// ==========================================

export function validateRequestSchema(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing: string[] = [];
    const source = req.method === "GET" ? req.query : req.body;

    for (const field of requiredFields) {
      if (source[field] === undefined || source[field] === null || source[field] === "") {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      const gatewayRes = res as unknown as GatewayResponse;
      return gatewayRes.error(
        "VALIDATION_ERROR",
        `Missing required fields: ${missing.join(", ")}`,
        400
      );
    }

    next();
  };
}

export function validateSessionMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = req.cookies?.shana_sid;
  const gatewayRes = res as unknown as GatewayResponse;

  if (!userId) {
    return gatewayRes.error(
      "UNAUTHORIZED",
      "Authentication is required. No active session cookie found.",
      401
    );
  }

  next();
}

// ==========================================
// ERROR HANDLING
// ==========================================

export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("[SHANA GATEWAY ERROR]", err);
  const response: StandardErrorResponse = {
    success: false,
    error_code: "INTERNAL_SERVER_ERROR",
    message: "A secure, centralized server exception occurred. The error details have been scrubbed."
  };
  res.status(500).json(response);
}

// ==========================================
// AUTOMATED API DOCUMENTATION
// ==========================================

export interface ApiDocEndpoint {
  path: string;
  method: string;
  description: string;
  requiresAuth: boolean;
  requestSchema?: Record<string, any>;
  responseSchema?: Record<string, any>;
  errorResponses?: Record<string, string>;
}

const registeredEndpoints: ApiDocEndpoint[] = [];

export function registerApiDoc(endpoint: ApiDocEndpoint) {
  registeredEndpoints.push(endpoint);
}

export function getApiDocs(): ApiDocEndpoint[] {
  return registeredEndpoints;
}
