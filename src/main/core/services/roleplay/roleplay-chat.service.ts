import OpenAI from 'openai';
import { createLogger } from '@/core/utils/logger';
import { RoleplayLLMConfig, RoleplayScenario, RoleplayMessage } from '@/core/common/config';

const logger = createLogger('RoleplayChatService');

/**
 * AI Chat Service for Roleplay
 * Handles AI conversation with streaming support
 */
export class RoleplayChatService {
  private client: OpenAI | null = null;
  private config: RoleplayLLMConfig;
  private scenario: RoleplayScenario;
  private messages: RoleplayMessage[] = [];

  constructor(config: RoleplayLLMConfig, scenario: RoleplayScenario) {
    this.config = config;
    this.scenario = scenario;
    this.initClient();
    this.initMessages();
  }

  /**
   * Initialize OpenAI client
   */
  private initClient(): void {
    const clientConfig: any = {
      baseURL: this.config.base_url,
      apiKey: this.config.key || 'dummy-key',
    };

    if (this.config.proxy) {
      clientConfig.httpAgent = require('https-proxy-agent')(this.config.proxy);
      clientConfig.httpsAgent = require('https-proxy-agent')(this.config.proxy);
    }

    this.client = new OpenAI(clientConfig);
  }

  /**
   * Initialize chat messages from scenario
   */
  private initMessages(): void {
    this.messages = [];

    // Add break prompt if exists
    if (this.config.break_prompt) {
      this.messages.push({
        role: 'system',
        content: this.config.break_prompt,
      });
    }

    // Add system prompt
    if (this.scenario.system_prompt) {
      this.messages.push({
        role: 'system',
        content: this.scenario.system_prompt,
      });
    }

    // Add start messages
    this.messages.push(...this.scenario.start);
  }

  /**
   * Reset chat session
   */
  reset(): void {
    this.initMessages();
    logger.info('Chat session reset');
  }

  /**
   * Load history messages
   * @param messages - Messages from history
   */
  loadHistory(messages: RoleplayMessage[]): void {
    this.messages = messages;
    logger.info(`Loaded ${messages.length} messages from history`);
  }

  /**
   * Get current messages
   * @returns Current messages
   */
  getMessages(): RoleplayMessage[] {
    return this.messages;
  }

  /**
   * Get current messages for saving
   * @returns Chat history data
   */
  getHistoryData(): {
    assistant_name: string;
    user_name: string;
    system_prompt: string;
    messages: RoleplayMessage[];
  } {
    return {
      assistant_name: this.scenario.assistant_name,
      user_name: this.scenario.user_name,
      system_prompt: this.scenario.system_prompt,
      messages: this.messages,
    };
  }

  /**
   * Send message and get streaming response
   * @param userInput - User input message
   * @param systemPrompt - Additional system prompt
   * @returns Async generator yielding response chunks
   */
  async *chat(userInput: string, systemPrompt: string = ''): AsyncGenerator<string> {
    // Add user message if not empty
    if (userInput.trim()) {
      this.messages.push({
        role: 'user',
        content: `${this.scenario.user_name}: ${userInput}`,
        name: this.scenario.user_name,
      });
    }

    // Add additional system prompt if provided
    if (systemPrompt.trim()) {
      this.messages.push({
        role: 'system',
        content: systemPrompt,
        name: 'system',
      });
    }

    try {
      if (!this.client) {
        throw new Error('OpenAI client not initialized');
      }

      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages: this.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        stream: true,
        temperature: this.config.temperature,
        max_tokens: this.config.max_tokens,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          yield content;
        }
      }

      // Add assistant response to messages
      const trimmedResponse = fullResponse.trim();
      const formattedResponse = trimmedResponse.startsWith(`${this.scenario.assistant_name}:`)
        ? trimmedResponse
        : `${this.scenario.assistant_name}: ${trimmedResponse}`;

      this.messages.push({
        role: 'assistant',
        content: formattedResponse,
        name: this.scenario.assistant_name,
      });

      logger.info('Chat message sent and response received');
    } catch (err) {
      logger.error('Chat failed', err);
      yield `Error: ${(err as Error).message}`;
    }
  }

  /**
   * Regenerate last assistant message
   * @returns Async generator yielding response chunks
   */
  async *regenerate(): AsyncGenerator<string> {
    // Remove last assistant message if exists
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      this.messages.pop();
    }

    // Generate new response
    yield* this.chat('', '');
  }

  /**
   * Pop last message
   * @returns True if message was popped
   */
  popMessage(): boolean {
    if (this.messages.length > 0) {
      this.messages.pop();
      logger.info('Last message popped');
      return true;
    }
    return false;
  }

  /**
   * Update scenario
   * @param scenario - New scenario data
   */
  updateScenario(scenario: RoleplayScenario): void {
    this.scenario = scenario;
    this.initMessages();
    logger.info('Scenario updated');
  }
}
