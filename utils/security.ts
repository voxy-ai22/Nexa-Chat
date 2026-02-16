
/**
 * Simple obfuscation / string encoding to hide sensitive strings from plain-text scrapers
 */
export const obfuscate = (str: string): string => btoa(str);
export const deobfuscate = (str: string): string => atob(str);

/**
 * Anti-Debug Logic
 */
export const initAntiDebug = () => {
  if (typeof window === 'undefined') return;

  const threshold = 160;
  const check = () => {
    const isDevToolsOpen = 
      window.outerWidth - window.innerWidth > threshold || 
      window.outerHeight - window.innerHeight > threshold;
    
    if (isDevToolsOpen) {
      console.warn("NEXA Security: Debugging is restricted.");
      // Optional: stop execution or reload
    }
  };

  window.addEventListener('resize', check);
  
  // Periodically check using debugger trap
  setInterval(() => {
    const startTime = performance.now();
    debugger;
    const endTime = performance.now();
    if (endTime - startTime > 100) {
      // User caught in debugger
      console.error("Access Denied");
    }
  }, 2000);
};

/**
 * Basic Hash for temporary tokens (CSRF)
 */
export const generateToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
