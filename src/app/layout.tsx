import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fallbackMetadata = {
  title: "LinkWeb — Personal Link Aggregation Platform",
  description:
    "A modern, lightweight, self-hosted link-in-bio platform. Built with Next.js, secured with OAuth 2.0.",
};

function normalizeIconUrl(iconUrl: string | null | undefined) {
  const value = iconUrl?.trim();
  if (!value) return "/favicon.ico";

  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol)
      ? value
      : "/favicon.ico";
  } catch {
    return value.startsWith("/") ? value : "/favicon.ico";
  }
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "global" },
      select: {
        siteTitle: true,
        seoDescription: true,
        siteIconUrl: true,
      },
    });

    const iconUrl = normalizeIconUrl(settings?.siteIconUrl);

    return {
      title: settings?.siteTitle
        ? `${settings.siteTitle} — Personal Link Aggregation Platform`
        : fallbackMetadata.title,
      description: settings?.seoDescription || fallbackMetadata.description,
      icons: {
        icon: [{ url: iconUrl }],
        shortcut: [{ url: iconUrl }],
        apple: [{ url: iconUrl }],
      },
    };
  } catch (error) {
    console.warn("[metadata] failed to load site settings", error);
    return {
      ...fallbackMetadata,
      icons: {
        icon: [{ url: "/favicon.ico" }],
        shortcut: [{ url: "/favicon.ico" }],
      },
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
