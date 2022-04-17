import LogoLink from "components/common/LogoLink";
import React from "react";
import { ToastContainer } from "react-toastify";

const Footer: React.FC = () => (
  <div style={{ padding: '20px' }}>
    <p>
      Site created by{' '}
      <a href="https://twitter.com/RoscoKalis">Rosco Kalis</a> / {' '}
      <a href="https://github.com/rkalis/revoke.cash">Source Code</a> / {' '}
      <a href="https://twitter.com/RevokeCash">Official Twitter</a>
    </p>
    <p>Learn more: <a href="https://kalis.me/unlimited-erc20-allowances/">Unlimited ERC20 allowances considered harmful</a></p>
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
      <LogoLink src="/logos/ethereum.png" alt="Ethereum" href="https://ethereum.org/" />
      <LogoLink src="/logos/binance.png" alt="Binance Smart Chain" href="https://www.bnbchain.world/" />
      <LogoLink src="/logos/avalanche.png" alt="Avalanche" href="https://www.avax.network/" />
      <LogoLink src="/logos/polygon.png" alt="Polygon" href="https://polygon.technology/" />
      <LogoLink src="/logos/fantom.png" alt="Fantom" href="https://fantom.foundation/" />
      <LogoLink src="/logos/harmony.png" alt="Harmony" href="https://harmony.one/" />
      <LogoLink src="/logos/klaytn.png" alt="Klaytn" href="https://www.klaytn.com/" />
      <LogoLink src="/logos/arbitrum.svg" alt="Arbitrum" href="https://arbitrum.io/" />
      <LogoLink src="/logos/metis.png" alt="Metis" href="https://www.metis.io/" />
      <LogoLink src="/logos/gnosis-chain.png" alt="Gnosis Chain" href="https://www.xdaichain.com/" />
      <LogoLink src="/logos/rootstock.png" alt="Rootstock" href="https://www.rsk.co/" />
      <LogoLink src="/logos/smartbch.png" alt="SmartBCH" href="https://smartbch.org/" />
      <LogoLink src="/logos/moonbeam.png" alt="Moonbeam" href="https://moonbeam.network/" />
      <LogoLink src="/logos/moonriver.png" alt="Moonriver" href="https://moonbeam.network/networks/moonriver/" />
      <LogoLink src="/logos/telos.png" alt="Telos" href="https://www.telos.net/" />
      <LogoLink src="/logos/fuse.png" alt="Fuse" href="https://fuse.io/" />
      <LogoLink src="/logos/heco.png" alt="HECO" href="https://www.hecochain.com/" />
      <LogoLink src="/logos/iotex.png" alt="IoTeX" href="https://iotex.io/" />
      <LogoLink src="/logos/shiden.svg" alt="Shiden" href="https://shiden.astar.network/" />
      <LogoLink src="/logos/palm.jpeg" alt="Palm" href="https://palm.io/" />
      {/* <LogoLink src="/logos/evmos.png" alt="Evmos" href="https://evmos.org/" /> */}
    </div>
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  </div>
)

export default Footer
