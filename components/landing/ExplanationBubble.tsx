import LandingParagraph from './LandingParagraph';

interface Props {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const ExplanationBubble = ({ title, icon, children }: Props) => {
  return (
    <div className="flex items-start gap-2 bg-white text-zinc-900 dark:bg-black dark:text-zinc-100 rounded-lg py-6 px-4 max-w-xs md:basis-96">
      {icon && <div>{icon}</div>}
      <LandingParagraph title={title} className="text-sm">
        {children}
      </LandingParagraph>
    </div>
  );
};

export default ExplanationBubble;
