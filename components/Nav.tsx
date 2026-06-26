import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/estrategias", label: "Estrategias" },
  { href: "/backtesting", label: "Backtesting" },
  { href: "/paper-trading", label: "Paper Trading" },
];

export function Nav() {
  return (
    <nav className="border-b border-foreground/10 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-6">
        <Link href="/" className="font-semibold tracking-tight">
          AnalisisMercado
        </Link>
        <ul className="flex gap-4 text-sm">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-foreground/70 hover:text-foreground">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}