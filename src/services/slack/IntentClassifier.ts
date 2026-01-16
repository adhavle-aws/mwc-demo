/**
 * Intent Classifier
 * 
 * Classifies incoming Slack messages to determine which agent should handle them
 */

export type AgentIntent =
  | 'onboarding'
  | 'provisioning'
  | 'status_query'
  | 'help'
  | 'unknown';

export interface ClassificationResult {
  intent: AgentIntent;
  confidence: number;
  keywords: string[];
  metadata?: Record<string, any>;
}

export class IntentClassifier {
  private onboardingKeywords = [
    'onboard',
    'setup',
    'create organization',
    'new customer',
    'aws organization',
    'cloudformation package',
    'cfn package',
    'policies',
  ];

  private provisioningKeywords = [
    'provision',
    'deploy',
    'deployment',
    'cloudformation',
    'stack',
    'infrastructure',
    'resources',
    'rollback',
  ];

  private statusKeywords = [
    'status',
    'progress',
    'check',
    'what is',
    'how is',
    'update',
  ];

  private helpKeywords = ['help', 'how to', 'what can', 'commands', 'guide'];

  /**
   * Classify a message to determine intent
   */
  classify(message: string): ClassificationResult {
    const normalizedMessage = message.toLowerCase().trim();

    // Check for onboarding intent
    const onboardingMatches = this.countKeywordMatches(
      normalizedMessage,
      this.onboardingKeywords
    );

    // Check for provisioning intent
    const provisioningMatches = this.countKeywordMatches(
      normalizedMessage,
      this.provisioningKeywords
    );

    // Check for status query intent
    const statusMatches = this.countKeywordMatches(
      normalizedMessage,
      this.statusKeywords
    );

    // Check for help intent
    const helpMatches = this.countKeywordMatches(
      normalizedMessage,
      this.helpKeywords
    );

    // Determine intent based on highest match count
    const matches = [
      { intent: 'onboarding' as AgentIntent, count: onboardingMatches.count, keywords: onboardingMatches.matched },
      { intent: 'provisioning' as AgentIntent, count: provisioningMatches.count, keywords: provisioningMatches.matched },
      { intent: 'status_query' as AgentIntent, count: statusMatches.count, keywords: statusMatches.matched },
      { intent: 'help' as AgentIntent, count: helpMatches.count, keywords: helpMatches.matched },
    ];

    // Sort by match count
    matches.sort((a, b) => b.count - a.count);

    const topMatch = matches[0];

    // If no keywords matched, return unknown intent
    if (topMatch.count === 0) {
      return {
        intent: 'unknown',
        confidence: 0,
        keywords: [],
      };
    }

    // Calculate confidence based on match count and message length
    const wordCount = normalizedMessage.split(/\s+/).length;
    const confidence = Math.min((topMatch.count / wordCount) * 100, 100);

    return {
      intent: topMatch.intent,
      confidence,
      keywords: topMatch.keywords,
    };
  }

  /**
   * Count keyword matches in a message
   */
  private countKeywordMatches(
    message: string,
    keywords: string[]
  ): { count: number; matched: string[] } {
    const matched: string[] = [];
    let count = 0;

    for (const keyword of keywords) {
      if (message.includes(keyword)) {
        matched.push(keyword);
        count++;
      }
    }

    return { count, matched };
  }

  /**
   * Add custom keywords for an intent
   */
  addKeywords(intent: AgentIntent, keywords: string[]): void {
    switch (intent) {
      case 'onboarding':
        this.onboardingKeywords.push(...keywords);
        break;
      case 'provisioning':
        this.provisioningKeywords.push(...keywords);
        break;
      case 'status_query':
        this.statusKeywords.push(...keywords);
        break;
      case 'help':
        this.helpKeywords.push(...keywords);
        break;
    }
  }
}
