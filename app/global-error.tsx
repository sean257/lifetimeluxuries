"use client";

/** Last resort if the root layout itself fails. Plain styles: globals may not have loaded. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#FAF7F5", color: "#1D1917", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 420, margin: "96px auto", padding: "0 16px", textAlign: "center" }}>
          <h1 style={{ fontWeight: 500 }}>Lifetime Luxuries is having trouble</h1>
          <p style={{ color: "#6E625D" }}>Try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{ background: "#A86F5C", color: "#fff", border: 0, borderRadius: 2, padding: "12px 22px", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
