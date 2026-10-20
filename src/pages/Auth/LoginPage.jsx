import React from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import useLoginPage from './useLoginPage';
import LoginDesktopView from './LoginDesktopView';
import LoginMobileView from './LoginMobileView';

/**
 * LoginPage Component
 * 
 * Thin coordinator component following the "Share Logic, Split the View" pattern:
 * - Detects viewport breakpoint (768px) via `useIsMobile`
 * - Shares authentication and reset password logic via `useLoginPage`
 * - Renders touch-optimized mobile view (`LoginMobileView`) on mobile viewports
 * - Renders glassmorphic card view (`LoginDesktopView`) on desktop/tablet
 */
const LoginPage = () => {
    const isMobile = useIsMobile(768);
    const loginState = useLoginPage();

    return isMobile ? (
        <LoginMobileView {...loginState} />
    ) : (
        <LoginDesktopView {...loginState} />
    );
};

export default LoginPage;
