import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validatingSession, setValidatingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError("Invalid or expired reset link. Please request a new password reset.");
          setHasValidSession(false);
        } else {
          setHasValidSession(true);
        }
      } catch {
        setError("An error occurred while validating your reset link.");
        setHasValidSession(false);
      } finally {
        setValidatingSession(false);
      }
    };
    
    checkSession();
  }, []);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const { error } = await authService.updatePassword(password);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Clear form
        setPassword("");
        setConfirmPassword("");
        
        // Redirect after success
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string): { strength: string; color: string; width: string } => {
    if (pwd.length === 0) return { strength: "", color: "", width: "0%" };
    
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { strength: "Weak", color: "bg-red-500", width: "33%" };
    if (score <= 4) return { strength: "Medium", color: "bg-amber-500", width: "66%" };
    return { strength: "Strong", color: "bg-green-500", width: "100%" };
  };

  const passwordStrength = getPasswordStrength(password);

  if (validatingSession) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh] px-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                <p className="text-slate-600 dark:text-slate-400">Validating reset link...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!hasValidSession) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh] px-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Invalid Reset Link</CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button 
                className="w-full mt-4" 
                onClick={() => router.push("/")}
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-[60vh] px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription>
              Choose a strong password to secure your NumiVault account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4 text-center py-4">
                <div className="flex justify-center text-green-500 mb-4">
                  <CheckCircle className="h-16 w-16" />
                </div>
                <h3 className="text-xl font-semibold">Password Updated Successfully!</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Your password has been reset. Redirecting you to the dashboard...
                </p>
                <div className="flex justify-center pt-2">
                  <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {password && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Password strength:</span>
                        <span className={`font-medium ${
                          passwordStrength.strength === "Weak" ? "text-red-500" :
                          passwordStrength.strength === "Medium" ? "text-amber-500" :
                          "text-green-500"
                        }`}>
                          {passwordStrength.strength}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mt-2">
                    <li className={password.length >= 6 ? "text-green-600 dark:text-green-400" : ""}>
                      ✓ At least 6 characters
                    </li>
                    <li className={/[A-Z]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>
                      ✓ One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>
                      ✓ One lowercase letter
                    </li>
                    <li className={/[0-9]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>
                      ✓ One number
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Reset Password
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 font-medium"
                    disabled={loading}
                  >
                    Return to Home
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}