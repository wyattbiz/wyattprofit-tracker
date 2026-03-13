"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/costs", label: "Product Costs" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className="bg-white shadow mb-0">
      <div className="max-w-4xl mx-auto px-4 flex items-center gap-6 h-14">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium transition-colors ${
              pathname === link.href
                ? "text-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
