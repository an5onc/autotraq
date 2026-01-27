import { z } from 'zod';

export const createInterchangeGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
  description: z.string().optional(),
});

export const addGroupMemberSchema = z.object({
  partId: z.number().int().positive('Part ID is required'),
});

export const groupIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Group ID must be a positive integer'),
});

export const memberParamSchema = z.object({
  id: z.coerce.number().int().positive('Group ID must be a positive integer'),
  partId: z.coerce.number().int().positive('Part ID must be a positive integer'),
});

export type CreateInterchangeGroupInput = z.infer<typeof createInterchangeGroupSchema>;
export type AddGroupMemberInput = z.infer<typeof addGroupMemberSchema>;
