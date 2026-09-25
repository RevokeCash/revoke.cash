import type { ReactNode } from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { Pill } from '../components/Pill';
import { headingFontFamily } from '../fonts';

// Static 16:9 tweet graphic for the September 2026 Magic Eden / Limit Break Payment Processor hack:
// the value that wallets still held at the start of the attack after they had revoked their Payment
// Processor approvals (apps/web/scripts/exploits/calculate-exploit-stats.ts, NFTs at floor price,
// two outlier collections left out). Same visual language as the other exploit graphics.
// Render with: yarn still MagicEdenSavedFunds out/magic-eden-saved-funds-tweet.png --scale=2

// A type alias rather than an interface: Remotion's Still props must satisfy
// Record<string, unknown>, which interfaces do not (no implicit index signature).
export type MagicEdenSavedFundsGraphicProps = {
  date: string;
};

export const MagicEdenSavedFundsGraphic = ({ date }: MagicEdenSavedFundsGraphicProps) => {
  return (
    <AbsoluteFill className="bg-[#0F0F0F]">
      <Img src={staticFile('images/cover-template.jpg')} alt="" className="absolute h-full w-full object-cover" />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(100deg, rgba(15, 15, 15, 0.55) 0%, rgba(15, 15, 15, 0.35) 45%, rgba(15, 15, 15, 0.15) 100%)',
        }}
      />
      <AbsoluteFill className="flex flex-col justify-between pt-[60px] pr-[72px] pb-[60px] pl-[104px]">
        <div className="flex items-center justify-between">
          <Img src={staticFile('images/revoke-wordmark-orange.svg')} alt="Revoke" className="h-9" />
          <InfoPill>{date}</InfoPill>
        </div>
        <div className="flex flex-col gap-7">
          <h1
            className="font-semibold text-[92px] text-white"
            style={{ fontFamily: headingFontFamily, letterSpacing: '-3px', lineHeight: 1.06 }}
          >
            Magic Eden hack.
            <br />
            <span className="text-brand">$3.9M saved by revoking.</span>
          </h1>
          <div className="flex items-center gap-3">
            <InfoPill>1,600+ wallets protected</InfoPill>
            <InfoPill>70 Bored Apes</InfoPill>
            <InfoPill>220 WETH</InfoPill>
          </div>
        </div>
        <div className="flex flex-col gap-[22px]">
          <BriefRow icon={<CheckIcon />}>Wallets that revoked before the attack kept their assets</BriefRow>
          <BriefRow icon={<WarningIcon />}>Payment Processor V2 and V3 approvals are still at risk</BriefRow>
          <BriefRow icon={<ArrowIcon />}>Still approved on any chain? Revoke now</BriefRow>
        </div>
        <div className="absolute right-[72px] bottom-[60px]">
          <InfoPill>revoke.cash</InfoPill>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const InfoPill = ({ children }: { children: ReactNode }) => {
  return (
    <Pill className="border border-white/25 bg-white/15 px-[26px] py-[10px] font-bold text-2xl text-white">
      {children}
    </Pill>
  );
};

const BriefRow = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => {
  return (
    <div className="flex items-center gap-5 font-semibold text-[28px] text-white/90">
      {icon}
      <span>{children}</span>
    </div>
  );
};

const WarningIcon = () => (
  <svg className="h-10 w-10 shrink-0" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="19" stroke="#FDB952" strokeWidth="2" />
    <path d="M20 11V23" stroke="#FDB952" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="20" cy="29" r="2.25" fill="#FDB952" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-10 w-10 shrink-0" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="20" fill="#FDB952" />
    <path d="M12 20.5L17.5 26L28 15" stroke="#0F0F0F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowIcon = () => (
  <svg className="h-10 w-10 shrink-0" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="19" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="2" />
    <path
      d="M13 20H27M27 20L21 14M27 20L21 26"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
