import { createSharedPathnamesNavigation } from 'next-intl/navigation';

// For *some reason*, Next.js won't compile if we import thesse values from './config', so they're repeated here
const locales = ['en', 'es', 'ja', 'ru', 'zh'] as const;
const localePrefix = 'as-needed' as const; // Default

export const { Link, redirect, usePathname, useRouter } = createSharedPathnamesNavigation({ locales, localePrefix });
