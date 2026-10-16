"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode, MouseEvent } from "react";
import Icon, { type IconName } from "@/components/Icon";
import { useAuth } from "@/components/AuthProvider";

const navigation: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/students", label: "Students", icon: "students" },
  { href: "/courses", label: "Courses", icon: "book" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, signOut, signingOut, signOutError } = useAuth();
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part.slice(0, 1)).join("").toUpperCase();
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
          <div className="sidebar-account">
            <span className="account-avatar">{initials}</span>
            <div><strong>{user.name}</strong><span>{user.email}</span><small>{isAdmin ? "Administrator" : "View access"}</small></div>
          </div>
          <button className="sidebar-signin" type="button" disabled={signingOut} onClick={signOut}>
            <Icon name="logout" />
            <span>{signingOut ? "Signing out…" : "Sign out"}</span>
            <Icon name="arrow" width="16" height="16" />
          </button>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-topbar">
          <div className="workspace-breadcrumb">
            <span>Workspace</span>
            <Icon name="chevron" width="14" height="14" />
            <strong>{currentPage}</strong>
          </div>
          <div className="topbar-account"><span className="role-badge">{isAdmin ? "Admin" : "View access"}</span><span className="account-avatar">{initials}</span><span className="account-name">{user.name}</span></div>
          <details className="workspace-mobile-menu">
            <summary aria-label="Toggle navigation">
              <Icon name="menu" />
              <span>Menu</span>
            </summary>
            <nav aria-label="Mobile navigation">
              {links(true)}
              <button
                className="workspace-nav-link"
                type="button"
                onClick={signOut}
                disabled={signingOut}
              >
                <Icon name="logout" />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </nav>
          </details>
        </header>
        {signOutError && <p role="alert" className="auth-shell-error">{signOutError}</p>}
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
