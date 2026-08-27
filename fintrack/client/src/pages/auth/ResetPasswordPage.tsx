import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ShieldCheck, Lock, Key, AlertCircle, CheckCircle2, Check } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getErrorMessage } from "../../services/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
} from "../../components/ui";

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get("token") || "";

  const { resetPassword } = useAuth();

  const [token, setToken] = useState(urlToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError("Password reset token is required.");
      return;
    }

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setError("Password must be at least 8 characters long and contain both letters and numbers.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword({
        token: token.trim(),
        password,
        confirmPassword,
      });
      setIsSuccess(true);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl border-border/80">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Set New Password</CardTitle>
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
        <CardDescription>
          Enter your new password to restore access to your FinTrack account
        </CardDescription>
      </CardHeader>

      {isSuccess ? (
        <CardContent className="space-y-5 pt-2">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-success/30 bg-success/10 text-success text-xs leading-relaxed animate-fadeIn">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground mb-1">Password updated successfully</p>
              <p className="text-muted-foreground">
                Your password has been changed. You can now sign in with your new credentials.
              </p>
            </div>
          </div>

          <Link to="/auth/login" className="block">
            <Button className="w-full">Sign In with New Password</Button>
          </Link>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2.5 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium animate-fadeIn"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!urlToken && (
              <Input
                label="Reset Security Token"
                placeholder="Paste token from reset email"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                leftIcon={<Key className="h-4 w-4" />}
              />
            )}

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
            />

            {/* Validation Indicator Pills */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground">Requirements:</span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className={`flex items-center gap-1 ${hasMinLength ? "text-success font-medium" : "text-muted-foreground"}`}>
                  <Check className="h-3 w-3" />
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1 ${hasLetter ? "text-success font-medium" : "text-muted-foreground"}`}>
                  <Check className="h-3 w-3" />
                  <span>Contains letter</span>
                </div>
                <div className={`flex items-center gap-1 ${hasNumber ? "text-success font-medium" : "text-muted-foreground"}`}>
                  <Check className="h-3 w-3" />
                  <span>Contains number</span>
                </div>
                <div className={`flex items-center gap-1 ${passwordsMatch ? "text-success font-medium" : "text-muted-foreground"}`}>
                  <Check className="h-3 w-3" />
                  <span>Passwords match</span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              leftIcon={<ShieldCheck className="h-4 w-4" />}
            >
              Update Password
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Remember your password?{" "}
              <Link to="/auth/login" className="text-primary font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </form>
      )}
    </Card>
  );
};
