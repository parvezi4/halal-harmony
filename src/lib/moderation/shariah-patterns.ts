/**
 * Shariah-compliant keyword patterns for content moderation
 * These patterns help maintain Islamic modesty and appropriate communication
 */

// Profanity and explicit language (English)
export const profanityPatterns = [
  /\b(fuck|shit|damn|hell|bitch|bastard|asshole|cunt|dick|pussy|cock)\b/gi,
  /\b(sex|sexual|sexy|nude|naked|porn|xxx)\b/gi,
];

// Sexual advances and inappropriate proposals
export const sexualAdvancePatterns = [
  /\b(hookup|hook up|one night|casual|fling|affair)\b/gi,
  /\b(send (me )?(pics?|photos?|nudes?))\b/gi,
  /\b(wanna (have )?sex|want to (have )?sex)\b/gi,
  /\b(sleep (together|with (me|you)))\b/gi,
  /\b(make love|have sex|get laid)\b/gi,
];

// Inappropriate body-related comments
export const inappropriateBodyPatterns = [
  /\b(sexy body|hot body|beautiful body)\b/gi,
  /\b(breasts?|boobs|tits|ass|butt|curves?)\b/gi,
];

// Contact info sharing (may want to moderate)
export const contactInfoPatterns = [
  /\b\d{10,}\b/g, // Phone numbers (10+ digits)
  /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, // Email addresses
  /\b(whatsapp|telegram|snapchat|instagram|facebook|fb)\s*[:@]?\s*[\w]+\b/gi,
];

// Transliterated Arabic inappropriate terms
export const arabicInappropriatePatterns = [
  /\b(zina|zinah)\b/gi, // Fornication
  /\b(haram relationship)\b/gi,
];

// Money/financial solicitation (potential scam)
export const financialSolicitationPatterns = [
  /\b(send (me )?money|need money|loan (me )?)\b/gi,
  /\b(western union|moneygram|bitcoin|paypal me)\b/gi,
  /\b(invest(ment)?|business opportunity|make money fast)\b/gi,
];

/**
 * Find which pattern matched in the text
 */
function findMatchedPattern(
  text: string,
  patterns: RegExp[]
): { matched: boolean; pattern?: string; matches?: string[] } {
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      return {
        matched: true,
        pattern: pattern.source,
        matches: matches,
      };
    }
  }
  return { matched: false };
}

/**
 * Get appropriate reason message for matched pattern category
 */
function getReasonForCategory(category: string, matches?: string[]): string {
  const matchedWords = matches ? matches.slice(0, 2).join(', ') : '';

  switch (category) {
    case 'profanity':
      return `Profanity detected${matchedWords ? `: ${matchedWords}` : ''}`;
    case 'sexual':
      return 'Sexual content or advances detected';
    case 'inappropriate-body':
      return 'Inappropriate body-related comments';
    case 'contact-info':
      return 'Contact information sharing detected';
    case 'arabic-inappropriate':
      return 'Inappropriate Islamic terminology';
    case 'financial':
      return 'Financial solicitation detected';
    default:
      return 'Inappropriate content detected';
  }
}

/**
 * Check message content for Shariah compliance
 * Returns flagging status and reason if content violates guidelines
 */
export function checkShariahCompliance(content: string): {
  isSafe: boolean;
  flaggedReason?: string;
} {
  const normalizedContent = content.toLowerCase().trim();

  // Check all pattern categories
  const checks = [
    { category: 'profanity', patterns: profanityPatterns },
    { category: 'sexual', patterns: sexualAdvancePatterns },
    { category: 'inappropriate-body', patterns: inappropriateBodyPatterns },
    { category: 'contact-info', patterns: contactInfoPatterns },
    { category: 'arabic-inappropriate', patterns: arabicInappropriatePatterns },
    { category: 'financial', patterns: financialSolicitationPatterns },
  ];

  for (const check of checks) {
    const result = findMatchedPattern(normalizedContent, check.patterns);
    if (result.matched) {
      return {
        isSafe: false,
        flaggedReason: getReasonForCategory(check.category, result.matches),
      };
    }
  }

  // Content passed all checks
  return {
    isSafe: true,
  };
}
