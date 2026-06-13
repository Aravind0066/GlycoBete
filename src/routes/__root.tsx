import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-5xl text-amber-400">404</h1>
        <p className="mt-4 text-slate-400">This quest doesn't exist.</p>
        <a
          href="/"
          className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-3 font-display text-xs text-white"
        >
          GO HOME
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl text-red-400">SOMETHING BROKE</h1>
        <p className="mt-4 text-sm text-slate-400">{error.message}</p>
        <a
          href="/"
          className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-3 font-display text-xs text-white"
        >
          RESTART
        </a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GlycoBete — India's Gamified AI Diabetes Companion" },
      {
        name: "description",
        content:
          "Track sugar, log meals, defeat weekly bosses. The RPG-style diabetes companion built for Indian patients.",
      },
      { property: "og:title", content: "GlycoBete" },
      { property: "og:description", content: "Gamified AI diabetes companion for India." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster theme="dark" position="top-center" />
    </QueryClientProvider>
  );
}
