'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { NetworkSelector } from '../wallet/NetworkSelector';
import { WalletModal } from '../wallet/WalletModal';

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Swap', href: '/' },
    { label: 'Pools', href: '/pools' },
    { label: 'Positions', href: '/positions' },
    { label: 'Tokens', href: '/tokens' },
    { label: 'History', href: '/history' },
    { label: 'Status', href: '/status' },
  ];

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(6, 7, 10, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.9rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span
              style={{
                background: 'linear-gradient(135deg, var(--accent-cyber) 0%, #00b4d8 100%)',
                color: '#000',
                fontWeight: 900,
                fontSize: '1.05rem',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)',
                boxShadow: '0 0 12px rgba(0, 229, 153, 0.3)',
              }}
            >
              Ω
            </span>
            <span
              style={{
                fontWeight: 800,
                fontSize: '1.2rem',
                letterSpacing: '-0.03em',
                color: '#fff',
              }}
            >
              OmniFi
            </span>
          </Link>

          <nav style={{ display: 'flex', gap: '0.4rem' }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-mono"
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: isActive ? 'var(--accent-cyber)' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(0, 229, 153, 0.08)' : 'transparent',
                    border: isActive
                      ? '1px solid rgba(0, 229, 153, 0.25)'
                      : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <NetworkSelector />
          <WalletModal />
        </div>
      </div>
    </header>
  );
}
