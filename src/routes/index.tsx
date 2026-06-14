import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { HeartLoading } from "@/components/HeartLoading";
<<<<<<< HEAD
import { getAuthSession, restoreSupabaseSession } from "@/lib/authService";
import { storage } from "@/lib/gameEngine";
=======
import { getMe } from "@/lib/healthApi";
>>>>>>> 0f48bc460758ddee6340a6a0ab869abcfb837edb

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
<<<<<<< HEAD
      await restoreSupabaseSession();
      const session = getAuthSession();
      const profile = storage.getProfile();

      if (!session) {
        navigate({ to: "/auth", replace: true });
        return;
      }
      navigate({ to: profile ? "/dashboard" : "/onboarding", replace: true });
=======
      try {
        const me = await getMe();
        if (!me.authenticated) {
          navigate({ to: "/login", replace: true });
          return;
        }
        navigate({ to: me.hasProfile ? "/dashboard" : "/onboarding", replace: true });
      } catch {
        navigate({ to: "/login", replace: true });
      }
>>>>>>> 0f48bc460758ddee6340a6a0ab869abcfb837edb
    })();
  }, [navigate]);

  return <HeartLoading message="Loading your quest..." />;
}
