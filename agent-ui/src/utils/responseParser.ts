/**
 * Response Parser Utility
 * 
 * Parses agent responses into structured sections and generates appropriate tabs
 * based on agent type and detected content.
 * 
 * Supports:
 * - XML tag extraction (e.g., <cfn> tags)
 * - Markdown section detection (## headers)
 * - YAML and JSON template detection
 * - Agent-specific tab generation
 */

import type {
  ParsedResponse,
  ResponseSection,
  TabDefinition,
  AgentType,
  TemplateFormat,
} from '../types';

/**
 * Extract content within XML tags
 * 
 * @param content - The full response content
 * @param tagName - The XML tag name to extract (without < >)
 * @returns The content within the tags, or null if not found
 */
export function extractXmlTag(content: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extract all markdown sections from content
 * 
 * @param content - The markdown content
 * @returns Array of sections with title and content
 */
export function extractMarkdownSections(content: string): Array<{ title: string; content: string; level: number }> {
  const sections: Array<{ title: string; content: string; level: number }> = [];
  const lines = content.split('\n');
  
  let currentSection: { title: string; content: string; level: number } | null = null;
  
  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headerMatch) {
      // Save previous section if exists
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // Start new section
      const level = headerMatch[1].length;
      const title = headerMatch[2].trim();
      currentSection = { title, content: '', level };
    } else if (currentSection) {
      // Add line to current section
      currentSection.content += line + '\n';
    }
  }
  
  // Add last section
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

/**
 * Detect template format (YAML or JSON)
 * 
 * @param template - The template content
 * @returns The detected format
 */
export function detectTemplateFormat(template: string): TemplateFormat {
  const trimmed = template.trim();
  
  // Check for JSON format
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON, might be YAML
    }
  }
  
  // Check for YAML indicators
  const yamlIndicators = [
    /^---/m,                    // YAML document separator
    /^\w+:\s*$/m,               // Key with no value on same line
    /^\s+-\s+/m,                // List items
    /:\s*\|/m,                  // Literal block scalar
    /:\s*>/m,                   // Folded block scalar
  ];
  
  for (const indicator of yamlIndicators) {
    if (indicator.test(trimmed)) {
      return 'yaml';
    }
  }
  
  // Default to YAML for CloudFormation templates
  return 'yaml';
}

/**
 * Parse OnboardingAgent response
 * 
 * Expected pattern:
 * - <cfn> tags containing CloudFormation template
 * - ## Architecture Overview section
 * - ## Cost Optimization section
 * - ## Quick Summary or ## Summary section
 * 
 * @param content - The agent response content
 * @returns Parsed sections
 */
function parseOnboardingResponse(content: string): ResponseSection[] {
  const sections: ResponseSection[] = [];
  
  // Extract CloudFormation template
  const cfnTemplate = extractXmlTag(content, 'cfn');
  if (cfnTemplate) {
    sections.push({
      type: 'template',
      title: 'CloudFormation Template',
      content: cfnTemplate,
      metadata: {
        format: detectTemplateFormat(cfnTemplate),
      },
    });
  }
  
  // Extract markdown sections
  const markdownSections = extractMarkdownSections(content);
  
  for (const section of markdownSections) {
    const lowerTitle = section.title.toLowerCase();
    
    if (lowerTitle.includes('architecture')) {
      sections.push({
        type: 'architecture',
        title: section.title,
        content: section.content.trim(),
      });
    } else if (lowerTitle.includes('cost')) {
      sections.push({
        type: 'cost',
        title: section.title,
        content: section.content.trim(),
      });
    } else if (lowerTitle.includes('summary')) {
      sections.push({
        type: 'summary',
        title: section.title,
        content: section.content.trim(),
      });
    }
  }
  
  return sections;
}

/**
 * Parse ProvisioningAgent response
 * 
 * Expected pattern:
 * - ## Deployment Summary section
 * - ## Provisioned Resources section
 * - ## Stack Outputs section
 * - ## Deployment Timeline section
 * 
 * @param content - The agent response content
 * @returns Parsed sections
 */
function parseProvisioningResponse(content: string): ResponseSection[] {
  const sections: ResponseSection[] = [];
  const markdownSections = extractMarkdownSections(content);
  
  for (const section of markdownSections) {
    const lowerTitle = section.title.toLowerCase();
    
    if (lowerTitle.includes('deployment') && lowerTitle.includes('summary')) {
      sections.push({
        type: 'progress',
        title: section.title,
        content: section.content.trim(),
      });
    } else if (lowerTitle.includes('resource')) {
      sections.push({
        type: 'resources',
        title: section.title,
        content: section.content.trim(),
      });
    } else if (lowerTitle.includes('summary')) {
      sections.push({
        type: 'summary',
        title: section.title,
        content: section.content.trim(),
      });
    }
  }
  
  return sections;
}

