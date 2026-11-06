export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code: string | undefined;
  public details: unknown;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    details?: unknown,
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;

    // Fix prototype chain (important in TS/Node)
    Object.setPrototypeOf(this, AppError.prototype);

    Error.captureStackTrace(this);
  }
}