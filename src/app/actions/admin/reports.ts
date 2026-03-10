'use server';

import { prisma } from '@/lib/prisma';
import { verifyAdminOrModerator } from '@/lib/admin/access';
import { ADMIN_CAPABILITIES } from '@/lib/admin/capabilities';
import { Prisma } from '@prisma/client';

export interface ReportSummary {
  id: string;
  reporterEmail: string;
  reporterAlias: string;
  reportedUserId: string | null;
  reportedUserEmail: string | null;
  reportedUserAlias: string | null;
  reportedUserRisk: 'GREEN' | 'AMBER' | 'RED' | null;
  reason: string;
  status: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
  hasThread: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlaggedUser {
  userId: string;
  email: string;
  alias: string;
  riskLabel: 'GREEN' | 'AMBER' | 'RED';
  riskNotes: string | null;
  riskLabeledAt: string | null;
  profileStatus: 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED';
  openReports: number;
  totalReports: number;
  createdAt: string;
}

interface PaginatedReportsResponse {
  success: boolean;
  data?: {
    reports: ReportSummary[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  errors?: { general?: string };
}

interface ActionResult {
  success: boolean;
  message?: string;
  errors?: { general?: string };
}

export async function getReports(filters?: {
  status?: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<PaginatedReportsResponse> {
  const { authorized } = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MANAGE_REPORTS);

  if (!authorized) {
    return {
      success: false,
      errors: { general: 'Not authorized to view reports' },
    };
  }

  try {
    const {
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters || {};

    const where: Prisma.ReportWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          reporter: {
            email: { contains: search, mode: 'insensitive' },
          },
        },
        {
          reporter: {
            profile: {
              alias: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          reportedUser: {
            email: { contains: search, mode: 'insensitive' },
          },
        },
        {
          reason: { contains: search, mode: 'insensitive' },
        },
      ];
    }

    const total = await prisma.report.count({ where });

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            email: true,
            profile: { select: { alias: true } },
          },
        },
        reportedUser: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                alias: true,
                riskLabel: true,
              },
            },
          },
        },
        messageThread: {
          select: { id: true },
        },
      },
      orderBy: {
        [sortBy]: sortOrder as Prisma.SortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data: ReportSummary[] = reports.map((report) => ({
      id: report.id,
      reporterEmail: report.reporter.email,
      reporterAlias: report.reporter.profile?.alias || 'N/A',
      reportedUserId: report.reportedUser?.id || null,
      reportedUserEmail: report.reportedUser?.email || null,
      reportedUserAlias: report.reportedUser?.profile?.alias || null,
      reportedUserRisk: (report.reportedUser?.profile?.riskLabel as 'GREEN' | 'AMBER' | 'RED') || null,
      reason: report.reason,
      status: report.status as 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED',
      hasThread: !!report.messageThread,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    }));

    return {
      success: true,
      data: {
        reports: data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching reports:', error);
    return {
      success: false,
      errors: { general: 'Failed to fetch reports' },
    };
  }
}

export async function updateReportStatus(
  reportId: string,
  status: 'REVIEWING' | 'RESOLVED' | 'DISMISSED',
  note?: string
): Promise<ActionResult> {
  const access = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MANAGE_REPORTS);

  if (!access.authorized || !access.userId) {
    return {
      success: false,
      errors: { general: 'Not authorized' },
    };
  }

  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { reportedUserId: true, status: true },
    });

    if (!report) {
      return {
        success: false,
        errors: { general: 'Report not found' },
      };
    }

    await prisma.report.update({
      where: { id: reportId },
      data: { status },
    });

    await prisma.moderationAuditLog.create({
      data: {
        actorId: access.userId,
        action: `REPORT_${status}`,
        targetType: 'Report',
        targetId: reportId,
        reason: note,
        metadata: {
          reportedUserId: report.reportedUserId,
          previousStatus: report.status,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      success: true,
      message: `Report marked as ${status.toLowerCase()}`,
    };
  } catch (error) {
    console.error('Error updating report:', error);
    return {
      success: false,
      errors: { general: 'Failed to update report' },
    };
  }
}

export async function getReportStats() {
  const { authorized } = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MANAGE_REPORTS);

  if (!authorized) {
    return {
      success: false,
      errors: { general: 'Not authorized' },
    };
  }

  try {
    const [open, reviewing, resolved, dismissed] = await Promise.all([
      prisma.report.count({ where: { status: 'OPEN' } }),
      prisma.report.count({ where: { status: 'REVIEWING' } }),
      prisma.report.count({ where: { status: 'RESOLVED' } }),
      prisma.report.count({ where: { status: 'DISMISSED' } }),
    ]);

    return {
      success: true,
      data: { open, reviewing, resolved, dismissed, total: open + reviewing + resolved + dismissed },
    };
  } catch (error) {
    console.error('Error fetching report stats:', error);
    return {
      success: false,
      errors: { general: 'Failed to fetch stats' },
    };
  }
}

export async function getFlaggedUsers(filters?: {
  riskLabel?: 'GREEN' | 'AMBER' | 'RED';
  sortBy?: 'riskLabeledAt' | 'openReports';
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data?: { users: FlaggedUser[]; total: number; page: number; limit: number; totalPages: number };
  errors?: { general?: string };
}> {
  const { authorized } = await verifyAdminOrModerator(ADMIN_CAPABILITIES.MANAGE_REPORTS);

  if (!authorized) {
    return {
      success: false,
      errors: { general: 'Not authorized' },
    };
  }

  try {
    const { riskLabel, page = 1, limit = 20 } = filters || {};

    const profileWhere: Prisma.ProfileWhereInput = {
      OR: [
        { riskLabel: { not: 'GREEN' } },
        { user: { reportsAgainst: { some: { status: { in: ['OPEN', 'REVIEWING'] } } } } },
      ],
    };

    if (riskLabel) {
      profileWhere.riskLabel = riskLabel;
      delete profileWhere.OR;
    }

    const total = await prisma.profile.count({ where: profileWhere });

    const profiles = await prisma.profile.findMany({
      where: profileWhere,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            reportsAgainst: {
              select: { id: true, status: true },
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { riskLabeledAt: 'desc' },
    });

    const users: FlaggedUser[] = profiles.map((profile) => {
      const openReports = profile.user.reportsAgainst.filter(
        (r) => r.status === 'OPEN' || r.status === 'REVIEWING'
      ).length;

      return {
        userId: profile.userId,
        email: profile.user.email,
        alias: profile.alias || 'N/A',
        riskLabel: profile.riskLabel as 'GREEN' | 'AMBER' | 'RED',
        riskNotes: profile.riskNotes,
        riskLabeledAt: profile.riskLabeledAt?.toISOString() || null,
        profileStatus: profile.status as 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED',
        openReports,
        totalReports: profile.user.reportsAgainst.length,
        createdAt: profile.createdAt.toISOString(),
      };
    });

    // Sort by open reports descending if requested
    if (filters?.sortBy === 'openReports') {
      users.sort((a, b) => b.openReports - a.openReports);
    }

    return {
      success: true,
      data: {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching flagged users:', error);
    return {
      success: false,
      errors: { general: 'Failed to fetch flagged users' },
    };
  }
}
