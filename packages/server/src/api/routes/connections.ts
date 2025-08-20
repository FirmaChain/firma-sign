import { Router } from 'express';
import { z } from 'zod';
import { ConnectionManager } from '../../services/ConnectionManager';
import { logger } from '../../utils/logger';
import { asyncHandler } from '../../utils/asyncHandler';

const router: Router = Router();
let connectionManager: ConnectionManager;

// Initialize connection manager
export function initializeConnectionRoutes(cm: ConnectionManager): Router {
	connectionManager = cm;
	return router;
}

// Validation schemas
const initializeSchema = z.object({
	transports: z.array(z.enum(['p2p', 'email', 'discord', 'telegram'])),
	config: z.object({
		p2p: z.object({
			port: z.number().optional(),
			enableDHT: z.boolean().optional(),
			enableMDNS: z.boolean().optional(),
		}).optional(),
		email: z.object({
			smtp: z.object({
				host: z.string(),
				port: z.number(),
				auth: z.object({
					user: z.string(),
					pass: z.string(),
				}),
			}),
		}).optional(),
		discord: z.object({
			botToken: z.string(),
			guildId: z.string(),
		}).optional(),
	}),
});

/**
 * POST /api/connections/initialize
 * Initialize connection manager with selected transports
 */
router.post('/initialize', asyncHandler(async (req, res) => {
	try {
		const validated = initializeSchema.parse(req.body);
		const result = await connectionManager.initialize(validated.transports, validated.config as Record<string, unknown>);
		res.json(result);
	} catch (error) {
		if (error instanceof z.ZodError) {
			res.status(400).json({
				error: {
					code: 'INVALID_REQUEST',
					message: 'Invalid request data',
					details: error.errors,
				},
			});
			return;
		}
		
		logger.error('Failed to initialize connections', error);
		res.status(500).json({
			error: {
				code: 'INITIALIZATION_FAILED',
				message: 'Failed to initialize connections',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

/**
 * GET /api/connections/status
 * Get the current status of all connections and transports
 */
router.get('/status', (req, res) => {
	try {
		const status = connectionManager.getStatus();
		res.json(status);
	} catch (error) {
		logger.error('Failed to get connection status', error);
		res.status(500).json({
			error: {
				code: 'STATUS_ERROR',
				message: 'Failed to get connection status',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
});

export default router;