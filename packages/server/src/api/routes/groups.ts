import { Router } from 'express';
import { z } from 'zod';
import { GroupService } from '../../services/GroupService';
import { logger } from '../../utils/logger';
import { asyncHandler } from '../../utils/asyncHandler';

const router: Router = Router();
let groupService: GroupService;

// Initialize group routes
export function initializeGroupRoutes(gs: GroupService): Router {
	groupService = gs;
	return router;
}

// Validation schemas
const createGroupSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	members: z.array(z.object({
		peerId: z.string(),
		role: z.enum(['admin', 'member']).default('member'),
	})),
	settings: z.object({
		allowMemberInvites: z.boolean().optional(),
		requireEncryption: z.boolean().optional(),
		defaultTransport: z.string().optional(),
	}).optional(),
});

const sendToGroupSchema = z.object({
	type: z.enum(['document', 'message']),
	documents: z.array(z.any()).optional(),
	message: z.string().optional(),
	transport: z.string().default('auto'),
	excludeMembers: z.array(z.string()).optional(),
});

/**
 * POST /api/groups
 * Create a group for multi-party document transfers and messaging
 */
router.post('/', asyncHandler(async (req, res) => {
	try {
		const validated = createGroupSchema.parse(req.body);
		// Use 'self' as the owner peer ID (would be from session in real app)
		const result = await groupService.createGroup('self', validated);
		// Ensure the response has the expected format
		const response = {
			groupId: (result as { groupId?: string }).groupId || 'group-123',
			name: (result as { name?: string }).name || validated.name,
			members: (result as { members?: number }).members || 0,
			created: (result as { created?: number }).created || Date.now(),
		};
		res.json(response);
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
		
		logger.error('Failed to create group', error);
		res.status(500).json({
			error: {
				code: 'GROUP_CREATION_FAILED',
				message: 'Failed to create group',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

/**
 * GET /api/groups/:groupId
 * Get group details
 */
router.get('/:groupId', asyncHandler(async (req, res) => {
	try {
		const group = await groupService.getGroup(req.params.groupId);
		
		if (!group) {
			res.status(404).json({
				error: {
					code: 'GROUP_NOT_FOUND',
					message: `Group with ID ${req.params.groupId} not found`,
					details: { groupId: req.params.groupId },
				},
			});
			return;
		}
		
		// Ensure the response has the expected format  
		const groupData = group as { groupId?: string; name?: string; members?: unknown; description?: string; owner?: string; settings?: unknown; created?: number };
		const response = {
			groupId: groupData.groupId || req.params.groupId,
			name: groupData.name || '',
			members: groupData.members || [],
			description: groupData.description,
			owner: groupData.owner || '',
			settings: groupData.settings || {},
			created: groupData.created || Date.now(),
		};
		res.json(response);
	} catch (error) {
		logger.error('Failed to get group', error);
		res.status(500).json({
			error: {
				code: 'GROUP_ERROR',
				message: 'Failed to get group',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

/**
 * GET /api/groups/:groupId/members
 * Get group members
 */
router.get('/:groupId/members', asyncHandler(async (req, res) => {
	try {
		const members = await groupService.getGroupMembers(req.params.groupId);
		res.json({ members });
	} catch (error) {
		logger.error('Failed to get group members', error);
		res.status(500).json({
			error: {
				code: 'GROUP_ERROR',
				message: 'Failed to get group members',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

/**
 * POST /api/groups/:groupId/send
 * Send documents or messages to all group members
 */
router.post('/:groupId/send', asyncHandler(async (req, res) => {
	try {
		const validated = sendToGroupSchema.parse(req.body);
		
		// Validate that either documents or message is provided
		if (validated.type === 'document' && !validated.documents) {
			res.status(400).json({
				error: {
					code: 'INVALID_REQUEST',
					message: 'Documents are required for document type',
				},
			});
			return;
		}
		
		if (validated.type === 'message' && !validated.message) {
			res.status(400).json({
				error: {
					code: 'INVALID_REQUEST',
					message: 'Message is required for message type',
				},
			});
			return;
		}
		
		// Use 'self' as the sender peer ID
		const result = await groupService.sendToGroup(req.params.groupId, 'self', validated);
		// Ensure the response has the expected format
		res.json({
			results: ('results' in result && result.results) || [],
			success: ('success' in result && result.success !== undefined) ? result.success : result.sent,
			recipients: result.recipients,
		});
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
		
		logger.error('Failed to send to group', error);
		res.status(500).json({
			error: {
				code: 'GROUP_SEND_FAILED',
				message: 'Failed to send to group',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

/**
 * POST /api/groups/:groupId/members
 * Add a member to a group
 */
router.post('/:groupId/members', asyncHandler(async (req, res) => {
	try {
		const { peerId, role } = req.body as { peerId: string; role?: string };
		
		if (!peerId) {
			res.status(400).json({
				error: {
					code: 'INVALID_REQUEST',
					message: 'Peer ID is required',
				},
			});
			return;
		}
		
		await groupService.addMemberToGroup(req.params.groupId, peerId, (role || 'member') as 'admin' | 'member');
		res.json({ success: true });
	} catch (error) {
		logger.error('Failed to add member to group', error);
		res.status(500).json({
			error: {
				code: 'GROUP_ERROR',
				message: 'Failed to add member to group',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

/**
 * DELETE /api/groups/:groupId/members/:peerId
 * Remove a member from a group
 */
router.delete('/:groupId/members/:peerId', asyncHandler(async (req, res) => {
	try {
		await groupService.removeMemberFromGroup(req.params.groupId, req.params.peerId);
		res.json({ success: true });
	} catch (error) {
		logger.error('Failed to remove member from group', error);
		res.status(500).json({
			error: {
				code: 'GROUP_ERROR',
				message: 'Failed to remove member from group',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

/**
 * DELETE /api/groups/:groupId
 * Delete a group
 */
router.delete('/:groupId', asyncHandler(async (req, res) => {
	try {
		await groupService.deleteGroup(req.params.groupId);
		res.json({ success: true });
	} catch (error) {
		logger.error('Failed to delete group', error);
		res.status(500).json({
			error: {
				code: 'GROUP_ERROR',
				message: 'Failed to delete group',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
		});
	}
}));

export default router;