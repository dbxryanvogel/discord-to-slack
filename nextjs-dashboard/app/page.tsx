import { UsageStatsComponent } from '@/components/usage-stats';
import { MessageLogsComponent } from '@/components/message-logs';

export default function Home() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Discord Bot Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor AI usage statistics and message analysis from your Discord bot
        </p>
      </div>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Usage Statistics</h2>
          <UsageStatsComponent />
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">Message Logs</h2>
          <MessageLogsComponent />
        </section>
      </div>
    </div>
  );
}
