import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Refferq — Free Open-Source Affiliate Marketing Platform"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #000000 0%, #022c22 50%, #000000 100%)",
          padding: "60px 80px",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -30%)",
            width: "800px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(16,185,129,0.12) 0%, transparent 70%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 18 18" fill="none">
              <path d="M3 6h12M3 9h12M3 12h7" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontSize: "36px", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>Refferq</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, justifyContent: "center" }}>
          <span style={{ fontSize: "52px", fontWeight: 800, color: "white", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Free Open-Source
          </span>
          <span
            style={{
              fontSize: "52px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              background: "linear-gradient(90deg, #34d399, #2dd4bf)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Affiliate Marketing Platform
          </span>
          <span style={{ fontSize: "20px", color: "#9ca3af", marginTop: "16px" }}>
            Self-hosted · Real-time tracking · Flexible commissions · 38+ API endpoints
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ padding: "10px 20px", borderRadius: "10px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", fontSize: "15px", fontWeight: 700, color: "#34d399" }}>$0 / forever</div>
          <div style={{ padding: "10px 20px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "15px", fontWeight: 600, color: "#d1d5db" }}>MIT License</div>
          <span style={{ marginLeft: "auto", fontSize: "17px", fontWeight: 500, color: "#6b7280" }}>refferq.com</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
