import TimeAgo from 'components/common/TimeAgo';

interface Props {
  timestamp: string | Date | null;
  fallback?: string;
}

const TimeAgoCell = ({ timestamp, fallback = '-' }: Props) => {
  if (!timestamp) return <span className="text-zinc-500">{fallback}</span>;
  return <TimeAgo datetime={timestamp} />;
};

export default TimeAgoCell;
