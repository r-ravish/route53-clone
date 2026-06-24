import type { Metadata } from "next";
import "@cloudscape-design/global-styles/index.css";
import "./globals.css";
import AuthGuardWrapper from "@/components/AuthGuardWrapper";

export const metadata: Metadata = {
  title: "Route 53 — AWS DNS Management Console",
  description:
    "A functional clone of the AWS Route53 DNS management console with hosted zones, DNS records, and traffic management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>
        <AuthGuardWrapper>{children}</AuthGuardWrapper>
      </body>
    </html>
  );
}
