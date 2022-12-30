import Button from 'components/common/Button';

interface Props {
  to: string;
  text: string;
}

const NavLink = ({ to, text }: Props) => {
  return (
    <Button href={to} size="none" style="tertiary" className="text-lg" router>
      {text}
    </Button>
  );
};

export default NavLink;
