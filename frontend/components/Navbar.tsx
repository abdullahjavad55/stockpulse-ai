"use client";

import Link        from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BookOpen, DollarSign } from "lucide-react";

const NAV_LINKS = [
  { href: "/",          label: "Home"      },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pricing",   label: "Pricing", icon: DollarSign  },
  { href: "/blog",      label: "Blog",    icon: BookOpen    },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="sticky top-0 z-50 w-full border-b border-bg-border bg-bg-base/80 backdrop-blur-xl"
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" aria-label="StockPulse AI — Home" className="flex items-center gap-2.5 font-extrabold text-lg">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand" aria-hidden>
            <Activity size={14} className="text-white" />
          </div>
          <span>
            StockPulse <span className="gradient-text">AI</span>
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                pathname === link.href
                  ? "text-white bg-bg-hover"
                  : "text-slate-400 hover:text-white hover:bg-bg-hover"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="ml-3 btn-primary !py-1.5 !px-4 text-sm"
          >
            Launch App
          </Link>
        </div>
      </div>
    </nav>
  );
}
