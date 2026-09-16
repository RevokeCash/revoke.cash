import { AbsoluteFill, Img, staticFile } from 'remotion';
import { montserratFontFamily } from '../fonts';

// Static 16:9 graphic announcing support for a new network, extracted from the "Revoke Network Support"
// Figma template (frame "16:9 Network Support Post", 1600x900). Positions and sizes are the template's.
// Left: a rounded panel bleeding off the left edge with a screenshot of the dashboard on the new network.
// Right: revoke wordmark, "x", the network's wordmark, and "NOW LIVE".
// Capture the screenshot at 2x with Remotion's own headless Chrome (an address with a full table looks best):
//   node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell \
//     --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=1280,1400 \
//     --virtual-time-budget=60000 --screenshot=public/images/network-support/<network>-screenshot.png \
//     "http://localhost:3000/address/<address>?chainId=<chainId>"
// Render with: yarn still NetworkSupport out/<network>-network-support.png --scale=2 [--props='{...}']

// A type alias rather than an interface: Remotion's Still props must satisfy
// Record<string, unknown>, which interfaces do not (no implicit index signature).
export type NetworkSupportGraphicProps = {
  // Wordmark of the new network, ideally white on transparent, centered in the 491x113 logo slot
  networkLogo: string;
  // Rendered width of the wordmark; the slot width (491) is the template's maximum, squat wordmarks look better narrower
  networkLogoWidth: number;
  // Screenshot of the dashboard on the new network, 1280px wide (CSS pixels, any device scale)
  screenshot: string;
  // How many CSS pixels to crop from the top of the screenshot, so the panel starts at the address card
  screenshotCropTop: number;
};

const FRAME_WIDTH = 1600;
const FRAME_HEIGHT = 900;
const SCREENSHOT_WIDTH = 1280;
const PANEL = { left: -260, top: 99, width: 954, height: 702, radius: 36 };
const LOGO_SLOT = { left: 899, top: 459, width: 491, height: 113 };

export const NetworkSupportGraphic = ({
  networkLogo,
  networkLogoWidth,
  screenshot,
  screenshotCropTop,
}: NetworkSupportGraphicProps) => {
  const screenshotScale = PANEL.width / SCREENSHOT_WIDTH;

  return (
    <AbsoluteFill style={{ backgroundColor: '#232120', width: FRAME_WIDTH }}>
      {/* The template's "BG pattern" image layer, exported from Figma clipped to the frame with its 90% fill opacity baked in */}
      <Img
        src={staticFile('images/network-support/bg-pattern.png')}
        alt=""
        style={{ position: 'absolute', left: 0, top: 0, width: FRAME_WIDTH, height: FRAME_HEIGHT }}
      />
      <div
        style={{
          position: 'absolute',
          left: PANEL.left,
          top: PANEL.top,
          width: PANEL.width,
          height: PANEL.height,
          borderRadius: PANEL.radius,
          overflow: 'hidden',
          backgroundColor: '#D9D9D9',
        }}
      >
        <Img
          src={staticFile(screenshot)}
          alt=""
          style={{ position: 'absolute', left: 0, top: -screenshotCropTop * screenshotScale, width: PANEL.width }}
        />
      </div>
      <Img
        src={staticFile('images/revoke-wordmark-orange.svg')}
        alt="Revoke"
        style={{ position: 'absolute', left: 890, top: 181, width: 509, height: 117 }}
      />
      <div
        style={{
          position: 'absolute',
          left: 1123,
          top: 357,
          width: 44,
          height: 43,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: montserratFontFamily,
          fontWeight: 700,
          fontSize: 82,
          lineHeight: 1,
          color: '#FFFFFF',
        }}
      >
        x
      </div>
      <div
        style={{
          position: 'absolute',
          left: LOGO_SLOT.left,
          top: LOGO_SLOT.top,
          width: LOGO_SLOT.width,
          height: LOGO_SLOT.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Img src={staticFile(networkLogo)} alt="" style={{ width: networkLogoWidth, height: 'auto' }} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1044,
          top: 699,
          width: 202,
          height: 50,
          fontFamily: montserratFontFamily,
          fontWeight: 600,
          fontSize: 35,
          color: '#FDB952',
          whiteSpace: 'nowrap',
        }}
      >
        NOW LIVE
      </div>
    </AbsoluteFill>
  );
};
