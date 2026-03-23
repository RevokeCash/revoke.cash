import Href from 'components/common/Href';
import Image from 'next/image';
import { twMerge } from 'tailwind-merge';
import type { Testimonial } from './testimonials-data';

interface Props {
  testimonial: Testimonial;
}

const TestimonialCard = ({ testimonial }: Props) => {
  const className = twMerge(
    'flex h-full flex-col justify-between rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5',
    'transition-colors bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800',
  );

  return (
    <Href href={testimonial.tweetUrl} external underline="none" className={className}>
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400 italic">"{testimonial.quote}"</p>
      <div className="mt-3 flex items-center gap-3">
        <Image
          src={testimonial.avatar}
          alt={testimonial.name}
          width={32}
          height={32}
          className="rounded-full"
          unoptimized
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{testimonial.name}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{testimonial.handle}</span>
        </div>
      </div>
    </Href>
  );
};

export default TestimonialCard;
