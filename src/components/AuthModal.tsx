import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, User, AlertCircle } from "lucide-react";
import { authService } from "@/services/authService";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot-password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Forgot password flow
    if (mode === "forgot-password") {
      if (!email) {
        setError("Please enter your email address");
        return;
      }
      setLoading(true);
      try {
        const { error: resetError } = await authService.resetPassword(email);
        if (resetError) {
          setError(resetError.message);
        } else {
          setSuccessMessage("Password reset email sent! Check your inbox.");
          setTimeout(() => {
            setMode("login");
            resetForm();
          }, 3000);
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Registration validation
    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      if (mode === "register") {
        const { error: signUpError } = await authService.signUp(email, password, { full_name: fullName });
        if (signUpError) {
          setError(signUpError.message);
        } else {
          setSuccessMessage("Registration successful! Please check your email to confirm your account.");
          setError("");
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } else {
        // Login flow with 2FA check
        const { user, error: signInError, requires2FA: needs2FA } = await authService.signIn(email, password);
        
        if (signInError) {
          setError(signInError.message);
        } else if (needs2FA && !requires2FA) {
          // First attempt, 2FA is required
          setRequires2FA(true);
          setError("");
        } else if (requires2FA && twoFactorCode) {
          // Verify 2FA code
          const { error: verifyError } = await authService.verify2FA(twoFactorCode);
          if (verifyError) {
            setError("Invalid 2FA code. Please try again.");
          } else {
            onSuccess();
            onClose();
          }
        } else if (!needs2FA) {
          // No 2FA required, login successful
          onSuccess();
          onClose();
        } else {
          setError("Please enter your 2FA code");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setTwoFactorCode("");
    setRequires2FA(false);
    setError("");
    setSuccessMessage("");
  };

  const toggleMode = () => {
    if (mode === "forgot-password") {
      setMode("login");
    } else {
      setMode(mode === "login" ? "register" : "login");
    }
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {mode === "login" ? "Welcome Back" : mode === "register" ? "Create Account" : "Reset Password"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login" 
              ? "Sign in to access your coin collection" 
              : mode === "register"
              ? "Register to start managing your collection"
              : "Enter your email to receive a password reset link"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {mode !== "forgot-password" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
              )}

              {mode === "login" && requires2FA && (
                <div className="space-y-2">
                  <Label htmlFor="twoFactorCode" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    2FA Code
                  </Label>
                  <Input
                    id="twoFactorCode"
                    type="text"
                    placeholder="000000"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    required
                    disabled={loading}
                    maxLength={6}
                    pattern="[0-9]{6}"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              )}
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="border-green-500 text-green-700 dark:text-green-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "login" ? "Signing In..." : mode === "register" ? "Creating Account..." : "Sending Reset Link..."}
              </>
            ) : (
              mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Send Reset Link"
            )}
          </Button>

          <div className="text-center text-sm space-y-2">
            {mode === "login" && !requires2FA && (
              <button
                type="button"
                onClick={() => setMode("forgot-password")}
                className="text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 font-medium block w-full"
                disabled={loading}
              >
                Forgot Password?
              </button>
            )}
            <button
              type="button"
              onClick={toggleMode}
              className="text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 font-medium block w-full"
              disabled={loading}
            >
              {mode === "login" 
                ? "Don't have an account? Register" 
                : mode === "register"
                ? "Already have an account? Sign In"
                : "Back to Sign In"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}