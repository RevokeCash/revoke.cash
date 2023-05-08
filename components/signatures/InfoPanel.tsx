import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Trans from 'next-translate/Trans';
import DashboardPanel from './DashboardPanel';

const InfoPanel = () => {
  return (
    <DashboardPanel>
      <div className="flex items-center gap-4">
        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500 shrink-0" />
        <div>
          <Trans
            i18nKey="address:signatures.info.description"
            components={[<span className="italic" />, <span className="font-bold" />]}
          />
        </div>
      </div>
    </DashboardPanel>
  );
};

export default InfoPanel;
