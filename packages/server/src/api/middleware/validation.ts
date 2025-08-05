import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export function validateRequest<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body) as z.infer<T>;
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        res.status(500).json({
          error: 'Internal server error'
        });
      }
    }
  };
}