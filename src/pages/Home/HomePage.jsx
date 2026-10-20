import React from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import useHomePage from './useHomePage';
import HomeDesktopView from './HomeDesktopView';
import HomeMobileView from './HomeMobileView';

/**
 * HomePage Component
 * 
 * Thin coordinator component that:
 * - Shares 100% of the shelf loading, active draft detection, and session startup logic via `useHomePage`
 * - Detects viewport breakpoint (768px) via `useIsMobile`
 * - Renders touch-optimized Ant Design Mobile view (`HomeMobileView`) on mobile with bottom TabBar
 * - Renders standard Ant Design desktop view (`HomeDesktopView`) on desktop/tablet
 */
const HomePage = () => {
    const isMobile = useIsMobile(768);
    const homeState = useHomePage();

    return isMobile ? (
        <HomeMobileView {...homeState} />
    ) : (
        <HomeDesktopView {...homeState} />
    );
};

export default HomePage;
