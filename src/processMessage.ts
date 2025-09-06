import { MessageData } from './types';

/**
 * Process a Discord message and prepare it for forwarding
 * @param messageData The Discord message data to process
 */
export async function processMessage(messageData: MessageData): Promise<void> {
  console.log('\n=== Processing Message ===');
  console.log('Message ID:', messageData.id);
  console.log('Author:', messageData.author.tag);
  console.log('Channel:', `#${messageData.channel.name}` + (messageData.channel.isThread ? ' (thread)' : ''));
  console.log('Server:', messageData.guild.name);
  console.log('Content:', messageData.content || '(no text content)');
  
  if (messageData.attachments.length > 0) {
    console.log('Attachments:');
    messageData.attachments.forEach(att => {
      console.log(`  - ${att.filename} (${att.size} bytes)`);
    });
  }
  
  if (messageData.embeds.length > 0) {
    console.log('Embeds:');
    messageData.embeds.forEach(embed => {
      console.log(`  - ${embed.title || 'Untitled'}: ${embed.description || 'No description'}`);
    });
  }
  
  if (messageData.mentions.users.length > 0 || messageData.mentions.roles.length > 0 || messageData.mentions.everyone) {
    console.log('Mentions:');
    if (messageData.mentions.everyone) console.log('  - @everyone');
    messageData.mentions.users.forEach(user => console.log(`  - User: ${user}`));
    messageData.mentions.roles.forEach(role => console.log(`  - Role: ${role}`));
  }
  
  console.log('Timestamp:', messageData.timestamp);
  console.log('=========================\n');
  
  // TODO: In the future, this is where we would:
  // 1. Send messageData to an AI endpoint for analysis
  // 2. Get the analysis result
  // 3. Forward to Slack with the analysis
}
