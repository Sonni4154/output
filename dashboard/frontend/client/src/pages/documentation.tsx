import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, HelpCircle, ExternalLink, Database, Shield } from "lucide-react";
import DatabaseTest from "@/components/DatabaseTest";
import AuthTest from "@/components/AuthTest";

export default function Documentation() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <BookOpen className="w-8 h-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documentation</h1>
          <p className="text-muted-foreground">Comprehensive guides and resources for the MPC Internal Dashboard</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Guide */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle className="text-lg">User Guide</CardTitle>
                <CardDescription>Step-by-step instructions for employees and administrators</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Learn how to use time tracking, job forms, scheduling, and all dashboard features.
            </p>
            <Button variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              View User Guide
            </Button>
          </CardContent>
        </Card>

        {/* Site Features */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <BookOpen className="w-6 h-6 text-green-600" />
              <div>
                <CardTitle className="text-lg">Site Features</CardTitle>
                <CardDescription>Complete overview of all dashboard capabilities</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Detailed documentation of features, integrations, and technical specifications.
            </p>
            <Button variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Features
            </Button>
          </CardContent>
        </Card>

        {/* Database Test */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Database className="w-6 h-6 text-orange-600" />
              <div>
                <CardTitle className="text-lg">Database Test</CardTitle>
                <CardDescription>Test database connectivity and API endpoints</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Verify that the React dashboard is properly connected to NeonDB through the backend API.
            </p>
            <Button variant="outline" className="w-full" onClick={() => {
              const testSection = document.getElementById('database-test');
              testSection?.scrollIntoView({ behavior: 'smooth' });
            }}>
              <Database className="w-4 h-4 mr-2" />
              Run Database Test
            </Button>
          </CardContent>
        </Card>

        {/* Authentication Test */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle className="text-lg">Authentication Test</CardTitle>
                <CardDescription>Test Neon Auth integration and user management</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test user authentication, sign up, sign in, and account management with Neon Auth.
            </p>
            <Button variant="outline" className="w-full" onClick={() => {
              const testSection = document.getElementById('auth-test');
              testSection?.scrollIntoView({ behavior: 'smooth' });
            }}>
              <Shield className="w-4 h-4 mr-2" />
              Test Authentication
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reference</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Time Tracking</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Clock in/out from the Time Clock page</li>
                <li>• Track project hours with the timer</li>
                <li>• Submit timesheets for approval</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Job Management</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Complete Hours and Materials forms</li>
                <li>• View customer information</li>
                <li>• Track service history</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Scheduling</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• View your schedule in Work Calendar</li>
                <li>• Sync with Google Calendar</li>
                <li>• Manage employee schedules (Admin)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Administration</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Generate reports and analytics</li>
                <li>• Manage employee accounts</li>
                <li>• Configure system settings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Test Section */}
      <div id="database-test">
        <DatabaseTest />
      </div>

      {/* Authentication Test Section */}
      <div id="auth-test">
        <AuthTest />
      </div>

      {/* Support Information */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>Get support and assistance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <HelpCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Technical Support</h4>
              <p className="text-sm text-muted-foreground">Contact your system administrator for technical issues</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Training</h4>
              <p className="text-sm text-muted-foreground">Reach out to your supervisor for training questions</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Feature Requests</h4>
              <p className="text-sm text-muted-foreground">Submit feedback through the system feedback form</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
