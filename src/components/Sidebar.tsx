"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Users,
  Sparkles,
  Wallet,
  LineChart,
  Calculator,
  ShieldCheck,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/equipe", label: "Equipe", icon: Users },
  { href: "/criativos", label: "Criativos", icon: Sparkles },
  { href: "/investimento", label: "Investimento", icon: Wallet },
  { href: "/financeiro", label: "Financeiro", icon: LineChart },
  { href: "/simulador", label: "Simulador", icon: Calculator },
];

const ADMIN_LINK: { href: string; label: string; icon: LucideIcon } = {
  href: "/admin",
  label: "Admin",
  icon: ShieldCheck,
};

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2">
      <Image src="/logo-icon.png" alt="Control" width={32} height={32} className="size-8 rounded-lg" priority />
      <div>
        <p className="text-sm font-bold leading-none tracking-tight text-control-ink">
          CONTROL
        </p>
        <p className="mt-0.5 text-[11px] leading-none text-control-ink/40">
          Marketing · Comercial
        </p>
      </div>
    </div>
  );
}

export function SidebarDesktop({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...LINKS, ADMIN_LINK] : LINKS;

  return (
    <aside className="hidden shrink-0 lg:flex lg:w-60 lg:flex-col lg:gap-6 lg:border-r lg:border-control-line lg:bg-control-surface lg:px-4 lg:py-6">
      <Brand />
      <nav className="flex flex-1 flex-col gap-0.5">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-control-blue-50 text-control-blue-700"
                  : "text-control-ink/55 hover:bg-control-bg hover:text-control-ink"
              }`}
            >
              <Icon className="size-4" strokeWidth={2} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-2">
        <ThemeToggle className="flex size-9 shrink-0 items-center justify-center rounded-lg text-control-ink/45 transition hover:bg-control-bg hover:text-control-ink" />
        <form action="/api/logout" method="POST" className="min-w-0 flex-1">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-control-ink/45 transition hover:bg-control-danger-100 hover:text-control-danger-600"
          >
            <LogOut className="size-4" strokeWidth={2} />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileTopNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...LINKS, ADMIN_LINK] : LINKS;

  return (
    <div className="border-b border-control-line bg-control-surface lg:hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <Brand />
        <div className="flex items-center gap-1.5">
          <ThemeToggle className="flex size-8 shrink-0 items-center justify-center rounded-full text-control-ink/45 transition hover:bg-control-bg hover:text-control-ink" />
          <form action="/api/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-control-ink/45 transition hover:bg-control-danger-100 hover:text-control-danger-600"
            >
              <LogOut className="size-3.5" strokeWidth={2} />
              Sair
            </button>
          </form>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 py-3">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-control-blue-600 text-white shadow-sm"
                  : "bg-control-bg text-control-ink/55"
              }`}
            >
              <Icon className="size-3.5" strokeWidth={2} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
