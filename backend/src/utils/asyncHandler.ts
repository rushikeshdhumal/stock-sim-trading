/**
 * Async Handler Utility
 *
 * Wraps async Express route handlers to automatically catch errors.
 * Eliminates need for try-catch blocks in every async controller.
 *
 * WHY NEEDED:
 * Express doesn't automatically catch errors in async functions.
 * Without this wrapper, uncaught promise rejections crash the server.
 *
 * USAGE:
 * ```typescript
 * // Without asyncHandler (verbose)
 * router.get('/users', async (req, res, next) => {
 *   try {
 *     const users = await getUsers();
 *     res.json(users);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 *
 * // With asyncHandler (clean)
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsers();
 *   res.json(users);
 * }));
 * ```
 *
 * ERROR HANDLING:
 * - Caught errors passed to Express error middleware via next(error)
 * - Error middleware formats and logs errors consistently
 */
import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Async Handler Wrapper
 *
 * Wraps an async route handler to catch promise rejections.
 *
 * @param {AsyncFunction} fn - Async route handler function
 * @returns {Function} Wrapped function that catches errors
 */
export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
