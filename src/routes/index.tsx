import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { HeartLoading } from "@/components/HeartLoading";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const profile = localStorage.getItem("gb_profile");
    navigate({ to: profile ? "/dashboard" : "/onboarding", replace: true });
  }, [navigate]);

  return <HeartLoading message="Loading your quest..." />;
}
