import { Filter } from 'bad-words';
import { checkShariahCompliance } from './shariah-patterns';

// Initialize bad-words filter
const profanityFilter = new Filter();

/**
 * Content moderation result
 */
export interface ModerationResult {
  isSafe: boolean;
  flaggedReason?: string;
}

/**
 * Moderation type configuration
 */
export type ModerationType = 'PATTERN' | 'AI_NLP';

/**
 * Moderation workflow configuration
 */
export type ModerationWorkflow = 'PRE_MODERATION' | 'POST_MODERATION';

/**
 * Moderation configuration
 * In MVP, this is hardcoded. Future: store in database and make admin-configurable
 */
export interface ModerationConfig {
  type: ModerationType;
  workflow: ModerationWorkflow;
}

// Default configuration (can be overridden)
const defaultConfig: ModerationConfig = {
  type: 'PATTERN',
  workflow: 'PRE_MODERATION',
};

/**
 * Get current moderation configuration
 * TODO: In future, fetch from database/admin settings
 */
export function getModerationConfig(): ModerationConfig {
  // For MVP, return hardcoded config
  // Future: fetch from database
  return defaultConfig;
}

/**
 * Filter message content using pattern-based detection
 * Combines bad-words library with custom Shariah compliance patterns
 */
function filterWithPatterns(content: string): ModerationResult {
  // First check with bad-words library
  if (profanityFilter.isProfane(content)) {
    // Extract the profane words
    const profaneWords = content
      .split(/\s+/)
      .filter((word) => profanityFilter.isProfane(word))
      .slice(0, 2); // Limit to first 2 words

    return {
      isSafe: false,
      flaggedReason: `Profanity detected${
        profaneWords.length > 0 ? `: ${profaneWords.join(', ')}` : ''
      }`,
    };
  }

  // Then check custom Shariah compliance patterns
  const shariahCheck = checkShariahCompliance(content);
  if (!shariahCheck.isSafe) {
    return {
      isSafe: false,
      flaggedReason: shariahCheck.flaggedReason,
    };
  }

  // Content passed all checks
  return {
    isSafe: true,
  };
}

/**
 * Filter message content using AI/NLP (future implementation)
 */
function filterWithAI(content: string): ModerationResult {
  // TODO: Implement AI-based contextual analysis
  // For now, fall back to pattern-based
  console.warn('AI/NLP moderation not yet implemented, using pattern-based');
  return filterWithPatterns(content);
}

/**
 * Main content filter function
 * Checks message content for Shariah compliance and inappropriate content
 *
 * @param content - The message content to check
 * @param config - Optional moderation configuration (defaults to current config)
 * @returns Moderation result with safety status and reason if flagged
 */
export function filterContent(content: string, config?: ModerationConfig): ModerationResult {
  const moderationConfig = config || getModerationConfig();

  // Validate content
  if (!content || content.trim().length === 0) {
    return {
      isSafe: true,
    };
  }

  // Apply moderation based on configured type
  switch (moderationConfig.type) {
    case 'PATTERN':
      return filterWithPatterns(content);
    case 'AI_NLP':
      return filterWithAI(content);
    default:
      console.error(`Unknown moderation type: ${moderationConfig.type}`);
      return filterWithPatterns(content);
  }
}

/**
 * Check if moderation workflow requires holding messages
 * @param config - Optional moderation configuration
 * @returns True if messages should be held for approval
 */
export function shouldHoldForApproval(config?: ModerationConfig): boolean {
  const moderationConfig = config || getModerationConfig();
  return moderationConfig.workflow === 'PRE_MODERATION';
}
