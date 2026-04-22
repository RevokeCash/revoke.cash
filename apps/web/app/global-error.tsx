'use client';

import { parseErrorMessage, stringifyError } from 'lib/utils/errors';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: 24 }}>
          <h1>Unexpected application error</h1>
          <p>{parseErrorMessage(error)}</p>
          <p>{stringifyError(error, 2)}</p>
          <button type="button" onClick={() => reset()}>
            Reload section
          </button>
        </div>
      </body>
    </html>
  );
}
