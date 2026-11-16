import type { Metadata } from "next";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/instrument-sans/index.css";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: "OcioFlex",
  description: "Focus and leisure, in balance.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-ctx="foco">
      <body>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
