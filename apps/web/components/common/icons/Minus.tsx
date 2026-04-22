interface Props {
  className?: string;
}

const Minus = ({ className }: Props) => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M12 8H4" stroke="black" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export default Minus;
