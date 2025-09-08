import 'dotenv/config';
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';

interface ChannelInfo {
    id: string;
    name: string;
    server: string;
    category: string;
}

// Create a minimal client just to list channels
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
    if (!client.user) {
        console.error('Client user not available');
        process.exit(1);
    }
    
    console.log(`Connected as ${client.user.tag}\n`);
    
    const allChannels: ChannelInfo[] = [];
    
    // Collect all text channels
    client.guilds.cache.forEach(guild => {
        console.log(`Server: ${guild.name}`);
        console.log('='.repeat(50));
        
        guild.channels.cache
            .filter((channel): channel is TextChannel => channel.type === 0) // 0 = text channel
            .forEach(channel => {
                const channelInfo: ChannelInfo = {
                    id: channel.id,
                    name: channel.name,
                    server: guild.name,
                    category: channel.parent?.name || 'No Category'
                };
                
                allChannels.push(channelInfo);
                console.log(`  ${channel.name}`);
                console.log(`    ID: ${channel.id}`);
                console.log(`    Category: ${channelInfo.category}`);
                console.log('');
            });
    });
    
    console.log('\n=== SETUP INSTRUCTIONS ===');
    console.log('To monitor specific channels, add their IDs to your .env file:');
    console.log('CHANNEL_IDS=id1,id2,id3\n');
    console.log('Example with first 3 channels:');
    if (allChannels.length > 0) {
        console.log(`CHANNEL_IDS=${allChannels.slice(0, 3).map(c => c.id).join(',')}`);
    }
    
    process.exit(0);
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('DISCORD_TOKEN not found in environment variables');
    console.log('\nMake sure you have a valid DISCORD_TOKEN in your .env file');
    process.exit(1);
}

client.login(token).catch((err: Error) => {
    console.error('Failed to login:', err.message);
    console.log('\nMake sure you have a valid DISCORD_TOKEN in your .env file');
    process.exit(1);
});
