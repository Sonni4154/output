import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  RefreshCw, 
  Trash2,
  Database,
  Users,
  Package,
  FileText,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// API functions
const qboApi = {
  getAuthUrl: () => fetch('/api/quickbooks/auth/url').then(res => res.json()),
  getAccounts: () => fetch('/api/quickbooks/accounts').then(res => res.json()),
  revokeAccount: (realmId: string) => 
    fetch(`/api/quickbooks/accounts/${realmId}`, { method: 'DELETE' }).then(res => res.json()),
  testToken: (realmId: string) => 
    fetch(`/api/quickbooks/test/${realmId}`).then(res => res.json()),
  getCompanyInfo: (realmId: string) => 
    fetch(`/api/quickbooks/company/${realmId}`).then(res => res.json()),
  getCustomers: (realmId: string) => 
    fetch(`/api/quickbooks/customers/${realmId}`).then(res => res.json()),
  getItems: (realmId: string) => 
    fetch(`/api/quickbooks/items/${realmId}`).then(res => res.json()),
  getInvoices: (realmId: string) => 
    fetch(`/api/quickbooks/invoices/${realmId}`).then(res => res.json()),
  syncData: (realmId: string, entityType: string) => 
    fetch(`/api/quickbooks/sync/${realmId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType })
    }).then(res => res.json())
};

export default function QuickBooksManager() {
  const [selectedRealmId, setSelectedRealmId] = useState<string>("");
  const [authUrl, setAuthUrl] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch connected accounts
  const { data: accountsData, isLoading: accountsLoading, refetch: refetchAccounts } = useQuery({
    queryKey: ['quickbooks-accounts'],
    queryFn: qboApi.getAccounts,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch auth URL
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ['quickbooks-auth-url'],
    queryFn: qboApi.getAuthUrl,
    enabled: false
  });

  // Test token mutation
  const testTokenMutation = useMutation({
    mutationFn: qboApi.testToken,
    onSuccess: (data) => {
      toast({
        title: "Token Test Successful",
        description: data.message,
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Token Test Failed",
        description: "Failed to test QuickBooks token",
        variant: "destructive"
      });
    }
  });

  // Revoke account mutation
  const revokeAccountMutation = useMutation({
    mutationFn: qboApi.revokeAccount,
    onSuccess: () => {
      toast({
        title: "Access Revoked",
        description: "QuickBooks access has been revoked successfully",
        variant: "default"
      });
      refetchAccounts();
    },
    onError: () => {
      toast({
        title: "Revoke Failed",
        description: "Failed to revoke QuickBooks access",
        variant: "destructive"
      });
    }
  });

  // Sync data mutation
  const syncDataMutation = useMutation({
    mutationFn: ({ realmId, entityType }: { realmId: string; entityType: string }) => 
      qboApi.syncData(realmId, entityType),
    onSuccess: (data) => {
      toast({
        title: "Sync Successful",
        description: `Synced ${data.recordCount} ${data.entityType} records`,
        variant: "default"
      });
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Failed to sync data from QuickBooks",
        variant: "destructive"
      });
    }
  });

  // Generate auth URL
  const generateAuthUrl = async () => {
    try {
      const response = await fetch('/api/quickbooks/auth/url');
      const data = await response.json();
      if (data.success) {
        setAuthUrl(data.authUrl);
        window.open(data.authUrl, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate authorization URL",
        variant: "destructive"
      });
    }
  };

  const handleRevokeAccount = (realmId: string) => {
    if (window.confirm('Are you sure you want to revoke QuickBooks access for this account?')) {
      revokeAccountMutation.mutate(realmId);
    }
  };

  const handleSyncData = (realmId: string, entityType: string) => {
    syncDataMutation.mutate({ realmId, entityType });
  };

  const accounts = accountsData?.accounts || [];

  return (
    <div className="space-y-6">
      {/* Authorization Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            QuickBooks Authorization
          </CardTitle>
          <CardDescription>
            Connect your QuickBooks account to enable data synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={generateAuthUrl}
              disabled={authLoading}
              className="flex items-center gap-2"
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Connect QuickBooks Account
            </Button>
            
            {authUrl && (
              <Button 
                variant="outline" 
                onClick={() => window.open(authUrl, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Authorization URL
              </Button>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>1. Click "Connect QuickBooks Account" to generate an authorization URL</p>
            <p>2. Complete the OAuth flow in QuickBooks</p>
            <p>3. Your account will appear in the connected accounts list below</p>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Connected Accounts ({accounts.length})
          </CardTitle>
          <CardDescription>
            Manage your connected QuickBooks accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accountsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading accounts...</span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No QuickBooks accounts connected</p>
              <p className="text-sm">Use the authorization section above to connect your first account</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account: any) => (
                <Card key={account.realmId} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{account.companyName}</h3>
                          <Badge variant={account.isActive ? "default" : "secondary"}>
                            {account.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Realm ID: {account.realmId}
                        </p>
                        {account.lastSyncAt && (
                          <p className="text-sm text-muted-foreground">
                            Last sync: {new Date(account.lastSyncAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testTokenMutation.mutate(account.realmId)}
                          disabled={testTokenMutation.isPending}
                        >
                          {testTokenMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Test Token
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeAccount(account.realmId)}
                          disabled={revokeAccountMutation.isPending}
                        >
                          {revokeAccountMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Sync Section */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Data Synchronization
            </CardTitle>
            <CardDescription>
              Sync data from QuickBooks to your local database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="realm-select">Select Account</Label>
                <select
                  id="realm-select"
                  value={selectedRealmId}
                  onChange={(e) => setSelectedRealmId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Choose an account...</option>
                  {accounts.map((account: any) => (
                    <option key={account.realmId} value={account.realmId}>
                      {account.companyName} ({account.realmId})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {selectedRealmId && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSyncData(selectedRealmId, 'customers')}
                  disabled={syncDataMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Sync Customers
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleSyncData(selectedRealmId, 'items')}
                  disabled={syncDataMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  Sync Items
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleSyncData(selectedRealmId, 'invoices')}
                  disabled={syncDataMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Sync Invoices
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    handleSyncData(selectedRealmId, 'customers');
                    handleSyncData(selectedRealmId, 'items');
                    handleSyncData(selectedRealmId, 'invoices');
                  }}
                  disabled={syncDataMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>QuickBooks Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {accounts.length > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span>Accounts Connected: {accounts.length}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {accounts.some((acc: any) => acc.isActive) ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span>Active Connections: {accounts.filter((acc: any) => acc.isActive).length}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>API Endpoints: Available</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
