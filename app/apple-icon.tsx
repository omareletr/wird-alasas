import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0c0c0c",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: "#f59e0b",
            fontSize: 110,
            lineHeight: 1,
            fontFamily: "serif",
          }}
        >
          و
        </div>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
