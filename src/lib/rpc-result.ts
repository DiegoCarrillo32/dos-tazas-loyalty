/**
 * Some RPCs report failure as a returned `{ error: "..." }` object rather than
 * by raising.
 *
 * The reason is transactional: a function runs inside the caller's
 * transaction, so `raise exception` rolls that transaction back — including
 * any audit row the function wrote on its way to failing. lookup_member()
 * records failed attempts to drive the brute-force limit, and those INSERTs
 * only survive if the call commits. See migration 00007.
 */
export function errorFromRpcResult(data: unknown): string | null {
  if (data && typeof data === "object" && "error" in data) {
    const code = (data as { error: unknown }).error;
    return typeof code === "string" ? code : "server_error";
  }
  return null;
}
