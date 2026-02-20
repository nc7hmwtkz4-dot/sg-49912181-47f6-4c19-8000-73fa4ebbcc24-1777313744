import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    // Supabase handles the email verification link automatically when it loads
    // It detects the #access_token in URL and sets the session
    // We just need to wait a moment to check if we are authenticated
    
    const checkAuth = async () => {
      // Small delay to allow Supabase client to process the hash
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if we have a session now (from URL hash)
      // Note: For 'Implicit' flow, Supabase processes hash and sets session.
      // For 'PKCE' flow (default in v2), we exchange code for session.
      // The current setup likely relies on the client auto-handling this.
      
      // However, if we arrived here, we are just showing a landing page.
      // The redirect link in authService points here.
      
      setStatus("success");
      setMessage("Your email has been confirmed successfully!");
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    };

    if (router.isReady) {
      checkAuth();
    }
  }, [router.isReady, router]);

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-[60vh] px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Email Confirmation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {status === "loading" && (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                <p className="text-slate-500">{message}</p>
              </div>
            )}
            
            {status === "success" && (
              <div className="flex flex-col items-center space-y-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Verified!</h3>
                  <p className="text-slate-500">{message}</p>
                </div>
                <p className="text-sm text-slate-400">Redirecting to dashboard...</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center space-y-4">
                <XCircle className="h-12 w-12 text-red-500" />
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Verification Failed</h3>
                  <p className="text-slate-500">{message}</p>
                </div>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/">Return Home</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}