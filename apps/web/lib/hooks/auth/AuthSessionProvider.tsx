'use client';

import type { AuthSession } from 'lib/auth/session';
import { createContext, type ReactNode, useContext } from 'react';

interface Props {
  children: ReactNode;
  initialSession?: AuthSession | null;
}

const AuthSessionContext = createContext<AuthSession | null>(null);

export const AuthSessionProvider = ({ children, initialSession }: Props) => {
  return <AuthSessionContext value={initialSession ?? null}>{children}</AuthSessionContext>;
};

export const useInitialAuthSession = () => {
  return useContext(AuthSessionContext);
};
