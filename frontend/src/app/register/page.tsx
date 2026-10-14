import { redirect } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import AuthForm from "@/components/AuthForm";
import { readSession } from "@/lib/server-auth";

export default async function RegisterPage() {
  const session = await readSession();
  if (session.state === "authenticated") redirect("/dashboard");
  return <AuthLayout><AuthForm mode="register" /></AuthLayout>;
}
