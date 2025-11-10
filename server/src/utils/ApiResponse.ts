import { Response } from 'express';

/**
 * Standardized API Response Wrapper Class.
 *
 * Provides a consistent structure for all API responses, making it
 * predictable for the frontend to consume.
 *
 * @template T The type of the data payload.
 */
export class ApiResponse<T> {
  public success: boolean;
  public statusCode: number;
  public message: string;
  public data: T | null;

  /**
   * Creates an instance of ApiResponse.
   * @param statusCode - The HTTP status code.
   * @param message - A descriptive message about the result.
   * @param data - The data payload (if any).
   */
  constructor(statusCode: number, message: string, data: T | null = null) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  /**
   * Sends the structured response using the Express Response object.
   * @param res - The Express Response object.
   */
  public send(res: Response): void {
    res.status(this.statusCode).json(this);
  }

  // --- Static Helper Methods for Common Responses ---

  /**
   * Creates a 200 OK response.
   * @param message - Response message.
   * @param data - Data payload.
   */
  static ok<T>(res: Response, message: string, data: T): void {
    new ApiResponse(200, message, data).send(res);
  }

  /**
   * Creates a 201 Created response.
   * @param message - Response message.
   * @param data - Newly created resource.
   */
  static created<T>(res: Response, message: string, data: T): void {
    new ApiResponse(201, message, data).send(res);
  }

  /**
   * Creates a 204 No Content response.
   * Typically used for successful deletions.
   * @param message - Response message.
   */
  static noContent(res: Response, message: string): void {
    new ApiResponse(204, message, null).send(res);
  }
}

/**
 * Convenience function for a 200 OK response.
 * @example
 * return sendSuccess(res, 'User fetched successfully', user);
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data: T,
  statusCode: number = 200,
) => {
  new ApiResponse(statusCode, message, data).send(res);
};