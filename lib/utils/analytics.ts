// import mixpanel from 'mixpanel';

export const init = () => {
  // if (process.env.NEXT_PUBLIC_MIXPANEL_API_KEY) {
  //   mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_API_KEY, { geolocate: false });
  // }
};

export const track = (eventName: string, eventProperties: any) => {
  // if (process.env.NEXT_PUBLIC_MIXPANEL_API_KEY) {
  //   mixpanel.track(eventName, eventProperties);
  // }
  if (typeof window === 'undefined') return;

  (window as any)?.sa_event(eventName, eventProperties);
};
