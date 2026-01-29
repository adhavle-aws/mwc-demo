# API Abstraction Layer

## Overview

The API abstraction layer provides a clean interface between the UI components and backend services. This design allows seamless migration from the current REST API implementation to Salesforce Apex controllers without changing component code.

## Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Components                             │
│  (React Components / Lightning Web Components)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Uses Interface
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              IAgentService (Interface)                       │
│  • invokeAgent()                                            │
│  • checkAgentStatus()                                       │
│  • checkAllAgentsStatus()                                   │
│  • getStackStatus()                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────────┐      ┌──────────────────────┐
│  React Implementation│      │ Salesforce Impl      │
│  (agentService.ts)   │      │ (agentService.js)    │
│                      │      │                      │
│  • fetch() API       │      │  • Apex callouts     │
│  • Streaming         │      │  • @wire decorators  │
│  • Retry logic       │      │  • Platform Events   │
└──────────┬───────────┘      └──────────┬───────────┘
           │                             │
           ▼                             ▼
┌──────────────────────┐      ┌──────────────────────┐
│   Backend API        │      │   Apex Controllers   │
│   (Express/Lambda)   │      │   + Named Creds      │
└──────────────────────┘      └──────────────────────┘
```

## Service Interface Definition

### TypeScript Interface (Shared)

```typescript
// IAgentService.ts
export interface AgentInvocationRequest {
  agentId: string;
  prompt: string;
  sessionId?: string;
}

export interface AgentStatusResponse {
  agentId: string;
  status: AgentStatus;
  arn: string;
  lastInvocation?: Date;
  errorMessage?: string;
}

export type AgentStatus = 'available' | 'busy' | 'error' | 'unknown';

export interface StackStatusResponse {
  stackName: string;
  stackId: string;
  status: string;
  resources: ResourceStatus[];
  outputs: Record<string, string>;
  events: StackEvent[];
  creationTime: Date;
  lastUpdatedTime?: Date;
}

export interface ResourceStatus {
  logicalId: string;
  physicalId: string;
  type: string;
  status: string;
  timestamp: Date;
}

export interface StackEvent {
  timestamp: Date;
  resourceType: string;
  logicalId: string;
  status: string;
  reason?: string;
}

/**
 * Service interface for agent communication
 * Implementations: React (fetch API), Salesforce (Apex)
 */
export interface IAgentService {
  /**
   * Invoke an agent with a prompt and get streaming response
   * @param request - Agent invocation request
   * @returns Async generator yielding response chunks
   */
  invokeAgent(
    request: AgentInvocationRequest
  ): AsyncGenerator<string, void, unknown>;

  /**
   * Check the status of a specific agent
   * @param agentId - Agent identifier
   * @returns Agent status response
   */
  checkAgentStatus(agentId: string): Promise<AgentStatusResponse>;

  /**
   * Check the status of all agents
   * @returns Map of agent IDs to their status
   */
  checkAllAgentsStatus(): Promise<Record<string, AgentStatus>>;

  /**
   * Get CloudFormation stack status
   * @param stackName - CloudFormation stack name
   * @returns Stack status response
   */
  getStackStatus(stackName: string): Promise<StackStatusResponse>;
}
```


## React Implementation (Current)

### File: `src/services/agentService.ts`

The current implementation uses the Fetch API with streaming support:

```typescript
import type { IAgentService, AgentInvocationRequest } from './IAgentService';

class ReactAgentService implements IAgentService {
  private readonly apiBaseUrl: string;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 1000;

  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
  }

  async *invokeAgent(request: AgentInvocationRequest) {
    const url = `${this.apiBaseUrl}/agents/invoke`;
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        yield chunk;
      }
    } finally {
      reader.releaseLock();
    }
  }

  async checkAgentStatus(agentId: string): Promise<AgentStatusResponse> {
    const url = `${this.apiBaseUrl}/agents/status?agentId=${agentId}`;
    const response = await this.fetchWithRetry(url);
    return response.json();
  }

  async checkAllAgentsStatus(): Promise<Record<string, AgentStatus>> {
    const url = `${this.apiBaseUrl}/agents/list`;
    const response = await this.fetchWithRetry(url);
    const data = await response.json();
    
    const statusMap: Record<string, AgentStatus> = {};
    data.forEach((agent: AgentStatusResponse) => {
      statusMap[agent.agentId] = agent.status;
    });
    return statusMap;
  }

  async getStackStatus(stackName: string): Promise<StackStatusResponse> {
    const url = `${this.apiBaseUrl}/stacks/status?stackName=${stackName}`;
    const response = await this.fetchWithRetry(url);
    return response.json();
  }

  private async fetchWithRetry(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    // Retry logic with exponential backoff
    // ... implementation
  }
}

