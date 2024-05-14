import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { writeToClipBoard } from 'lib/utils';
import { useTranslations } from 'next-intl';
import Button from './Button';
import WithHoverTooltip from './WithHoverTooltip';

interface Props {
  content: string;
  className?: string;
  tooltip?: string;
}

const CopyButton = ({ content, tooltip, className }: Props) => {
  const t = useTranslations();

  const button = (
    <Button style="none" size="none" onClick={() => writeToClipBoard(content, t)} aria-label="Copy To Clipboard">
      <DocumentDuplicateIcon className={className ?? 'w-4 h-4'} />
    </Button>
  );

  if (tooltip) {
    return <WithHoverTooltip tooltip={tooltip}>{button}</WithHoverTooltip>;
  }

  return button;
};

export default CopyButton;
