const HeaderLogo = () => {
  return (
    <a href="/" className="flex no-underline">
      <img
        src="/assets/images/revoke-wordmark-black.svg"
        alt="Revoke.cash logo"
        height="30"
        width="130"
        className="block dark:hidden shrink-0"
      />
      <img
        src="/assets/images/revoke-wordmark-white.svg"
        alt="Revoke.cash logo"
        height="30"
        width="130"
        className="hidden dark:block shrink-0"
      />
    </a>
  );
};

export default HeaderLogo;