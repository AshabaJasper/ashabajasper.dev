"use client";

/** Last-resort error page. Renders its own document because the root layout failed. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-GB">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          background: "#fafaf8",
          color: "#1b1f23",
          padding: 24,
        }}
      >
        <main style={{ maxWidth: 520 }}>
          <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, letterSpacing: 2, color: "#5f6973" }}>
            SOMETHING WENT WRONG
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 44, lineHeight: 1.05, margin: "12px 0" }}>
            This page failed to load.
          </h1>
          <p style={{ color: "#5f6973", lineHeight: 1.6 }}>Try again in a moment. If it keeps happening, email ashabajasper@gmail.com.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              minHeight: 44,
              padding: "0 22px",
              borderRadius: 999,
              border: 0,
              background: "#137c72",
              color: "#fff",
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
