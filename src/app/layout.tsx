import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Affiliate Platform',
  description: 'White-label affiliate platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}