import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

interface SyncStatus {
  integrations?: Array<{
    provider: string;
    isActive: boolean;
    lastSyncAt: string | null;
    syncStatus: 'pending' | 'syncing' | 'success' | 'error';
  }>;
  recentLogs?: Array<{
    id: string;
    operation: string;
    entityType: string;
    status: string;
    direction: string;
    errorMessage?: string;
    createdAt: string;
  }>;
}

export default function SyncButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-900 text-green-100">Synced</Badge>;
      case 'error':
        return <Badge variant="destructive" className="bg-red-900 text-red-100">Error</Badge>;
      case 'syncing':
        return <Badge variant="outline" className="bg-blue-900 text-blue-100 border-blue-700">Syncing</Badge>;
      default:
        return <Badge variant="secondary" className="bg-slate-800 text-slate-100">Pending</Badge>;
    }
  };

  // Mock data for frontend-only version
  const integrations: any[] = [];
  const quickbooksIntegration = undefined;
  const isSyncing = false;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync
          {quickbooksIntegration && (
            <div className="ml-2">
              {quickbooksIntegration.connected ? 
                getStatusIcon('success') : 
                getStatusIcon(quickbooksIntegration.syncStatus)
              }
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-slate-900 mb-2">Integration Status</h3>
            <div className="space-y-2">
              {Array.isArray(integrations) ? integrations.map((integration: any) => (
                <div key={integration.provider} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(integration.syncStatus)}
                    <div>
                      <p className="font-medium text-sm capitalize">{integration.provider}</p>
                      {integration.lastSyncAt && (
                        <p className="text-xs text-slate-500">
                          Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(integration.connected ? 'success' : integration.syncStatus)}
                    {integration.provider === 'quickbooks' && integration.connected && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                            variant="outline"
                            disabled={true}
                          >
                            Sync Now (Backend Required)
                          </Button>
                      </div>
                    )}
                  </div>
                </div>
              )) : null}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium text-slate-900 mb-2">Recent Activity</h3>
            <p className="text-sm text-slate-500 text-center py-4">No recent activity - Backend required</p>
          </div>

          {quickbooksIntegration && !quickbooksIntegration.isActive && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    QuickBooks integration is not active. Please configure it in the Integrations page.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}