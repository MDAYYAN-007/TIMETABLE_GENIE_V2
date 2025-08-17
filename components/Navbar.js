'use client';

import Link from "next/link";
import { FaHome, FaInfoCircle, FaListAlt, FaSignInAlt, FaBars, FaTimes } from "react-icons/fa";
import { useState } from "react";
import { Orbitron } from "next/font/google";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["700"] });

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  let status = "loading";
  let session = null;

  return (
    <nav className="bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500/90 backdrop-blur-sm shadow-md fixed w-full z-10 top-0 left-0">
      <div className="mx-auto px-6 py-4 flex justify-between items-center max-md:px-4 max-sm:px-2">
        
        {/* Logo */}
        <Link
          href="/"
          className={`${orbitron.className} text-3xl font-bold text-white tracking-wide drop-shadow-md`}
        >
          TimetableGenie
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
            <p className="nav-link hover:text-[#ffda77] hover:scale-105 transform transition-all flex items-center">
              <FaHome className="mr-2" />
              Home
            </p>
          </Link>
          <Link href="#">
            <p className="nav-link hover:text-[#ffda77] hover:scale-105 transform transition-all flex items-center">
              <FaListAlt className="mr-2" />
              Time Tables
            </p>
          </Link>
          <Link href="#">
            <p className="nav-link hover:text-[#ffda77] hover:scale-105 transform transition-all flex items-center">
              <FaInfoCircle className="mr-2" />
              About
            </p>
          </Link>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="absolute top-16 left-0 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 shadow-lg flex flex-col items-center space-y-4 py-4 md:hidden">
            <Link href="/">
              <p
                onClick={() => setMenuOpen(false)}
                className="text-white text-lg hover:text-[#ffda77] transition-all"
              >
                <FaHome className="inline-block mr-2" />
                Home
              </p>
            </Link>
            <Link href="#">
              <p
                onClick={() => setMenuOpen(false)}
                className="text-white text-lg hover:text-[#ffda77] transition-all"
              >
                <FaListAlt className="inline-block mr-2" />
                Time Tables
              </p>
            </Link>
            <Link href="#">
              <p
                onClick={() => setMenuOpen(false)}
                className="text-white text-lg hover:text-[#ffda77] transition-all"
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
                // onClick={() => handleSignOut()}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 max-md:px-3 max-md:py-1 rounded-lg transition-all"
              >
                <span className="text-white">Sign Out</span>
              </button>
              <span className="absolute left-1/2 -bottom-8 transform -translate-x-1/2 text-center text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap bg-purple-600 px-2 py-1 rounded">
                {/* Signed in as: {session.user.email.split('@')[0]} */}
              </span>
            </div>
          ) : (
            <Link
              href="#"
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
