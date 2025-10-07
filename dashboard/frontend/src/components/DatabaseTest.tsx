import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Database, Users, Package, FileText } from "lucide-react";
import { useCustomers, useInvoices, useEstimates, useItems, useTokenStatus } from "@/hooks/useQuickBooks";

export default function DatabaseTest() {
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Test QuickBooks backend endpoints
  const { data: customersData, isLoading: customersLoading, error: customersError } = useCustomers();
  const { data: invoicesData, isLoading: invoicesLoading, error: invoicesError } = useInvoices();
  const { data: estimatesData, isLoading: estimatesLoading, error: estimatesError } = useEstimates();
  const { data: itemsData, isLoading: itemsLoading, error: itemsError } = useItems();
  const { data: tokenStatusData, isLoading: tokenLoading, error: tokenError } = useTokenStatus();

  const runAllTests = async () => {
    const results: Record<string, any> = {};

    try {
      // Test QuickBooks backend endpoints
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      
      // Test customers endpoint
      const customersResponse = await fetch(`${apiBaseUrl}/api/customers`);
      results.customers = {
        status: customersResponse.ok ? 'success' : 'error',
        data: customersResponse.ok ? await customersResponse.json() : null,
        timestamp: new Date().toISOString()
      };

      // Test invoices endpoint
      const invoicesResponse = await fetch(`${apiBaseUrl}/api/invoices`);
      results.invoices = {
        status: invoicesResponse.ok ? 'success' : 'error',
        data: invoicesResponse.ok ? await invoicesResponse.json() : null,
        timestamp: new Date().toISOString()
      };

      // Test estimates endpoint
      const estimatesResponse = await fetch(`${apiBaseUrl}/api/estimates`);
      results.estimates = {
        status: estimatesResponse.ok ? 'success' : 'error',
        data: estimatesResponse.ok ? await estimatesResponse.json() : null,
        timestamp: new Date().toISOString()
      };

      // Test items endpoint
      const itemsResponse = await fetch(`${apiBaseUrl}/api/items`);
      results.items = {
        status: itemsResponse.ok ? 'success' : 'error',
        data: itemsResponse.ok ? await itemsResponse.json() : null,
        timestamp: new Date().toISOString()
      };

      // Test token status endpoint
      const tokenResponse = await fetch(`${apiBaseUrl}/api/tokens/status`);
      results.tokenStatus = {
        status: tokenResponse.ok ? 'success' : 'error',
        data: tokenResponse.ok ? await tokenResponse.json() : null,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      results.error = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }

    setTestResults(results);
  };

  const getStatusIcon = (status: string, loading: boolean) => {
    if (loading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (status === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusBadge = (status: string, loading: boolean) => {
    if (loading) return <Badge variant="secondary">Loading...</Badge>;
    if (status === 'success') return <Badge variant="default" className="bg-green-500">Connected</Badge>;
    return <Badge variant="destructive">Error</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            QuickBooks Backend Connection Test
          </CardTitle>
          <CardDescription>
            Test the connection between React frontend and QuickBooks backend API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runAllTests} className="w-full">
            Run All Tests
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Token Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {getStatusIcon(tokenStatusData ? 'success' : 'error', tokenLoading)}
                  QuickBooks Token
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getStatusBadge(tokenStatusData ? 'success' : 'error', tokenLoading)}
                {tokenStatusData && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Status: {tokenStatusData.isValid ? 'Valid' : 'Invalid'}</p>
                    <p>Expires: {tokenStatusData.expiresAt ? new Date(tokenStatusData.expiresAt).toLocaleString() : 'N/A'}</p>
                  </div>
                )}
                {tokenError && (
                  <p className="mt-2 text-xs text-red-500">
                    Error: {tokenError.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Customers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {getStatusIcon(customersData?.success ? 'success' : 'error', customersLoading)}
                  Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getStatusBadge(customersData?.success ? 'success' : 'error', customersLoading)}
                {customersData?.success && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Count: {Array.isArray(customersData.data) ? customersData.data.length : 'N/A'}</p>
                  </div>
                )}
                {customersError && (
                  <p className="mt-2 text-xs text-red-500">
                    Error: {customersError.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Invoices */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {getStatusIcon(invoicesData?.success ? 'success' : 'error', invoicesLoading)}
                  Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getStatusBadge(invoicesData?.success ? 'success' : 'error', invoicesLoading)}
                {invoicesData?.success && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Count: {Array.isArray(invoicesData.data) ? invoicesData.data.length : 'N/A'}</p>
                  </div>
                )}
                {invoicesError && (
                  <p className="mt-2 text-xs text-red-500">
                    Error: {invoicesError.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Estimates */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {getStatusIcon(estimatesData?.success ? 'success' : 'error', estimatesLoading)}
                  Estimates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getStatusBadge(estimatesData?.success ? 'success' : 'error', estimatesLoading)}
                {estimatesData?.success && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Count: {Array.isArray(estimatesData.data) ? estimatesData.data.length : 'N/A'}</p>
                  </div>
                )}
                {estimatesError && (
                  <p className="mt-2 text-xs text-red-500">
                    Error: {estimatesError.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {getStatusIcon(itemsData?.success ? 'success' : 'error', itemsLoading)}
                  Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getStatusBadge(itemsData?.success ? 'success' : 'error', itemsLoading)}
                {itemsData?.success && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Count: {Array.isArray(itemsData.data) ? itemsData.data.length : 'N/A'}</p>
                  </div>
                )}
                {itemsError && (
                  <p className="mt-2 text-xs text-red-500">
                    Error: {itemsError.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* QuickBooks Data Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                QuickBooks Data Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">
                    {customersData?.success ? customersData.data?.length || 0 : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">Customers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {invoicesData?.success ? invoicesData.data?.length || 0 : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">Invoices</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {estimatesData?.success ? estimatesData.data?.length || 0 : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">Estimates</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {itemsData?.success ? itemsData.data?.length || 0 : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">Items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Connection Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">QuickBooks Backend Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1">
                <p><strong>API Base URL:</strong> {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}</p>
                <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
                <p><strong>Database:</strong> NeonDB (PostgreSQL) with Drizzle ORM</p>
                <p><strong>Backend:</strong> Express.js + TypeScript + QuickBooks API</p>
                <p><strong>Frontend:</strong> React + Vite + TanStack Query</p>
                <p><strong>Authentication:</strong> Stack Auth JWT</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
