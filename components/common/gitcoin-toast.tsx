import React from 'react';
import { toast } from 'react-toastify';

export const displayGitcoinToast = () => {
  // const toastContent = (
  //   <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
  //     <div>
  //       Hello friend! <span role="img" aria-label="wave">👋</span>
  //     </div>

  //     <div>
  //      Gitcoin Grants Round 12 is now live with over $2M in donation matching!
  //      Please consider supporting Revoke.cash by donating to the <a href="https://gitcoin.co/grants/259/rosco-kalis-crypto-software-engineer" target="_blank" rel="noopener noreferrer" style={{ color: 'red' }}>Revoke.cash grant</a>
  //     </div>
  //   </div>
  // )

  // Check that launch has happened + disable on small screens / mobile
  if (window.innerWidth > 800 && Math.round(Date.now() / 1000) > 1652720400) {
    const toastContent = (
      <div style={{ display: "flex", flexDirection: 'column', gap: '10px' }}>
        <div>
          My dad and I just launched our generative art project "Imperfections". Check it out on the Art Blocks website or on Twitter (link in footer).
        </div>
        <img src="/artblocks.jpeg" style={{ width: '100%' }} />
      </div>
    )

    toast.info(toastContent, {
      position: "top-left",
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    })
  }
}
