import Link from 'next/link';
import { UsageStatsComponent } from '@/components/usage-stats';
import { MessageLogsComponent } from '@/components/message-logs';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export default function Home() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Discord Bot Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor AI usage statistics and message analysis from your Discord bot
            </p>
          </div>
          <Link href="/settings">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
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
