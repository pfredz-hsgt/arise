import React from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import useRoutineIndent from './useRoutineIndent';
import RoutineIndentDesktopView from './RoutineIndentDesktopView';
import RoutineIndentMobileView from './RoutineIndentMobileView';

/**
 * RoutineIndentPage Component
 * 
 * Acts as the coordinator / container:
 * - Shares 100% of the state and API logic via `useRoutineIndent`
 * - Uses responsive window width breakpoint via `useIsMobile` (default: 768px)
 * - Renders touch-optimized Ant Design Mobile view on mobile devices
 * - Renders standard Ant Design desktop view on desktop/tablet devices
 */
const RoutineIndentPage = () => {
    const isMobile = useIsMobile(768);
    const indentState = useRoutineIndent();

    return isMobile ? (
        <RoutineIndentMobileView {...indentState} />
    ) : (
        <RoutineIndentDesktopView {...indentState} />
    );
};

export default RoutineIndentPage;
