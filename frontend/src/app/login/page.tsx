import Link from "next/link";

export default function LoginPage() {
  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10 text-slate-900">
      <section
        aria-labelledby="login-heading"
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <p className="mb-2 text-sm font-medium text-blue-600">
          Student Management System
        </p>

        <h1 id="login-heading" className="text-3xl font-bold">
          Sign in
        </h1>

        <p
          id="login-notice"
          className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800"
        >
          Sign-in is not available yet.
        </p>

        <form className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="login-email"
              className="mb-1 block text-sm font-medium"
            >
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              required
              maxLength={254}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-1 block text-sm font-medium"
            >
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled
            aria-describedby="login-notice"
            className="w-full cursor-not-allowed rounded-lg bg-blue-600 px-4 py-2 font-medium text-white opacity-50"
          >
            Sign in
          </button>
        </form>

        <Link
          href="/dashboard"
          className="mt-6 block text-center text-sm font-medium text-blue-600 hover:underline"
        >
          View dashboard
        </Link>
      </section>
    </main>
  );
}