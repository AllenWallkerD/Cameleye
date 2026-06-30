"use client";

// Fallback for errors in the root layout itself (replaces <html>/<body>).
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#f5f3fc",
          color: "#181126",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ color: "#6b6286", marginTop: 6 }}>Please reload the page.</p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "10px 18px",
              borderRadius: 12,
              border: "none",
              background: "#7c3aed",
              color: "#fff",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
