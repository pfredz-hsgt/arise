import React from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import useShortExpPage from './useShortExpPage';
import ShortExpDesktopView from './ShortExpDesktopView';
import ShortExpMobileView from './ShortExpMobileView';
import ShortExpModal from '../../components/ShortExpModal';

const ShortExpPage = () => {
    const isMobile = useIsMobile(768);
    const shortExpState = useShortExpPage();

    return (
        <>
            {isMobile ? (
                <ShortExpMobileView {...shortExpState} />
            ) : (
                <ShortExpDesktopView {...shortExpState} />
            )}

            <ShortExpModal
                isOpen={shortExpState.isEditModalVisible}
                onClose={shortExpState.handleEditModalClose}
                selectedItem={shortExpState.editingItem}
            />
        </>
    );
};

export default ShortExpPage;
