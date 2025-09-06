# Discord Message Receiver

This is a simple Discord bot that shows how to:
1. Receive all new messages from a Discord server
2. List available channels
3. Select specific channels to monitor
4. Extract full message metadata

## Setup

1. Create a `.env` file with your Discord bot token:
```
DISCORD_TOKEN=your_discord_bot_token_here
CHANNEL_IDS=
```

2. Install dependencies:
```bash
npm install
```

3. List all available channels in your server:
```bash
npm run list-channels
```

This will show all text channels and their IDs.

4. Configure channel monitoring:

Option A - Monitor ALL channels:
```
CHANNEL_IDS=ALL
```

Option B - Monitor specific channels:
```
CHANNEL_IDS=1234567890,0987654321
```

Option C - Leave empty to also monitor all channels:
```
CHANNEL_IDS=
```

5. Run the bot:
```bash
npm start
```

## What the bot collects

For each message, the bot extracts:
- Message content and ID
- Author info (username, ID, avatar, roles)
- Channel info (name, ID, type)
- Server info
- Attachments
- Mentions
- Embeds/URLs
- Timestamps

All this data is logged to console. In your implementation, you would send this to your AI endpoint for processing.
