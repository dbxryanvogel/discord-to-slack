# Deployment Guide

## Railway Deployment

This bot is configured for easy deployment on Railway.

### Prerequisites

1. A Railway account ([railway.app](https://railway.app))
2. Your Discord bot token
3. Your OpenAI API key
4. A Neon database connection string

### Environment Variables

Set these environment variables in your Railway project:

```env
# Required
DISCORD_TOKEN=your_discord_bot_token_here
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# Optional
OPENAI_MODEL=gpt-4o-mini
CHANNEL_IDS=ALL
DASHBOARD_PORT=3000
```

### Deployment Steps

1. **Create a new Railway project**
   ```bash
   railway login
   railway init
   ```

2. **Link your GitHub repository**
   - Push your code to GitHub
   - Connect the repository in Railway dashboard

3. **Set environment variables**
   - Go to your Railway project settings
   - Add all required environment variables

4. **Deploy**
   - Railway will automatically deploy when you push to your main branch
   - The bot will start automatically using `npm start`

### Running Multiple Services

To run both the bot and dashboard on Railway:

1. **Option 1: Single Service (Recommended for small projects)**
   - Change the start command in Railway to: `npm start:all`
   - This runs both bot and dashboard in one container

2. **Option 2: Multiple Services (Better for scaling)**
   - Create two services in Railway:
     - **Bot Service**: Start command: `npm start`
     - **Dashboard Service**: Start command: `npm run dashboard:prod`
   - Share the same DATABASE_URL between services

### Monitoring

- View logs in Railway dashboard
- Access dashboard at `https://your-app.railway.app/usage`
- Run `npm run usage-stats` locally to check statistics

### Troubleshooting

#### Bun/NPM Conflicts
If you see "lockfile had changes" errors:
- The project uses NPM, not Bun
- Ensure `bun.lock` is deleted
- Use `npm ci` for clean installs

#### Database Connection Issues
- Ensure DATABASE_URL includes `?sslmode=require`
- Check Neon dashboard for connection limits
- Verify IP allowlisting if enabled

#### Memory Issues
- The bot is lightweight but AI calls can spike memory
- Monitor usage in Railway metrics
- Consider upgrading if hitting limits

### Cost Optimization

1. **Database**: Neon free tier includes:
   - 0.5 GB storage
   - 10 GB bandwidth/month
   - Perfect for small to medium Discord servers

2. **Railway**: Free tier includes:
   - $5/month credits
   - 500 GB bandwidth
   - Sufficient for bot + dashboard

3. **OpenAI**: Monitor with dashboard
   - Use `gpt-4o-mini` for cost efficiency
   - Dashboard shows exact costs per message
   - Set up billing alerts in OpenAI

### Security Notes

- Never commit `.env` file
- Use Railway's environment variables
- Enable 2FA on all accounts
- Regularly rotate API keys
- Monitor usage dashboard for anomalies
