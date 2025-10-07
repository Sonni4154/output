import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Settings as SettingsIcon, ExternalLink, Database, FileSpreadsheet, Calendar, AlertCircle, CheckCircle, Plus, Trash2, Terminal, Link2, Activity, BarChart3, Key } from "lucide-react";
import { SiGoogle, SiPostgresql } from "react-icons/si";
export default function Settings() {
  const [activeTab, setActiveTab] = useState("integrations");

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <SettingsIcon className="h-8 w-8" />
          Settings & Integrations
        </h1>
        <p className="text-muted-foreground">
          Manage your business integrations and system settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="sync">Sync & Automation</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Integration Status
              </CardTitle>
              <CardDescription>
                Manage your business system integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Architecture Change:</strong> QuickBooks integration has been moved to a Python Flask service for improved reliability and performance. 
                  The core application now focuses on internal operations while external integrations are handled by dedicated microservices.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <Card className="border-muted">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">QuickBooks Online</h3>
                          <p className="text-sm text-muted-foreground">Accounting & Financial Data</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Moved to Python Flask
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                          <a href="https://github.com/your-org/quickbooks-flask-service" target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Service
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <SiGoogle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Google Calendar</h3>
                          <p className="text-sm text-muted-foreground">Scheduling & Time Tracking</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-muted">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <FileSpreadsheet className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold">JotForm</h3>
                          <p className="text-sm text-muted-foreground">Form Data Collection</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          Available
                        </Badge>
                        <Button variant="outline" size="sm">
                          Setup
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SiPostgresql className="h-5 w-5" />
                Database Connections
              </CardTitle>
              <CardDescription>
                Manage database connections and data sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Primary Database:</strong> PostgreSQL connection is active and healthy. 
                  Using Neon serverless database for optimal performance and scalability.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <Card className="border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <SiPostgresql className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-medium">Production Database</h4>
                          <p className="text-sm text-muted-foreground">Neon PostgreSQL</p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Sync & Automation
              </CardTitle>
              <CardDescription>
                Monitor and configure automated data synchronization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Sync functionality will be available when backend is connected.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Environment</Label>
                  <Input value="Production" disabled />
                  <p className="text-sm text-muted-foreground">
                    Current deployment environment
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Application Version</Label>
                  <Input value="1.0.0" disabled />
                  <p className="text-sm text-muted-foreground">
                    Current application version
                  </p>
                </div>

                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    <strong>System Health:</strong> All core services are running normally. 
                    QuickBooks integration has been successfully migrated to external Python Flask service.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}