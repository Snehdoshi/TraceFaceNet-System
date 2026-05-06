import { useState } from "react";
import { useLocation, Link } from "wouter";
import { KeyRound, ShieldAlert } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { requestPasswordReset, resetPassword } = useAuth();
  const [username, setUsername] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [issuedToken, setIssuedToken] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const requestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequesting(true);
    const token = await requestPasswordReset(username);
    setRequesting(false);

    if (!token) {
      toast({
        title: "Recovery failed",
        description: "That username does not exist or could not be verified.",
        variant: "destructive",
      });
      return;
    }

    setIssuedToken(token);
    setResetToken(token);
    toast({
      title: "Reset token created",
      description: "Use the token shown below to set a new password.",
    });
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetting(true);
    const success = await resetPassword(username, resetToken, newPassword);
    setResetting(false);

    if (!success) {
      toast({
        title: "Password reset failed",
        description: "Check the username, reset token, and new password.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Password updated",
      description: "You can now sign in with the new password.",
    });
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-background tech-grid flex items-center justify-center px-4">
      <Card className="w-full max-w-lg border-primary/20 shadow-[0_0_35px_rgba(59,130,246,0.12)]">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <KeyRound className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl">Forgot Password</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">Generate a reset token, then use it to choose a new password.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={requestToken}>
            <div className="space-y-2">
              <Label htmlFor="username">Username or Email</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username or email" autoComplete="username" />
            </div>
            <Button type="submit" className="w-full" size="lg" isLoading={requesting}>
              Get Reset Token
            </Button>
          </form>

          {issuedToken ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="text-sm font-semibold text-foreground">Reset Token</div>
              <div className="break-all rounded-md bg-background/70 px-3 py-2 text-xs font-mono text-primary border border-border/50">{issuedToken}</div>
            </div>
          ) : null}

          <form className="space-y-4 border-t border-border/50 pt-6" onSubmit={submitReset}>
            <div className="space-y-2">
              <Label htmlFor="resetToken">Reset Token</Label>
              <Input id="resetToken" value={resetToken} onChange={(e) => setResetToken(e.target.value)} placeholder="Paste token here" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full" size="lg" isLoading={resetting}>
              <ShieldAlert className="w-4 h-4 mr-2" />
              Reset Password
            </Button>
            <div className="text-sm text-muted-foreground text-center">
              Remembered it? <Link href="/login" className="text-primary hover:underline">Back to sign in</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
