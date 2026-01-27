import prisma from '../repositories/prisma.js';
import { CreateInterchangeGroupInput } from '../schemas/interchange.schema.js';

export async function createInterchangeGroup(input: CreateInterchangeGroupInput) {
  return prisma.interchangeGroup.create({
    data: input,
  });
}

export async function getInterchangeGroups() {
  return prisma.interchangeGroup.findMany({
    include: {
      members: {
        include: {
          part: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getInterchangeGroupById(id: number) {
  const group = await prisma.interchangeGroup.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          part: true,
        },
      },
    },
  });

  if (!group) {
    throw new Error('Interchange group not found');
  }

  return group;
}

export async function addMemberToGroup(groupId: number, partId: number) {
  // Verify group exists
  const group = await prisma.interchangeGroup.findUnique({ where: { id: groupId } });
  if (!group) {
    throw new Error('Interchange group not found');
  }

  // Verify part exists
  const part = await prisma.part.findUnique({ where: { id: partId } });
  if (!part) {
    throw new Error('Part not found');
  }

  // Check if already a member
  const existing = await prisma.interchangeGroupMember.findUnique({
    where: { groupId_partId: { groupId, partId } },
  });

  if (existing) {
    throw new Error('Part is already a member of this group');
  }

  return prisma.interchangeGroupMember.create({
    data: { groupId, partId },
    include: { part: true, group: true },
  });
}

export async function removeMemberFromGroup(groupId: number, partId: number) {
  const member = await prisma.interchangeGroupMember.findUnique({
    where: { groupId_partId: { groupId, partId } },
  });

  if (!member) {
    throw new Error('Part is not a member of this group');
  }

  await prisma.interchangeGroupMember.delete({
    where: { groupId_partId: { groupId, partId } },
  });
}

/**
 * Get all interchangeable parts for a given part
 */
export async function getInterchangeableParts(partId: number) {
  // Find all groups this part belongs to
  const memberships = await prisma.interchangeGroupMember.findMany({
    where: { partId },
    include: {
      group: {
        include: {
          members: {
            include: {
              part: true,
            },
          },
        },
      },
    },
  });

  // Collect all interchangeable parts (excluding the original part)
  const interchangeableParts = new Map<number, typeof memberships[0]['group']['members'][0]['part']>();

  for (const membership of memberships) {
    for (const member of membership.group.members) {
      if (member.partId !== partId) {
        interchangeableParts.set(member.partId, member.part);
      }
    }
  }

  return Array.from(interchangeableParts.values());
}
