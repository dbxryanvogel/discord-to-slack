import 'dotenv/config';
import { Client, GatewayIntentBits, Message, TextChannel, ThreadChannel } from 'discord.js';
import { MessageData } from './types';
import { processMessage } from './processMessage';
import { initializeDatabase } from './database/client';

// Create Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Store channels we want to monitor (can be configured)
let monitoredChannels: string[] = [];

// When bot is ready
client.once('ready', async () => {
    if (!client.user) return;
    
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('Connected to servers:', client.guilds.cache.map(g => g.name).join(', '));
    
    // Initialize database
    try {
        await initializeDatabase();
    } catch (error) {
        console.error('Failed to initialize database:', error);
        console.log('Bot will continue without database functionality');
    }
    
    // List all available channels across all servers
    console.log('\n=== Available Channels ===');
    client.guilds.cache.forEach(guild => {
        console.log(`\nServer: ${guild.name}`);
        guild.channels.cache
            .filter((channel): channel is TextChannel => channel.type === 0) // 0 = text channel
            .forEach(channel => {
                console.log(`  - ${channel.name} (ID: ${channel.id})`);
            });
    });
    
    // If CHANNEL_IDS env var is set, use those channels
    const channelIds = process.env.CHANNEL_IDS;
    if (channelIds && channelIds.toUpperCase() === 'ALL') {
        console.log('\n=== Monitoring ALL Channels ===');
        monitoredChannels = []; // Empty array means monitor all
    } else if (channelIds) {
        monitoredChannels = channelIds.split(',').map(id => id.trim()).filter(id => id);
        console.log('\n=== Monitoring Specific Channels ===');
        console.log('Channel IDs:', monitoredChannels);
    } else {
        console.log('\n=== Monitoring ALL Channels (no config) ===');
        monitoredChannels = [];
    }
});

// Listen for new messages
client.on('messageCreate', async (message: Message) => {
    // Debug: Log ALL messages with content
    console.log(`\n[DEBUG] New message:`);
    console.log(`  Channel: #${message.channel.type === 0 || message.channel.isThread() ? (message.channel as TextChannel | ThreadChannel).name : 'Unknown'} (${message.channel.id})`);
    console.log(`  Author: ${message.author.tag}`);
    console.log(`  Content: "${message.content}"`);
    console.log(`  Is Thread: ${message.channel.isThread()}`);
    
    // Skip bot messages
    if (message.author.bot) {
        console.log('[DEBUG] Skipping bot message');
        return;
    }
    
    // Check if we should process this channel or thread
    let shouldProcess = false;
    
    if (monitoredChannels.length === 0) {
        // No filter - process all messages
        shouldProcess = true;
    } else if (message.channel.isThread()) {
        // For threads, check if parent channel is monitored
        const parentId = message.channel.parentId;
        shouldProcess = parentId ? monitoredChannels.includes(parentId) : false;
        console.log(`[DEBUG] Thread parent channel: ${parentId}, monitored: ${shouldProcess}`);
    } else {
        // Regular channel - check if it's monitored
        shouldProcess = monitoredChannels.includes(message.channel.id);
    }
    
    if (!shouldProcess) {
        console.log(`[DEBUG] Skipping - channel/thread not in monitored list`);
        return;
    }
    
    // Ensure we have guild context
    if (!message.guild) {
        console.log('[DEBUG] No guild context, skipping');
        return;
    }
    
    // Get channel name safely
    let channelName = 'Unknown';
    let parentName: string | null = null;
    
    if (message.channel.type === 0) {
        channelName = (message.channel as TextChannel).name;
    } else if (message.channel.isThread()) {
        const threadChannel = message.channel as ThreadChannel;
        channelName = threadChannel.name;
        parentName = threadChannel.parent?.name || null;
    }
    
    // Extract all message metadata
    const messageData: MessageData = {
        // Message info
        content: message.content,
        id: message.id,
        timestamp: message.createdAt,
        editedTimestamp: message.editedAt,
        
        // Author info
        author: {
            id: message.author.id,
            username: message.author.username,
            discriminator: message.author.discriminator,
            tag: message.author.tag,
            avatar: message.author.avatarURL(),
            bot: message.author.bot
        },
        
        // Channel info
        channel: {
            id: message.channel.id,
            name: channelName,
            type: message.channel.type,
            nsfw: 'nsfw' in message.channel ? message.channel.nsfw : false,
            isThread: message.channel.isThread(),
            parentId: message.channel.isThread() ? (message.channel as ThreadChannel).parentId : null,
            parentName: parentName
        },
        
        // Server info
        guild: {
            id: message.guild.id,
            name: message.guild.name,
            icon: message.guild.iconURL()
        },
        
        // Member info (roles, nickname, etc)
        member: {
            nickname: message.member?.nickname || null,
            roles: message.member?.roles.cache.map(role => ({
                id: role.id,
                name: role.name,
                color: role.hexColor
            })) || [],
            joinedAt: message.member?.joinedAt || null
        },
        
        // Attachments
        attachments: Array.from(message.attachments.values()).map(att => ({
            id: att.id,
            filename: att.name,
            size: att.size,
            url: att.url,
            contentType: att.contentType
        })),
        
        // Message flags
        mentions: {
            users: Array.from(message.mentions.users.values()).map(u => u.tag),
            roles: Array.from(message.mentions.roles.values()).map(r => r.name),
            everyone: message.mentions.everyone
        },
        
        // URLs in message
        embeds: message.embeds.map(embed => ({
            title: embed.title,
            description: embed.description,
            url: embed.url,
            type: embed.data.type || 'rich'
        }))
    };
    
    // Process the message using our new function
    const result = await processMessage(messageData);
    
    // Log the analysis result (in production, this would be sent to Slack)
    console.log('\n📊 Message Analysis Complete');
    console.log(`Priority: ${result.analysis.priority.toUpperCase()}`);
    console.log(`Status: ${result.analysis.supportStatus}`);
    console.log(`Mood: ${result.analysis.customerMood.emoji} ${result.analysis.customerMood.description}`);
});

// Login to Discord
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('DISCORD_TOKEN not found in environment variables');
    process.exit(1);
}

client.login(token).catch(error => {
    console.error('Failed to login:', error);
    process.exit(1);
});
