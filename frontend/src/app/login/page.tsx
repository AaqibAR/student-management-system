import { redirect } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import AuthForm from "@/components/AuthForm";
import { readSession } from "@/lib/server-auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const session = await readSession();
  if (session.state === "authenticated") redirect("/dashboard");
  const { reason } = await searchParams;
  return <AuthLayout><AuthForm mode="login" expired={reason === "expired" || session.state === "expired"} /></AuthLayout>;
}
