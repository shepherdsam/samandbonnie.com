'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Menu() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/rsvp', label: 'RSVP' },
    { href: '/details', label: 'Details' },
    { href: '/registry', label: 'Registry' },
  ];

  return (
    <nav className="main-nav">
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link 
              href={link.href} 
              className={pathname === link.href ? 'active' : ''}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
