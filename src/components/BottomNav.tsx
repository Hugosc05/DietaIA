'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Hoy', icon: '✓' },
  { href: '/dieta', label: 'Dieta', icon: '🍽' },
  { href: '/progreso', label: 'Progreso', icon: '📈' }
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname === '/login') return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg justify-around pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-6 py-2.5 text-xs font-medium transition-colors ${
                active ? 'text-accent' : 'text-slate-400'
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
