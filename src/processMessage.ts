import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { MessageData } from './types';
import { saveUsage } from './database/client';

// Define the schema for message analysis
const messageAnalysisSchema = z.object({
  supportStatus: z.enum([
    'help_request',
    'bug_report',
    'feature_request',
    'complaint',
    'feedback',
    'question',
    'documentation_issue',
    'urgent_issue',
    'general_discussion',
    'resolved',
    'other'
  ]).describe('The type of customer support status'),
  
  tone: z.enum([
    'happy',
    'neutral',
    'frustrated',
    'angry',
    'confused',
    'grateful',
    'urgent',
    'professional'
  ]).describe('The emotional tone of the message'),
  
  priority: z.enum(['low', 'medium', 'high', 'critical']).describe('Priority level based on content and tone'),
  
  sentiment: z.object({
    score: z.number().min(-1).max(1).describe('Sentiment score from -1 (negative) to 1 (positive)'),
    confidence: z.number().min(0).max(1).describe('Confidence level of the sentiment analysis')
  }),
  
  topics: z.array(z.string()).describe('Main topics or keywords mentioned in the message'),
  
  needsResponse: z.boolean().describe('Whether this message requires a response'),
  
  summary: z.string().describe('A brief summary of the message for Slack notification'),
  
  suggestedActions: z.array(z.string()).describe('Suggested actions for handling this message'),
  
  customerMood: z.object({
    description: z.string().describe('Brief description of customer mood'),
    emoji: z.string().describe('Emoji representing the mood')
  }),
  
  technicalDetails: z.object({
    hasCode: z.boolean().describe('Whether the message contains code snippets'),
    hasError: z.boolean().describe('Whether the message mentions errors'),
    hasScreenshot: z.boolean().describe('Whether the message includes screenshots or images'),
    mentionsVersion: z.boolean().describe('Whether specific versions are mentioned')
  })
});

export type MessageAnalysis = z.infer<typeof messageAnalysisSchema>;

/**
 * Process a Discord message and analyze it for customer support
 * @param messageData The Discord message data to process
 * @returns Analysis result with token usage information
 */
