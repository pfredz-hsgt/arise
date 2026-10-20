import React from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import useInventoryTable from './useInventoryTable';
import InventoryDesktopView from './InventoryDesktopView';
import InventoryMobileView from './InventoryMobileView';

/**
 * InventoryTable Coordinator Component
 * 
 * - Shares 100% of the data fetching, lookup values, and CRUD operations via `useInventoryTable`
 * - Detects viewport breakpoint (768px) via `useIsMobile`
 * - Renders touch-optimized Ant Design Mobile view (`InventoryMobileView`) on mobile viewports (< 768px)
 * - Renders full-featured Ant Design table (`InventoryDesktopView`) on desktop viewports (>= 768px)
 */
const InventoryTable = (props) => {
    const isMobile = useIsMobile(768);
    const inventoryState = useInventoryTable();

    return isMobile ? (
        <InventoryMobileView {...inventoryState} {...props} />
    ) : (
        <InventoryDesktopView {...inventoryState} {...props} />
    );
};

export default InventoryTable;
