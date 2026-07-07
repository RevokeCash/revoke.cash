import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { PlanCard } from '../../components/PlanCard';
import { riseIn } from '../../motion';

// Simplified for video: plan, price, one differentiator. Ultimate carries the brand treatment as
// the announcement's flagship; the full feature matrix lives on the pricing page.
export const PricingScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill className="items-center justify-center gap-20 bg-black">
      <div className="flex flex-col items-center gap-6">
        <h1 className="font-heading text-8xl font-semibold tracking-tight text-white" style={riseIn(frame, fps, 0)}>
          Choose your <span className="text-brand">protection.</span>
        </h1>
        <p className="text-4xl text-zinc-400" style={riseIn(frame, fps, 12)}>
          Everything you use today stays free.
        </p>
      </div>
      <div className="flex items-stretch gap-8">
        <PlanCard name="Free" price="$0" tagline="Inspect & revoke. Always free." style={riseIn(frame, fps, 20)} />
        <PlanCard
          name="Premium"
          price="$99"
          note="/year · 10 wallets"
          tagline="Every chain in one dashboard."
          badge={{ label: 'Most Popular', className: 'bg-zinc-100 text-zinc-900' }}
          style={riseIn(frame, fps, 32)}
        />
        <PlanCard
          name="Ultimate"
          price="$199"
          note="/year · 10 wallets"
          tagline="Auto-revokes threats for you."
          badge={{ label: 'Best Protection', className: 'bg-brand text-zinc-900' }}
          className="border-brand/70"
          style={riseIn(frame, fps, 44)}
        />
      </div>
    </AbsoluteFill>
  );
};
