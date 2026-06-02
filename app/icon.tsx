import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 96,
        }}
      >
        <div
          style={{
            color: "#f59e0b",
            fontSize: 300,
            lineHeight: 1,
            fontFamily: "serif",
          }}
        >
          و
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
