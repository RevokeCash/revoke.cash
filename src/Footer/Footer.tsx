import React from "react";
import { ToastContainer } from "react-toastify";

const Footer: React.FC = () => (
  <div style={{ padding: '20px' }}>
    <p>Site created by <a href="https://twitter.com/RoscoKalis">Rosco Kalis</a> (<a href="https://github.com/rkalis/revoke.cash">Source Code</a>)</p>
    <p>Learn more: <a href="https://kalis.me/unlimited-erc20-allowances/">Unlimited ERC20 allowances considered harmful</a></p>
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
