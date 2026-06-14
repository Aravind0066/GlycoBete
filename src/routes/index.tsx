import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { HeartLoading } from "@/components/HeartLoading";
import { getMe } from "@/lib/healthApi";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
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
    })();
  }, [navigate]);

  return <HeartLoading message="Loading your quest..." />;
}
