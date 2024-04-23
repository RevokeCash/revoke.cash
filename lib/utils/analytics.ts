export const init = () => {};

export const track = (eventName: string, eventProperties: any) => {
  if (typeof window === 'undefined') return;

  (window as any)?.sa_event(eventName, eventProperties);
};
