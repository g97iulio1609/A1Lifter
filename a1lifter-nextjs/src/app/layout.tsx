import type { Metadata } from "next";
import { Providers } from "@/components/providers/providers";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "A1Lifter - Competition Management Platform",
  description: "Multisport competition management platform for powerlifting, weightlifting, strongman, and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
