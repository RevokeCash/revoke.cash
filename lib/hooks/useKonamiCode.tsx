import { useEffect, useState } from 'react';

/**
 * Konami Code sequence: ↑↑↓↓←→←→BA
 * The famous cheat code from Konami games
 */
const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

/**
 * Custom React hook that detects when the user enters the Konami code
 * @param callback - Function to call when the Konami code is successfully entered
 */
export const useKonamiCode = (callback: () => void) => {
  const [keys, setKeys] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setKeys((prevKeys) => {
        const newKeys = [...prevKeys, event.key];
        const recentKeys = newKeys.slice(-KONAMI_CODE.length);

        // Check if the recent keys match the Konami code
        const isMatch = KONAMI_CODE.every((key, index) => key === recentKeys[index]);

        if (isMatch) {
          callback();
          return []; // Reset after successful match
        }

        return recentKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [callback]);
};
