import React from 'react';

export const metadata = {
  title: 'OmniFi DEX',
  description: 'Non-custodial multi-chain DEX',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#090a0f', color: '#f3f4f6' }}>{children}</body>
    </html>
  );
}
