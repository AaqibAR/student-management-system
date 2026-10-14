"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode, MouseEvent } from "react";
import Icon, { type IconName } from "@/components/Icon";

const navigation: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/students", label: "Students", icon: "students" },
  { href: "/courses", label: "Courses", icon: "book" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentPage =
    navigation.find((item) => pathname === item.href)?.label ??
    (pathname === "/login" ? "Sign in" : "Workspace");

  function closeMobileMenu(event: MouseEvent<HTMLAnchorElement>) {
    event.currentTarget.closest("details")?.removeAttribute("open");
  }

  function links(mobile = false) {
    return navigation.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className={`workspace-nav-link ${pathname === item.href ? "is-active" : ""}`}
        aria-current={pathname === item.href ? "page" : undefined}
        onClick={mobile ? closeMobileMenu : undefined}
      >
        <Icon name={item.icon} />
        <span>{item.label}</span>
        {pathname === item.href && <span className="nav-active-dot" />}
      </Link>
    ));
  }

  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#page-content">
        Skip to content
      </a>
      <aside className="workspace-sidebar" aria-label="Workspace sidebar">
        <Link
          href="/dashboard"
          className="workspace-brand"
          aria-label="Student Management overview"
        >
          <span className="brand-mark">
            <Icon name="book" width="23" height="23" />
          </span>
          <span>
            Student<span className="brand-subtitle">MANAGEMENT</span>
          </span>
        </Link>
        <div className="workspace-selector">
          <span className="workspace-selector-mark">SM</span>
          <span>
            Academic workspace<small>Students &amp; courses</small>
          </span>
        </div>
        <p className="sidebar-label">WORKSPACE</p>
        <nav aria-label="Main navigation">{links()}</nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Icon name="layers" />
            <p>
              A little more organized.
              <span>One place for your academic records.</span>
            </p>
          </div>
          <Link className="sidebar-signin" href="/login">
            <Icon name="login" />
            <span>Sign in</span>
            <Icon name="arrow" width="16" height="16" />
          </Link>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-topbar">
          <div className="workspace-breadcrumb">
            <span>Workspace</span>
            <Icon name="chevron" width="14" height="14" />
            <strong>{currentPage}</strong>
          </div>
          <Link href="/login" className="topbar-signin">
            Sign in <Icon name="arrow" width="15" height="15" />
          </Link>
          <details className="workspace-mobile-menu">
            <summary aria-label="Toggle navigation">
              <Icon name="menu" />
              <span>Menu</span>
            </summary>
            <nav aria-label="Mobile navigation">
              {links(true)}
              <Link
                className="workspace-nav-link"
                href="/login"
                onClick={closeMobileMenu}
              >
                <Icon name="login" />
                Sign in
              </Link>
            </nav>
          </details>
        </header>
        <div id="page-content" tabIndex={-1} className="workspace-content">
          {children}
        </div>
        <footer className="workspace-footer">
          <span>Student Management System</span>
          <span>Built for a clearer academic day.</span>
        </footer>
      </div>
    </div>
  );
}
