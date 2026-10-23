import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { SITE_NAME } from "@/lib/metadata";
import { SITE_URL } from "@/lib/site";

// Pages with nothing of their own to refresh send `s-maxage=86400` (a day), not
// Next's default of a year for a fully static page (phase18.md step 3, M1).
// Browsers ignore s-maxage and there is no CDN; the year only mattered to a
// fetcher's own cache, which kept an old build. A page's own, shorter
// `revalidate` wins over this one. `expireTime` in next.config.ts is the other half.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Akash James",
  // Required for Next to resolve app/opengraph-image.tsx to the absolute URL
  // link unfurlers fetch; without it og:image is left pointing at localhost.
  metadataBase: new URL(SITE_URL),
  // Renders directly under the OG card in Slack/LinkedIn/iMessage, and as the
  // SERP snippet — so it deliberately avoids repeating the name, role and
  // claim the card already shows. Also the default for any route that sets no
  // description of its own.
  description:
    "Most portfolios describe the work, this one runs it. A Go and Redis streaming backend on AWS, pushing live prices to the page you're reading.",
  // Default only, for routes with no metadata of their own (the 404). Every
  // real route replaces this whole object via lib/metadata.ts's pageMetadata,
  // since Next merges metadata shallowly. Deliberately no `alternates` here:
  // a layout-level canonical would leak onto every page that didn't override it.
  openGraph: { siteName: SITE_NAME, locale: "en_US", type: "website" },
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
