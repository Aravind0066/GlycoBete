import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { HeartLoading } from "@/components/HeartLoading";
import { getAuthSession, restoreSupabaseSession } from "@/lib/authService";
import { storage } from "@/lib/gameEngine";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      await restoreSupabaseSession();
      const session = getAuthSession();
      const profile = storage.getProfile();

      if (!session) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      navigate({ to: profile ? "/dashboard" : "/onboarding", replace: true });
    })();
  }, [navigate]);

  return <HeartLoading message="Loading your quest..." />;
}
