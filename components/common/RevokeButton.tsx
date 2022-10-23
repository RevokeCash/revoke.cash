import { Button } from 'react-bootstrap';

interface Props {
  revoke: () => Promise<void>;
  disabled: boolean;
}

const RevokeButton = ({ disabled, revoke }: Props) => (
  <Button size="sm" disabled={disabled} className="RevokeButton" onClick={revoke}>
    Revoke
  </Button>
);

export default RevokeButton;
