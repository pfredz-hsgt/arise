import React from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import useRoutineSummary from './useRoutineSummary';
import RoutineSummaryDesktopView from './RoutineSummaryDesktopView';
import RoutineSummaryMobileView from './RoutineSummaryMobileView';

/**
 * RoutineSummaryPage Component
 * 
 * Thin coordinator component that:
 * - Shares 100% of summary session data loading, item updating, and final submission via `useRoutineSummary`
 * - Detects viewport breakpoint (768px) via `useIsMobile`
 * - Renders touch-optimized Ant Design Mobile view (`RoutineSummaryMobileView`) on mobile
 * - Renders standard Ant Design desktop view (`RoutineSummaryDesktopView`) on desktop/tablet
 */
const RoutineSummaryPage = () => {
    const isMobile = useIsMobile(768);
    const summaryState = useRoutineSummary();

    return isMobile ? (
        <RoutineSummaryMobileView {...summaryState} />
    ) : (
        <RoutineSummaryDesktopView {...summaryState} />
    );
};

export default RoutineSummaryPage;
