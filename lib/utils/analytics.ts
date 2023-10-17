import { init as amplitudeInit, track as amplitudeTrack } from '@amplitude/analytics-browser';
import mixpanel from 'mixpanel-browser';

export const init = () => {
  amplitudeInit(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY, null, {
    trackingOptions: {
      ipAddress: false,
    },
  });

  mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_API_KEY, {
    ip: false,
  });
};

export const track = (eventName: string, eventProperties: any) => {
  amplitudeTrack(eventName, eventProperties);
  mixpanel.track(eventName, eventProperties);
};
