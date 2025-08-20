import { Request, Response, NextFunction } from 'express';

/**
 * Wraps sync route handlers to ensure they return void
 */
export const syncHandler = (
	fn: (req: Request, res: Response, next: NextFunction) => void
) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		try {
			fn(req, res, next);
		} catch (error) {
			next(error);
		}
	};
};