import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Lock, Mail, User as UserIcon, AlertCircle, Check } from "lucide-react";
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

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Real-time password criteria
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill out all required fields.");
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
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });
      toast.success("Account created successfully. Welcome to FinTrack!", "Registration Complete");
      navigate("/dashboard", { replace: true });
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
          <CardTitle className="text-xl font-bold">Create FinTrack Account</CardTitle>
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
        </div>
        <CardDescription>
          Get started with personal cash flow, budgets, and savings management
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
            label="Full Name"
            placeholder="Alex Miller"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<UserIcon className="h-4 w-4" />}
          />

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

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
          />

          {/* Password Validation Indicator Pills */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-muted-foreground">Password requirements:</span>
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
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            Create Account
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth/login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};