export const agentService = new ReactAgentService();
```


## Salesforce Implementation (Future)

### File: `force-app/main/default/lwc/agentService/agentService.js`

The Salesforce implementation uses Apex controllers and Platform Events:

```javascript
import invokeAgentApex from '@salesforce/apex/AgentController.invokeAgent';
import checkAgentStatusApex from '@salesforce/apex/AgentController.checkAgentStatus';
import checkAllAgentsStatusApex from '@salesforce/apex/AgentController.checkAllAgentsStatus';
import getStackStatusApex from '@salesforce/apex/AgentController.getStackStatus';
import { subscribe, MessageContext } from 'lightning/messageService';
import AGENT_RESPONSE_CHANNEL from '@salesforce/messageChannel/AgentResponseChannel__c';

/**
 * Salesforce implementation of IAgentService
 * Uses Apex controllers and Platform Events for streaming
 */
class SalesforceAgentService {
  messageContext;

  constructor(messageContext) {
    this.messageContext = messageContext;
  }

  /**
   * Invoke agent with streaming via Platform Events
   */
  async *invokeAgent(request) {
    // Start agent invocation (returns immediately with requestId)
    const result = await invokeAgentApex({
      agentId: request.agentId,
      prompt: request.prompt,
      sessionId: request.sessionId
    });

    const requestId = result.requestId;
    
    // Subscribe to Platform Events for streaming chunks
    const chunks = [];
    let isComplete = false;

    const subscription = subscribe(
      this.messageContext,
      AGENT_RESPONSE_CHANNEL,
      (message) => {
        if (message.requestId === requestId) {
          if (message.isComplete) {
            isComplete = true;
          } else {
            chunks.push(message.chunk);
          }
        }
      }
    );

    // Yield chunks as they arrive
    while (!isComplete) {
      if (chunks.length > 0) {
        yield chunks.shift();
      }
      await this.sleep(100); // Poll every 100ms
    }

    // Yield remaining chunks
    while (chunks.length > 0) {
      yield chunks.shift();
    }
  }

  /**
   * Check agent status
   */
  async checkAgentStatus(agentId) {
    const result = await checkAgentStatusApex({ agentId });
    return {
      agentId: result.agentId,
      status: result.status,
      arn: result.arn,
      lastInvocation: result.lastInvocation ? new Date(result.lastInvocation) : undefined,
      errorMessage: result.errorMessage
    };
  }

  /**
   * Check all agents status
   */
  async checkAllAgentsStatus() {
    const results = await checkAllAgentsStatusApex();
    const statusMap = {};
    
    results.forEach(agent => {
      statusMap[agent.agentId] = agent.status;
    });
    
    return statusMap;
  }

