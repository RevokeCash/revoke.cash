import { useState, useEffect } from "react";
import HeaderLogo from "./HeaderLogo";
import WalletIndicator from "../wallet/WalletIndicator";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "../common/ThemeToggle";

const Header = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is typical tablet breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <header className="flex justify-between items-center gap-8 w-full p-4 lg:px-8 pb-8 relative">
      <div className="flex shrink-0 h-9">
        <HeaderLogo />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {isMobile ? (
          <MobileMenu />
        ) : (
          <WalletIndicator />
        )}
      </div>
    </header>
  );
};

export default Header;