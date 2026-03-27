"use client";

import Link        from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BookOpen, DollarSign, BarChart2 } from "lucide-react";

const NAV_LINKS = [
  { href: "/",          label: "Home"      },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pricing",   label: "Pricing"   },
  { href: "/blog",      label: "Blog"      },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="sticky top-0 z-50 w-full border-b border-bg-border/60 bg-bg-base/85 backdrop-blur-xl"
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          aria-label="StockPulse AI - Home"
          className="flex items-center gap-2.5 font-extrabold text-lg group"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand shadow-brand-sm group-hover:shadow-brand-md transition-shadow duration-200">
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
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                pathname === link.href
                  ? "text-white bg-bg-hover"
                  : "text-slate-400 hover:text-white hover:bg-bg-hover/60"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="ml-2 btn-primary !py-1.5 !px-4 text-sm flex items-center gap-1.5"
          >
            <BarChart2 size={13} />
            Launch App
          </Link>
        </div>
      </div>
    </nav>
  );
}
