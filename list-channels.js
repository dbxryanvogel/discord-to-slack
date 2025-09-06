require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// Create a minimal client just to list channels
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
    console.log(`Connected as ${client.user.tag}\n`);
    
    let allChannels = [];
    
    // Collect all text channels
    client.guilds.cache.forEach(guild => {
        console.log(`Server: ${guild.name}`);
        console.log('='.repeat(50));
        
        guild.channels.cache
            .filter(channel => channel.type === 0) // 0 = text channel
            .forEach(channel => {
                const channelInfo = {
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

client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('Failed to login:', err.message);
    console.log('\nMake sure you have a valid DISCORD_TOKEN in your .env file');
    process.exit(1);
});
