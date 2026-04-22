'use client';

import Toggle from 'components/common/Toggle';

interface Props {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

const AutoRevokeRuleToggle = ({ label, description, enabled, onToggle, disabled = false, children }: Props) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
        </div>
        <Toggle checked={enabled} onChange={onToggle} disabled={disabled} />
      </div>
      {enabled && children && <div className="pl-1">{children}</div>}
    </div>
  );
};

export default AutoRevokeRuleToggle;
