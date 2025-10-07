import { useState } from "react";
import { useAuth } from "@/lib/neonAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  User, 
  Mail, 
  Lock,
  LogOut,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthTest() {
  const { user, isLoading, isAuthenticated, signIn, signUp, signOut, updateProfile } = useAuth();
  const { toast } = useToast();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let result;
      if (isSignUp) {
        result = await signUp(formData.email, formData.password, formData.firstName, formData.lastName);
      } else {
        result = await signIn(formData.email, formData.password);
      }

      if (result.success) {
        toast({
          title: isSignUp ? "Account Created" : "Signed In",
          description: `Welcome ${user?.firstName || user?.email}!`,
          variant: "default"
        });
        setFormData({ email: '', password: '', firstName: '', lastName: '' });
      } else {
        toast({
          title: "Authentication Failed",
          description: result.error || "Please check your credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully",
        variant: "default"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Loading authentication...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Authentication Status
          </CardTitle>
          <CardDescription>
            Current authentication state and user information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            {isAuthenticated ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            <Badge variant={isAuthenticated ? "default" : "destructive"}>
              {isAuthenticated ? "Authenticated" : "Not Authenticated"}
            </Badge>
          </div>

          {isAuthenticated && user && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span>{user.email}</span>
              </div>
              {user.firstName && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span>{user.firstName} {user.lastName}</span>
                </div>
              )}
              {user.role && (
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Role:</span>
                  <Badge variant="outline">{user.role}</Badge>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Authentication Form */}
      {!isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {isSignUp ? "Create Account" : "Sign In"}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? "Create a new account to access the dashboard" 
                : "Sign in to your existing account"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isSignUp ? "Create Account" : "Sign In"}
                </Button>
              </div>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp 
                    ? "Already have an account? Sign in" 
                    : "Don't have an account? Sign up"
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* User Actions */}
      {isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Account Actions
            </CardTitle>
            <CardDescription>
              Manage your account and authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>• Your session is secure and encrypted</p>
              <p>• You can sign out at any time</p>
              <p>• Your data is protected with industry-standard security</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Configuration</CardTitle>
          <CardDescription>
            Current authentication setup and environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Provider:</strong> Neon Auth (Stack Auth)</p>
              <p><strong>Project ID:</strong> {import.meta.env.VITE_STACK_PROJECT_ID || 'Not configured'}</p>
              <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
            </div>
            <div>
              <p><strong>API Base URL:</strong> {import.meta.env.VITE_API_BASE_URL || 'Not configured'}</p>
              <p><strong>Auth URL:</strong> {import.meta.env.VITE_NEXTAUTH_URL || 'Not configured'}</p>
              <p><strong>Secure:</strong> {window.location.protocol === 'https:' ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
