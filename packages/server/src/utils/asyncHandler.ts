import { Request, Response, NextFunction } from 'express';

/**
 * Wraps async route handlers to ensure proper error handling
 */
export const asyncHandler = (
	fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void
) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		const result = fn(req, res, next);
		if (result instanceof Promise) {
			result.catch(next);
		}
	};
};