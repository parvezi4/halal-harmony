import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { filterContent } from '@/lib/moderation/contentFilter';
import {
  getPendingMessages,
  approveMessage,
  rejectMessage,
  getModerationStats,
} from '@/app/actions/admin/moderation';

// Mock dependencies
jest.mock('next-auth/next');
jest.mock('bad-words', () => ({
  __esModule: true,
  Filter: jest.fn().mockImplementation(() => ({
    isProfane: jest.fn().mockReturnValue(false),
    clean: jest.fn((text) => text),
  })),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    messageThread: {
      update: jest.fn(),
    },
  },
}));
jest.mock('@/lib/moderation/contentFilter');

const mockGetServerSession = getServerSession as jest.Mock;
const mockFilterContent = filterContent as jest.Mock;

describe('Admin Moderation Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authorization', () => {
    it('should return error if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await getPendingMessages();

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Not authorized');
    });

    it('should return error if user is not admin', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user123' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: 'MEMBER',
      });

      const result = await getPendingMessages();

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Not authorized');
    });
  });

  describe('getPendingMessages', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'admin123' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: 'ADMIN',
      });
    });

    it('should return formatted pending messages', async () => {
      (prisma.message.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'msg123',
          content: 'Flagged content',
          createdAt: new Date('2026-03-10T10:00:00Z'),
          isFlagged: true,
          flaggedReason: 'Profanity detected',
          sender: {
            id: 'user123',
            email: 'user@example.com',
            profile: {
              alias: 'TestUser',
              fullName: 'Test User',
            },
          },
          thread: {
            id: 'thread123',
            participantA: {
              id: 'user123',
              profile: { alias: 'TestUser' },
            },
            participantB: {
              id: 'user456',
              profile: { alias: 'OtherUser' },
            },
            messages: [
              {
                content: 'Previous message',
                createdAt: new Date('2026-03-10T09:00:00Z'),
                sender: {
                  id: 'user456',
                  profile: { alias: 'OtherUser' },
                },
              },
            ],
          },
        },
      ]);

      const result = await getPendingMessages();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].content).toBe('Flagged content');
      expect(result.data[0].flaggedReason).toBe('Profanity detected');
      expect(result.data[0].thread.participants).toHaveLength(2);
    });
  });

  describe('approveMessage', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'admin123' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: 'ADMIN',
      });
    });

    it('should return error if message not found', async () => {
      (prisma.message.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await approveMessage('msg123');

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Message not found');
    });

    it('should return error if message is not pending', async () => {
      (prisma.message.findUnique as jest.Mock).mockResolvedValue({
        threadId: 'thread123',
        moderationStatus: 'APPROVED',
        createdAt: new Date(),
      });

      const result = await approveMessage('msg123');

      expect(result.success).toBe(false);
      expect(result.errors?.general).toContain('not pending');
    });

    it('should approve message and update thread timestamp', async () => {
      const messageDate = new Date('2026-03-10T10:00:00Z');
      (prisma.message.findUnique as jest.Mock).mockResolvedValue({
        threadId: 'thread123',
        moderationStatus: 'PENDING',
        createdAt: messageDate,
      });
      (prisma.message.findMany as jest.Mock).mockResolvedValue([]); // No queued messages
      (prisma.message.update as jest.Mock).mockResolvedValue({});
      (prisma.messageThread.update as jest.Mock).mockResolvedValue({});

      const result = await approveMessage('msg123');

      expect(result.success).toBe(true);
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: 'msg123' },
        data: { moderationStatus: 'APPROVED' },
      });
      expect(prisma.messageThread.update).toHaveBeenCalledWith({
        where: { id: 'thread123' },
        data: { lastMessageAt: messageDate },
      });
    });

    it('should release queued clean messages after approval', async () => {
      const messageDate = new Date('2026-03-10T10:00:00Z');
      const queuedDate = new Date('2026-03-10T10:01:00Z');

      (prisma.message.findUnique as jest.Mock).mockResolvedValue({
        threadId: 'thread123',
        moderationStatus: 'PENDING',
        createdAt: messageDate,
      });

      // Mock queued messages
      (prisma.message.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'queued1',
          content: 'Clean queued message',
          createdAt: queuedDate,
          flaggedReason: 'Queued - waiting for previous message approval',
        },
      ]);

      mockFilterContent.mockReturnValue({ isSafe: true });
      (prisma.message.update as jest.Mock).mockResolvedValue({});
      (prisma.messageThread.update as jest.Mock).mockResolvedValue({});

      const result = await approveMessage('msg123');

      expect(result.success).toBe(true);
      expect(result.data?.releasedCount).toBe(1);
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: 'queued1' },
        data: {
          moderationStatus: 'APPROVED',
          flaggedReason: null,
          isFlagged: false,
        },
      });
    });

    it('should keep flagged queued messages pending', async () => {
      const messageDate = new Date('2026-03-10T10:00:00Z');

      (prisma.message.findUnique as jest.Mock).mockResolvedValue({
        threadId: 'thread123',
        moderationStatus: 'PENDING',
        createdAt: messageDate,
      });

      (prisma.message.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'queued1',
          content: 'Queued message with profanity',
          createdAt: new Date('2026-03-10T10:01:00Z'),
          flaggedReason: 'Queued - waiting for previous message approval',
        },
      ]);

      mockFilterContent.mockReturnValue({
        isSafe: false,
        flaggedReason: 'Profanity detected',
      });
      (prisma.message.update as jest.Mock).mockResolvedValue({});
      (prisma.messageThread.update as jest.Mock).mockResolvedValue({});

      const result = await approveMessage('msg123');

      expect(result.success).toBe(true);
      // Should update queued message with new flaggedReason
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: 'queued1' },
        data: {
          flaggedReason: 'Profanity detected',
          isFlagged: true,
        },
      });
    });
  });

  describe('rejectMessage', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'admin123' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: 'ADMIN',
      });
    });

    it('should reject message and not update thread timestamp', async () => {
      (prisma.message.findUnique as jest.Mock).mockResolvedValue({
        threadId: 'thread123',
        senderId: 'user123',
        moderationStatus: 'PENDING',
        createdAt: new Date(),
      });
      (prisma.message.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.message.update as jest.Mock).mockResolvedValue({});

      const result = await rejectMessage('msg123', 'Inappropriate content');

      expect(result.success).toBe(true);
      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: 'msg123' },
        data: { moderationStatus: 'REJECTED' },
      });
      expect(prisma.messageThread.update).not.toHaveBeenCalled();
    });

    it('should release clean queued messages after rejection', async () => {
      (prisma.message.findUnique as jest.Mock).mockResolvedValue({
        threadId: 'thread123',
        senderId: 'user123',
        moderationStatus: 'PENDING',
        createdAt: new Date('2026-03-10T10:00:00Z'),
      });

      (prisma.message.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'queued1',
          content: 'Clean queued message',
          createdAt: new Date('2026-03-10T10:01:00Z'),
          flaggedReason: 'Queued - waiting for previous message approval',
        },
      ]);

      mockFilterContent.mockReturnValue({ isSafe: true });
      (prisma.message.update as jest.Mock).mockResolvedValue({});
      (prisma.messageThread.update as jest.Mock).mockResolvedValue({});

      const result = await rejectMessage('msg123');

      expect(result.success).toBe(true);
      expect(result.data?.releasedCount).toBe(1);
    });
  });

  describe('getModerationStats', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'admin123' },
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: 'ADMIN',
      });
    });

    it('should return moderation statistics', async () => {
      (prisma.message.count as jest.Mock)
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(100) // approved
        .mockResolvedValueOnce(10) // rejected
        .mockResolvedValueOnce(15); // flagged

      const result = await getModerationStats();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        pending: 5,
        approved: 100,
        rejected: 10,
        totalFlagged: 15,
      });
    });
  });
});
