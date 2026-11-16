import { addCrispEvent, type CrispEventColor } from 'lib/utils/crisp';
import mixpanel from 'mixpanel-browser';

interface TrackOptions {
  // Also adds the event to the timeline of the user's Crisp chat, which support sees once the user opens the chat
  crisp?: boolean;
  crispColor?: CrispEventColor;
}

const analytics = {
  isInitialized: false,
  init() {
    if (this.isInitialized) return;
    const apiKey = process.env.NEXT_PUBLIC_MIXPANEL_API_KEY;
    if (apiKey && typeof window !== 'undefined') {
      mixpanel.init(apiKey, { ip: false, api_host: 'https://api-eu.mixpanel.com' });
      this.isInitialized = true;
    }
  },

  track(eventName: string, eventProperties?: Record<string, any>, options?: TrackOptions) {
    if (options?.crisp) addCrispEvent(eventName, eventProperties ?? {}, options.crispColor);

    if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_MIXPANEL_API_KEY) return;
    if (!this.isInitialized) {
      this.init();
    }

    mixpanel.track(eventName, eventProperties);
  },
};

export default analytics;
