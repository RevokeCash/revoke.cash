import { redirect } from 'next/navigation';

// This page only catches URLs that are not handled by the i18n middleware (e.g. /api/...), we redirect it to a /404
// page that will get caught by the i18n middleware so we render the correct 404 page. It would be nice if we could
// render the correct 404 page here, but we can't because we don't have the locale information.
const NotFound = () => {
  redirect('/404');
};

export default NotFound;
