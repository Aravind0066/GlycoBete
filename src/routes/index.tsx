import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { HeartLoading } from "@/components/HeartLoading";
import { ThemeToggleFab } from "@/components/ThemeToggle";
import { api } from "@/lib/api";
import { markBootComplete } from "@/lib/bootSession";
import { migrateLocalStorageIfNeeded } from "@/lib/migrateClient";

const BOOT_MIN_MS = 2200;

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const start = Date.now();
      await migrateLocalStorageIfNeeded((payload) => api.migrateLocalData(payload));
      const { hasProfile } = await api.hasProfile();
      const wait = Math.max(0, BOOT_MIN_MS - (Date.now() - start));
      await new Promise((r) => setTimeout(r, wait));
      markBootComplete();
      navigate({ to: hasProfile ? "/dashboard" : "/welcome", replace: true });
    })();
  }, [navigate]);

  return (
    <>
      <ThemeToggleFab />
      <HeartLoading active message="Loading your quest..." />
    </>
  );
}
