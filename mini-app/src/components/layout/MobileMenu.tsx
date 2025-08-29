import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from "react";
import WalletIndicator from "../wallet/WalletIndicator";

const MobileMenu = () => {
  const [open, setOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      // Need a double RAF to ensure the DOM updates with initial state first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before removing from DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match the leave duration
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-transparent border-none cursor-pointer p-1 flex items-center justify-center"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? (
          <XMarkIcon className="h-8 w-8 text-zinc-900 dark:text-zinc-100" />
        ) : (
          <Bars3Icon className="h-8 w-8 text-zinc-900 dark:text-zinc-100" />
        )}
      </button>

      {/* Mobile Menu Panel */}
      {shouldRender && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setOpen(false)}
            className={`fixed inset-0 bg-black/30 dark:bg-black/50 z-40 transition-opacity duration-300 ${
              isAnimating ? 'opacity-100' : 'opacity-0'
            }`}
          />
          
          {/* Menu Panel */}
          <div className={`fixed inset-0 top-16 z-50 overflow-y-auto bg-white dark:bg-black w-screen h-screen
            transition-all ${isAnimating ? 'duration-300 ease-out' : 'duration-300 ease-in'}
            ${isAnimating 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
            }`}>
            <div className="flex flex-col items-center gap-6 p-12">
              <WalletIndicator mobile={true} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileMenu;