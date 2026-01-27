import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as interchangeService from '../services/interchange.service.js';
import { CreateInterchangeGroupInput, AddGroupMemberInput } from '../schemas/interchange.schema.js';
import { success, created, validationError, notFound, serverError } from '../utils/response.js';

export async function createGroup(req: AuthenticatedRequest, res: Response) {
  try {
    const input: CreateInterchangeGroupInput = req.body;
    const group = await interchangeService.createInterchangeGroup(input);
    created(res, group);
  } catch (err) {
    console.error('Create interchange group error:', err);
    serverError(res);
  }
}

export async function getGroups(req: AuthenticatedRequest, res: Response) {
  try {
    const groups = await interchangeService.getInterchangeGroups();
    success(res, groups);
  } catch (err) {
    console.error('Get interchange groups error:', err);
    serverError(res);
  }
}

export async function getGroupById(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const group = await interchangeService.getInterchangeGroupById(id);
    success(res, group);
  } catch (err) {
    if (err instanceof Error && err.message === 'Interchange group not found') {
      notFound(res, err.message);
      return;
    }
    console.error('Get interchange group error:', err);
    serverError(res);
  }
}

export async function addMember(req: AuthenticatedRequest, res: Response) {
  try {
    const groupId = parseInt(req.params.id, 10);
    const input: AddGroupMemberInput = req.body;
    const member = await interchangeService.addMemberToGroup(groupId, input.partId);
    created(res, member);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Interchange group not found' || err.message === 'Part not found') {
        notFound(res, err.message);
        return;
      }
      if (err.message === 'Part is already a member of this group') {
        validationError(res, err.message);
        return;
      }
    }
    console.error('Add member to group error:', err);
    serverError(res);
  }
}

export async function removeMember(req: AuthenticatedRequest, res: Response) {
  try {
    const groupId = parseInt(req.params.id, 10);
    const partId = parseInt(req.params.partId, 10);
    await interchangeService.removeMemberFromGroup(groupId, partId);
    success(res, { message: 'Member removed from group' });
  } catch (err) {
    if (err instanceof Error && err.message === 'Part is not a member of this group') {
      notFound(res, err.message);
      return;
    }
    console.error('Remove member from group error:', err);
    serverError(res);
  }
}

export async function getInterchangeableParts(req: AuthenticatedRequest, res: Response) {
  try {
    const partId = parseInt(req.params.partId, 10);
    const parts = await interchangeService.getInterchangeableParts(partId);
    success(res, parts);
  } catch (err) {
    console.error('Get interchangeable parts error:', err);
    serverError(res);
  }
}
