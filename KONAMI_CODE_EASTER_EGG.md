# Konami Code Easter Egg 🎮

## Overview

A fun and interactive Easter egg feature that activates when users enter the famous Konami Code on the website!

## The Konami Code

Press the following sequence on any page:

```
↑ ↑ ↓ ↓ ← → ← → B A
```

## What Happens?

When the code is successfully entered, users are treated to:

- 🎉 **Celebration Animation**: A beautiful overlay with an animated checkmark
- ✨ **Floating Emojis**: Various celebratory emojis float across the screen
- 🎨 **Smooth Transitions**: Fade-in and fade-out effects for a polished experience
- 🔊 **Message**: A fun message encouraging users to stay safe and keep revoking!

## Technical Implementation

### Components

1. **`useKonamiCode` Hook** (`lib/hooks/useKonamiCode.tsx`)
   - Custom React hook that listens for keyboard input
   - Tracks the last 10 keys pressed
   - Compares against the Konami code sequence
   - Calls a callback function when the code matches

2. **`KonamiEasterEgg` Component** (`components/common/KonamiEasterEgg.tsx`)
   - Client-side component that displays the celebration
   - Features:
     - Auto-closes after 8 seconds
     - Can be manually closed by clicking or pressing Escape
     - Animated SVG checkmark with bounce and pulse effects
     - Floating emoji particles with staggered animations
   - Uses Tailwind CSS for styling and animations

3. **`KonamiCodeListener` Component** (`components/common/KonamiCodeListener.tsx`)
   - Wrapper component that manages the Easter egg state
   - Listens for the Konami code and shows the celebration

### Integration

The Easter egg is integrated into the main layout (`app/[locale]/layout.tsx`), making it available on every page of the website without impacting the main application logic.

### Internationalization

The Easter egg messages are localized and can be translated to other languages:
- `common.easter_egg.title`: "Konami Code Activated"
- `common.easter_egg.message`: "You found the secret! Stay safe and keep revoking! 🛡️"
- `common.easter_egg.hint`: "Click anywhere to close"

## Benefits

1. **User Engagement**: Adds a playful element that rewards curious users
2. **Brand Personality**: Shows the human side of Revoke.cash
3. **Viral Potential**: Easter eggs are often shared on social media
4. **Zero Impact**: Doesn't affect performance or main functionality
5. **Accessibility**: Can be closed with keyboard (Escape) or mouse clicks

## Future Enhancements

Possible improvements for the future:
- Add sound effects when activated
- Include different variations based on holidays or special events
- Track activation analytics (with user consent)
- Add more Easter eggs with different key combinations
- Integrate with Web3 features (e.g., show NFT collectibles)

## Testing

To test the Easter egg:
1. Navigate to any page on the site
2. Use your keyboard arrow keys to enter: ↑ ↑ ↓ ↓ ← → ← → B A
3. The celebration overlay should appear
4. Wait 8 seconds for auto-close or click/press Escape to close manually

---

**Built with ❤️ for the Revoke.cash community!**
