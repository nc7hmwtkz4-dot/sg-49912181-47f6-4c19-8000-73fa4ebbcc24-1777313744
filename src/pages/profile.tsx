import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Lock, Trash2, Save, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Profile form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const authUser = await authService.getCurrentUser();
      
      if (!authUser) {
        router.push("/");
        return;
      }

      setUser(authUser);
      setEmail(authUser.email || "");

      // Get full name from profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", authUser.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
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
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setProfileMessage({
        type: "error",
        text: error.message || "Failed to update profile. Please try again."
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
    } catch (error: any) {
      console.error("Error updating password:", error);
      setPasswordMessage({
        type: "error",
        text: error.message || "Failed to update password. Please try again."
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
    } catch (error: any) {
      console.error("Error deleting account:", error);
      alert(error.message || "Failed to delete account. Please try again.");
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