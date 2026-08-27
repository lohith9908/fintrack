import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogIn, Lock, Mail, AlertCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/ui/Toast";
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

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please provide both email and password.");
      return;
    }

    try {
      setIsLoading(true);
      await login({ email: email.trim(), password });
      toast.success("Signed in successfully. Welcome back!", "Authentication Succeeded");

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
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
          <CardTitle className="text-xl font-bold">Sign In to FinTrack</CardTitle>
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <LogIn className="h-5 w-5" />
          </div>
        </div>
        <CardDescription>
          Enter your credentials to access your financial dashboards and ledger
        </CardDescription>
      </CardHeader>

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

          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
          />

          <div className="space-y-1.5">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <div className="flex justify-end">
              <Link
                to="/auth/forgot-password"
                className="text-xs text-primary hover:underline font-medium"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            leftIcon={<LogIn className="h-4 w-4" />}
          >
            Sign In
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/auth/register" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};
