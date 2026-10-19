import React from 'react';
import useIsMobile from '../hooks/useIsMobile';
import useShortExp from './useShortExp';
import ShortExpDesktopModal from './ShortExpDesktopModal';
import ShortExpMobilePopup from './ShortExpMobilePopup';

/**
 * ShortExpModal Component
 * 
 * Thin coordinator component that:
 * - Shares 100% of the short expiry batch fetching, editing, and saving logic via `useShortExp`
 * - Detects viewport breakpoint (768px) via `useIsMobile`
 * - Renders touch-optimized slide-up bottom sheet (`ShortExpMobilePopup`) on mobile
 * - Renders standard Ant Design modal (`ShortExpDesktopModal`) on desktop/tablet
 */
const ShortExpModal = ({ isOpen, onClose, selectedItem }) => {
    const isMobile = useIsMobile(768);
    const shortExpState = useShortExp({ isOpen, onClose, selectedItem });

    if (!isOpen) return null;

    return isMobile ? (
        <ShortExpMobilePopup
            isOpen={isOpen}
            onClose={onClose}
            selectedItem={selectedItem}
            {...shortExpState}
        />
    ) : (
        <ShortExpDesktopModal
            isOpen={isOpen}
            onClose={onClose}
            selectedItem={selectedItem}
            {...shortExpState}
        />
    );
};

export default ShortExpModal;
