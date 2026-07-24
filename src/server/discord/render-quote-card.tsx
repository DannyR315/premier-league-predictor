import { ImageResponse } from "next/og";

const MAX_CHARS = 200;

export async function renderQuoteCard({
  text,
  authorName,
  authorAvatarUrl,
}: {
  text: string;
  authorName: string;
  authorAvatarUrl?: string;
}): Promise<ArrayBuffer> {
  const truncated = text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}…` : text;

  const image = new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "48px",
          background: "#313338",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          {authorAvatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) requires a plain <img>, not next/image
            <img
              src={authorAvatarUrl}
              alt=""
              width={56}
              height={56}
              style={{ borderRadius: "50%", marginRight: 20 }}
            />
          )}
          <span style={{ color: "#f2f3f5", fontSize: 30, fontWeight: 700 }}>
            {authorName}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            color: "#dbdee1",
            fontSize: 30,
            lineHeight: 1.4,
          }}
        >
          {truncated}
        </div>
      </div>
    ),
    { width: 700, height: 380 },
  );

  return image.arrayBuffer();
}
