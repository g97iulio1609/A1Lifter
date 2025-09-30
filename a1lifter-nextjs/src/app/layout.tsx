import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A1Lifter - Powerlifting Competition Management",
  description: "Professional powerlifting and strongman competition management system",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="A1Lifter" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
