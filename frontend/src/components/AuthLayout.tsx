import type { ReactNode } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <main className="auth-page">
    <section className="auth-story" aria-label="Student Management workspace">
      <Link href="/" className="workspace-brand auth-brand" aria-label="Student Management home">
        <span className="brand-mark"><Icon name="book" width="23" height="23" /></span>
        <span>Student<span className="brand-subtitle">MANAGEMENT</span></span>
      </Link>
      <div className="auth-story-copy reveal">
        <p className="auth-kicker"><span />YOUR ACADEMIC WORKSPACE</p>
        <h2>One workspace.<br /><em>Clearer days.</em></h2>
        <p>Bring your students and courses together.<br />Make room for what matters next.</p>
        <div className="auth-illustration" aria-hidden="true">
          <div className="auth-orbit" />
          <div className="auth-mini-card auth-mini-back"><Icon name="book" width="30" height="30" /><i /><i /></div>
          <div className="auth-mini-card auth-mini-front"><span className="auth-mini-avatar"><Icon name="students" width="26" height="26" /></span><div><i /><i /><i /></div><span className="auth-mini-check"><Icon name="check" width="15" height="15" /></span></div>
        </div>
        <ul className="auth-features">
          <li><Icon name="students" /><span>Student directory</span></li>
          <li><Icon name="book" /><span>Course catalog</span></li>
          <li><Icon name="lock" /><span>Access by role</span></li>
        </ul>
      </div>
      <p className="auth-story-footer">A little more organized, every day.</p>
    </section>
    <section className="auth-form-area">
      <div className="auth-mobile-brand"><Icon name="book" /><span>Student Management</span></div>
      {children}
      <p className="auth-footer">Student Management System</p>
    </section>
  </main>;
}
