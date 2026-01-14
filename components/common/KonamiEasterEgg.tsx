'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface Props {
  onClose: () => void;
}

/**
 * Easter egg component that displays a celebration animation when the Konami code is entered
 * Features:
 * - Animated checkmark with bounce and pulse effects
 * - Floating emoji particles
 * - Auto-closes after 8 seconds
 * - Can be manually closed by clicking anywhere or pressing Escape
 */
const KonamiEasterEgg = ({ onClose }: Props) => {
  const t = useTranslations();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    setIsVisible(true);

    // Auto-close after 8 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Wait for fade out animation
    }, 8000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={() => {
        setIsVisible(false);
        setTimeout(onClose, 500);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setIsVisible(false);
          setTimeout(onClose, 500);
        }
      }}
    >
      <div className="relative flex flex-col items-center gap-6 p-8">
        {/* Animated Logo */}
        <div
          className={`transform transition-all duration-1000 ${
            isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
          }`}
        >
          <div className="animate-bounce">
            <svg
              className="h-32 w-32 drop-shadow-2xl animate-pulse"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Celebration checkmark"
            >
              <title>Celebration checkmark</title>
              <circle cx="50" cy="50" r="45" fill="#FF6B35" />
              <path
                d="M30 45 L45 60 L70 35"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-draw"
              />
            </svg>
          </div>
        </div>

        {/* Celebration Text */}
        <div
          className={`text-center transition-all duration-1000 delay-300 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <h2 className="text-4xl font-bold text-white mb-2 animate-pulse">🎉 {t('common.easter_egg.title')} 🎉</h2>
          <p className="text-xl text-white/90">{t('common.easter_egg.message')}</p>
          <p className="text-sm text-white/70 mt-4">{t('common.easter_egg.hint')}</p>
        </div>

        {/* Floating emojis */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {['🚀', '⭐', '🎊', '🎈', '✨', '🎯', '💎', '🔥'].map((emoji) => (
            <div
              key={emoji}
              className="absolute text-4xl animate-float"
              style={{
                left: `${emoji.codePointAt(0)! % 100}%`,
                top: `${(emoji.codePointAt(0)! * 13) % 100}%`,
                animationDelay: `${(emoji.codePointAt(0)! % 10) * 0.3}s`,
                animationDuration: `${3 + (emoji.codePointAt(0)! % 3)}s`,
              }}
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translateY(-100px) rotate(180deg);
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes draw {
          0% {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dasharray: 100;
            stroke-dashoffset: 0;
          }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        .animate-draw {
          animation: draw 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default KonamiEasterEgg;
