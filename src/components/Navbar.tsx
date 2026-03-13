"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/costs", label: "Product Costs" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className="bg-white shadow">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
        <span className="text-sm font-bold text-gray-800">Profit Tracker</span>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6">
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

        {/* Hamburger button */}
        <button
          onClick={() => setOpen(!open)}
          className="sm:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 cursor-pointer"
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-0.5 bg-gray-600 transition-transform ${
              open ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-gray-600 transition-opacity ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-gray-600 transition-transform ${
              open ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="sm:hidden border-t border-gray-200">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-3 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
