/**
 * Constants shared between the server-side signer and the browser.
 *
 * `crypto.ts` imports `node:crypto` and reads LOYALTY_QR_SECRET, so a client
 * component cannot import from it — pulling in that module would drag the
 * secret-reading code into the bundle. This file holds only the parts that are
 * safe and useful on both sides.
 */

/** Every signed payload starts `DT1.` — used to tell a QR from a typed cédula. */
export const QR_PREFIX = "DT1";
