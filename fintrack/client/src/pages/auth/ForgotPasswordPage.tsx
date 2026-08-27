import React, { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
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

export const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    try {
      setIsLoading(true);
      await forgotPassword(email.trim());
      setIsSubmitted(true);
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
          <CardTitle className="text-xl font-bold">Reset Password</CardTitle>
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
        </div>
        <CardDescription>
          Enter your registered email address to receive password reset instructions
        </CardDescription>
      </CardHeader>

      {isSubmitted ? (
        <CardContent className="space-y-5 pt-2">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-success/30 bg-success/10 text-success text-xs leading-relaxed animate-fadeIn">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground mb-1">Check your email inbox</p>
              <p className="text-muted-foreground">
                If an account matches <strong className="text-foreground">{email}</strong>, we have sent a secure one-time password reset link. Please check your inbox and spam folders.
              </p>
            </div>
          </div>

          <Link to="/auth/login" className="block">
            <Button variant="outline" className="w-full" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Return to Sign In
            </Button>
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

            <Input
              label="Email Address"
              type="email"
              placeholder="alex@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              leftIcon={<KeyRound className="h-4 w-4" />}
            >
              Send Reset Instructions
            </Button>

            <Link
              to="/auth/login"
              className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
};
