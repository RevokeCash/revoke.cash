import { useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';

interface Props {
  update: (newAllowance: string) => Promise<void>;
  disabled: boolean;
}

const UpdateControls = ({ disabled, update }: Props) => {
  const [value, setValue] = useState<string>('0');

  let inputGroup = (
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
          Update
        </Button>
      </InputGroup.Append>
    </InputGroup>
  );

  return inputGroup;
};

export default UpdateControls;
