import React from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import useIndentPage from './useIndentPage';
import IndentDesktopView from './IndentDesktopView';
import IndentMobileView from './IndentMobileView';

/**
 * IndentPage Component (Urgent Indent)
 * 
 * Thin coordinator component that:
 * - Shares 100% of inventory data loading, search, row/source filtering, and pagination via `useIndentPage`
 * - Detects viewport breakpoint (768px) via `useIsMobile`
 * - Renders touch-optimized Ant Design Mobile view (`IndentMobileView`) on mobile
 * - Renders standard Ant Design desktop view (`IndentDesktopView`) on desktop/tablet
 */
const IndentPage = () => {
    const isMobile = useIsMobile(768);
    const indentPageState = useIndentPage();

    return isMobile ? (
        <IndentMobileView {...indentPageState} />
    ) : (
        <IndentDesktopView {...indentPageState} />
    );
};

export default IndentPage;
