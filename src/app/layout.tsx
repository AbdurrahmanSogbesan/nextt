import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Nextt",
  description: "A roster scheduling web application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-[radial-gradient(50%_120%_at_50%_-10%,rgba(99,102,241,0.12),transparent),linear-gradient(to_bottom,transparent,transparent)]">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