  /**
   * Get CloudFormation stack status
   */
  async getStackStatus(stackName) {
    const result = await getStackStatusApex({ stackName });
    return {
      stackName: result.stackName,
      stackId: result.stackId,
      status: result.status,
      resources: result.resources || [],
      outputs: result.outputs || {},
      events: result.events || [],
      creationTime: new Date(result.creationTime),
      lastUpdatedTime: result.lastUpdatedTime ? new Date(result.lastUpdatedTime) : undefined
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export { SalesforceAgentService };
```


### Apex Controller: `AgentController.cls`

```apex
public with sharing class AgentController {
    
    /**
     * Invoke an agent and return requestId for streaming
     * Actual response chunks are sent via Platform Events
     */
    @AuraEnabled
    public static Map<String, Object> invokeAgent(
        String agentId, 
        String prompt, 
        String sessionId
    ) {
        try {
            // Generate unique request ID
            String requestId = generateRequestId();
            
            // Start async agent invocation
            System.enqueueJob(new AgentInvocationJob(
                requestId,
                agentId,
                prompt,
                sessionId
            ));
            
            return new Map<String, Object>{
                'requestId' => requestId,
                'status' => 'STARTED'
            };
            
        } catch (Exception e) {
            throw new AuraHandledException('Failed to invoke agent: ' + e.getMessage());
        }
    }
    
    /**
     * Check status of a specific agent
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> checkAgentStatus(String agentId) {
        try {
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:AWS_Bedrock_AgentCore/agents/status');
            req.setMethod('GET');
            req.setHeader('Content-Type', 'application/json');
            
            // Add query parameter
            String endpoint = req.getEndpoint() + '?agentId=' + EncodingUtil.urlEncode(agentId, 'UTF-8');
            req.setEndpoint(endpoint);
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            if (res.getStatusCode() == 200) {
                return (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            } else {
                throw new AuraHandledException('Status check failed: ' + res.getStatus());
            }
            
        } catch (Exception e) {
            throw new AuraHandledException('Failed to check agent status: ' + e.getMessage());
        }
    }
    
    /**
     * Check status of all agents
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> checkAllAgentsStatus() {
        try {
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:AWS_Bedrock_AgentCore/agents/list');
            req.setMethod('GET');
            req.setHeader('Content-Type', 'application/json');
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            if (res.getStatusCode() == 200) {
                return (List<Map<String, Object>>) JSON.deserializeUntyped(res.getBody());
            } else {
                throw new AuraHandledException('Failed to list agents: ' + res.getStatus());
            }
            
        } catch (Exception e) {
            throw new AuraHandledException('Failed to check all agents: ' + e.getMessage());
        }
    }
    
    /**
     * Get CloudFormation stack status
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getStackStatus(String stackName) {
        try {
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:AWS_CloudFormation/stacks/status');
            req.setMethod('GET');
            req.setHeader('Content-Type', 'application/json');
            
            String endpoint = req.getEndpoint() + '?stackName=' + EncodingUtil.urlEncode(stackName, 'UTF-8');
            req.setEndpoint(endpoint);
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            if (res.getStatusCode() == 200) {
                return (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            } else {
                throw new AuraHandledException('Stack status check failed: ' + res.getStatus());
            }
            
        } catch (Exception e) {
            throw new AuraHandledException('Failed to get stack status: ' + e.getMessage());
        }
    }
    
    /**
     * Generate unique request ID
     */
    private static String generateRequestId() {
        return String.valueOf(Crypto.getRandomLong()) + '-' + 
               String.valueOf(DateTime.now().getTime());
    }
}
```


### Queueable Job for Async Agent Invocation

```apex
/**
 * Queueable job to invoke agent asynchronously
 * Publishes response chunks via Platform Events
 */
public class AgentInvocationJob implements Queueable, Database.AllowsCallouts {
    private String requestId;
    private String agentId;
    private String prompt;
    private String sessionId;
    
    public AgentInvocationJob(String requestId, String agentId, String prompt, String sessionId) {
        this.requestId = requestId;
        this.agentId = agentId;
        this.prompt = prompt;
        this.sessionId = sessionId;
    }
    
    public void execute(QueueableContext context) {
        try {
            // Call AWS Bedrock AgentCore
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:AWS_Bedrock_AgentCore/agents/invoke');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setTimeout(120000); // 2 minutes
            
            Map<String, Object> body = new Map<String, Object>{
                'agentId' => agentId,
                'prompt' => prompt,
                'sessionId' => sessionId
            };
            req.setBody(JSON.serialize(body));
            
            Http http = new Http();
            HttpResponse res = http.send(req);
            
            if (res.getStatusCode() == 200) {
                String responseBody = res.getBody();
                
                // Publish response via Platform Event
                Agent_Response__e event = new Agent_Response__e(
                    Request_Id__c = requestId,
                    Chunk__c = responseBody,
                    Is_Complete__c = true
                );
                
                EventBus.publish(event);
                
            } else {
                // Publish error event
                Agent_Response__e errorEvent = new Agent_Response__e(
                    Request_Id__c = requestId,
                    Chunk__c = 'Error: ' + res.getStatus(),
                    Is_Complete__c = true,
                    Is_Error__c = true
                );
                
                EventBus.publish(errorEvent);
            }
            
        } catch (Exception e) {
            // Publish error event
            Agent_Response__e errorEvent = new Agent_Response__e(
                Request_Id__c = requestId,
                Chunk__c = 'Error: ' + e.getMessage(),
                Is_Complete__c = true,
                Is_Error__c = true
            );
            
            EventBus.publish(errorEvent);
        }
    }
}
```

### Platform Event Definition

```xml
<!-- Agent_Response__e.object-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <deploymentStatus>Deployed</deploymentStatus>
    <eventType>HighVolume</eventType>
    <label>Agent Response</label>
    <pluralLabel>Agent Responses</pluralLabel>
    
    <fields>
        <fullName>Request_Id__c</fullName>
        <label>Request ID</label>
        <length>255</length>
        <required>true</required>
        <type>Text</type>
    </fields>
    
    <fields>
        <fullName>Chunk__c</fullName>
        <label>Response Chunk</label>
        <length>131072</length>
        <type>LongTextArea</type>
    </fields>
    
    <fields>
        <fullName>Is_Complete__c</fullName>
        <label>Is Complete</label>
        <defaultValue>false</defaultValue>
        <type>Checkbox</type>
    </fields>
    
    <fields>
        <fullName>Is_Error__c</fullName>
        <label>Is Error</label>
        <defaultValue>false</defaultValue>
        <type>Checkbox</type>
    </fields>
</CustomObject>
```


## Component Usage Examples

### React Component Using Service

```typescript
// ChatWindow.tsx
import { invokeAgent } from '../services/agentService';

const ChatWindow: React.FC<Props> = ({ agentId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    setIsLoading(true);
    
    try {
      let fullResponse = '';
      
      // Use service interface
      for await (const chunk of invokeAgent({ agentId, prompt: content })) {
        fullResponse += chunk;
        // Update UI with streaming content
      }
      
      setMessages([...messages, {
        role: 'agent',
        content: fullResponse,
        timestamp: new Date()
      }]);
      
    } catch (error) {
      console.error('Failed to invoke agent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Chat UI */}
    </div>
  );
};
```

### LWC Component Using Service

```javascript
// agentChat.js
import { LightningElement, api, track, wire } from 'lwc';
import { MessageContext, subscribe } from 'lightning/messageService';
import AGENT_RESPONSE_CHANNEL from '@salesforce/messageChannel/AgentResponseChannel__c';
import invokeAgent from '@salesforce/apex/AgentController.invokeAgent';

export default class AgentChat extends LightningElement {
  @api agentId;
  @track messages = [];
  @track isLoading = false;
  @track streamingContent = '';
  
  currentRequestId;
  subscription;

  @wire(MessageContext)
  messageContext;

  connectedCallback() {
    this.subscribeToResponseChannel();
  }

  disconnectedCallback() {
    if (this.subscription) {
      unsubscribe(this.subscription);
    }
  }

  subscribeToResponseChannel() {
    this.subscription = subscribe(
      this.messageContext,
      AGENT_RESPONSE_CHANNEL,
      (message) => this.handleResponseChunk(message)
    );
  }

  async handleSendMessage(event) {
    const content = event.detail.content;
    this.isLoading = true;
    this.streamingContent = '';

    try {
      // Invoke agent (returns immediately with requestId)
      const result = await invokeAgent({
        agentId: this.agentId,
        prompt: content,
        sessionId: this.sessionId
      });

      this.currentRequestId = result.requestId;

      // Add user message
      this.messages = [...this.messages, {
        role: 'user',
        content: content,
        timestamp: new Date()
      }];

    } catch (error) {
      this.handleError(error);
      this.isLoading = false;
    }
  }

  handleResponseChunk(message) {
    if (message.requestId === this.currentRequestId) {
      if (message.isError) {
        this.handleError(new Error(message.chunk));
        this.isLoading = false;
      } else if (message.isComplete) {
        // Add complete message
        this.messages = [...this.messages, {
          role: 'agent',
          content: this.streamingContent,
          timestamp: new Date()
        }];
        this.streamingContent = '';
        this.isLoading = false;
      } else {
        // Append chunk to streaming content
        this.streamingContent += message.chunk;
      }
    }
  }

  handleError(error) {
    console.error('Agent invocation failed:', error);
    // Show error message to user
  }
}
```


## Service Factory Pattern

To enable easy switching between implementations:

### Factory Interface

```typescript
// serviceFactory.ts
import type { IAgentService } from './IAgentService';

export type ServiceEnvironment = 'react' | 'salesforce';

export interface ServiceFactory {
  createAgentService(): IAgentService;
}

class ReactServiceFactory implements ServiceFactory {
  createAgentService(): IAgentService {
    return new ReactAgentService();
  }
}

class SalesforceServiceFactory implements ServiceFactory {
  constructor(private messageContext: any) {}
  
  createAgentService(): IAgentService {
    return new SalesforceAgentService(this.messageContext);
  }
}

// Environment detection
export function getServiceFactory(env?: ServiceEnvironment): ServiceFactory {
  const environment = env || detectEnvironment();
  
  if (environment === 'salesforce') {
    // In Salesforce, messageContext must be provided
    throw new Error('MessageContext required for Salesforce environment');
  }
  
  return new ReactServiceFactory();
}

function detectEnvironment(): ServiceEnvironment {
  // Check if running in Salesforce
  if (typeof window !== 'undefined' && 
      window.location.hostname.includes('force.com')) {
    return 'salesforce';
  }
  return 'react';
}
```

### Usage in Components

```typescript
// React Component
import { getServiceFactory } from '../services/serviceFactory';

const agentService = getServiceFactory().createAgentService();

// Use service
const response = await agentService.checkAgentStatus('agent-1');
```

```javascript
// LWC Component
import { LightningElement, wire } from 'lwc';
import { MessageContext } from 'lightning/messageService';
import { SalesforceAgentService } from 'c/agentService';

export default class MyComponent extends LightningElement {
  @wire(MessageContext)
  messageContext;
  
  agentService;

  connectedCallback() {
    this.agentService = new SalesforceAgentService(this.messageContext);
  }

  async checkStatus() {
    const response = await this.agentService.checkAgentStatus('agent-1');
    // Use response
  }
}
```


## Error Handling Abstraction

### Error Types (Shared)

```typescript
// errors.ts
export type ErrorType = 'network' | 'authentication' | 'agent' | 'client' | 'deployment';

export interface ServiceError {
  type: ErrorType;
  message: string;
  statusCode?: number;
  retryable: boolean;
  details?: string;
}

export class AgentServiceError extends Error implements ServiceError {
  type: ErrorType;
  statusCode?: number;
  retryable: boolean;
  details?: string;

  constructor(
    message: string,
    type: ErrorType,
    statusCode?: number,
    retryable: boolean = false,
    details?: string
  ) {
    super(message);
    this.name = 'AgentServiceError';
    this.type = type;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.details = details;
  }
}
```

### React Error Handling

```typescript
try {
  const response = await agentService.checkAgentStatus('agent-1');
} catch (error) {
  if (error instanceof AgentServiceError) {
    // Handle categorized error
    switch (error.type) {
      case 'network':
        showError('Network error. Please check your connection.');
        break;
      case 'authentication':
        showError('Authentication failed. Please log in again.');
        break;
      case 'agent':
        showError('Agent is unavailable. Please try again later.');
        break;
    }
  }
}
```

### Salesforce Error Handling

```javascript
// LWC
try {
  const response = await checkAgentStatus({ agentId: 'agent-1' });
} catch (error) {
  // Apex errors come as AuraHandledException
  const errorMessage = error.body?.message || error.message;
  
  // Categorize based on message content
  if (errorMessage.includes('Network')) {
    this.showError('Network error. Please check your connection.');
  } else if (errorMessage.includes('Authentication')) {
    this.showError('Authentication failed. Please log in again.');
  } else {
    this.showError('An error occurred. Please try again.');
  }
}
```

## Configuration Management

### React Configuration

```typescript
// config.ts
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  awsRegion: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  agents: {
    onboarding: import.meta.env.VITE_ONBOARDING_AGENT_ARN,
    provisioning: import.meta.env.VITE_PROVISIONING_AGENT_ARN,
    mwc: import.meta.env.VITE_MWC_AGENT_ARN,
  },
  polling: {
    interval: 5000,
    maxAttempts: 100,
  },
};
```

### Salesforce Configuration

```apex
// AgentConfig.cls
public class AgentConfig {
    
    // Custom Metadata Type: Agent_Configuration__mdt
    public static Map<String, String> getAgentArns() {
        Map<String, String> arns = new Map<String, String>();
        
        for (Agent_Configuration__mdt config : [
            SELECT Agent_Id__c, Agent_ARN__c 
            FROM Agent_Configuration__mdt
        ]) {
            arns.put(config.Agent_Id__c, config.Agent_ARN__c);
        }
        
        return arns;
    }
    
    public static Integer getPollingInterval() {
        Agent_Settings__c settings = Agent_Settings__c.getInstance();
        return settings.Polling_Interval__c != null 
            ? settings.Polling_Interval__c.intValue() 
            : 5000;
    }
}
```


## Testing the Abstraction Layer

### React Service Tests

```typescript
// agentService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ReactAgentService } from './agentService';

describe('ReactAgentService', () => {
  it('should invoke agent and stream response', async () => {
    const service = new ReactAgentService();
    const chunks: string[] = [];

    for await (const chunk of service.invokeAgent({
      agentId: 'test-agent',
      prompt: 'test prompt'
    })) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should check agent status', async () => {
    const service = new ReactAgentService();
    const status = await service.checkAgentStatus('test-agent');

    expect(status).toHaveProperty('agentId');
    expect(status).toHaveProperty('status');
  });
});
```

### Apex Service Tests

```apex
// AgentControllerTest.cls
@isTest
private class AgentControllerTest {
    
    @isTest
    static void testInvokeAgent() {
        Test.setMock(HttpCalloutMock.class, new AgentCalloutMock());
        
        Test.startTest();
        Map<String, Object> result = AgentController.invokeAgent(
            'test-agent',
            'test prompt',
            'session-123'
        );
        Test.stopTest();
        
        System.assertNotEquals(null, result.get('requestId'));
        System.assertEquals('STARTED', result.get('status'));
    }
    
    @isTest
    static void testCheckAgentStatus() {
        Test.setMock(HttpCalloutMock.class, new AgentStatusMock());
        
        Test.startTest();
        Map<String, Object> status = AgentController.checkAgentStatus('test-agent');
        Test.stopTest();
        
        System.assertEquals('available', status.get('status'));
    }
    
    // Mock classes
    private class AgentCalloutMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"response": "test response"}');
            res.setStatusCode(200);
            return res;
        }
    }
    
    private class AgentStatusMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"agentId": "test-agent", "status": "available"}');
            res.setStatusCode(200);
            return res;
        }
    }
}
```

## Migration Checklist

### Service Layer Migration

- [ ] Create `IAgentService` interface
- [ ] Refactor React service to implement interface
- [ ] Create Apex controller with matching methods
- [ ] Define Platform Event for streaming
- [ ] Implement Queueable job for async operations
- [ ] Create LWC service wrapper
- [ ] Write tests for both implementations
- [ ] Document API differences
- [ ] Create migration guide for developers

### Configuration Migration

- [ ] Create Custom Metadata Types for agent configuration
- [ ] Create Custom Settings for application settings
- [ ] Migrate environment variables to Salesforce
- [ ] Configure Named Credentials
- [ ] Set up Remote Site Settings
- [ ] Document configuration steps

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Maintained By**: Agent UI Development Team
