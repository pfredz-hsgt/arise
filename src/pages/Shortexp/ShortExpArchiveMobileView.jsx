import React, { useState, useMemo, useEffect } from 'react';
import {
    NavBar,
    SearchBar,
    Button,
    Picker,
    SafeArea,
    SpinLoading,
    ConfigProvider
} from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';
import {
    LeftOutlined,
    CalendarOutlined,
    FileExcelOutlined,
    HistoryOutlined,
    UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getSourceColor, getUnitColor } from '../../lib/colorMappings';

const ShortExpArchiveMobileView = ({
    unit,
    loading,
    drugs,
    filteredDrugs,
    archiveDates,
    selectedDate,
    setSelectedDate,
    searchQuery,
    setSearchQuery,
    exportToExcel,
    navigate
}) => {
    const [datePickerVisible, setDatePickerVisible] = useState(false);

    // Mobile pagination
    const [page, setPage] = useState(1);
    const pageSize = 15;

    const totalPages = Math.max(1, Math.ceil(filteredDrugs.length / pageSize));
    const paginatedDrugs = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredDrugs.slice(start, start + pageSize);
    }, [filteredDrugs, page, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, selectedDate, filteredDrugs.length]);

    // Format dates for picker
    const datePickerColumns = useMemo(() => {
        const options = (archiveDates || []).map(d => ({
            label: dayjs(d).format('DD MMM YYYY'),
            value: d
        }));
        return [options];
    }, [archiveDates]);

    const formattedSelectedDate = useMemo(() => {
        if (!selectedDate) return 'Select Date';
        return dayjs(selectedDate).format('DD MMM YYYY');
    }, [selectedDate]);

    return (
        <ConfigProvider locale={enUS}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100%',
                    paddingBottom: '80px',
                    background: '#f8fafc'
                }}
            >
                {/* Sticky Header */}
                <div
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 20,
                        background: '#ffffff',
                        borderBottom: '1px solid #f0f0f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                >
                    <NavBar
                        backArrow={<LeftOutlined style={{ fontSize: 16 }} />}
                        onBack={() => navigate('/home')}
                        right={
                            <Button
                                size="mini"
                                shape="rounded"
                                onClick={exportToExcel}
                                disabled={drugs.length === 0}
                                style={{
                                    background: drugs.length === 0 ? undefined : '#15803d',
                                    color: drugs.length === 0 ? undefined : '#ffffff',
                                    borderColor: drugs.length === 0 ? undefined : '#15803d',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    padding: '4px 10px'
                                }}
                            >
                                <FileExcelOutlined /> Excel
                            </Button>
                        }
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                                Archive
                            </span>
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: '2px 7px',
                                    background: '#eff6ff',
                                    color: getUnitColor(unit) || '#1677ff',
                                    borderRadius: 10,
                                    border: '1px solid #bfdbfe'
                                }}
                            >
                                {unit}
                            </span>
                        </div>
                    </NavBar>

                    {/* Date Selector Pill & Search Bar */}
                    <div style={{ padding: '8px 12px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Date Picker Trigger Pill */}
                        <div
                            onClick={() => {
                                if (archiveDates.length > 0) setDatePickerVisible(true);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 14px',
                                background: '#f8fafc',
                                borderRadius: 10,
                                border: '1px solid #e2e8f0',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                                <HistoryOutlined style={{ color: '#64748b' }} />
                                <span>Archive Date:</span>
                                <span style={{ color: '#2563eb' }}>{formattedSelectedDate}</span>
                            </div>
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                                Change &gt;
                            </span>
                        </div>

                        {/* Search Bar */}
                        <SearchBar
                            placeholder="Search archived drug, batch, or PKU..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onClear={() => setSearchQuery('')}
                            style={{
                                '--background': '#f1f5f9',
                                '--height': '36px',
                                '--border-radius': '18px',
                                fontSize: 13
                            }}
                        />
                    </div>
                </div>

                {/* Counter Bar */}
                <div
                    style={{
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 12,
                        color: '#64748b'
                    }}
                >
                    <div>
                        Showing <strong style={{ color: '#0f172a' }}>{paginatedDrugs.length}</strong> of{' '}
                        {filteredDrugs.length} archived records
                    </div>
                    {searchQuery && (
                        <div
                            onClick={() => setSearchQuery('')}
                            style={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Clear search
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div style={{ padding: '0 12px', flex: 1 }}>
                    {loading && archiveDates.length === 0 ? (
                        <div style={{ padding: '48px 0', textAlign: 'center' }}>
                            <SpinLoading color="primary" />
                            <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>
                                Loading archived records...
                            </div>
                        </div>
                    ) : filteredDrugs.length === 0 ? (
                        <div
                            style={{
                                padding: '48px 16px',
                                textAlign: 'center',
                                background: '#ffffff',
                                borderRadius: 12,
                                border: '1px dashed #cbd5e1',
                                marginTop: 8
                            }}
                        >
                            <HistoryOutlined style={{ fontSize: 36, color: '#94a3b8', marginBottom: 12 }} />
                            <div style={{ fontSize: 15, fontWeight: 600, color: '#334155' }}>
                                No Archived Records Found
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                                {archiveDates.length === 0
                                    ? `No past short expiry archives recorded for ${unit}`
                                    : 'Try selecting a different archive date or clear the search query'}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {paginatedDrugs.map(record => {
                                return (
                                    <div
                                        key={record.id}
                                        style={{
                                            background: '#ffffff',
                                            borderRadius: 12,
                                            border: '1px solid #e2e8f0',
                                            borderLeft: '4px solid #94a3b8',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                            padding: 12
                                        }}
                                    >
                                        {/* Top Row: Name + Batch */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                gap: 8,
                                                marginBottom: 6
                                            }}
                                        >
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', flex: 1 }}>
                                                {record.name}
                                            </div>
                                            {record.batch_no && (
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        padding: '2px 7px',
                                                        borderRadius: 6,
                                                        background: '#e0f2fe',
                                                        color: '#0369a1',
                                                        border: '1px solid #bae6fd',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    #{record.batch_no}
                                                </span>
                                            )}
                                        </div>

                                        {/* Metadata Tags */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 5,
                                                alignItems: 'center',
                                                marginBottom: 10
                                            }}
                                        >
                                            {record.pku && (
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        fontWeight: 600,
                                                        padding: '1px 6px',
                                                        borderRadius: 4,
                                                        background: '#fef3c7',
                                                        color: '#b45309'
                                                    }}
                                                >
                                                    {record.pku}
                                                </span>
                                            )}
                                            {record.rak && (
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        fontWeight: 500,
                                                        padding: '1px 6px',
                                                        borderRadius: 4,
                                                        background: '#f1f5f9',
                                                        color: '#475569'
                                                    }}
                                                >
                                                    Rak: {record.rak}
                                                </span>
                                            )}
                                            {record.puchase_type && (
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        padding: '1px 6px',
                                                        borderRadius: 4,
                                                        background: '#f0fdf4',
                                                        color: '#16a34a'
                                                    }}
                                                >
                                                    {record.puchase_type}
                                                </span>
                                            )}
                                        </div>

                                        {/* Expiry Date and Total Qty Row */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                background: '#f8fafc',
                                                borderRadius: 8,
                                                padding: '8px 10px',
                                                border: '1px solid #f1f5f9'
                                            }}
                                        >
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#334155', fontWeight: 600 }}>
                                                    <CalendarOutlined style={{ color: '#94a3b8' }} />
                                                    {dayjs(record.exp_date).format('DD/MM/YYYY')}
                                                </div>
                                                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                                                    Archived by: <strong style={{ color: '#334155' }}>{record.archived_by}</strong>
                                                </div>
                                            </div>

                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                                                    Total Qty
                                                </div>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                                                    {record.qty || 0}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Remarks bubble if present */}
                                        {record.se_remarks && (
                                            <div
                                                style={{
                                                    marginTop: 8,
                                                    padding: '6px 10px',
                                                    background: '#fafafa',
                                                    border: '1px solid #f0f0f0',
                                                    borderRadius: 6,
                                                    fontSize: 11,
                                                    color: '#64748b'
                                                }}
                                            >
                                                <strong>Remarks:</strong> {record.se_remarks}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Stepper Pagination */}
                            {totalPages > 1 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 4px',
                                        marginTop: 4
                                    }}
                                >
                                    <Button
                                        size="small"
                                        disabled={page <= 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        style={{ fontSize: 12 }}
                                    >
                                        Prev
                                    </Button>

                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                                        Page {page} of {totalPages}
                                    </div>

                                    <Button
                                        size="small"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        style={{ fontSize: 12 }}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Floating Bottom Bar with Export */}
                <div
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: '#ffffff',
                        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
                        borderTop: '1px solid #e2e8f0',
                        padding: '10px 16px',
                        zIndex: 99,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10
                    }}
                >
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                        {drugs.length} total archived items
                    </div>

                    <Button
                        size="small"
                        shape="rounded"
                        onClick={exportToExcel}
                        disabled={drugs.length === 0}
                        style={{
                            background: drugs.length === 0 ? undefined : '#15803d',
                            color: drugs.length === 0 ? undefined : '#ffffff',
                            borderColor: drugs.length === 0 ? undefined : '#15803d',
                            fontWeight: 600,
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}
                    >
                        <FileExcelOutlined /> Export Excel
                    </Button>
                    <SafeArea position="bottom" />
                </div>

                {/* Date Picker Wheel */}
                <Picker
                    columns={datePickerColumns}
                    visible={datePickerVisible}
                    onClose={() => setDatePickerVisible(false)}
                    value={selectedDate ? [selectedDate] : []}
                    onConfirm={v => {
                        if (v && v[0]) setSelectedDate(v[0]);
                    }}
                    title="Select Archive Date"
                />
            </div>
        </ConfigProvider>
    );
};

export default ShortExpArchiveMobileView;
