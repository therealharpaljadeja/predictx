import { NextRequest, NextResponse } from "next/server";

// Server-side cache: tweet ID → username (persists across requests while server is running)
const tweetAuthorCache = new Map<string, string>();

export async function GET(req: NextRequest) {
  const endpointPath = req.nextUrl.searchParams.get("endpointPath");
  if (!endpointPath) {
    return NextResponse.json({ username: null, avatarUrl: null }, { status: 400 });
  }

  // Follower market: extract username directly
  const usernameMatch = endpointPath.match(/users\/by\/username\/([^?]+)/);
  if (usernameMatch) {
    const username = usernameMatch[1];
    return NextResponse.json(
      { username, avatarUrl: `https://unavatar.io/x/${username}` },
      { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } },
    );
  }

  // Tweet market: resolve tweet ID → author username
  const tweetMatch = endpointPath.match(/tweets\/(\d+)/);
  if (tweetMatch) {
    const tweetId = tweetMatch[1];

    // Check server cache first
    if (tweetAuthorCache.has(tweetId)) {
      const username = tweetAuthorCache.get(tweetId)!;
      return NextResponse.json(
        { username, avatarUrl: `https://unavatar.io/x/${username}` },
        { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } },
      );
    }

    // Use Twitter's free oembed API (no auth required)
    try {
      const oembedUrl = `https://publish.twitter.com/oembed?url=https://x.com/i/status/${tweetId}&omit_script=true`;
      const res = await fetch(oembedUrl, { next: { revalidate: 86400 } });

      if (res.ok) {
        const data = await res.json();
        // author_url looks like "https://twitter.com/username"
        const authorMatch = (data.author_url as string)?.match(/twitter\.com\/(\w+)/);
        if (authorMatch) {
          const username = authorMatch[1];
          tweetAuthorCache.set(tweetId, username);
          return NextResponse.json(
            { username, avatarUrl: `https://unavatar.io/x/${username}` },
            { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } },
          );
        }
      }
    } catch {
      // Fall through to null response
    }
  }

  return NextResponse.json({ username: null, avatarUrl: null });
}
