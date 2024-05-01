import mixpanel from 'mixpanel-browser';

export const init = () => {
  if (process.env.NEXT_PUBLIC_MIXPANEL_API_KEY) {
    mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_API_KEY, { ip: false });
  }
};

export const track = (eventName: string, eventProperties: any) => {
  if (typeof window === 'undefined') return;

  if (process.env.NEXT_PUBLIC_MIXPANEL_API_KEY) {
    mixpanel.track(eventName, eventProperties);
  }
};