export async function processMessage(messageData: MessageData): Promise<{
  analysis: MessageAnalysis;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  messageData: MessageData;
}> {
  const startTime = Date.now();
  
  console.log('\n=== Processing Message ===');
  console.log('Message ID:', messageData.id);
  console.log('Author:', messageData.author.tag);
  console.log('Channel:', `#${messageData.channel.name}` + (messageData.channel.isThread ? ' (thread)' : ''));
  console.log('Server:', messageData.guild.name);
  console.log('Content:', messageData.content || '(no text content)');
  
  // Prepare context for AI analysis
  const attachmentInfo = messageData.attachments.length > 0 
    ? `Attachments: ${messageData.attachments.map(a => `${a.filename} (${a.contentType})`).join(', ')}`
    : '';
  
  const embedInfo = messageData.embeds.length > 0
    ? `Embeds: ${messageData.embeds.map(e => e.title || 'Untitled').join(', ')}`
    : '';
  
  const mentionInfo = (messageData.mentions.users.length > 0 || messageData.mentions.roles.length > 0 || messageData.mentions.everyone)
    ? `Mentions: ${[
        messageData.mentions.everyone ? '@everyone' : '',
        ...messageData.mentions.users.map(u => `@${u}`),
        ...messageData.mentions.roles.map(r => `@${r}`)
      ].filter(Boolean).join(', ')}`
    : '';

  // Create a comprehensive prompt for AI analysis
  const prompt = `Analyze this Discord message for customer support purposes:

Message Content: "${messageData.content}"
Author: ${messageData.author.tag} (${messageData.author.bot ? 'Bot' : 'Human'})
Channel: #${messageData.channel.name} ${messageData.channel.isThread ? '(thread)' : ''}
Server: ${messageData.guild.name}
${attachmentInfo}
${embedInfo}
${mentionInfo}

Please analyze this message and categorize it according to:
1. Support status type (help request, bug report, feature request, etc.)
2. Emotional tone and sentiment
3. Priority level
4. Key topics
5. Whether it needs a response
6. Provide a brief summary suitable for Slack notification
7. Suggest actions for handling this message
8. Assess technical details (code, errors, screenshots, version mentions)`;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  
  try {
    // Use generateObject to get structured analysis
    const result = await generateObject({
      model: openai(model),
      schema: messageAnalysisSchema,
      prompt,
      schemaName: 'MessageAnalysis',
      schemaDescription: 'Customer support analysis of a Discord message'
    });

    const processingTime = Date.now() - startTime;

    // Log the analysis results
    console.log('\n=== AI Analysis Results ===');
    console.log('Support Status:', result.object.supportStatus);
    console.log('Tone:', result.object.tone);
    console.log('Priority:', result.object.priority);
    console.log('Sentiment Score:', result.object.sentiment.score);
    console.log('Topics:', result.object.topics.join(', '));
    console.log('Needs Response:', result.object.needsResponse);
    console.log('Summary:', result.object.summary);
    console.log('Customer Mood:', `${result.object.customerMood.emoji} ${result.object.customerMood.description}`);
    console.log('\nSuggested Actions:');
    result.object.suggestedActions.forEach(action => {
      console.log(`  - ${action}`);
    });
    
    // Extract token usage (the actual structure depends on the provider)
    // For OpenAI models, usage typically includes promptTokens and completionTokens
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = result.usage?.totalTokens || 0;
    
    // Try to extract detailed token counts if available
    if (result.usage && typeof result.usage === 'object') {
      // Check for various possible property names
      if ('promptTokens' in result.usage) {
        promptTokens = (result.usage as any).promptTokens || 0;
      }
      if ('completionTokens' in result.usage) {
        completionTokens = (result.usage as any).completionTokens || 0;
      }
      // If we have prompt and completion tokens, calculate total
      if (promptTokens > 0 && completionTokens > 0) {
        totalTokens = promptTokens + completionTokens;
      }
    }
    
    // Log token usage for billing monitoring
    console.log('\n=== Token Usage (for billing) ===');
    console.log('Model:', model);
    console.log('Prompt Tokens:', promptTokens || 'Not available');
    console.log('Completion Tokens:', completionTokens || 'Not available');
    console.log('Total Tokens:', totalTokens);
    console.log('Processing Time:', `${processingTime}ms`);
    
    // Calculate and log costs
    const inputCost = (promptTokens / 1_000_000) * 0.050;
    const outputCost = (completionTokens / 1_000_000) * 0.400;
    const totalCost = inputCost + outputCost;
    
    if (promptTokens > 0 && completionTokens > 0) {
      console.log(`Cost: $${totalCost.toFixed(6)} (Input: $${inputCost.toFixed(6)}, Output: $${outputCost.toFixed(6)})`);
    }
    console.log('=========================\n');
    
    // Save usage data to database
    await saveUsage(
      messageData,
      result.object,
      {
        promptTokens,
        completionTokens,
        totalTokens
      },
      model,
      processingTime
    );

    return {
      analysis: result.object,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens
      },
      messageData
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Error analyzing message:', error);
    
    // Create a default analysis for the failed request
    const defaultAnalysis: MessageAnalysis = {
      supportStatus: 'other',
      tone: 'neutral',
      priority: 'medium',
      sentiment: { score: 0, confidence: 0 },
      topics: [],
      needsResponse: true,
      summary: 'Unable to analyze message',
      suggestedActions: ['Manual review required'],
      customerMood: { description: 'Unknown', emoji: '❓' },
      technicalDetails: {
        hasCode: false,
        hasError: false,
        hasScreenshot: messageData.attachments.length > 0,
        mentionsVersion: false
      }
    };
    
    // Save the error to database
    await saveUsage(
      messageData,
      defaultAnalysis,
      {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      model,
      processingTime,
      error as Error
    );
    
    // Return a default analysis if AI fails
    return {
      analysis: defaultAnalysis,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      messageData
    };
  }
}