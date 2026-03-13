'use client';

import farcasterSdk from '@farcaster/miniapp-sdk';

interface Props {
  allowances?: any[];
}

const FarcasterShareButton = ({ allowances }: Props) => {
  const handleShare = async () => {
    if (!(await farcasterSdk.isInMiniApp())) {
      // Fallback to web share
      const text = 'Just checked my wallet security with @revoke! Check yours at https://revoke.cash';
      window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`, '_blank');
      return;
    }

    try {
      const riskCount =
        allowances?.filter((a) => a.payload?.spenderData?.riskFactors && a.payload.spenderData.riskFactors.length > 0)
          .length || 0;
      const text =
        riskCount > 0
          ? `⚠️ Found ${riskCount} risky token approvals in my wallet! Checking wallet security with @revoke 🔐\n\nCheck yours: https://revoke.cash`
          : '✅ My wallet is secure! No risky token approvals found. Checked with @revoke 🔐\n\nCheck yours: https://revoke.cash';

      await farcasterSdk.actions.composeCast({
        text,
        embeds: ['https://revoke.cash'],
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 1000 1000" aria-hidden="true">
        <title>Farcaster icon</title>
        <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z" />
        <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.444H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z" />
        <path d="M693.333 746.667C681.06 746.667 671.111 756.616 671.111 768.889V795.556H666.667C654.394 795.556 644.444 805.505 644.444 817.778V844.444H893.333V817.778C893.333 805.505 883.384 795.556 871.111 795.556H866.667V768.889C866.667 756.616 856.717 746.667 844.444 746.667V351.111H868.889L897.778 253.333H720V746.667H693.333Z" />
      </svg>
      Share on Farcaster
    </button>
  );
};

export default FarcasterShareButton;
