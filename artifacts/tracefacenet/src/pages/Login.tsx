import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShieldAlert, Lock } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);

    if (!success) {
      toast({
        title: "Login failed",
        description: "Wrong Username or Password",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Login successful",
      description: "Secure session established.",
    });
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background tech-grid flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-primary/20 shadow-[0_0_35px_rgba(59,130,246,0.12)]">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <ShieldAlert className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl">TRACEFACENET Access</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">Authenticate to enter the command center.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Username or Email</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or email"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              <Lock className="w-4 h-4 mr-2" />
              Sign In Securely
            </Button>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <Link href="/register" className="hover:text-primary transition-colors">
                Register user
              </Link>
              <Link href="/forgot-password" className="hover:text-primary transition-colors">
                Forgot password?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
