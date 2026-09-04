import type { Metadata } from "next";

import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Crear mi tarjeta · Dos Tazas",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
