/**
 * Response Helper Utilities
 *
 * Standardized response formatting for consistent API responses.
 *
 * RESPONSE FORMATS:
 * - Success: { success: true, data: T, message?: string }
 * - Error: { success: false, error: string, details?: any }
 *
 * BENEFITS:
 * - Consistent response structure across all endpoints
 * - Type-safe response helpers
 * - Automatic HTTP status code handling
 * - Optional messages and error details
 *
 * USAGE:
 * ```typescript
 * // Success responses
 * successResponse(res, users); // 200 OK
 * createdResponse(res, newUser); // 201 Created
 * noContentResponse(res); // 204 No Content
 *
 * // Error responses
 * errorResponse(res, 'Not found', 404);
 * errorResponse(res, 'Validation failed', 400, validationErrors);
 * ```
 */
import { Response } from 'express';

interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}

/**
 * Success Response
 *
 * Returns a standardized success response with data.
 *
 * @param {Response} res - Express response object
 * @param {T} data - Response data payload
 * @param {string} [message] - Optional success message
 * @param {number} [statusCode=200] - HTTP status code (default: 200)
 * @returns {Response} Express response
 */
export const successResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response<SuccessResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
};

/**
 * Error Response
 *
 * Returns a standardized error response.
 *
 * @param {Response} res - Express response object
 * @param {string} error - Error message
 * @param {number} [statusCode=500] - HTTP status code (default: 500)
 * @param {any} [details] - Optional error details (e.g., validation errors)
 * @returns {Response} Express response
 */
export const errorResponse = (
  res: Response,
  error: string,
  statusCode: number = 500,
  details?: any
): Response<ErrorResponse> => {
  return res.status(statusCode).json({
    success: false,
    error,
    ...(details && { details }),
  });
};

/**
 * Created Response
 *
 * Returns a 201 Created response for newly created resources.
 *
 * @param {Response} res - Express response object
 * @param {T} data - Created resource data
 * @param {string} [message] - Success message (default: 'Resource created successfully')
 * @returns {Response} Express response with 201 status
 */
export const createdResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): Response<SuccessResponse<T>> => {
  return successResponse(res, data, message, 201);
};

/**
 * No Content Response
 *
 * Returns a 204 No Content response (typically for successful DELETE operations).
 *
 * @param {Response} res - Express response object
 * @returns {Response} Express response with 204 status
 */
export const noContentResponse = (res: Response): Response => {
  return res.status(204).send();
};
