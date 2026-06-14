import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { HeartLoading } from "@/components/HeartLoading";
import { completeOAuthIfNeeded } from "@/lib/authService";
import { storage } from "@/lib/gameEngine";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await completeOAuthIfNeeded();
        toast.success("Signed in with Google");
        navigate({ to: storage.getProfile() ? "/dashboard" : "/onboarding", replace: true });
      } catch {
        toast.error("Google sign-in could not be completed");
        navigate({ to: "/auth", replace: true });
      }
    })();
  }, [navigate]);

  return <HeartLoading message="Completing Google sign-in..." />;
}
