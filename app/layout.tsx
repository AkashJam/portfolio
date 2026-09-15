import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";

// Same pattern (and same fallback) as app/robots.ts and app/sitemap.ts — a
// localhost default so a build that never received the var fails visibly in
// dev instead of quietly advertising the production origin.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Akash James",
  // Required for Next to resolve app/opengraph-image.png to the absolute URL
  // link unfurlers fetch; without it og:image is left pointing at localhost.
  metadataBase: new URL(SITE_URL),
  // Renders directly under the OG card in Slack/LinkedIn/iMessage, and as the
  // SERP snippet — so it deliberately avoids repeating the name, role and
  // claim the card already shows. Also the default for any route that sets no
  // description of its own.
  description:
    "Most portfolios describe the work, this one runs it. A Go and Redis streaming backend on AWS, pushing live prices to the page you're reading.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas text-text">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
