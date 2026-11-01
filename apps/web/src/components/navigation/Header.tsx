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
        background: 'rgba(9, 10, 15, 0.95)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                background: 'var(--accent-cyber)',
                color: '#000',
                fontWeight: 900,
                fontSize: '1rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Ω
            </span>
            <span
              style={{
                fontWeight: 700,
                fontSize: '1.15rem',
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              OmniFi
            </span>
          </Link>

          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-mono"
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <NetworkSelector />
          <WalletModal />
        </div>
      </div>
    </header>
  );
}

