import { ImageResponse } from "next/og";

export const alt = "Lifetime Luxuries · Men's watches & accessories, Harare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 56" fill="none" stroke="#A86F5C" stroke-width="1.6" stroke-linejoin="round"><path d="M14 13 L16 5 L20 9 L24 2 L28 9 L32 5 L34 13 Z"/><path d="M10 17 H38 L46 27 L24 54 L2 27 Z"/><path d="M2 27 H46 M17 17 L13 27 L24 54 L35 27 L31 17 M17 17 L24 27 L31 17"/></svg>`;

/** Default share image for pages without a product photo. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF7F5",
          color: "#1D1917",
          gap: 28,
        }}
      >
        <img src={`data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`} width={168} height={196} alt="" />
        <div style={{ fontSize: 76, color: "#A86F5C", letterSpacing: "0.32em", marginRight: "-0.32em" }}>LIFETIME LUXURIES</div>
        <div style={{ fontSize: 30, color: "#6E625D", letterSpacing: "0.18em" }}>MEN&apos;S WATCHES &amp; ACCESSORIES · HARARE</div>
      </div>
    ),
    size,
  );
}
