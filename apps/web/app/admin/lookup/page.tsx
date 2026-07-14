import LookupSearch from 'components/admin/lookup/LookupSearch';

const AdminLookupPage = () => (
  <div className="flex flex-col gap-6">
    <LookupSearch />
    <p className="text-sm text-zinc-600 dark:text-zinc-400">
      Look up an address to inspect its subscription coverage, auto-revoke permissions, rules, indexing health and
      activity.
    </p>
  </div>
);

export default AdminLookupPage;
