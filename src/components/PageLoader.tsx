import type { ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import { HeartLoading } from "@/components/HeartLoading";
import { ThemeToggleFab } from "@/components/ThemeToggle";
import { useMinLoadingTime } from "@/lib/useMinLoadingTime";

type PageLoaderProps = {
  loading: boolean;
  message?: string;
  minMs?: number;
  shell?: boolean;
  themeFab?: boolean;
  children: ReactNode;
};

export function PageLoader({
  loading,
  message,
  minMs = 1600,
  shell = true,
  themeFab = false,
  children,
}: PageLoaderProps) {
  const show = useMinLoadingTime(loading, minMs);

  const body = (
    <>
      <HeartLoading active={show} message={message} />
      {!show ? children : null}
    </>
  );

  if (shell) return <AppShell>{body}</AppShell>;

  return (
    <>
      {themeFab && <ThemeToggleFab />}
      {body}
    </>
  );
}
