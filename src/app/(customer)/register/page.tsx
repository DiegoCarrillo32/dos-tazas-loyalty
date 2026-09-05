import type { Metadata } from "next";

import { requireCompleteProfile } from "@/lib/require-profile";

import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Crear mi tarjeta · Dos Tazas",
};

export default async function RegisterPage() {
  // A signed-in visitor with no card belongs on the onboarding form, which
  // creates the card *and* links it in one step.
  await requireCompleteProfile();

  return <RegisterForm />;
}
