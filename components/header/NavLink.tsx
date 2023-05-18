import Button from 'components/common/Button';
import { useRouter } from 'next/router';
import { twMerge } from 'tailwind-merge';

interface Props {
  to: string;
  text: string;

  className?: string;
}

const NavLink = ({ to, text, className }: Props) => {
  const router = useRouter();

  const currentRootPath = router.asPath.split('/')[1];
  const currentToPath = to.split('/')[1];

  const isCurrent = currentRootPath === currentToPath;

  return (
    <Button
      href={to}
      size="none"
      style="tertiary"
      className={twMerge('text-lg', isCurrent && 'underline underline-offset-8 decoration-2', className)}
      router
    >
      {text}
    </Button>
  );
};

export default NavLink;
