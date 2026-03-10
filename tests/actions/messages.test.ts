import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { checkEitherHasSubscription } from '@/lib/subscription/checkActiveSubscription';
import { filterContent } from '@/lib/moderation/contentFilter';
import {
  getThreads,
  sendMessage,
  initiateThread,
  getUnreadCount,
} from '@/app/actions/messages';

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
    messageThread: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
    },
  },
}));
jest.mock('@/lib/subscription/checkActiveSubscription');
jest.mock('@/lib/moderation/contentFilter', () => ({
  filterContent: jest.fn(),
  shouldHoldForApproval: jest.fn(() => true), // Default to pre-moderation for tests
}));

const mockGetServerSession = getServerSession as jest.Mock;
const mockCheckEitherHasSubscription = checkEitherHasSubscription as jest.Mock;
const mockFilterContent = filterContent as jest.Mock;

describe('Messaging Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateThread', () => {
    const mockSession = {
      user: { id: 'user123', email: 'test@example.com' },
    };

    it('should return error if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await initiateThread('recipient123');

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Not authenticated');
    });

    it('should return error if trying to message self', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      const result = await initiateThread('user123');

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Cannot start conversation with yourself');
    });

    it('should return error if neither user has subscription', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockCheckEitherHasSubscription.mockResolvedValue(false);

      const result = await initiateThread('recipient123');

      expect(result.success).toBe(false);
      expect(result.errors?.subscription).toContain('subscription');
      expect(mockCheckEitherHasSubscription).toHaveBeenCalledWith('user123', 'recipient123');
    });

    it('should return existing thread if already exists', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockCheckEitherHasSubscription.mockResolvedValue(true);
      (prisma.messageThread.findFirst as jest.Mock).mockResolvedValue({
        id: 'thread123',
      });

      const result = await initiateThread('recipient123');

      expect(result.success).toBe(true);
      expect(result.data?.threadId).toBe('thread123');
      expect(result.data?.existed).toBe(true);
    });

    it('should create new thread if subscription exists and no thread found', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockCheckEitherHasSubscription.mockResolvedValue(true);
      (prisma.messageThread.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'recipient123',
        profile: {
          status: 'APPROVED',
          gender: 'FEMALE',
        },
      });
      (prisma.profile.findUnique as jest.Mock).mockResolvedValue({
        gender: 'MALE',
      });
      (prisma.messageThread.create as jest.Mock).mockResolvedValue({
        id: 'newthread123',
      });

      const result = await initiateThread('recipient123');

      expect(result.success).toBe(true);
      expect(result.data?.threadId).toBe('newthread123');
      expect(result.data?.existed).toBe(false);
      expect(prisma.messageThread.create).toHaveBeenCalledWith({
        data: {
          participantAId: 'user123',
          participantBId: 'recipient123',
        },
      });
    });

    it('should return error if recipient has same gender', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      mockCheckEitherHasSubscription.mockResolvedValue(true);
      (prisma.messageThread.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'recipient123',
        profile: {
          status: 'APPROVED',
          gender: 'MALE',
        },
      });
      (prisma.profile.findUnique as jest.Mock).mockResolvedValue({
        gender: 'MALE',
      });

      const result = await initiateThread('recipient123');

      expect(result.success).toBe(false);
      expect(result.errors?.general).toContain('opposite gender');
    });
  });

  describe('sendMessage', () => {
    const mockSession = {
      user: { id: 'user123', email: 'test@example.com' },
    };

    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession);
    });

    it('should return error if content is empty', async () => {
      const result = await sendMessage('thread123', '');

      expect(result.success).toBe(false);
      expect(result.errors?.content).toBe('Message cannot be empty');
    });

    it('should return error if content too long', async () => {
      const longContent = 'a'.repeat(2001);

      const result = await sendMessage('thread123', longContent);

      expect(result.success).toBe(false);
      expect(result.errors?.content).toContain('too long');
    });

    it('should flag and hold message if content violates moderation', async () => {
      (prisma.messageThread.findUnique as jest.Mock).mockResolvedValue({
        participantAId: 'user123',
        participantBId: 'user456',
        isBlocked: false,
        messages: [], // No pending messages
      });
      mockFilterContent.mockReturnValue({
        isSafe: false,
        flaggedReason: 'Profanity detected: badword',
      });
      (prisma.message.create as jest.Mock).mockResolvedValue({
        id: 'msg123',
        content: 'badword content',
        createdAt: new Date(),
        isFlagged: true,
        flaggedReason: 'Profanity detected: badword',
        moderationStatus: 'PENDING',
        sender: {
          profile: {
            alias: 'TestUser',
          },
        },
      });

      const result = await sendMessage('thread123', 'badword content');

      expect(result.success).toBe(true);
      expect(result.data?.message.moderationStatus).toBe('PENDING');
      expect(result.data?.message.isFlagged).toBe(true);
      expect(prisma.messageThread.update).not.toHaveBeenCalled(); // Thread not updated when message is pending
    });

    it('should approve and deliver clean message', async () => {
      (prisma.messageThread.findUnique as jest.Mock).mockResolvedValue({
        participantAId: 'user123',
        participantBId: 'user456',
        isBlocked: false,
        messages: [],
      });
      mockFilterContent.mockReturnValue({
        isSafe: true,
      });
      (prisma.message.create as jest.Mock).mockResolvedValue({
        id: 'msg123',
        threadId: 'thread123',
        content: 'Clean message',
        createdAt: new Date(),
        isFlagged: false,
        moderationStatus: 'APPROVED',
        sender: {
          profile: {
            alias: 'TestUser',
          },
        },
      });

      const result = await sendMessage('thread123', 'Clean message');

      expect(result.success).toBe(true);
      expect(result.data?.message.moderationStatus).toBe('APPROVED');
      expect(result.data?.message.isFlagged).toBe(false);
      expect(prisma.messageThread.update).toHaveBeenCalledWith({
        where: { id: 'thread123' },
        data: { lastMessageAt: expect.any(Date) },
      });
    });

    it('should queue clean message if thread has pending messages', async () => {
      (prisma.messageThread.findUnique as jest.Mock).mockResolvedValue({
        participantAId: 'user123',
        participantBId: 'user456',
        isBlocked: false,
        messages: [{ id: 'pending-msg' }], // Has pending message
      });
      mockFilterContent.mockReturnValue({
        isSafe: true,
      });
      (prisma.message.create as jest.Mock).mockResolvedValue({
        id: 'msg123',
        content: 'Clean message',
        createdAt: new Date(),
        isFlagged: false,
        flaggedReason: 'Queued - waiting for previous message approval',
        moderationStatus: 'PENDING',
        sender: {
          profile: {
            alias: 'TestUser',
          },
        },
      });

      const result = await sendMessage('thread123', 'Clean message');

      expect(result.success).toBe(true);
      expect(result.data?.message.moderationStatus).toBe('PENDING');
      expect(result.data?.message.flaggedReason).toContain('Queued');
      expect(prisma.messageThread.update).not.toHaveBeenCalled();
    });
  });

  describe('getThreads', () => {
    const mockSession = {
      user: { id: 'user123' },
    };

    it('should return error if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await getThreads();

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Not authenticated');
    });

    it('should return formatted threads for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.messageThread.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'thread123',
          participantAId: 'user123',
          participantBId: 'user456',
          lastMessageAt: new Date('2026-03-10T10:00:00Z'),
          participantA: {
            id: 'user123',
            profile: {
              alias: 'Me',
              photos: [],
            },
          },
          participantB: {
            id: 'user456',
            profile: {
              alias: 'OtherUser',
              photos: [{ url: '/photo.jpg', isBlurred: false }],
            },
          },
          messages: [
            {
              content: 'Last message content',
              createdAt: new Date('2026-03-10T10:00:00Z'),
              senderId: 'user456',
              isRead: false,
            },
          ],
          _count: {
            messages: 2,
          },
        },
      ]);

      const result = await getThreads();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].otherParticipant.alias).toBe('OtherUser');
      expect(result.data[0].unreadCount).toBe(2);
      expect(result.data[0].lastMessage?.content).toContain('Last message');
    });
  });

  describe('getUnreadCount', () => {
    const mockSession = {
      user: { id: 'user123' },
    };

    it('should return error if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await getUnreadCount();

      expect(result.success).toBe(false);
      expect(result.errors?.general).toBe('Not authenticated');
    });

    it('should return correct unread count', async () => {
      mockGetServerSession.mockResolvedValue(mockSession);
      (prisma.messageThread.findMany as jest.Mock).mockResolvedValue([
        { id: 'thread1' },
        { id: 'thread2' },
      ]);
      (prisma.message.count as jest.Mock).mockResolvedValue(5);

      const result = await getUnreadCount();

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(5);
      expect(prisma.message.count).toHaveBeenCalledWith({
        where: {
          threadId: { in: ['thread1', 'thread2'] },
          senderId: { not: 'user123' },
          isRead: false,
          moderationStatus: 'APPROVED',
        },
      });
    });
  });
});
