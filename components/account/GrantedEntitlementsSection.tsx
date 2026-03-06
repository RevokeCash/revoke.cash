import Card, { CardTitle } from 'components/common/Card';
import Label from 'components/common/Label';
import type { GrantedEntitlement } from 'lib/premium/types';
import { shortenAddress } from 'lib/utils/formatting';

interface Props {
  entitlements: GrantedEntitlement[];
}

const GrantedEntitlementsSection = ({ entitlements }: Props) => {
  return (
    <Card header={<CardTitle title="Granted Premium Access" />} className="flex flex-col gap-2">
      {entitlements.map((entitlement) => (
        <div key={entitlement.ownerAddress} className="flex flex-col gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800 p-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">{entitlement.planName}</span>
            <Label className="bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100">Active</Label>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Granted by {shortenAddress(entitlement.ownerAddress, 4)} · Valid until {entitlement.endsAt.slice(0, 10)}
          </p>
        </div>
      ))}
    </Card>
  );
};

export default GrantedEntitlementsSection;
