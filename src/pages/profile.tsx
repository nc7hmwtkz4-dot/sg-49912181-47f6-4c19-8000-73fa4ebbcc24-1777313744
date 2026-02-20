import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { authService, type AuthUser } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Lock, Trash2, Save, AlertCircle, CheckCircle2, Shield, XCircle, Loader2, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [has2FA, setHas2FA] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  
  // Profile form state
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserProfile = async () => {
    try {
      const authUser = await authService.getCurrentUser();
      
      if (!authUser) {
        router.push("/");
        return;
      }

      setUser(authUser);
      setFullName(authUser.user_metadata?.full_name || "");
      setEmail(authUser.email || "");

      // Check if user has 2FA enabled
      const { enabled, error: mfaError } = await authService.has2FA();
      if (!mfaError) {
        setHas2FA(enabled);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);

    try {
      // Update full name in profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update email if changed
      if (email !== user.email) {
        const { error: emailError } = await authService.updateEmail(email);
        if (emailError) throw emailError;
        
        setProfileMessage({
          type: "success",
          text: "Profile updated! Please check your new email to confirm the change."
        });
      } else {
        setProfileMessage({
          type: "success",
          text: "Profile updated successfully!"
        });
      }

      // Reload user data
      await loadUserProfile();
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      setProfileMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update profile. Please try again."
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordMessage(null);

    // Validate passwords
    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 6 characters long."
      });
      setIsUpdatingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "New passwords do not match."
      });
      setIsUpdatingPassword(false);
      return;
    }

    try {
      const { error } = await authService.updatePassword(newPassword);
      
      if (error) throw error;

      setPasswordMessage({
        type: "success",
        text: "Password updated successfully!"
      });

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      console.error("Error updating password:", error);
      setPasswordMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update password. Please try again."
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      alert("Please type DELETE to confirm account deletion.");
      return;
    }

    if (!confirm("Are you absolutely sure? This action cannot be undone. All your coins and sales data will be permanently deleted.")) {
      return;
    }

    try {
      // Delete user's data (handled by CASCADE in database)
      const { error } = await authService.deleteAccount();
      
      if (error) throw error;

      // Sign out and redirect
      await authService.signOut();
      router.push("/");
    } catch (error: unknown) {
      console.error("Error deleting account:", error);
      alert(error instanceof Error ? error.message : "Failed to delete account. Please try again.");
    }
  };

  const handleEnable2FA = async () => {
    setTwoFALoading(true);

    try {
      const { qrCode: qr, secret: sec, error: enrollError } = await authService.enroll2FA();
      
      if (enrollError) {
        // Error handling
      } else if (qr && sec) {
        setQrCode(qr);
        setSecret(sec);
        setShow2FASetup(true);
      }
    } catch {
      // Error already logged
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      return;
    }

    setTwoFALoading(true);

    try {
      const { error: verifyError } = await authService.verify2FA(verificationCode);
      
      if (!verifyError) {
        setHas2FA(true);
        setShow2FASetup(false);
        setQrCode("");
        setSecret("");
        setVerificationCode("");
      }
    } catch {
      // Error already logged
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm("Are you sure you want to disable two-factor authentication? This will make your account less secure.")) {
      return;
    }

    setTwoFALoading(true);

    try {
      const { error: disableError } = await authService.disable2FA();
      
      if (!disableError) {
        setHas2FA(false);
      }
    } catch {
      // Error already logged
    } finally {
      setTwoFALoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <SEO title="Profile - NumiVault" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-400">Loading profile...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Profile Settings - NumiVault" />
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Information */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-300">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Changing your email requires verification
                </p>
              </div>

              {profileMessage && (
                <Alert className={profileMessage.type === "success" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20"}>
                  <div className="flex items-center gap-2">
                    {profileMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                    <AlertDescription className={profileMessage.type === "success" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}>
                      {profileMessage.text}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isUpdatingProfile}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
              >
                <Save className="w-4 h-4 mr-2" />
                {isUpdatingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Lock className="w-5 h-5" />
              Change Password
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword" className="text-slate-700 dark:text-slate-300">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-300">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                  minLength={6}
                />
              </div>

              {passwordMessage && (
                <Alert className={passwordMessage.type === "success" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-red-500 bg-red-50 dark:bg-red-900/20"}>
                  <div className="flex items-center gap-2">
                    {passwordMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                    <AlertDescription className={passwordMessage.type === "success" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}>
                      {passwordMessage.text}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isUpdatingPassword}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
              >
                <Lock className="w-4 h-4 mr-2" />
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication Section */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                {has2FA ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">2FA Enabled</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Your account is protected with 2FA</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">2FA Disabled</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Enable 2FA for enhanced security</p>
                    </div>
                  </>
                )}
              </div>
              {has2FA ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisable2FA}
                  disabled={twoFALoading}
                  className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  {twoFALoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Disable 2FA"
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnable2FA}
                  disabled={twoFALoading}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
                >
                  {twoFALoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Enable 2FA"
                  )}
                </Button>
              )}
            </div>

            {show2FASetup && qrCode && (
              <div className="space-y-4 p-4 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                <div>
                  <h4 className="font-medium mb-2 text-slate-900 dark:text-slate-100">Step 1: Scan QR Code</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  <div className="flex justify-center p-4 bg-white dark:bg-slate-900 rounded-lg">
                    <Image
                      src={qrCode}
                      alt="2FA QR Code"
                      width={192}
                      height={192}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-slate-900 dark:text-slate-100">Step 2: Enter Secret Key (Optional)</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    If you can't scan the QR code, manually enter this key:
                  </p>
                  <code className="block p-3 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono break-all">
                    {secret}
                  </code>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-slate-900 dark:text-slate-100">Step 3: Verify Code</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Enter the 6-digit code from your authenticator app to complete setup:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      className="text-center text-lg tracking-widest font-mono"
                    />
                    <Button
                      onClick={handleVerify2FA}
                      disabled={twoFALoading || verificationCode.length !== 6}
                    >
                      {twoFALoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShow2FASetup(false);
                    setQrCode("");
                    setSecret("");
                    setVerificationCode("");
                    setError("");
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            )}

            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-medium">Why enable 2FA?</p>
              <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400">
                <li>Protects your account even if your password is compromised</li>
                <li>Adds a verification step during login</li>
                <li>Uses time-based one-time passwords (TOTP)</li>
                <li>Compatible with popular authenticator apps</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Account Statistics */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Mail className="w-5 h-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Account ID</span>
              <span className="text-slate-900 dark:text-white font-mono text-sm">{user?.id?.slice(0, 8)}...</span>
            </div>
            <Separator className="bg-slate-200 dark:bg-slate-700" />
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Account Created</span>
              <span className="text-slate-900 dark:text-white">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : "N/A"}
              </span>
            </div>
            <Separator className="bg-slate-200 dark:bg-slate-700" />
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Last Sign In</span>
              <span className="text-slate-900 dark:text-white">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-white dark:bg-slate-900 border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Permanently delete your account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            ) : (
              <div className="space-y-4 p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                <Alert className="border-red-500 bg-red-100 dark:bg-red-900/30">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    <strong>Warning:</strong> This action cannot be undone. All your coins, sales records, and personal data will be permanently deleted.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="deleteConfirm" className="text-slate-700 dark:text-slate-300">
                    Type <strong>DELETE</strong> to confirm
                  </Label>
                  <Input
                    id="deleteConfirm"
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="bg-white dark:bg-slate-800 border-red-300 dark:border-red-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    className="border-slate-300 dark:border-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== "DELETE"}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Permanently Delete Account
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}