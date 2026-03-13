'use server';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrModerator } from '@/lib/admin/access';

export interface AuditLogFilters {
  search?: string;
  actorId?: string;
  targetType?: string;
  action?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: 'SUPERADMIN' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface AuditLogResult {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditLogStats {
  totalActions: number;
  actionsLast24h: number;
  actionsLast7d: number;
  topActions: { action: string; count: number }[];
}

// Admin-only: full audit log visibility
export async function getAuditLog(
  filters: AuditLogFilters = {}
): Promise<{ success: false; error: string } | { success: true; data: AuditLogResult }> {
  const access = await verifyAdminOrModerator();
  if (!access.authorized || !access.userId) {
    return { success: false, error: 'Unauthorized' };
  }
  if (access.role !== 'SUPERADMIN' && access.role !== 'ADMIN') {
    return { success: false, error: 'Audit log is restricted to administrators' };
  }

  const {
    search = '',
    actorId = '',
    targetType = '',
    action = '',
    page = 1,
    pageSize = 25,
  } = filters;

  const where: Prisma.ModerationAuditLogWhereInput = {};

  if (actorId) {
    where.actorId = actorId;
  }

  if (targetType) {
    where.targetType = targetType;
  }

  if (action) {
    where.action = { contains: action, mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { targetId: { contains: search, mode: 'insensitive' } },
      { reason: { contains: search, mode: 'insensitive' } },
      { actor: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const skip = (page - 1) * pageSize;

  const [logs, total] = await Promise.all([
    prisma.moderationAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        actorId: true,
        actor: { select: { email: true, role: true } },
        action: true,
        targetType: true,
        targetId: true,
        reason: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.moderationAuditLog.count({ where }),
  ]);

  const entries: AuditLogEntry[] = logs.map((log) => ({
    id: log.id,
    actorId: log.actorId,
    actorEmail: log.actor.email,
    actorRole: log.actor.role as 'SUPERADMIN' | 'ADMIN' | 'MODERATOR' | 'MEMBER',
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    reason: log.reason,
    metadata: log.metadata as Record<string, unknown> | null,
    createdAt: log.createdAt,
  }));

  return {
    success: true,
    data: { entries, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getAuditLogStats(): Promise<
  { success: false; error: string } | { success: true; data: AuditLogStats }
> {
  const access = await verifyAdminOrModerator();
  if (!access.authorized || !access.userId) {
    return { success: false, error: 'Unauthorized' };
  }
  if (access.role !== 'SUPERADMIN' && access.role !== 'ADMIN') {
    return { success: false, error: 'Audit log is restricted to administrators' };
  }

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalActions, actionsLast24h, actionsLast7d, actionCounts] = await Promise.all([
    prisma.moderationAuditLog.count(),
    prisma.moderationAuditLog.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.moderationAuditLog.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.moderationAuditLog.groupBy({
      by: ['action'],
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 5,
    }),
  ]);

  const topActions = actionCounts.map((row) => ({
    action: row.action,
    count: row._count.action,
  }));

  return {
    success: true,
    data: { totalActions, actionsLast24h, actionsLast7d, topActions },
  };
}

export async function getDistinctActors(): Promise<
  { success: false; error: string } | { success: true; data: { id: string; email: string }[] }
> {
  const access = await verifyAdminOrModerator();
  if (!access.authorized || !access.userId) {
    return { success: false, error: 'Unauthorized' };
  }
  if (access.role !== 'SUPERADMIN' && access.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' };
  }

  const actors = await prisma.user.findMany({
    where: {
      moderationAuditLogs: { some: {} },
    },
    select: { id: true, email: true },
    orderBy: { email: 'asc' },
  });

  return { success: true, data: actors };
}
