import { getChainName } from '@revoke.cash/core/chains';
import { CRISP_WEBSITE_ID } from '@revoke.cash/core/constants';
import { isNullish } from '@revoke.cash/core/utils';
import { Crisp, type EventsColors } from 'crisp-sdk-web';

// Events wait in sessionStorage until the user opens the chat, so Crisp only receives data from users who chat with us
const PENDING_EVENTS_STORAGE_KEY = 'crisp_pending_events';
const MAX_PENDING_EVENTS = 10;
const MAX_EVENT_VALUE_LENGTH = 300;

type CrispEventData = Record<string, string | number | null | undefined>;
type CrispEventColor = 'blue' | 'green' | 'orange' | 'red';

interface CrispEvent {
  name: string;
  data: Record<string, string | number>;
  color: CrispEventColor;
}

export const addCrispEvent = (name: string, data: CrispEventData, color: CrispEventColor = 'blue') => {
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

const formatEventData = (data: CrispEventData): Record<string, string | number> => {
  return Object.fromEntries(
    Object.entries(data)
      .filter((entry): entry is [string, string | number] => !isNullish(entry[1]))
      .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, MAX_EVENT_VALUE_LENGTH) : value]),
  );
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
