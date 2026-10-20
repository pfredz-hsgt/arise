import React from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import useShortExpEntry from './useShortExpEntry';
import ShortExpEntryDesktopView from './ShortExpEntryDesktopView';
import ShortExpEntryMobileView from './ShortExpEntryMobileView';

const ShortExpEntry = () => {
    const isMobile = useIsMobile(768);
    const entryState = useShortExpEntry();

    return isMobile ? (
        <ShortExpEntryMobileView {...entryState} />
    ) : (
        <ShortExpEntryDesktopView {...entryState} />
    );
};

export default ShortExpEntry;
