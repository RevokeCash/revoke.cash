'use client';

import Card from 'components/common/Card';
import { useTranslations } from 'next-intl';

const InfoPanel = () => {
  const t = useTranslations();

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{t('address.delegations.info_panel.title')}</h2>
        <p>{t('address.delegations.info_panel.description')}</p>
        <div className="flex flex-col gap-2">
          <h3 className="text-md font-semibold">{t('address.delegations.info_panel.what_are_delegations')}</h3>
          <ul className="list-disc list-inside">
            <li>{t('address.delegations.info_panel.delegations_explanation_1')}</li>
            <li>{t('address.delegations.info_panel.delegations_explanation_2')}</li>
            <li>{t('address.delegations.info_panel.delegations_explanation_3')}</li>
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-md font-semibold">{t('address.delegations.info_panel.why_revoke')}</h3>
          <ul className="list-disc list-inside">
            <li>{t('address.delegations.info_panel.revoke_reason_1')}</li>
            <li>{t('address.delegations.info_panel.revoke_reason_2')}</li>
            <li>{t('address.delegations.info_panel.revoke_reason_3')}</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default InfoPanel;
