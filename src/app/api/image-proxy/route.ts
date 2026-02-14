import { NextRequest } from "next/server";

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !isHttpUrl(url)) {
    return new Response("invalid url", { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "tarie-image-proxy",
      },
      cache: "force-cache",
    });

    if (!upstream.ok) {
      return new Response("upstream error", { status: 502 });
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const body = await upstream.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return new Response("fetch failed", { status: 502 });
  }
}
