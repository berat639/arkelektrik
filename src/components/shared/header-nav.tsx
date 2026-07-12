"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";

interface HeaderNavProps {
  serviceLinks: { href: string; label: string }[];
}

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/homepage", label: "Ana Sayfa" },
  { href: "/admin/posts", label: "Yazılar" },
  { href: "/admin/services", label: "Faaliyet Alanları" },
  { href: "/admin/about", label: "Hakkımızda" },
  { href: "/admin/messages", label: "Mesajlar" },
];

export function HeaderNav({ serviceLinks }: HeaderNavProps) {
  const pathname = usePathname();
  const isAdmin = (pathname ?? "").startsWith("/admin");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    handleScroll(); // set initial state
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
    setServicesOpen(false);
  }

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : (pathname ?? "").startsWith(path);

  // ── Admin layout ──
  if (isAdmin) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <Image src="/ark-logo.png" alt="ARK Global" width={100} height={32} className="h-8 w-auto" priority />
          </Link>

          {/* Desktop admin nav */}
          <nav className="nav-desktop items-center gap-1">
            {adminLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <form action="/admin/logout" method="POST" className="ml-1">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              >
                Çıkış
              </button>
            </form>
          </nav>

          {/* Mobile admin */}
          <div className="nav-mobile items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
              className="flex items-center justify-center h-9 w-9 rounded-lg transition-colors text-muted-foreground hover:bg-muted cursor-pointer"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile admin dropdown */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMobileOpen(false)} />
            <div className="fixed inset-x-0 top-16 z-50 border-b bg-background shadow-lg max-h-[80vh] overflow-y-auto">
              <nav className="container mx-auto px-4 py-3 flex flex-col gap-0.5">
                {adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="my-1.5 border-t" />
                <form action="/admin/logout" method="POST">
                  <button
                    type="submit"
                    onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    Çıkış Yap
                  </button>
                </form>
              </nav>
            </div>
          </>
        )}
      </header>
    );
  }

  // ── Public ARK layout ──
  const headerBg = scrolled
    ? "bg-dark-900/95 backdrop-blur-md shadow-xl shadow-black/30 border-b border-teal-500/25"
    : "bg-dark-900/80 backdrop-blur-sm";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <Image src="/ark-logo.png" alt="ARK Global" width={120} height={40} className="h-10 w-auto" priority />
        </Link>

        {/* Desktop Nav */}
        <ul className="public-nav-desktop ml-auto gap-6 lg:gap-8">

          <li>
            <Link
              href="/hakkimizda"
              className={`nav-link ${isActive("/hakkimizda") ? "active text-white" : ""}`}
            >
              Hakkımızda
            </Link>
          </li>

          {/* Services dropdown */}
          <li
            ref={dropdownRef}
            className="relative group"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <Link
              href="/hizmetler"
              className={`nav-link flex items-center gap-1 ${isActive("/hizmetler") ? "active text-white" : ""}`}
            >
              Faaliyet Alanlarımız
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`}
              />
            </Link>
            <div
              className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 w-80 transition-all duration-200 ${
                servicesOpen
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              {/* Inner wrapper for hover gap continuity */}
              <div className="absolute -top-3 left-0 right-0 h-3 bg-transparent" />
              <div
                className="bg-dark-800 border border-teal-500/25 shadow-2xl relative"
                style={{
                  clipPath:
                    "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                }}
              >
                <div className="p-2">
                  <Link
                    href="/hizmetler"
                    className="block px-4 py-2 text-xs font-semibold text-teal-500 uppercase tracking-wider border-b border-dark-600 mb-1"
                  >
                    Tüm Faaliyet Alanlarımız
                  </Link>
                  {serviceLinks.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-teal-500/10 transition-colors duration-150"
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </li>

          <li>
            <Link href="/blog" className={`nav-link ${isActive("/blog") ? "active text-white" : ""}`}>
              Blog
            </Link>
          </li>
          <li>
            <Link
              href="/contact"
              className={`nav-link ${isActive("/contact") ? "active text-white" : ""}`}
            >
              İletişim
            </Link>
          </li>
        </ul>

        {/* Mobile toggle */}
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden text-white p-2 cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden bg-dark-800 border-t border-teal-500/25 transition-all duration-300 overflow-hidden ${
          mobileOpen ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="px-6 py-4 space-y-1">
          {[
            { label: "Hakkımızda", to: "/hakkimizda" },
            { label: "Blog", to: "/blog" },
            { label: "İletişim", to: "/contact" },
          ].map(({ label, to }) => (
            <li key={to}>
              <Link
                href={to}
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-white/75 hover:text-white text-sm uppercase tracking-wider font-medium border-b border-teal-500/25 transition-colors"
              >
                {label}
              </Link>
            </li>
          ))}

          {/* Mobile services */}
          <li>
            <button
              onClick={() => setServicesOpen(!servicesOpen)}
              className="w-full flex items-center justify-between py-3 text-white/75 hover:text-white text-sm uppercase tracking-wider font-medium border-b border-teal-500/25 cursor-pointer"
            >
              Faaliyet Alanlarımız
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`}
              />
            </button>
            {servicesOpen && (
              <ul className="mt-1 ml-4 space-y-1 pb-2">
                <li>
                  <Link
                    href="/hizmetler"
                    onClick={() => setMobileOpen(false)}
                    className="block py-2 text-sm text-teal-500 font-medium"
                  >
                    Tüm Faaliyet Alanlarımız
                  </Link>
                </li>
                {serviceLinks.map((s) => (
                  <li key={s.href}>
                    <Link
                      href={s.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-2 text-sm text-white/55 hover:text-teal-500 transition-colors"
                    >
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>


        </ul>
      </div>
    </header>
  );
}
