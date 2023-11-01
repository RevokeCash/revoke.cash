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
        fontFamily: 'Futura Condensed Bold',
        fontSize: 80,
        color: 'white',
        textShadow: [0, 1, 2, 3, 4, 5, 6]
          .flatMap((x) =>
            [0, 1, 2, 3, 4, 5, 6].flatMap((y) => [
              `${x}px ${y}px black`,
              `${x}px -${y}px black`,
              `-${x}px ${y}px black`,
              `-${x}px -${y}px black`,
            ]),
          )
          .join(', '),
      }}
    >
      {children}
    </div>
  );
};

export default OgHeaderText;
