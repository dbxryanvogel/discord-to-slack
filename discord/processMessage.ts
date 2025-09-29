import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { MessageData } from './types';
import { saveUsage, saveMessageLog, shouldSendWebhook, sendSlackWebhook, getEnabledTeams, shouldTeamReceiveWebhook, sendTeamSlackWebhook } from './database/client';

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
  }),

  teamRouting: z.object({
    recommendedTeam: z.string().describe('The name of the team that should handle this message'),
    confidence: z.number().min(0).max(1).describe('Confidence level in the team routing decision'),
    reasoning: z.string().describe('Brief explanation of why this team was chosen')
  }).optional().describe('AI-recommended team routing (only if teams are available)')
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

  // Fetch available teams for AI routing
  const enabledTeams = await getEnabledTeams();
  console.log('Available teams for routing:', enabledTeams.length > 0 ? enabledTeams.map(t => t.name).join(', ') : 'None');
  
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

  // Create team information for AI routing
  const teamInfo = enabledTeams.length > 0 
    ? `\n\nAvailable Teams for Routing:
${enabledTeams.map(team => `- ${team.name}: ${team.description}`).join('\n')}

Please also recommend which team should handle this message based on the team descriptions above.`
    : '';

  // Create a comprehensive prompt for AI analysis
  const prompt = `Analyze this Discord message for customer support purposes:

Message Content: "${messageData.content}"
Author: ${messageData.author.tag} (${messageData.author.bot ? 'Bot' : 'Human'})
Channel: #${messageData.channel.name} ${messageData.channel.isThread ? '(thread)' : ''}
Server: ${messageData.guild.name}
${attachmentInfo}
${embedInfo}
${mentionInfo}${teamInfo}

Please analyze this message and categorize it according to:
1. Support status type (help request, bug report, feature request, etc.)
2. Emotional tone and sentiment
3. Priority level
4. Key topics
5. Whether it needs a response
6. Provide a brief summary suitable for Slack notification
7. Suggest actions for handling this message
8. Assess technical details (code, errors, screenshots, version mentions)${enabledTeams.length > 0 ? '\n9. Recommend the most appropriate team to handle this message' : ''}`;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  
  // Create dynamic schema based on whether teams are available
  const dynamicSchema = enabledTeams.length > 0 
    ? messageAnalysisSchema
    : messageAnalysisSchema.omit({ teamRouting: true });
  
  try {
    // Use generateObject to get structured analysis
    const result = await generateObject({
      model: openai(model),
      schema: dynamicSchema,
      prompt
    } as any);

    const processingTime = Date.now() - startTime;
    const analysis = result.object as MessageAnalysis;

    // Log the analysis results
    console.log('\n=== AI Analysis Results ===');
    console.log('Support Status:', analysis.supportStatus);
    console.log('Tone:', analysis.tone);
    console.log('Priority:', analysis.priority);
    console.log('Sentiment Score:', analysis.sentiment.score);
    console.log('Topics:', analysis.topics.join(', '));
    console.log('Needs Response:', analysis.needsResponse);
    console.log('Summary:', analysis.summary);
    console.log('Customer Mood:', `${analysis.customerMood.emoji} ${analysis.customerMood.description}`);
    
    if (analysis.teamRouting) {
      console.log('\n=== Team Routing ===');
      console.log('Recommended Team:', analysis.teamRouting.recommendedTeam);
      console.log('Confidence:', `${(analysis.teamRouting.confidence * 100).toFixed(1)}%`);
      console.log('Reasoning:', analysis.teamRouting.reasoning);
    }
    
    console.log('\nSuggested Actions:');
    analysis.suggestedActions.forEach((action: string) => {
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
      analysis,
      {
        promptTokens,
        completionTokens,
        totalTokens
      },
      model,
      processingTime
    );
    
    // Save message log with full analysis
    await saveMessageLog(
      messageData,
      analysis,
      {
        promptTokens,
        completionTokens,
        totalTokens
      },
      model,
      processingTime
    );

    // Handle team routing and webhooks
    try {
      let routedToTeam = false;
      
      // If we have team routing recommendations, try to route to the recommended team first
      if (analysis.teamRouting && enabledTeams.length > 0) {
        const recommendedTeam = enabledTeams.find(team => 
          team.name.toLowerCase() === analysis.teamRouting!.recommendedTeam.toLowerCase()
        );
        
        if (recommendedTeam) {
          const shouldSendToTeam = await shouldTeamReceiveWebhook(recommendedTeam, messageData, analysis);
          if (shouldSendToTeam) {
            console.log(`🎯 Routing message to recommended team: ${recommendedTeam.name}`);
            const teamWebhookSent = await sendTeamSlackWebhook(
              recommendedTeam, 
              messageData, 
              analysis, 
              analysis.teamRouting.confidence
            );
            if (teamWebhookSent) {
              console.log(`✅ Team webhook sent successfully to ${recommendedTeam.name}`);
              routedToTeam = true;
            } else {
              console.log(`❌ Failed to send team webhook to ${recommendedTeam.name}`);
            }
          } else {
            console.log(`⏭️  Recommended team ${recommendedTeam.name} doesn't meet webhook criteria`);
          }
        } else {
          console.log(`⚠️  Recommended team "${analysis.teamRouting.recommendedTeam}" not found in enabled teams`);
        }
      }
      
      // If no specific team routing or it failed, try other teams that might be interested
      if (!routedToTeam && enabledTeams.length > 0) {
        console.log('🔍 Checking other teams for potential routing...');
        for (const team of enabledTeams) {
          // Skip the team we already tried
          if (analysis.teamRouting && team.name.toLowerCase() === analysis.teamRouting.recommendedTeam.toLowerCase()) {
            continue;
          }
          
          const shouldSendToTeam = await shouldTeamReceiveWebhook(team, messageData, analysis);
          if (shouldSendToTeam) {
            console.log(`📤 Sending to team: ${team.name}`);
            const teamWebhookSent = await sendTeamSlackWebhook(team, messageData, analysis);
            if (teamWebhookSent) {
              console.log(`✅ Team webhook sent successfully to ${team.name}`);
              routedToTeam = true;
            } else {
              console.log(`❌ Failed to send team webhook to ${team.name}`);
            }
          }
        }
      }
      
      // Fallback to general webhook if no teams were routed to
      if (!routedToTeam) {
        const shouldSend = await shouldSendWebhook(messageData, analysis);
        if (shouldSend) {
          console.log(`🔔 Sending general Slack webhook for message from ${messageData.author.tag}`);
          const webhookSent = await sendSlackWebhook(messageData, analysis);
          if (webhookSent) {
            console.log(`✅ General Slack webhook sent successfully`);
          } else {
            console.log(`❌ Failed to send general Slack webhook`);
          }
        } else {
          console.log(`⏭️  Message doesn't meet any webhook criteria`);
        }
      }
    } catch (webhookError) {
      console.error('❌ Error processing webhooks:', webhookError);
      // Don't fail the entire message processing if webhook fails
    }

    return {
      analysis,
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