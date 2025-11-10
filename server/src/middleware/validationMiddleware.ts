import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from './errorHandler';
import expressAsyncHandler from 'express-async-handler';

export const validateRequest = (schema: AnyZodObject) =>
  expressAsyncHandler(
    async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const parsedSchema = await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });

        req.body = parsedSchema.body;
        req.query = parsedSchema.query;
        req.params = parsedSchema.params;

        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const formattedMessage = error.errors
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join('; ');

          throw new ApiError(400, `Validation failed: ${formattedMessage}`);
        }
        next(error);
      }
    },
  );