/**
 * Parse MWCAgent (orchestrator) response
 * 
 * Generic parsing for orchestrator responses
 * 
 * @param content - The agent response content
 * @returns Parsed sections
 */
function parseOrchestratorResponse(content: string): ResponseSection[] {
  const sections: ResponseSection[] = [];
  const markdownSections = extractMarkdownSections(content);
  
  // Generic section parsing
  for (const section of markdownSections) {
    const lowerTitle = section.title.toLowerCase();
    
    if (lowerTitle.includes('architecture')) {
      sections.push({
        type: 'architecture',
        title: section.title,
        content: section.content.trim(),
      });
    } else if (lowerTitle.includes('cost')) {
      sections.push({
        type: 'cost',
        title: section.title,
        content: section.content.trim(),
      });
    } else if (lowerTitle.includes('resource')) {
      sections.push({
        type: 'resources',
        title: section.title,
        content: section.content.trim(),
      });
    } else if (lowerTitle.includes('summary')) {
      sections.push({
        type: 'summary',
        title: section.title,
        content: section.content.trim(),
      });
    }
  }
  
  return sections;
}

/**
 * Generate tabs from parsed sections
 * 
 * @param sections - The parsed response sections
 * @param agentType - The type of agent that generated the response
 * @returns Array of tab definitions
 */
export function generateTabs(sections: ResponseSection[], agentType: AgentType): TabDefinition[] {
  const tabs: TabDefinition[] = [];
  
  // Define tab order based on agent type
  const tabOrder: Record<AgentType, string[]> = {
    onboarding: ['architecture', 'cost', 'template', 'summary'],
    provisioning: ['progress', 'resources', 'summary'],
    orchestrator: ['summary', 'architecture', 'cost', 'resources'],
  };
  
  const order = tabOrder[agentType];
  
  // Create tabs in the specified order
  for (const sectionType of order) {
    const section = sections.find(s => s.type === sectionType);
    if (section) {
      tabs.push({
        id: section.type,
        label: section.title,
        content: section,
      });
    }
  }
  
  // Add any remaining sections not in the order
  for (const section of sections) {
    if (!tabs.find(t => t.id === section.type)) {
      tabs.push({
        id: section.type,
        label: section.title,
        content: section,
      });
    }
  }
  
  return tabs;
}

/**
 * Parse agent response into structured sections and tabs
 * 
 * Main entry point for response parsing. Detects agent type and applies
 * appropriate parsing strategy.
 * 
 * @param content - The raw agent response content
 * @param agentType - The type of agent that generated the response
 * @returns Parsed response with sections and tabs
 */
export function parseAgentResponse(content: string, agentType: AgentType): ParsedResponse {
  let sections: ResponseSection[] = [];
  
  // Parse based on agent type
  switch (agentType) {
    case 'onboarding':
      sections = parseOnboardingResponse(content);
      break;
    case 'provisioning':
      sections = parseProvisioningResponse(content);
      break;
    case 'orchestrator':
      sections = parseOrchestratorResponse(content);
      break;
  }
  
  // Generate tabs from sections
  const tabs = generateTabs(sections, agentType);
  
  // Build parsed response object
  const parsed: ParsedResponse = {
    raw: content,
    sections,
    tabs,
  };
  
  // Add convenience properties for direct access
  for (const section of sections) {
    switch (section.type) {
      case 'architecture':
        parsed.architecture = section.content;
        break;
      case 'cost':
        parsed.costOptimization = section.content;
        break;
      case 'template':
        parsed.template = section.content;
        break;
      case 'summary':
        parsed.summary = section.content;
        break;
    }
  }
  
  return parsed;
}

/**
 * Remove XML tags from content
 * 
 * Useful for cleaning up content before display
 * 
 * @param content - Content with XML tags
 * @param tagName - Tag name to remove
 * @returns Content with tags removed
 */
export function removeXmlTag(content: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'gi');
  return content.replace(regex, '').trim();
}

/**
 * Extract all XML tags from content
 * 
 * @param content - The content to search
 * @returns Map of tag names to their content
 */
export function extractAllXmlTags(content: string): Map<string, string> {
  const tags = new Map<string, string>();
  const regex = /<(\w+)>([\s\S]*?)<\/\1>/gi;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const tagName = match[1];
    const tagContent = match[2].trim();
    tags.set(tagName, tagContent);
  }
  
  return tags;
}
