require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

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
let monitoredChannels = [];

// When bot is ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('Connected to servers:', client.guilds.cache.map(g => g.name).join(', '));
    
    // List all available channels across all servers
    console.log('\n=== Available Channels ===');
    client.guilds.cache.forEach(guild => {
        console.log(`\nServer: ${guild.name}`);
        guild.channels.cache
            .filter(channel => channel.type === 0) // 0 = text channel
            .forEach(channel => {
                console.log(`  - ${channel.name} (ID: ${channel.id})`);
            });
    });
    
    // If CHANNEL_IDS env var is set, use those channels
    if (process.env.CHANNEL_IDS && process.env.CHANNEL_IDS.toUpperCase() === 'ALL') {
        console.log('\n=== Monitoring ALL Channels ===');
        monitoredChannels = []; // Empty array means monitor all
    } else if (process.env.CHANNEL_IDS) {
        monitoredChannels = process.env.CHANNEL_IDS.split(',').map(id => id.trim()).filter(id => id);
        console.log('\n=== Monitoring Specific Channels ===');
        console.log('Channel IDs:', monitoredChannels);
    } else {
        console.log('\n=== Monitoring ALL Channels (no config) ===');
        monitoredChannels = [];
    }
});

// Listen for new messages
client.on('messageCreate', async (message) => {
    // Debug: Log ALL messages with content
    console.log(`\n[DEBUG] New message:`);
    console.log(`  Channel: #${message.channel.name} (${message.channel.id})`);
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
        shouldProcess = monitoredChannels.includes(parentId);
        console.log(`[DEBUG] Thread parent channel: ${parentId}, monitored: ${shouldProcess}`);
    } else {
        // Regular channel - check if it's monitored
        shouldProcess = monitoredChannels.includes(message.channel.id);
    }
    
    if (!shouldProcess) {
        console.log(`[DEBUG] Skipping - channel/thread not in monitored list`);
        return;
    }
    
    // Extract all message metadata
    const messageData = {
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
            name: message.channel.name,
            type: message.channel.type,
            nsfw: message.channel.nsfw,
            isThread: message.channel.isThread(),
            parentId: message.channel.parentId || null,
            parentName: message.channel.parent?.name || null
        },
        
        // Server info
        guild: {
            id: message.guild.id,
            name: message.guild.name,
            icon: message.guild.iconURL()
        },
        
        // Member info (roles, nickname, etc)
        member: {
            nickname: message.member?.nickname,
            roles: message.member?.roles.cache.map(role => ({
                id: role.id,
                name: role.name,
                color: role.hexColor
            })),
            joinedAt: message.member?.joinedAt
        },
        
        // Attachments
        attachments: message.attachments.map(att => ({
            id: att.id,
            filename: att.name,
            size: att.size,
            url: att.url,
            contentType: att.contentType
        })),
        
        // Message flags
        mentions: {
            users: message.mentions.users.map(u => u.tag),
            roles: message.mentions.roles.map(r => r.name),
            everyone: message.mentions.everyone
        },
        
        // URLs in message
        embeds: message.embeds.map(embed => ({
            title: embed.title,
            description: embed.description,
            url: embed.url,
            type: embed.type
        }))
    };
    
    console.log('\n=== New Message Received ===');
    console.log(JSON.stringify(messageData, null, 2));
    
    // Here you would:
    // 1. Send messageData to your AI endpoint
    // 2. Get the analysis result
    // 3. Forward to Slack with the analysis
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
