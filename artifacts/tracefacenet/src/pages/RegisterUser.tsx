import { useState } from "react";
import { useLocation, Link } from "wouter";
import { UserPlus, ShieldAlert } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function RegisterUser() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please confirm the same password twice.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const success = await register(username, password);
    setSubmitting(false);

    if (!success) {
      toast({
        title: "Registration failed",
        description: "That username may already exist or the input is invalid.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "User registered",
      description: "Account created and session started.",
    });
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background tech-grid flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-primary/20 shadow-[0_0_35px_rgba(59,130,246,0.12)]">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl">Register User</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">Create an operator account for the command center.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Username or Email</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username or email" autoComplete="username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password" autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full" size="lg" isLoading={submitting}>
              <ShieldAlert className="w-4 h-4 mr-2" />
              Create Account
            </Button>
            <div className="text-sm text-muted-foreground text-center">
              Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
