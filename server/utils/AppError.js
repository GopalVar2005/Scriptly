class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;  // Mark this error as operational (expected)
    Error.captureStackTrace(this, this.constructor);  // Capture the stack trace for better debugging
  }
}
module.exports = AppError;
