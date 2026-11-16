import { getChainName } from '@revoke.cash/core/chains';
import { CRISP_WEBSITE_ID } from '@revoke.cash/core/constants';
import { isNullish } from '@revoke.cash/core/utils';
import { Crisp, type EventsColors } from 'crisp-sdk-web';

// Events wait in sessionStorage until the user opens the chat, so Crisp only receives data from users who chat with us
const PENDING_EVENTS_STORAGE_KEY = 'crisp_pending_events';
const MAX_PENDING_EVENTS = 10;
const MAX_EVENT_VALUE_LENGTH = 300;

export type CrispEventColor = 'blue' | 'green' | 'orange' | 'red';

interface CrispEvent {
  name: string;
  data: Record<string, string | number>;
  color: CrispEventColor;
}

// Use analytics.track() with the crisp option instead, so the event also goes to Mixpanel
export const addCrispEvent = (name: string, data: Record<string, unknown>, color: CrispEventColor = 'blue') => {
  if (isNullish(CRISP_WEBSITE_ID) || typeof window === 'undefined') return;

  // Crisp shows the time it receives an event, which is later than the real time for events that waited
  const event = { name, data: { ...formatEventData(data), time: new Date().toISOString() }, color };

  if (isCrispChatOpened()) {
    pushEvent(event);
    return;
  }

  writePendingEvents([...readPendingEvents(), event].slice(-MAX_PENDING_EVENTS));
};

// The SDK counts Crisp as loaded once it adds the script tag, but $crisp.is only exists after the script has run,
// so calling Crisp.chat.isChatOpened() before that throws
export const isCrispChatOpened = (): boolean => {
  return typeof window !== 'undefined' && typeof window.$crisp?.is === 'function' && Crisp.chat.isChatOpened();
};

export const formatCrispChain = (chainId: number | undefined): string | undefined => {
  return chainId ? `${getChainName(chainId)} (${chainId})` : undefined;
};

export const sendPendingCrispEvents = () => {
  readPendingEvents().forEach(pushEvent);
  writePendingEvents([]);
};

const pushEvent = (event: CrispEvent) => {
  Crisp.session.pushEvent(event.name, event.data, event.color as EventsColors);
};

const formatEventData = (data: Record<string, unknown>): Record<string, string | number> => {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => !isNullish(value))
      .map(([key, value]) => [key, formatEventValue(key, value)]),
  );
};

// Crisp only shows strings and numbers well, and a chain ID is easier to read with the chain name
const formatEventValue = (key: string, value: unknown): string | number => {
  if (key === 'chainId' && typeof value === 'number') return formatCrispChain(value) ?? value;
  if (typeof value === 'number') return value;
  return String(value).slice(0, MAX_EVENT_VALUE_LENGTH);
};

// Storage access throws when the browser blocks site data, and the events are not worth breaking the caller for
const readPendingEvents = (): CrispEvent[] => {
  try {
    return JSON.parse(sessionStorage.getItem(PENDING_EVENTS_STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
};

const writePendingEvents = (events: CrispEvent[]) => {
  try {
    if (events.length === 0) sessionStorage.removeItem(PENDING_EVENTS_STORAGE_KEY);
    else sessionStorage.setItem(PENDING_EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch {}
};
