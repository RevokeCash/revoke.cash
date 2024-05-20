import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  tw?: string;
}

const OgHeaderText = ({ children, tw }: Props) => {
  return (
    <div
      tw={tw}
      style={{
        fontFamily: 'Inter Bold',
        textAlign: 'center',
        fontSize: 56,
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 1)',
        padding: '0.75rem 1.5rem',
        letterSpacing: '-2px',
      }}
    >
      {children}
    </div>
  );
};

export default OgHeaderText;
