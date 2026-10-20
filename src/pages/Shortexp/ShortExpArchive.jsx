import React from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import useShortExpArchive from './useShortExpArchive';
import ShortExpArchiveDesktopView from './ShortExpArchiveDesktopView';
import ShortExpArchiveMobileView from './ShortExpArchiveMobileView';

const ShortExpArchive = () => {
    const isMobile = useIsMobile(768);
    const archiveState = useShortExpArchive();

    return isMobile ? (
        <ShortExpArchiveMobileView {...archiveState} />
    ) : (
        <ShortExpArchiveDesktopView {...archiveState} />
    );
};

export default ShortExpArchive;
