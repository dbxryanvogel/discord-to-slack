import { WebhookSettingsComponent } from '@/components/webhook-settings';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure Slack webhook notifications and filtering rules
        </p>
      </div>
      
      <WebhookSettingsComponent />
    </div>
  );
}
