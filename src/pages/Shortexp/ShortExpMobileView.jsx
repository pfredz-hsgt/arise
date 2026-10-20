import React, { useState, useMemo, useEffect } from 'react';
import {
    NavBar,
    SearchBar,
    Button,
    Dialog,
    SafeArea,
    SpinLoading,
    ConfigProvider
} from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';
import {
    LeftOutlined,
    CalendarOutlined,
    FileExcelOutlined,
    InboxOutlined,
    PlusOutlined,
    RightOutlined,
    WarningOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getSourceColor, getUnitColor } from '../../lib/colorMappings';

const ShortExpMobileView = ({
    unit,
    user,
    loading,
    drugs,
    filteredDrugs,
    searchQuery,
    setSearchQuery,
    urgencyFilter,
    setUrgencyFilter,
    openEditModal,
    exportToExcel,
    handleArchiveAndClear,
    navigate
}) => {
    // Mobile pagination
    const [page, setPage] = useState(1);
    const pageSize = 15;

    const totalPages = Math.max(1, Math.ceil(filteredDrugs.length / pageSize));
    const paginatedDrugs = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredDrugs.slice(start, start + pageSize);
    }, [filteredDrugs, page, pageSize]);

    // Reset page on search or filter change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, urgencyFilter, filteredDrugs.length]);

    // Count statistics
    const stats = useMemo(() => {
        const today = dayjs().startOf('day');
        let critical = 0;
        let warning = 0;
        drugs.forEach(d => {
            const days = dayjs(d.exp_date).startOf('day').diff(today, 'day');
            if (days < 30) critical++;
            else if (days < 90) warning++;
        });
        return { critical, warning, total: drugs.length };
    }, [drugs]);

    const confirmArchiveAndClear = () => {
        Dialog.confirm({
            title: `Archive & Clear (${unit})`,
            content: `Are you sure you want to archive and clear all ${unit} short expiry records? This action cannot be undone.`,
            confirmText: 'Yes, Archive & Clear',
            cancelText: 'Cancel',
            onConfirm: handleArchiveAndClear
        });
    };

    return (
        <ConfigProvider locale={enUS}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100%',
                    paddingBottom: user?.role === 'Issuer' ? 140 : 130,
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
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '3px 8px',
                                background: getUnitColor(unit),
                                color: '#ffffff',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 700
                            }}>
                                {unit}
                            </span>
                        }

                    >
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                            Short Expiry
                        </span>
                    </NavBar>

                    {/* Search Bar */}
                    <div style={{ padding: '8px 12px', background: '#ffffff' }}>
                        <SearchBar
                            placeholder="Search drug name, batch, or PKU..."
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

                    {/* Filter Pills */}
                    <div
                        style={{
                            padding: '6px 12px 10px 12px',
                            display: 'flex',
                            gap: 8,
                            overflowX: 'auto',
                            whiteSpace: 'nowrap',
                            WebkitOverflowScrolling: 'touch',
                            background: '#ffffff',
                            borderBottom: '1px solid #f1f5f9'
                        }}
                    >
                        {/* All */}
                        <div
                            onClick={() => setUrgencyFilter('all')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 12px',
                                borderRadius: 16,
                                fontSize: 12,
                                fontWeight: 600,
                                background: urgencyFilter === 'all' ? '#1e293b' : '#f1f5f9',
                                color: urgencyFilter === 'all' ? '#ffffff' : '#475569',
                                cursor: 'pointer',
                                flexShrink: 0
                            }}
                        >
                            All ({stats.total})
                        </div>

                        {/* Critical (< 30d) */}
                        <div
                            onClick={() => setUrgencyFilter('critical')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 12px',
                                borderRadius: 16,
                                fontSize: 12,
                                fontWeight: 600,
                                background: urgencyFilter === 'critical' ? '#fee2e2' : '#f8fafc',
                                color: urgencyFilter === 'critical' ? '#dc2626' : '#64748b',
                                border: urgencyFilter === 'critical' ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                                cursor: 'pointer',
                                flexShrink: 0
                            }}
                        >
                            <span
                                style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    background: '#ef4444'
                                }}
                            />
                            Critical &lt;30d ({stats.critical})
                        </div>

                        {/* Upcoming (< 90d) */}
                        <div
                            onClick={() => setUrgencyFilter('warning')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 12px',
                                borderRadius: 16,
                                fontSize: 12,
                                fontWeight: 600,
                                background: urgencyFilter === 'warning' ? '#fef3c7' : '#f8fafc',
                                color: urgencyFilter === 'warning' ? '#b45309' : '#64748b',
                                border: urgencyFilter === 'warning' ? '1px solid #fde68a' : '1px solid #e2e8f0',
                                cursor: 'pointer',
                                flexShrink: 0
                            }}
                        >
                            <span
                                style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    background: '#f59e0b'
                                }}
                            />
                            Upcoming &lt;90d ({stats.warning})
                        </div>
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
                        {filteredDrugs.length} items
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

                {/* Drug Cards List */}
                <div style={{ padding: '0 12px', flex: 1 }}>
                    {loading && drugs.length === 0 ? (
                        <div style={{ padding: '48px 0', textAlign: 'center' }}>
                            <SpinLoading color="primary" />
                            <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>
                                Loading short expiry items...
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
                            <WarningOutlined style={{ fontSize: 36, color: '#94a3b8', marginBottom: 12 }} />
                            <div style={{ fontSize: 15, fontWeight: 600, color: '#334155' }}>
                                No Items Found
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                                {searchQuery || urgencyFilter !== 'all'
                                    ? 'Try adjusting your search query or urgency filter'
                                    : `No short expiry items registered for ${unit}`}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {paginatedDrugs.map(record => {
                                const daysLeft = dayjs(record.exp_date).startOf('day').diff(dayjs().startOf('day'), 'day');
                                const isCritical = daysLeft < 30;
                                const isWarning = daysLeft < 90;

                                const borderColor = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#3b82f6';
                                const daysBadgeBg = isCritical ? '#fee2e2' : isWarning ? '#fef3c7' : '#eff6ff';
                                const daysBadgeColor = isCritical ? '#dc2626' : isWarning ? '#b45309' : '#1d4ed8';

                                return (
                                    <div
                                        key={record.id}
                                        onClick={() => openEditModal(record)}
                                        style={{
                                            background: '#ffffff',
                                            borderRadius: 12,
                                            border: '1px solid #e2e8f0',
                                            borderLeft: `4px solid ${borderColor}`,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                            padding: 12,
                                            cursor: 'pointer',
                                            transition: 'transform 0.15s, box-shadow 0.15s'
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
                                            {record.indent_source && (
                                                <span
                                                    style={{
                                                        fontSize: 10,
                                                        padding: '1px 6px',
                                                        borderRadius: 4,
                                                        background: '#f8fafc',
                                                        color: getSourceColor(record.indent_source) || '#64748b',
                                                        border: '1px solid #e2e8f0'
                                                    }}
                                                >
                                                    {record.indent_source}
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
                                                    <CalendarOutlined style={{ color: borderColor }} />
                                                    {dayjs(record.exp_date).format('DD/MM/YYYY')}
                                                </div>
                                                <span
                                                    style={{
                                                        display: 'inline-block',
                                                        marginTop: 2,
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        padding: '1px 6px',
                                                        borderRadius: 10,
                                                        background: daysBadgeBg,
                                                        color: daysBadgeColor
                                                    }}
                                                >
                                                    {daysLeft} days left
                                                </span>
                                            </div>

                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                                                    Total Qty
                                                </div>
                                                <div style={{ fontSize: 16, fontWeight: 500, color: '#0f172a' }}>
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
                                                    background: '#fffbeb',
                                                    border: '1px solid #fef3c7',
                                                    borderRadius: 6,
                                                    fontSize: 11,
                                                    color: '#92400e'
                                                }}
                                            >
                                                <strong>Remarks:</strong> {record.se_remarks}
                                            </div>
                                        )}

                                        {/* Tap to edit prompt */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                alignItems: 'center',
                                                gap: 3,
                                                marginTop: 8,
                                                fontSize: 11,
                                                color: '#2563eb',
                                                fontWeight: 600
                                            }}
                                        >
                                            Edit batch / details <RightOutlined style={{ fontSize: 9 }} />
                                        </div>
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

                {/* Floating Bottom Action Bar */}
                <div
                    style={{
                        position: 'fixed',
                        bottom: 50,
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
                        {drugs.length} total item{drugs.length === 1 ? '' : 's'}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                            size="small"
                            shape="rounded"
                            onClick={exportToExcel}
                            style={{
                                background: '#15803d',
                                color: '#ffffff',
                                borderColor: '#15803d',
                                fontWeight: 600,
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                            }}
                        >
                            <FileExcelOutlined /> Excel
                        </Button>

                        {user?.role === 'Issuer' && (
                            <Button
                                size="small"
                                shape="rounded"
                                color="danger"
                                onClick={confirmArchiveAndClear}
                                style={{
                                    fontWeight: 600,
                                    fontSize: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                }}
                            >
                                <InboxOutlined /> Archive
                            </Button>
                        )}
                    </div>
                    {/* <SafeArea position="bottom" /> */}
                </div>

                {/* Floating Add / Entry + Button */}
                <div
                    onClick={() => navigate('/shortexp-entry')}
                    role="button"
                    tabIndex={0}
                    aria-label="Add Short Expiry Entry"
                    style={{
                        position: 'fixed',
                        right: 18,
                        bottom: 114,
                        zIndex: 100,
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 20px rgba(22, 119, 255, 0.42), 0 2px 6px rgba(0,0,0,0.12)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        WebkitTapHighlightColor: 'transparent',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        WebkitTouchCallout: 'none',
                    }}
                    onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
                    onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
                    onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    <PlusOutlined style={{ fontSize: 24, fontWeight: 'bold' }} />
                </div>
            </div>
        </ConfigProvider>
    );
};

export default ShortExpMobileView;
