import React, { useState, useEffect } from 'react';
import ProgressTab from './ProgressTab';
import type { ResourceStatus, StackEvent } from '../types';

/**
 * Example usage of ProgressTab component with mock data
 * 
 * This example demonstrates:
 * - Initial deployment state
 * - Simulated progress updates
 * - Resource status changes
 * - Event timeline updates
 * - Terminal status handling
 */
const ProgressTabExample: React.FC = () => {
  const [status, setStatus] = useState('CREATE_IN_PROGRESS');
  const [resources, setResources] = useState<ResourceStatus[]>([
    {
      logicalId: 'VPC',
      physicalId: 'vpc-abc123',
      type: 'AWS::EC2::VPC',
      status: 'CREATE_COMPLETE',
      timestamp: new Date(Date.now() - 60000),
    },
    {
      logicalId: 'PublicSubnet',
      physicalId: 'subnet-def456',
      type: 'AWS::EC2::Subnet',
      status: 'CREATE_COMPLETE',
      timestamp: new Date(Date.now() - 45000),
    },
    {
      logicalId: 'InternetGateway',
      physicalId: 'igw-ghi789',
      type: 'AWS::EC2::InternetGateway',
      status: 'CREATE_IN_PROGRESS',
      timestamp: new Date(Date.now() - 30000),
    },
    {
      logicalId: 'S3Bucket',
      physicalId: '',
      type: 'AWS::S3::Bucket',
      status: 'CREATE_IN_PROGRESS',
      timestamp: new Date(Date.now() - 15000),
    },
    {
      logicalId: 'LambdaFunction',
      physicalId: '',
      type: 'AWS::Lambda::Function',
      status: 'CREATE_PENDING',
      timestamp: new Date(),
    },
  ]);

  const [events, setEvents] = useState<StackEvent[]>([
    {
      timestamp: new Date(Date.now() - 60000),
      resourceType: 'AWS::EC2::VPC',
      logicalId: 'VPC',
      status: 'CREATE_IN_PROGRESS',
    },
    {
      timestamp: new Date(Date.now() - 55000),
      resourceType: 'AWS::EC2::VPC',
      logicalId: 'VPC',
      status: 'CREATE_COMPLETE',
    },
    {
      timestamp: new Date(Date.now() - 45000),
      resourceType: 'AWS::EC2::Subnet',
      logicalId: 'PublicSubnet',
      status: 'CREATE_IN_PROGRESS',
    },
    {
      timestamp: new Date(Date.now() - 40000),
      resourceType: 'AWS::EC2::Subnet',
      logicalId: 'PublicSubnet',
      status: 'CREATE_COMPLETE',
    },
    {
      timestamp: new Date(Date.now() - 30000),
      resourceType: 'AWS::EC2::InternetGateway',
      logicalId: 'InternetGateway',
      status: 'CREATE_IN_PROGRESS',
    },
  ]);

  const startTime = new Date(Date.now() - 120000); // Started 2 minutes ago

  /**
   * Simulate deployment progress
   */
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate resource updates
      setResources((prev) => {
        const updated = [...prev];
        
        // Find first in-progress resource and complete it
        const inProgressIndex = updated.findIndex((r) =>
          r.status.includes('IN_PROGRESS')
        );
        
        if (inProgressIndex !== -1) {
          updated[inProgressIndex] = {
            ...updated[inProgressIndex],
            status: 'CREATE_COMPLETE',
            physicalId: `${updated[inProgressIndex].type.split('::').pop()?.toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
          };

          // Add completion event
          setEvents((prevEvents) => [
            ...prevEvents,
            {
              timestamp: new Date(),
              resourceType: updated[inProgressIndex].type,
              logicalId: updated[inProgressIndex].logicalId,
              status: 'CREATE_COMPLETE',
            },
          ]);

          // Start next pending resource
          const pendingIndex = updated.findIndex((r) =>
            r.status.includes('PENDING')
          );
          if (pendingIndex !== -1) {
            updated[pendingIndex] = {
              ...updated[pendingIndex],
              status: 'CREATE_IN_PROGRESS',
              timestamp: new Date(),
            };

            // Add start event
            setEvents((prevEvents) => [
              ...prevEvents,
              {
                timestamp: new Date(),
                resourceType: updated[pendingIndex].type,
                logicalId: updated[pendingIndex].logicalId,
                status: 'CREATE_IN_PROGRESS',
              },
            ]);
          }
        }

        // Check if all resources are complete
        const allComplete = updated.every((r) =>
          r.status.includes('COMPLETE')
        );
        if (allComplete) {
          setStatus('CREATE_COMPLETE');
        }

        return updated;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-screen bg-[#0a0e1a]">
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold text-[#e4e7eb] mb-6">
          ProgressTab Component Example
        </h1>

        <div className="bg-[#151b2d] rounded-lg border border-[#2d3548] overflow-hidden h-[calc(100vh-200px)]">
          <ProgressTab
            stackName="example-infrastructure-stack"
            status={status}
            resources={resources}
            events={events}
            startTime={startTime}
          />
        </div>

        {/* Status indicator */}
        <div className="mt-4 p-4 bg-[#151b2d] rounded-lg border border-[#2d3548]">
          <p className="text-sm text-[#9ca3af]">
            Current Status:{' '}
            <span className="font-semibold text-[#e4e7eb]">{status}</span>
          </p>
          <p className="text-xs text-[#6b7280] mt-2">
            This example simulates a CloudFormation deployment with automatic
            progress updates every 5 seconds. Resources transition from pending
            → in-progress → complete.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProgressTabExample;
