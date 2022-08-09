import { CHROME_EXTENSION_URL, FIREFOX_EXTENSION_URL } from 'components/common/constants';
import DownloadButton from 'components/common/DownloadButton';
import Heading from 'components/common/Heading';
import Logo from 'components/common/Logo';
import { NextPage } from 'next';
import Image from 'next/image';
import React from 'react';
import 'react-toastify/dist/ReactToastify.css';

const Extension: NextPage = () => {
  return (
    <div
      style={{
        textAlign: 'left',
        fontSize: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '800px',
        margin: 'auto',
      }}
    >
      <div>
        <Heading text="Revoke.cash Browser Extension" type="h4" />
        In many cases, phishing websites try to make you sign an allowance while they pretend to be an NFT mint or other
        legitimate use cases. When these phishing scams happen, it is recommended to use Revoke.cash to mitigate the
        damage, but it is even better to prevent the scam in the first place.
      </div>

      <div>
        This is where the Revoke.cash Browser Extension comes in. The extension pops up whenever you are about to sign
        an allowance and will inform you of the allowance details. This can help you prevent signing malicious
        allowances.
      </div>

      <div>
        <Image src="/assets/images/extension-screenshot-1.png" height="800" width="1280" />
      </div>

      <div>
        The Revoke.cash browser extension works with every EVM-based network such as Ethereum, Avalanche or Polygon,
        including chains that are not supported on the Revoke.cash website.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
        <DownloadButton href={CHROME_EXTENSION_URL}>
          <Logo src="/assets/images/vendor/chrome.png" alt="Chrome Logo" />
          <Logo src="/assets/images/vendor/brave.png" alt="Brave Logo" />
          <Logo src="/assets/images/vendor/edge.png" alt="Edge Logo" />
        </DownloadButton>
        <DownloadButton href={FIREFOX_EXTENSION_URL}>
          <Logo src="/assets/images/vendor/firefox.png" alt="Firefox Logo" />
        </DownloadButton>
      </div>
    </div>
  );
};

export default Extension;
