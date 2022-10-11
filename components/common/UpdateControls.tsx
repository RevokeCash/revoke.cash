import useTranslation from 'next-translate/useTranslation';
import { useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';

interface Props {
  update: (newAllowance: string) => Promise<void>;
  disabled: boolean;
}

const UpdateControls = ({ disabled, update }: Props) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>('0');

  return (
    <InputGroup size="sm">
      <Form.Control
        type="text"
        size="sm"
        className="NewAllowance"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
      />
      <InputGroup.Append>
        <Button disabled={disabled} className="UpdateButton" onClick={() => update(value)}>
          {t('common:buttons.update')}
        </Button>
      </InputGroup.Append>
    </InputGroup>
  );
};

export default UpdateControls;
