import { useState } from 'react';
import TabBar from './TabBar';

/**
 * TabBar Component Examples
 * 
 * Demonstrates various usage patterns for the TabBar component.
 */

/**
 * Example 1: Basic TabBar
 */
export function BasicTabBarExample() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <div className="bg-[#0a0e1a] min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Basic TabBar</h2>
        
        <div className="bg-[#151b2d] rounded-lg overflow-hidden">
          <TabBar
            tabs={tabs}
            activeTabId={activeTab}
            onTabChange={setActiveTab}
          />
          
          <div className="p-6 text-white">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Overview</h3>
                <p className="text-gray-300">
                  This is the overview section. It provides a high-level summary of the content.
                </p>
              </div>
            )}
            {activeTab === 'details' && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Details</h3>
                <p className="text-gray-300">
                  This section contains detailed information about the topic.
                </p>
              </div>
            )}
            {activeTab === 'settings' && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Settings</h3>
                <p className="text-gray-300">
                  Configure your preferences and options here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 2: TabBar with Icons
 */
export function TabBarWithIconsExample() {
  const [activeTab, setActiveTab] = useState('architecture');

  const tabs = [
    { id: 'architecture', label: 'Architecture', icon: '🏗️' },
    { id: 'cost', label: 'Cost Optimization', icon: '💰' },
    { id: 'template', label: 'Template', icon: '📄' },
    { id: 'summary', label: 'Summary', icon: '📋' }
  ];

  return (
    <div className="bg-[#0a0e1a] min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">TabBar with Icons</h2>
        
        <div className="bg-[#151b2d] rounded-lg overflow-hidden">
          <TabBar
            tabs={tabs}
            activeTabId={activeTab}
            onTabChange={setActiveTab}
          />
          
          <div className="p-6 text-white">
            {activeTab === 'architecture' && (
              <div>
                <h3 className="text-xl font-semibold mb-2">🏗️ Architecture Overview</h3>
                <p className="text-gray-300">
                  System architecture diagrams and component descriptions.
                </p>
              </div>
            )}
            {activeTab === 'cost' && (
              <div>
                <h3 className="text-xl font-semibold mb-2">💰 Cost Optimization</h3>
                <p className="text-gray-300">
                  Cost breakdown and optimization recommendations.
                </p>
              </div>
            )}
            {activeTab === 'template' && (
              <div>
                <h3 className="text-xl font-semibold mb-2">📄 CloudFormation Template</h3>
                <p className="text-gray-300">
                  Infrastructure as Code template with syntax highlighting.
                </p>
              </div>
            )}
            {activeTab === 'summary' && (
              <div>
                <h3 className="text-xl font-semibold mb-2">📋 Quick Summary</h3>
                <p className="text-gray-300">
                  High-level summary of the infrastructure design.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 3: Many Tabs (Scrollable)
 */
export function ManyTabsExample() {
  const [activeTab, setActiveTab] = useState('tab1');

  const tabs = Array.from({ length: 10 }, (_, i) => ({
    id: `tab${i + 1}`,
    label: `Tab ${i + 1}`
  }));

  return (
    <div className="bg-[#0a0e1a] min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Many Tabs (Scrollable)</h2>
        <p className="text-gray-400 mb-4">
          Try scrolling horizontally or using arrow keys to navigate
        </p>
        
        <div className="bg-[#151b2d] rounded-lg overflow-hidden">
          <TabBar
            tabs={tabs}
            activeTabId={activeTab}
            onTabChange={setActiveTab}
          />
          
          <div className="p-6 text-white">
            <h3 className="text-xl font-semibold mb-2">
              Content for {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <p className="text-gray-300">
              This demonstrates horizontal scrolling when there are many tabs.
              Use arrow keys to navigate between tabs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 4: Agent Response Simulation
 */
export function AgentResponseExample() {
  const [activeTab, setActiveTab] = useState('architecture');

  const tabs = [
    { id: 'architecture', label: 'Architecture', icon: '🏗️' },
    { id: 'cost', label: 'Cost Optimization', icon: '💰' },
    { id: 'template', label: 'CloudFormation', icon: '📄' },
    { id: 'summary', label: 'Summary', icon: '📋' }
  ];

  const content = {
    architecture: `
## System Architecture

The proposed infrastructure consists of:

- **VPC**: Isolated network environment
- **EC2 Instances**: Application servers in private subnets
- **RDS Database**: PostgreSQL database with Multi-AZ deployment
- **Application Load Balancer**: Distributes traffic across instances
- **CloudFront**: CDN for static content delivery
    `,
    cost: `
## Cost Breakdown

Estimated monthly costs:

- EC2 Instances (2x t3.medium): $60/month
- RDS PostgreSQL (db.t3.small): $30/month
- Application Load Balancer: $20/month
- Data Transfer: ~$10/month

**Total Estimated Cost**: $120/month

### Optimization Tips
- Use Reserved Instances for 40% savings
- Enable auto-scaling to match demand
- Use S3 for static assets instead of EC2
    `,
    template: `
AWSTemplateFormatVersion: '2010-09-09'
Description: Sample infrastructure template

Resources:
  MyVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: MyVPC
    `,
    summary: `
## Quick Summary

This infrastructure design provides a scalable, highly available web application environment.

**Key Features:**
- Multi-AZ deployment for high availability
- Auto-scaling for cost optimization
- Secure network architecture with private subnets
- Managed database with automated backups

**Deployment Time**: ~15 minutes
**Estimated Cost**: $120/month
    `
  };

  return (
    <div className="bg-[#0a0e1a] min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Agent Response Simulation</h2>
        
        <div className="bg-[#151b2d] rounded-lg overflow-hidden">
          <TabBar
            tabs={tabs}
            activeTabId={activeTab}
            onTabChange={setActiveTab}
          />
          
          <div className="p-6 text-white">
            <pre className="whitespace-pre-wrap text-gray-300 font-sans">
              {content[activeTab as keyof typeof content]}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Default export with all examples
 */
export default function TabBarExamples() {
  const [currentExample, setCurrentExample] = useState<'basic' | 'icons' | 'many' | 'agent'>('basic');

  return (
    <div className="bg-[#0a0e1a] min-h-screen">
      {/* Example selector */}
      <div className="bg-[#151b2d] border-b border-[#2d3548] p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <button
            onClick={() => setCurrentExample('basic')}
            className={`px-4 py-2 rounded ${
              currentExample === 'basic'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Basic
          </button>
          <button
            onClick={() => setCurrentExample('icons')}
            className={`px-4 py-2 rounded ${
              currentExample === 'icons'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            With Icons
          </button>
          <button
            onClick={() => setCurrentExample('many')}
            className={`px-4 py-2 rounded ${
              currentExample === 'many'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Many Tabs
          </button>
          <button
            onClick={() => setCurrentExample('agent')}
            className={`px-4 py-2 rounded ${
              currentExample === 'agent'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Agent Response
          </button>
        </div>
      </div>

      {/* Current example */}
      {currentExample === 'basic' && <BasicTabBarExample />}
      {currentExample === 'icons' && <TabBarWithIconsExample />}
      {currentExample === 'many' && <ManyTabsExample />}
      {currentExample === 'agent' && <AgentResponseExample />}
    </div>
  );
}
