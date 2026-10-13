import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white text-slate-900">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4"
      >
        <Link href="/dashboard" className="font-bold">
          Student Management
        </Link>

        <div className="flex flex-wrap gap-5 text-sm font-medium">
          <Link href="/dashboard" className="hover:text-blue-600">
            Dashboard
          </Link>
          <Link href="/students" className="hover:text-blue-600">
            Students
          </Link>
          <Link href="/courses" className="hover:text-blue-600">
            Courses
          </Link>
          <Link href="/login" className="hover:text-blue-600">
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
}