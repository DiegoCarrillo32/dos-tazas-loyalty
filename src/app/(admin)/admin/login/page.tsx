import type { Metadata } from "next";
import { Suspense } from "react";

import { StaffLoginForm } from "@/components/StaffLoginForm";

export const metadata: Metadata = {
  title: "Ingreso de personal · Dos Tazas",
};

export default function AdminLoginPage() {
  return (
    <Suspense>
      <StaffLoginForm />
    </Suspense>
  );
}
