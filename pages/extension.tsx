import { EXTENSION_URL } from 'components/common/constants';
import Heading from 'components/common/Heading';
import LogoLink from 'components/common/LogoLink';
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
        <Heading text="Revoke.cash Browser Extension" type="h2" />
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
        <Image src="/extension-screenshot-1.png" height="800" width="1280" />
      </div>

      <div>
        The Revoke.cash browser extension works with every EVM-based network such as Ethereum, Avalanche or Polygon,
        including chains that are not supported on the Revoke.cash website.
      </div>

      <div>
        <Heading text="Supported Browsers" type="h2" />
        The Revoke.cash browser extension is available for Chrome, Brave, Edge and other Chromium-based browsers through
        the{' '}
        <a href={EXTENSION_URL} target="_blank">
          Chrome Web Store
        </a>
        . Support for other browsers such as Firefox and Safari may be added in the future.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
        <LogoLink src="/logos/chrome.png" alt="Chrome Download Link" href={EXTENSION_URL} size={64} />
        <LogoLink src="/logos/brave.png" alt="Brave Download Link" href={EXTENSION_URL} size={64} />
        <LogoLink src="/logos/edge.png" alt="Edge Download Link" href={EXTENSION_URL} size={64} />
        {/* <LogoLink src="/logos/firefox.png" alt="Firefox Download Link" href="todo" size={64} />
        <LogoLink src="/logos/safari.png" alt="Safari Download Link" href="todo" size={64} /> */}
      </div>
    </div>
  );
};

export default Extension;
