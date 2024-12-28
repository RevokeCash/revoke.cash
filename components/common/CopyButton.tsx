'use client';

import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { writeToClipBoard } from 'lib/utils';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import Button from './Button';
import WithHoverTooltip from './WithHoverTooltip';

interface Props {
  content: string;
  className?: string;
  tooltip?: string;
}

const CopyButtonComponent = ({ content, tooltip, className }: Props) => {
  const t = useTranslations();

  //Trying to stabilise onClick
  const handleCopy = () => writeToClipBoard(content, t);

  const button = (
    <Button style="none" size="none" onClick={handleCopy} aria-label="Copy To Clipboard">
      <DocumentDuplicateIcon className={className ?? 'w-4 h-4'} />
    </Button>
  );

  if (tooltip) {
    return <WithHoverTooltip tooltip={tooltip}>{button}</WithHoverTooltip>;
  }

  return button;
};

// Memoize the component to avoid re-renders unless props change
const CopyButton = memo(CopyButtonComponent);

export default CopyButton;
