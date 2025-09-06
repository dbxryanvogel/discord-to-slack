# Discord to Slack Bot with AI Analysis

A TypeScript Discord bot that monitors messages in specified channels, analyzes them using AI for customer support insights, and forwards them to Slack with intelligent categorization.

## Features

- 🤖 **AI-Powered Message Analysis**: Uses OpenAI to analyze Discord messages for customer support
- 📊 **Intelligent Categorization**: Automatically categorizes messages (help requests, bug reports, feature requests, etc.)
- 🎭 **Sentiment Analysis**: Detects customer tone and mood
- 🚨 **Priority Detection**: Assigns priority levels based on content and urgency
- 💰 **Token Usage Tracking**: Monitors AI token usage for billing purposes
- 🔍 **Technical Detail Detection**: Identifies code snippets, errors, screenshots, and version mentions
- 📝 **Smart Summaries**: Generates concise summaries suitable for Slack notifications

## Message Analysis Categories

### Support Status Types
- `help_request` - User needs assistance
- `bug_report` - Reporting an issue
- `feature_request` - Requesting new functionality
- `complaint` - Expressing dissatisfaction
- `feedback` - Providing general feedback
- `question` - Asking a question
- `documentation_issue` - Reporting documentation problems
- `urgent_issue` - Critical/time-sensitive matters
- `general_discussion` - General conversation
- `resolved` - Issue has been resolved
- `other` - Doesn't fit other categories

### Tone Analysis
- `happy`, `neutral`, `frustrated`, `angry`, `confused`, `grateful`, `urgent`, `professional`

### Priority Levels
- `low`, `medium`, `high`, `critical`

## Setup

### 1. Environment Configuration

Create a `.env` file with your tokens:

```env
# Discord Bot Token
DISCORD_TOKEN=your_discord_bot_token_here

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini  # Options: gpt-4o, gpt-4o-mini, gpt-4-turbo

# Channel Monitoring Options
CHANNEL_IDS=ALL  # or specific IDs: 1234567890,0987654321
```

### 2. Install Dependencies

```bash
npm install
```

### 3. List Available Channels

```bash
npm run list-channels
```

This will show all text channels and their IDs.

### 4. Configure Channel Monitoring

- **Monitor ALL channels**: `CHANNEL_IDS=ALL`
- **Monitor specific channels**: `CHANNEL_IDS=1234567890,0987654321`
- **Leave empty to monitor all**: `CHANNEL_IDS=`

### 5. Run the Bot

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

## Project Structure

```
discord-to-slack/
├── src/                    # TypeScript source files
│   ├── bot.ts             # Main bot file
│   ├── list-channels.ts   # Channel listing utility
│   ├── processMessage.ts  # AI message processing
│   └── types.ts           # TypeScript type definitions
├── dist/                  # Compiled JavaScript (auto-generated)
├── .env                   # Environment variables (create this)
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies
```

## What the Bot Analyzes

For each message, the bot:

1. **Extracts Message Data**:
   - Content, author, channel, server info
   - Attachments, mentions, embeds
   - Timestamps and edit history

2. **Performs AI Analysis**:
   - Categorizes the support request type
   - Analyzes emotional tone and sentiment
   - Assigns priority level
   - Identifies key topics
   - Determines if response is needed
   - Generates summary for Slack
   - Suggests handling actions
   - Detects technical details

3. **Tracks Token Usage**:
   - Monitors total tokens used
   - Logs usage for billing purposes
   - Provides fallback if AI fails

## Example Output

```
=== AI Analysis Results ===
Support Status: bug_report
Tone: frustrated
Priority: high
Sentiment Score: -0.3
Topics: login, authentication, error
Needs Response: true
Summary: User unable to login, receiving authentication error
Customer Mood: 😤 Frustrated with login issues

Suggested Actions:
  - Check authentication service status
  - Review recent auth system changes
  - Escalate to engineering team

=== Token Usage (for billing) ===
Total Tokens: 245
```

## Extending the Bot

The `processMessage` function returns structured data that can be used to:
- Send formatted messages to Slack
- Store analysis in a database
- Trigger automated workflows
- Generate support tickets
- Track customer sentiment over time

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode with auto-reload
- `npm start` - Run compiled production version
- `npm run list-channels` - List all Discord channels
- `npm run list-channels:prod` - List channels (production)

## Technologies Used

- **TypeScript** - Type-safe development
- **Discord.js** - Discord API integration
- **Vercel AI SDK** - Structured AI responses ([Documentation](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data))
- **OpenAI** - Message analysis
- **Zod** - Schema validation for AI responses

## License

ISC