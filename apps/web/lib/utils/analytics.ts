import mixpanel from 'mixpanel-browser';

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

  track(eventName: string, eventProperties?: Record<string, any>) {
    if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_MIXPANEL_API_KEY) return;
    if (!this.isInitialized) {
      this.init();
    }

    mixpanel.track(eventName, eventProperties);
  },
};

export default analytics;
