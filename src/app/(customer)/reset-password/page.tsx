import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nueva contraseña · Dos Tazas",
};

/**
 * Where a password-recovery link lands.
 *
 * By the time this renders, /auth/confirm has already redeemed the recovery
 * token and put a session in cookies — that session is the proof of ownership,
 * which is why this form asks only for the new password and not the old one.
 * Without a session there is nothing to authorize the change, so bounce.
 */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/account?error=link");

  return <ResetPasswordForm email={data.user.email ?? ""} />;
}
