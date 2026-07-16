// ip=0 disables IP geolocation, matching the frontend client's `ip: false`
const MIXPANEL_TRACK_URL = 'https://api-eu.mixpanel.com/track?ip=0';

// Server-side counterpart of the frontend Mixpanel client, for events that must not depend on the
// user's browser (adblockers, closed tabs). Deduplicated by insertId when provided.
export const trackServerEvent = async (
  eventName: string,
  distinctId: string,
  properties: Record<string, unknown>,
  insertId?: string,
): Promise<void> => {
  const token = process.env.MIXPANEL_API_KEY ?? process.env.NEXT_PUBLIC_MIXPANEL_API_KEY;
  if (!token) return;

  const event = {
    event: eventName,
    properties: {
      token,
      time: Date.now(),
      distinct_id: distinctId,
      ...(insertId ? { $insert_id: insertId } : {}),
      ...properties,
    },
  };

  try {
    await fetch(MIXPANEL_TRACK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([event]),
      signal: AbortSignal.timeout(2_000),
    });
  } catch {
    // Analytics must never break the calling flow
  }
};
