import mixpanel from 'mixpanel-browser';

export const init = () => {
  mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_API_KEY, {
    ip: false,
  });
};

export const track = (eventName: string, eventProperties: any) => {
  mixpanel.track(eventName, eventProperties);
};
