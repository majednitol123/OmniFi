import React from 'react';
import '../styles/terminal.css';
import { WalletProvider } from '../context/WalletContext';
import { Header } from '../components/navigation/Header';

export const metadata = {
  title: 'OmniFi | Industrial High-Performance Non-Custodial Multi-Chain DEX',
  description: 'Non-custodial cross-network liquidity and routing protocol with mathematical exactness',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <Header />
          <main style={{ minHeight: 'calc(100vh - 70px)' }}>{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
