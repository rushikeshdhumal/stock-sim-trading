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

export const createdResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): Response<SuccessResponse<T>> => {
  return successResponse(res, data, message, 201);
};

export const noContentResponse = (res: Response): Response => {
  return res.status(204).send();
};
