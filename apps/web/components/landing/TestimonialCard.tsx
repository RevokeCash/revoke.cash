import Href from 'components/common/Href';
import Image from 'next/image';
import { twMerge } from 'tailwind-merge';
import type { TranslatedTestimonial } from './testimonials-data';

interface Props {
  testimonial: TranslatedTestimonial;
}

const TestimonialCard = ({ testimonial }: Props) => {
  const className = twMerge(
    'flex h-full flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5',
    'transition bg-white dark:bg-zinc-900 hover:border-brand/50 dark:hover:border-brand/40',
  );

  return (
    <Href href={testimonial.tweetUrl} external underline="none" className={className}>
      <div className="flex items-center gap-3">
        <Image
          src={testimonial.avatar}
          alt={testimonial.name}
          width={40}
          height={40}
          className="rounded-full"
          unoptimized
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{testimonial.name}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{testimonial.handle}</span>
        </div>
        <XLogo className="ml-auto h-4 w-4 shrink-0 self-start text-zinc-300 dark:text-zinc-600" />
      </div>
      <p className="whitespace-pre-line text-sm leading-6 text-zinc-800 dark:text-zinc-200">
        {testimonial.quote}
        {/* Invisible spacer sized to the carousel's avatar controls: it shares the last line of the quote
            when there is room, and otherwise wraps so the text never runs underneath the controls */}
        <span aria-hidden="true" className="inline-block align-top h-6 w-28" />
      </p>
    </Href>
  );
};

const XLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
  </svg>
);

export default TestimonialCard;
