'use client';

// timeago.js locales must be registered before rendering relative times, so we do it here
// once instead of in every consumer; always use this component instead of timeago-react
import 'lib/i18n/timeago';

export { default } from 'timeago-react';
