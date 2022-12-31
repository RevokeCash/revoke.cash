import LandingParagraph from './LandingParagraph';

interface Props {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const ExplanationBubble = ({ title, icon, children }: Props) => {
  return (
    <div className="flex items-start gap-2 bg-white text-gray-900 dark:bg-black dark:text-gray-100 rounded-lg py-6 px-4 max-w-xs">
      {icon && <div>{icon}</div>}
      <LandingParagraph title={title}>
        <div className="text-sm">{children}</div>
      </LandingParagraph>
    </div>
  );
};

export default ExplanationBubble;
