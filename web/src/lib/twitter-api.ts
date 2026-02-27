const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

export function resolveJsonPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc !== null && acc !== undefined && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export async function fetchMetricValue(
  endpointPath: string,
  jsonPath: string,
): Promise<number> {
  if (!TWITTER_BEARER_TOKEN) {
    throw new Error("TWITTER_BEARER_TOKEN is not set");
  }

  const url = `https://api.x.com/2/${endpointPath}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TWITTER_BEARER_TOKEN}` },
  });

  if (!res.ok) {
    throw new Error(`X API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const value = resolveJsonPath(data, jsonPath);

  if (typeof value !== "number") {
    throw new Error(`Expected number at ${jsonPath}, got ${typeof value}`);
  }

  return value;
}

export function buildEndpointKey(endpointPath: string, jsonPath: string): string {
  return `${endpointPath}::${jsonPath}`;
}
