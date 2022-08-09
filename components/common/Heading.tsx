interface Props {
  text: string;
  type?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5';
  center?: boolean;
}

const Heading = ({ text, type, center }: Props) => {
  const style = {
    color: 'black',
    textTransform: 'uppercase',
    fontFamily: 'Futura Condensed',
    fontWeight: 'bold',
    fontStyle: 'oblique',
    textAlign: center ? 'center' : 'left',
  } as const;

  if (type === 'h1') return <h1 style={{ ...style, fontSize: '30px' }}>{text}</h1>;
  if (type === 'h2') return <h2 style={{ ...style, fontSize: '26px' }}>{text}</h2>;
  if (type === 'h3') return <h3 style={{ ...style, fontSize: '22px' }}>{text}</h3>;
  if (type === 'h4') return <h4 style={{ ...style, fontSize: '18px' }}>{text}</h4>;
};

export default Heading;
