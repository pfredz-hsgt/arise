import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if current viewport is below a specific breakpoint (default: 768px).
 * Uses window.matchMedia for performant, listener-driven updates on resize or device rotation.
 * 
 * @param {number} breakpoint - Width in pixels (default 768)
 * @returns {boolean} - true if viewport is mobile width
 */
export const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.innerWidth < breakpoint;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 0.02}px)`);
        
        const updateIsMobile = (e) => {
            setIsMobile(e.matches);
        };

        // Set initial value in case it changed between state init and effect
        setIsMobile(mediaQuery.matches);

        // Modern matchMedia listener with fallback for older browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', updateIsMobile);
            return () => mediaQuery.removeEventListener('change', updateIsMobile);
        } else {
            mediaQuery.addListener(updateIsMobile);
            return () => mediaQuery.removeListener(updateIsMobile);
        }
    }, [breakpoint]);

    return isMobile;
};

export default useIsMobile;
