import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoleplayChatService } from '@/core/services/roleplay/roleplay-chat.service';
import { RoleplayLLMConfig, RoleplayScenario, RoleplayMessage } from '../../common/config';

// Mock logger
vi.mock('../utils/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
}));

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

// Mock https-proxy-agent
vi.mock('https-proxy-agent', () => ({
  default: vi.fn(() => ({})),
}));

describe('RoleplayChatService', () => {
  const mockConfig: RoleplayLLMConfig = {
    base_url: 'https://api.example.com',
    model: 'test-model',
    key: 'test-api-key',
    temperature: 0.7,
    max_tokens: 1000,
  };

  const mockScenario: RoleplayScenario = {
    assistant_name: 'AI Assistant',
    user_name: 'User',
    system_prompt: 'You are a helpful assistant',
    start: [
      { role: 'system', content: 'Hello, how can I help you today?' },
    ],
  };

  let service: RoleplayChatService;

  beforeEach(() => {
    service = new RoleplayChatService(mockConfig, mockScenario);
  });

  describe('constructor', () => {
    it('should initialize service with config and scenario', () => {
      expect(service).toBeDefined();
    });

    it('should initialize messages with system prompt and start messages', () => {
      const messages = service.getMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({
        role: 'system',
        content: 'You are a helpful assistant',
      });
      expect(messages[1]).toEqual({
        role: 'system',
        content: 'Hello, how can I help you today?',
      });
    });
  });

  describe('reset', () => {
    it('should reset messages to initial state', () => {
      // Add some messages
      service['messages'].push({ role: 'user', content: 'Test message' });

      service.reset();

      const messages = service.getMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toBe('You are a helpful assistant');
    });
  });

  describe('loadHistory', () => {
    it('should load messages from history', () => {
      const historyMessages: RoleplayMessage[] = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      service.loadHistory(historyMessages);

      const messages = service.getMessages();
      expect(messages).toEqual(historyMessages);
    });
  });

  describe('getMessages', () => {
    it('should return current messages', () => {
      const messages = service.getMessages();
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('getHistoryData', () => {
    it('should return history data with correct structure', () => {
      const historyData = service.getHistoryData();

      expect(historyData).toEqual({
        assistant_name: 'AI Assistant',
        user_name: 'User',
        system_prompt: 'You are a helpful assistant',
        messages: expect.any(Array),
      });
    });

    it('should include current messages in history data', () => {
      const messages = service.getMessages();
      const historyData = service.getHistoryData();

      expect(historyData.messages).toEqual(messages);
    });
  });

  describe('popMessage', () => {
    it('should return true and remove last message when messages exist', () => {
      service['messages'].push({ role: 'user', content: 'Test message' });
      const initialLength = service['messages'].length;

      const result = service.popMessage();

      expect(result).toBe(true);
      expect(service['messages'].length).toBe(initialLength - 1);
    });

    it('should return false when no messages exist', () => {
      service['messages'] = [];
      const result = service.popMessage();
      expect(result).toBe(false);
    });
  });

  describe('updateScenario', () => {
    it('should update scenario and reinitialize messages', () => {
      const newScenario: RoleplayScenario = {
        ...mockScenario,
        assistant_name: 'New Assistant',
      };

      service.updateScenario(newScenario);

      const messages = service.getMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe('You are a helpful assistant');
      expect(messages[1].content).toBe('Hello, how can I help you today?');
    });
  });

  describe('chat', () => {
    it('should add user message to messages', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Hello' } }] };
        },
      };

      const mockCreate = vi.fn().mockResolvedValue(mockStream);
      (service as any).client.chat.completions.create = mockCreate;

      const chunks: string[] = [];
      for await (const chunk of service.chat('Test input')) {
        chunks.push(chunk);
      }

      const messages = service.getMessages();
      const userMessage = messages.find((m) => m.role === 'user' && m.content.includes('Test input'));
      expect(userMessage).toBeDefined();
    });

    it('should add system prompt if provided', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Response' } }] };
        },
      };

      const mockCreate = vi.fn().mockResolvedValue(mockStream);
      (service as any).client.chat.completions.create = mockCreate;

      const systemPrompt = 'Additional system instruction';
      const chunks: string[] = [];
      for await (const chunk of service.chat('Test input', systemPrompt)) {
        chunks.push(chunk);
      }

      const messages = service.getMessages();
      const sysMessage = messages.find((m) => m.role === 'system' && m.content === systemPrompt);
      expect(sysMessage).toBeDefined();
    });

    it('should yield response chunks', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Hello' } }] };
          yield { choices: [{ delta: { content: ' World' } }] };
        },
      };

      const mockCreate = vi.fn().mockResolvedValue(mockStream);
      (service as any).client.chat.completions.create = mockCreate;

      const chunks: string[] = [];
      for await (const chunk of service.chat('Test')) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' World']);
    });

    it('should add assistant response to messages', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'AI response' } }] };
        },
      };

      const mockCreate = vi.fn().mockResolvedValue(mockStream);
      (service as any).client.chat.completions.create = mockCreate;

      for await (const chunk of service.chat('Test')) {
        // consume stream
      }

      const messages = service.getMessages();
      const assistantMessage = messages.find((m) => m.role === 'assistant');
      expect(assistantMessage).toBeDefined();
      expect(assistantMessage?.content).toContain('AI Assistant:');
    });

    it('should format assistant response with name if not present', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Response without name' } }] };
        },
      };

      const mockCreate = vi.fn().mockResolvedValue(mockStream);
      (service as any).client.chat.completions.create = mockCreate;

      for await (const chunk of service.chat('Test')) {
        // consume stream
      }

      const messages = service.getMessages();
      const assistantMessage = messages.find((m) => m.role === 'assistant');
      expect(assistantMessage?.content).toBe('AI Assistant: Response without name');
    });

    it('should not duplicate assistant name if already present', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'AI Assistant: Already has name' } }] };
        },
      };

      const mockCreate = vi.fn().mockResolvedValue(mockStream);
      (service as any).client.chat.completions.create = mockCreate;

      for await (const chunk of service.chat('Test')) {
        // consume stream
      }

      const messages = service.getMessages();
      const assistantMessage = messages.find((m) => m.role === 'assistant');
      expect(assistantMessage?.content).toBe('AI Assistant: Already has name');
    });

    it('should handle errors gracefully', async () => {
      const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'));
      (service as any).client.chat.completions.create = mockCreate;

      const chunks: string[] = [];
      for await (const chunk of service.chat('Test')) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Error: API Error']);
    });
  });

  describe('regenerate', () => {
    it('should remove last assistant message and regenerate', async () => {
      // Add an assistant message
      service['messages'].push({
        role: 'assistant',
        content: 'AI Assistant: Old response',
        name: 'AI Assistant',
      });

      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'New response' } }] };
        },
      };

      const mockCreate = vi.fn().mockResolvedValue(mockStream);
      (service as any).client.chat.completions.create = mockCreate;

      const chunks: string[] = [];
      for await (const chunk of service.regenerate()) {
        chunks.push(chunk);
      }

      const messages = service.getMessages();
      const oldMessage = messages.find((m) => m.content === 'AI Assistant: Old response');
      expect(oldMessage).toBeUndefined();
      expect(chunks).toEqual(['New response']);
    });

    it('should work when no assistant message exists', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: 'Response' } }] };
        },
      };

      const mockCreate = vi.fn().mockResolvedValue(mockStream);
      (service as any).client.chat.completions.create = mockCreate;

      const chunks: string[] = [];
      for await (const chunk of service.regenerate()) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Response']);
    });
  });

  describe('config with break_prompt', () => {
    it('should add break prompt to initial messages', () => {
      const configWithBreak: RoleplayLLMConfig = {
        ...mockConfig,
        break_prompt: 'Break the character if needed',
      };

      const serviceWithBreak = new RoleplayChatService(configWithBreak, mockScenario);
      const messages = serviceWithBreak.getMessages();

      expect(messages[0]).toEqual({
        role: 'system',
        content: 'Break the character if needed',
      });
    });
  });

  describe('config without start messages', () => {
    it('should initialize with only system prompt', () => {
      const scenarioWithoutStart: RoleplayScenario = {
        ...mockScenario,
        start: [],
      };

      const serviceWithoutStart = new RoleplayChatService(mockConfig, scenarioWithoutStart);
      const messages = serviceWithoutStart.getMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('system');
    });
  });
});
