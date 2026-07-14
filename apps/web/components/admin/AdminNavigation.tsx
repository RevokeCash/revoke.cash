'use client';

import NavigationTab from 'components/common/NavigationTab';
import NavigationTabs from 'components/common/NavigationTabs';

const AdminNavigation = () => (
  <NavigationTabs>
    <NavigationTab name="Overview" href="/admin" />
    <NavigationTab name="Subscriptions" href="/admin/subscriptions" matchNestedRoutes />
    <NavigationTab name="Activity" href="/admin/activity" matchNestedRoutes />
    <NavigationTab name="Revenue" href="/admin/revenue" matchNestedRoutes />
    <NavigationTab name="Executor" href="/admin/executor" matchNestedRoutes />
    <NavigationTab name="Lookup" href="/admin/lookup" matchNestedRoutes />
  </NavigationTabs>
);

export default AdminNavigation;
