"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FaHome,
  FaInfoCircle,
  FaListAlt,
  FaBars,
  FaTimes,
  FaUniversity,
} from "react-icons/fa";
import { Orbitron } from "next/font/google";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["700"] });

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home", icon: <FaHome className="mr-2" /> },
    {
      href: "/create-institution",
      label: "Institutions",
      icon: <FaUniversity className="mr-2" />,
    },
    {
      href: "/about",
      label: "About",
      icon: <FaInfoCircle className="mr-2" />,
    },
  ];

  return (
    <nav className="fixed top-0 left-0 z-20 w-full bg-gradient-to-r from-indigo-500/95 via-purple-500/95 to-blue-500/95 backdrop-blur-md shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 max-md:px-4 max-sm:px-3">
        {/* Logo */}
        <Link
          href="/"
          className={`${orbitron.className} flex items-center gap-2 text-2xl font-extrabold tracking-wide text-white drop-shadow-md md:text-3xl`}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-sm shadow-sm">
            ✨
          </span>
          <span>
            Timetable
            <span className="text-[#ffde59]">Genie</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <p className="group flex items-center rounded-full px-4 py-2 text-sm font-medium text-white/90 transition-all hover:bg-white/10 hover:text-[#ffde59]">
                {link.icon}
                <span>{link.label}</span>
                <span className="ml-1 h-[2px] w-0 rounded-full bg-[#ffde59] transition-all group-hover:w-4" />
              </p>
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="relative z-30 block text-white md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? (
            <FaTimes className="text-2xl" />
          ) : (
            <FaBars className="text-2xl" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 ${menuOpen
            ? "pointer-events-auto max-h-96 opacity-100"
            : "pointer-events-none max-h-0 opacity-0"
          }`}
      >
        <div className="flex flex-col gap-2 border-t border-white/15 bg-gradient-to-b from-indigo-600 via-purple-600 to-blue-600 px-6 pb-4 pt-3">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <p
                onClick={() => setMenuOpen(false)}
                className="flex items-center rounded-lg px-3 py-2 text-base font-medium text-white/95 transition-all hover:bg-white/10 hover:text-[#ffde59]"
              >
                {link.icon}
                {link.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
