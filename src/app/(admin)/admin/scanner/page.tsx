import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ScannerWorkspace } from "@/components/ScannerWorkspace";
import { getColonesPerPoint } from "@/lib/loyalty-settings";
import { createClient } from "@/lib/supabase/server";
import { Alert } from "@/design-system";

export const metadata: Metadata = {
  title: "Escáner · Dos Tazas",
};

/**
 * Middleware guarantees a session before this renders; what it cannot check is
 * whether that session belongs to a *barista*. A customer who upgraded their
 * account is perfectly authenticated and has no business here, so the staff
 * check happens explicitly.
 *
 * This is defence in depth rather than the boundary itself — every RPC the
 * scanner calls re-checks is_staff() server-side, so a customer who bypassed
 * this page entirely would still be refused by Postgres.
 */
export default async function ScannerPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/admin/login?next=/admin/scanner");

  const { data: isStaff } = await supabase.rpc("is_staff");

  if (!isStaff) {
    return (
      <Alert tone="danger" title="Sin acceso">
        Esta cuenta no está registrada como personal de Dos Tazas. Pedile a un administrador que
        te agregue.
      </Alert>
    );
  }

  // Fetched here rather than inside the panel: the barista's preview of
  // "₡3.500 = +7 puntos" has to match what earn_points() will actually award,
  // and that comes from the same row.
  const colonesPerPoint = await getColonesPerPoint();

  return <ScannerWorkspace colonesPerPoint={colonesPerPoint} />;
}
