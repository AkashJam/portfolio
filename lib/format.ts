// Shared display formatters. Kept out of any "use client" module: once a
// file has "use client", every export from it — not just components —
// becomes a client reference to Server Components that import it, so a
// Server Component calling `.format()` on a value re-exported from a client
// module gets an opaque reference object instead of the real Intl.NumberFormat
// instance. Plain formatters used by both server and client code live here
// instead, so both sides get the real value.
export const volumeFormat = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});
