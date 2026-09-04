import type { Metadata, Viewport } from "next";

import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "@/providers/Toaster";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#fff5e1",
  width: "device-width",
  initialScale: 1,
  // Baristas use this one-handed on a phone; stopping the zoom-on-focus jump
  // keeps the scanner viewfinder steady. Same reasoning as the POS app.
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Dos Tazas · Club de Lealtad",
  description:
    "Acumulá puntos con cada café en Dos Tazas y canjealos por bebidas, repostería y grano de origen.",
  icons: { icon: "/assets/LOGO-05.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'system';
                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground transition-colors duration-200">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
