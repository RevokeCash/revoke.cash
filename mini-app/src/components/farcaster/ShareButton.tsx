import { sdk } from '@farcaster/frame-sdk';
import Button from '../common/MobileButton';

interface ShareButtonProps {
  text: string;
  style?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const ShareButton = ({ text, style = 'primary', size = 'md', children }: ShareButtonProps) => {
  const handleShare = async () => {
    try {
      if (sdk && sdk.actions && sdk.actions.openUrl) {
        const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
        await sdk.actions.openUrl(shareUrl);
      } else {
        if (navigator.share) {
          await navigator.share({ text });
        } else {
          await navigator.clipboard.writeText(text);
        }
      }
    } catch (error) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (clipboardError) {
        console.error('Failed to share or copy to clipboard:', clipboardError);
      }
    }
  };

  return (
    <Button onClick={handleShare} style={style} size={size}>
      {children}
    </Button>
  );
};
