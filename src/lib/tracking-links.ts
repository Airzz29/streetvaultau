export type TrackingProvider = "auspost" | "global17";

export function trackingUrl(trackingCode: string, provider: TrackingProvider): string {
  const code = encodeURIComponent(trackingCode.trim());
  if (provider === "auspost") {
    return `https://auspost.com.au/mypost/track/details/${code}`;
  }
  return `https://t.17track.net/en#nums=${code}`;
}

export function trackingProviderForChannel(channel: "local" | "dropship"): TrackingProvider {
  return channel === "local" ? "auspost" : "global17";
}
