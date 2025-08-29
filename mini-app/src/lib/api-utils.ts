// Override apiLogin for mini-app context to skip login requirement
export const setupMiniAppApiOverrides = () => {
  // Check if we're in the mini-app context
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    // Override the apiLogin to always return true for mini-app
    const originalApiLogin = (window as any).__apiLogin || (() => Promise.resolve(false));
    (window as any).__apiLogin = originalApiLogin;
    
    // Monkey patch the apiLogin import to skip actual login
    const moduleCache = (window as any).__moduleCache || {};
    if (moduleCache['lib/utils']) {
      moduleCache['lib/utils'].apiLogin = () => Promise.resolve(true);
    }
    
    // Also try to patch it via a global override
    (window as any).__skipApiLogin = true;
  }
};