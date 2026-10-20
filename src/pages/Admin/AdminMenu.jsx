import React from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import useAdminMenu from './useAdminMenu';
import AdminMenuDesktopView from './AdminMenuDesktopView';
import AdminMenuMobileView from './AdminMenuMobileView';

const AdminMenuPage = () => {
    const isMobile = useIsMobile(768);
    const adminState = useAdminMenu();

    return isMobile ? (
        <AdminMenuMobileView {...adminState} />
    ) : (
        <AdminMenuDesktopView {...adminState} />
    );
};

export default AdminMenuPage;
