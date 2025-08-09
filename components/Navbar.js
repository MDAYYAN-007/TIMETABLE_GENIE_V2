'use client';

import Link from "next/link";
import { FaHome, FaInfoCircle, FaListAlt, FaSignInAlt, FaBars, FaTimes } from "react-icons/fa";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const router = useRouter();

  const handleSignOut = async () => {
    const isConfirmed = window.confirm('Are you sure you want to sign out?');
    if (!isConfirmed) return;
    await signOut({ redirect: false });
    router.push("/login");
  }

  return (
    <nav className="navbar bg-gradient-to-r from-[#8e44ad] to-[#3498db] shadow-md fixed w-full z-10 top-0 left-0">
      <div className="mx-auto px-6 py-4 flex justify-between items-center max-md:px-4 max-sm:px-2">
        {/* Logo */}
        <Link href="/" className="text-2xl font-extrabold text-white flex items-center gap-2 max-md:text-xl">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff8a65] to-[#ffe0b2]">
            Timetable Genie
          </span>
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="block md:hidden text-white focus:outline-none relative z-20"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
        </button>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center space-x-6 text-lg text-white">
          <Link href="/">
            <p className="nav-link hover:text-[#ff8a65] hover:scale-105 transform transition-all flex items-center">
              <FaHome className="mr-2" />
              Home
            </p>
          </Link>
          <Link href="/timetables">
            <p className="nav-link hover:text-[#ff8a65] hover:scale-105 transform transition-all flex items-center">
              <FaListAlt className="mr-2" />
              Time Tables
            </p>
          </Link>
          <Link href="/about">
            <p className="nav-link hover:text-[#ff8a65] hover:scale-105 transform transition-all flex items-center">
              <FaInfoCircle className="mr-2" />
              About
            </p>
          </Link>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="absolute top-16 left-0 w-full bg-[#8e44ad] shadow-lg flex flex-col items-center space-y-4 py-4 md:hidden">
            <Link href="/">
              <p
                onClick={() => setMenuOpen(false)}
                className="text-white text-lg hover:text-[#ff8a65] transition-all"
              >
                <FaHome className="inline-block mr-2" />
                Home
              </p>
            </Link>
            <Link href="/timetables">
              <p
                onClick={() => setMenuOpen(false)}
                className="text-white text-lg hover:text-[#ff8a65] transition-all"
              >
                <FaListAlt className="inline-block mr-2" />
                Time Tables
              </p>
            </Link>
            <Link href="/about">
              <p
                onClick={() => setMenuOpen(false)}
                className="text-white text-lg hover:text-[#ff8a65] transition-all"
              >
                <FaInfoCircle className="inline-block mr-2" />
                About
              </p>
            </Link>
          </div>
        )}

        {/* Auth Section */}
        <div className="relative ml-4 max-md:ml-2">
          {status === "loading" ? (
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          ) : session ? (
            <div className="group relative">
              <button
                onClick={() => handleSignOut()}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 max-md:px-3 max-md:py-1 rounded-lg transition-all"
              >
                <span className="text-white">Sign Out</span>
              </button>
              <span className="absolute left-1/2 -bottom-8 transform -translate-x-1/2 text-center text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap bg-[#8e44ad] px-2 py-1 rounded">
                Signed in as: {session.user.email.split('@')[0]}
              </span>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 max-md:px-3 max-md:py-1 rounded-lg transition-all"
            >
              <FaSignInAlt className="text-white" />
              <span className="text-white">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
