import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { themeBootScript } from "@/hooks/useTheme";

export const metadata: Metadata = {
  title: {
    default: "MainStocks — The on-chain stock market, reimagined",
    template: "%s · MainStocks",
  },
  description:
    "Explore markets, analyze assets and manage positions through one clean, connected trading interface.",
  applicationName: "MainStocks",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#05070b" },
    { media: "(prefers-color-scheme: light)", color: "#f6f9fc" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <Providers>
          <Navbar />
          <main id="main">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
