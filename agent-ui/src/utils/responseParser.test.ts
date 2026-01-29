/**
 * Tests for Response Parser Utility
 */

import { describe, it, expect } from 'vitest';
import {
  extractXmlTag,
  extractMarkdownSections,
  detectTemplateFormat,
  parseAgentResponse,
  generateTabs,
  extractAllXmlTags,
  removeXmlTag,
} from './responseParser';

describe('extractXmlTag', () => {
  it('should extract content from XML tags', () => {
    const content = 'Some text <cfn>template content</cfn> more text';
    const result = extractXmlTag(content, 'cfn');
    expect(result).toBe('template content');
  });

  it('should return null if tag not found', () => {
    const content = 'Some text without tags';
    const result = extractXmlTag(content, 'cfn');
    expect(result).toBeNull();
  });

  it('should handle multiline content', () => {
    const content = '<cfn>\nline1\nline2\nline3\n</cfn>';
    const result = extractXmlTag(content, 'cfn');
    expect(result).toBe('line1\nline2\nline3');
  });

  it('should be case insensitive', () => {
    const content = '<CFN>template</CFN>';
    const result = extractXmlTag(content, 'cfn');
    expect(result).toBe('template');
  });
});

describe('extractMarkdownSections', () => {
  it('should extract sections with headers', () => {
    const content = `## Section 1
Content 1

## Section 2
Content 2`;
    const sections = extractMarkdownSections(content);
    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe('Section 1');
    expect(sections[0].content.trim()).toBe('Content 1');
    expect(sections[1].title).toBe('Section 2');
    expect(sections[1].content.trim()).toBe('Content 2');
  });

  it('should handle different header levels', () => {
    const content = `# Level 1
Content

## Level 2
More content`;
    const sections = extractMarkdownSections(content);
    expect(sections[0].level).toBe(1);
    expect(sections[1].level).toBe(2);
  });

  it('should handle empty content', () => {
    const content = '';
    const sections = extractMarkdownSections(content);
    expect(sections).toHaveLength(0);
  });
});

describe('detectTemplateFormat', () => {
  it('should detect JSON format', () => {
    const json = '{"key": "value"}';
    expect(detectTemplateFormat(json)).toBe('json');
  });

  it('should detect YAML format with document separator', () => {
    const yaml = '---\nkey: value';
    expect(detectTemplateFormat(yaml)).toBe('yaml');
  });

  it('should detect YAML format with list items', () => {
    const yaml = 'items:\n  - item1\n  - item2';
    expect(detectTemplateFormat(yaml)).toBe('yaml');
  });

  it('should default to YAML for ambiguous content', () => {
    const ambiguous = 'some text';
    expect(detectTemplateFormat(ambiguous)).toBe('yaml');
  });
});

describe('parseAgentResponse', () => {
  it('should parse OnboardingAgent response with CFN template', () => {
    const content = `<cfn>
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
</cfn>

## Architecture Overview
This is the architecture description.

## Cost Optimization Tips
These are cost tips.

## Quick Summary
This is the summary.`;

    const parsed = parseAgentResponse(content, 'onboarding');
    
    expect(parsed.sections).toHaveLength(4);
    expect(parsed.tabs).toHaveLength(4);
    expect(parsed.template).toBeDefined();
    expect(parsed.architecture).toBeDefined();
    expect(parsed.costOptimization).toBeDefined();
    expect(parsed.summary).toBeDefined();
  });

  it('should parse ProvisioningAgent response', () => {
    const content = `## Deployment Summary
Status: IN_PROGRESS

## Provisioned Resources
- Resource 1
- Resource 2

## Summary
Deployment complete.`;

    const parsed = parseAgentResponse(content, 'provisioning');
    
    expect(parsed.sections.length).toBeGreaterThan(0);
    expect(parsed.tabs.length).toBeGreaterThan(0);
  });

  it('should preserve raw content', () => {
    const content = 'Test content';
    const parsed = parseAgentResponse(content, 'orchestrator');
    expect(parsed.raw).toBe(content);
  });
});

describe('generateTabs', () => {
  it('should generate tabs in correct order for onboarding agent', () => {
    const sections = [
      { type: 'summary' as const, title: 'Summary', content: 'summary' },
      { type: 'template' as const, title: 'Template', content: 'template' },
      { type: 'architecture' as const, title: 'Architecture', content: 'arch' },
      { type: 'cost' as const, title: 'Cost', content: 'cost' },
    ];

    const tabs = generateTabs(sections, 'onboarding');
    
    expect(tabs[0].id).toBe('architecture');
    expect(tabs[1].id).toBe('cost');
    expect(tabs[2].id).toBe('template');
    expect(tabs[3].id).toBe('summary');
  });

  it('should handle missing sections', () => {
    const sections = [
      { type: 'summary' as const, title: 'Summary', content: 'summary' },
    ];

    const tabs = generateTabs(sections, 'onboarding');
    expect(tabs).toHaveLength(1);
    expect(tabs[0].id).toBe('summary');
  });
});

describe('extractAllXmlTags', () => {
  it('should extract multiple XML tags', () => {
    const content = '<cfn>template</cfn> text <output>result</output>';
    const tags = extractAllXmlTags(content);
    
    expect(tags.size).toBe(2);
    expect(tags.get('cfn')).toBe('template');
    expect(tags.get('output')).toBe('result');
  });

  it('should handle no tags', () => {
    const content = 'plain text';
    const tags = extractAllXmlTags(content);
    expect(tags.size).toBe(0);
  });
});

describe('removeXmlTag', () => {
  it('should remove XML tags from content', () => {
    const content = 'before <cfn>template</cfn> after';
    const result = removeXmlTag(content, 'cfn');
    expect(result).toBe('before  after');
  });

  it('should handle multiple occurrences', () => {
    const content = '<tag>first</tag> middle <tag>second</tag>';
    const result = removeXmlTag(content, 'tag');
    expect(result).toBe('middle');
  });
});
