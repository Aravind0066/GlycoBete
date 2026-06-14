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
    let cancelled = false;
    const fallback = setTimeout(() => {
      if (!cancelled) navigate({ to: "/login", replace: true });
    }, 3000);

    (async () => {
      try {
        const me = await getMe();
        if (cancelled) return;
        clearTimeout(fallback);
        if (!me.authenticated) {
          navigate({ to: "/login", replace: true });
          return;
        }
        navigate({ to: me.hasProfile ? "/dashboard" : "/onboarding", replace: true });
      } catch {
        if (!cancelled) navigate({ to: "/login", replace: true });
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, [navigate]);

  return <HeartLoading message="Loading your quest..." />;
}
