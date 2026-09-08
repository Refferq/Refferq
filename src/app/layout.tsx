
import { createTranslator } from "@/i18n/translator";
import React from 'react';
import { LocaleProvider } from '@/i18n/provider';
import { getSnapshot } from '@/i18n/runtime.server';
import { Toaster } from '@/components/ui/sonner';
import { db } from '@/lib/prisma';
import './globals.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const snapshot = await getSnapshot();
  const { t: __tr } = createTranslator(snapshot.pack);
  return {
    title: __tr("Refferq - Modern Affiliate Marketing Platform"),
    description: __tr("Next-generation affiliate marketing platform with comprehensive tracking, commission management, and payout automation."),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const snapshot = await getSnapshot();
  const { t: __tr } = createTranslator(snapshot.pack);
  let settings = null;
  try {
    settings = await db.getPlatformSettings();
  } catch {
    // DB unavailable (e.g. during Docker build prerendering) — use defaults
  }

  // Create dynamic styles based on settings
  const dynamicStyles = {
    '--primary': settings?.brandButtonColor ? hexToHSL(settings.brandButtonColor) : undefined,
    '--radius': '0.5rem',
  } as React.CSSProperties;

  return (
    <html lang={snapshot.locale} dir={snapshot.pack.meta.direction}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased" style={dynamicStyles}>
        <LocaleProvider snapshot={snapshot}>{children}<Toaster /></LocaleProvider>
      </body>
    </html>
  );
}

// Helper to convert hex to HSL for Tailwind compatibility
function hexToHSL(hex: string): string {
  // Remove hash if present
  const rHex = hex.replace('#', '');
  const r = parseInt(rHex.substring(0, 2), 16) / 255;
  const g = parseInt(rHex.substring(2, 4), 16) / 255;
  const b = parseInt(rHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
