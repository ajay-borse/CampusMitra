/**
 * Centralized Error Handling Middleware for Express
 *
 * Whenever an error occurs in any controller or route handler,
 * calling next(error) forwards the error to this middleware.
 * It formats the error as a consistent JSON response.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`❌ [Error Handler] ${err.name || 'Error'}: ${err.message}`);

  // Handle malformed JSON body errors from express.json()
  if (err instanceof SyntaxError && (err.status === 400 || err.statusCode === 400) && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload. Please ensure request body contains valid JSON.',
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', '),
    });
  }

  // Handle Mongoose bad ObjectId CastError
  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      message: `Resource not found with id: ${err.value}`,
    });
  }

  // Default to 500 if status code hasn't been set
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Only return the detailed stack trace in development mode
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
