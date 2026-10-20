import React from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import useIndentRecord from './useIndentRecord';
import IndentRecordDesktopView from './IndentRecordDesktopView';
import IndentRecordMobileView from './IndentRecordMobileView';

const IndentRecordPage = () => {
    const isMobile = useIsMobile(768);
    const recordState = useIndentRecord();

    return isMobile ? (
        <IndentRecordMobileView {...recordState} />
    ) : (
        <IndentRecordDesktopView {...recordState} />
    );
};

export default IndentRecordPage;
