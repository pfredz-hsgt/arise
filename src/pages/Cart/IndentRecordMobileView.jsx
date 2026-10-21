import React, { useState, useEffect, useMemo } from 'react';
import {
    NavBar,
    SearchBar,
    Button,
    Checkbox,
    Picker,
    CalendarPicker,
    SafeArea,
    SpinLoading,
    ConfigProvider
} from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';
import {
    LeftOutlined,
    FileExcelOutlined,
    EyeOutlined,
    CalendarOutlined,
    UserOutlined,
    DownOutlined,
    UpOutlined,
    CloseCircleFilled
} from '@ant-design/icons';
import { getUnitColor } from '../../lib/colorMappings';
import { api } from '../../lib/api';
import dayjs from 'dayjs';

// Lazy loader component for session items on mobile if not already embedded
const MobileSessionItems = ({ session, debouncedSearch }) => {
    const [items, setItems] = useState(() => {
        if (session.isAdhocRequests) return session.items || [];
        if (session.indent_items && session.indent_items.length > 0) return session.indent_items;
        return [];
    });
    const [loading, setLoading] = useState(() => {
        if (session.isAdhocRequests) return false;
        if (session.indent_items && session.indent_items.length > 0) return false;
        return true;
    });

    useEffect(() => {
        if (session.isAdhocRequests) {
            setItems(session.items || []);
            setLoading(false);
            return;
        }

        if (session.indent_items && session.indent_items.length > 0) {
            setItems(session.indent_items);
            setLoading(false);
            return;
        }

        let isMounted = true;
        const fetchItems = async () => {
            try {
                const data = await api.get(`/indent_items?session_id=${session.id}`);
                if (isMounted) {
                    setItems(data || []);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to load session items', err);
                if (isMounted) setLoading(false);
            }
        };

        fetchItems();
        return () => {
            isMounted = false;
        };
    }, [session]);

    const displayItems = useMemo(() => {
        if (!debouncedSearch) return items;
        const lower = debouncedSearch.toLowerCase();
        return items.filter(i =>
            i.inventory_items?.name?.toLowerCase().includes(lower)
        );
    }, [items, debouncedSearch]);

    if (loading) {
        return (
            <div style={{ padding: '16px 0', textAlign: 'center' }}>
                <SpinLoading color="primary" style={{ '--size': '20px' }} />
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Loading items...</div>
            </div>
        );
    }

    if (displayItems.length === 0) {
        return (
            <div style={{ padding: '12px 0', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                No matching items in this record
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {displayItems.map((item, idx) => (
                <div
                    key={item.id || idx}
                    style={{
                        padding: '10px 12px',
                        background: '#f8fafc',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 12
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', flex: 1, paddingRight: 8 }}>
                            {item.inventory_items?.name || 'Unknown Drug'}
                        </div>
                        {item.inventory_items?.pku && (
                            <span
                                style={{
                                    fontSize: 10,
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    background: '#fef3c7',
                                    color: '#b45309',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {item.inventory_items.pku}
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, color: '#64748b', fontSize: 11, marginTop: 4 }}>
                        <div>
                            Max: <strong style={{ color: '#334155' }}>{item.snapshot_max_qty !== null && item.snapshot_max_qty !== undefined ? item.snapshot_max_qty : '-'}</strong>
                        </div>
                        <div>
                            Bal: <strong style={{ color: '#334155' }}>{item.snapshot_balance !== null && item.snapshot_balance !== undefined ? item.snapshot_balance : '-'}</strong>
                        </div>
                        <div>
                            Indent Qty: <strong style={{ color: '#2563eb', fontSize: 12 }}>{item.requested_qty}</strong>
                        </div>
                    </div>

                    {item.indent_remarks && (
                        <div style={{ marginTop: 4, fontSize: 11, color: '#d97706', fontStyle: 'italic' }}>
                            Remarks: {item.indent_remarks}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const IndentRecordMobileView = ({
    unit,
    loading,
    users,
    dateRange,
    setDateRange,
    selectedUser,
    setSelectedUser,
    searchText,
    setSearchText,
    debouncedSearch,
    selectedRowKeys,
    exporting,
    filteredSessions,
    previewSingleSessionPDF,
    processPDFExport,
    exportToExcel,
    toggleSelectAll,
    toggleRowSelect,
    navigate
}) => {
    // Expandable card state
    const [expandedIds, setExpandedIds] = useState([]);

    // Pickers visibility
    const [userPickerVisible, setUserPickerVisible] = useState(false);
    const [calendarPickerVisible, setCalendarPickerVisible] = useState(false);
    const [tempDateRange, setTempDateRange] = useState(null);

    // Mobile pagination state
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const totalPages = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
    const paginatedSessions = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredSessions.slice(start, start + pageSize);
    }, [filteredSessions, page, pageSize]);

    // Reset to page 1 on filter changes
    useEffect(() => {
        setPage(1);
    }, [filteredSessions.length, searchText, selectedUser, dateRange]);

    const toggleExpand = (id) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
        );
    };

    // User Picker Options
    const userPickerColumns = useMemo(() => {
        const options = [
            { label: 'All Users', value: '' },
            ...(users || []).map(u => ({ label: u.name, value: u.name }))
        ];
        return [options];
    }, [users]);

    // Quick Date Preset Handler
    const handleDatePreset = (preset) => {
        if (preset === 'all') {
            setDateRange(null);
        } else if (preset === 'today') {
            setDateRange([dayjs().startOf('day'), dayjs().endOf('day')]);
        } else if (preset === 'week') {
            setDateRange([dayjs().subtract(7, 'day').startOf('day'), dayjs().endOf('day')]);
        } else if (preset === 'month') {
            setDateRange([dayjs().startOf('month'), dayjs().endOf('day')]);
        }
    };

    const isAllSelected =
        filteredSessions.length > 0 && selectedRowKeys.length === filteredSessions.length;

    // Active date label
    const dateRangeLabel = useMemo(() => {
        if (!dateRange || !dateRange[0] || !dateRange[1]) return 'All Dates';
        if (dayjs(dateRange[0]).isSame(dateRange[1], 'day')) {
            return dayjs(dateRange[0]).format('DD/MM/YYYY');
        }
        return `${dayjs(dateRange[0]).format('DD/MM')} - ${dayjs(dateRange[1]).format('DD/MM')}`;
    }, [dateRange]);

    // Bounds for calendar picker
    const calendarMin = useMemo(() => {
        const twoYearsAgo = dayjs().subtract(2, 'year').startOf('month');
        if (dateRange && dateRange[0] && dayjs(dateRange[0]).isBefore(twoYearsAgo)) {
            return dayjs(dateRange[0]).startOf('month').toDate();
        }
        return twoYearsAgo.toDate();
    }, [dateRange]);

    return (
        <ConfigProvider locale={enUS}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100%',
                    paddingBottom: selectedRowKeys.length > 0 ? 140 : 80,
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
                            Indent Records
                        </span>
                    </NavBar>

                    {/* Search Bar */}
                    <div style={{ padding: '8px 12px', background: '#ffffff' }}>
                        <SearchBar
                            placeholder="Search item name in records..."
                            value={searchText}
                            onChange={setSearchText}
                            onClear={() => setSearchText('')}
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
                        {/* Indenter User Pill */}
                        <div
                            onClick={() => setUserPickerVisible(true)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 16,
                                fontSize: 12,
                                fontWeight: 500,
                                background: selectedUser ? '#e0e7ff' : '#f1f5f9',
                                color: selectedUser ? '#3730a3' : '#475569',
                                border: selectedUser ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                                cursor: 'pointer',
                                flexShrink: 0
                            }}
                        >
                            <UserOutlined style={{ fontSize: 11 }} />
                            <span>{selectedUser || 'All Users'}</span>
                            {selectedUser && (
                                <CloseCircleFilled
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedUser(null);
                                    }}
                                    style={{ fontSize: 12, color: '#6366f1', marginLeft: 2 }}
                                />
                            )}
                        </div>

                        {/* Date Filter Pill */}
                        <div
                            onClick={() => {
                                setTempDateRange(
                                    dateRange && dateRange[0] && dateRange[1]
                                        ? [dateRange[0].toDate(), dateRange[1].toDate()]
                                        : null
                                );
                                setCalendarPickerVisible(true);
                            }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 16,
                                fontSize: 12,
                                fontWeight: 500,
                                background: dateRange ? '#eff6ff' : '#f1f5f9',
                                color: dateRange ? '#1d4ed8' : '#475569',
                                border: dateRange ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                                cursor: 'pointer',
                                flexShrink: 0
                            }}
                        >
                            <CalendarOutlined style={{ fontSize: 11 }} />
                            <span>{dateRangeLabel}</span>
                            {dateRange && (
                                <CloseCircleFilled
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDateRange(null);
                                    }}
                                    style={{ fontSize: 12, color: '#3b82f6', marginLeft: 2 }}
                                />
                            )}
                        </div>

                        {/* Quick Date Presets */}
                        {!dateRange && (
                            <>
                                <div
                                    onClick={() => handleDatePreset('today')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '4px 10px',
                                        borderRadius: 16,
                                        fontSize: 11,
                                        background: '#f8fafc',
                                        color: '#64748b',
                                        border: '1px solid #e2e8f0',
                                        cursor: 'pointer',
                                        flexShrink: 0
                                    }}
                                >
                                    Today
                                </div>
                                <div
                                    onClick={() => handleDatePreset('week')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '4px 10px',
                                        borderRadius: 16,
                                        fontSize: 11,
                                        background: '#f8fafc',
                                        color: '#64748b',
                                        border: '1px solid #e2e8f0',
                                        cursor: 'pointer',
                                        flexShrink: 0
                                    }}
                                >
                                    7 Days
                                </div>
                                <div
                                    onClick={() => handleDatePreset('month')}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '4px 10px',
                                        borderRadius: 16,
                                        fontSize: 11,
                                        background: '#f8fafc',
                                        color: '#64748b',
                                        border: '1px solid #e2e8f0',
                                        cursor: 'pointer',
                                        flexShrink: 0
                                    }}
                                >
                                    This Month
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Selection & Total Summary Row */}
                <div
                    style={{
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 12,
                        color: '#64748b'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Checkbox
                            checked={isAllSelected}
                            indeterminate={
                                selectedRowKeys.length > 0 &&
                                selectedRowKeys.length < filteredSessions.length
                            }
                            onChange={toggleSelectAll}
                        >
                            <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>
                                Select All
                            </span>
                        </Checkbox>
                        {selectedRowKeys.length > 0 && (
                            <span
                                style={{
                                    background: '#dbeafe',
                                    color: '#1d4ed8',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: 10
                                }}
                            >
                                {selectedRowKeys.length} selected
                            </span>
                        )}
                    </div>

                    <div>
                        {filteredSessions.length} record{filteredSessions.length === 1 ? '' : 's'}
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={{ padding: '0 12px', flex: 1 }}>
                    {loading ? (
                        <div style={{ padding: '40px 0', textAlign: 'center' }}>
                            <SpinLoading color="primary" />
                            <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>
                                Loading indent records...
                            </div>
                        </div>
                    ) : filteredSessions.length === 0 ? (
                        <div
                            style={{
                                padding: '48px 16px',
                                textAlign: 'center',
                                background: '#ffffff',
                                borderRadius: 12,
                                border: '1px dashed #cbd5e1',
                                marginTop: 12
                            }}
                        >
                            <CalendarOutlined style={{ fontSize: 36, color: '#94a3b8', marginBottom: 12 }} />
                            <div style={{ fontSize: 15, fontWeight: 600, color: '#334155' }}>
                                No Records Found
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                                Try adjusting your search query or date/indenter filters
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {paginatedSessions.map((session) => {
                                const isSelected = selectedRowKeys.includes(session.id);
                                const isExpanded = expandedIds.includes(session.id);
                                const itemCount = session.isAdhocRequests
                                    ? session.items?.length || 0
                                    : session.indent_items?.length || 0;

                                const isApproved = session.status === 'Approved';

                                return (
                                    <div
                                        key={session.id}
                                        style={{
                                            background: '#ffffff',
                                            borderRadius: 12,
                                            border: isSelected ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                                            boxShadow: isSelected
                                                ? '0 2px 8px rgba(59, 130, 246, 0.12)'
                                                : '0 1px 3px rgba(0,0,0,0.04)',
                                            padding: 12,
                                            transition: 'border 0.2s, box-shadow 0.2s'
                                        }}
                                    >
                                        {/* Card Top Row: Checkbox + Date + Status */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginBottom: 8
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onChange={() => toggleRowSelect(session.id)}
                                                />
                                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                                    {dayjs(session.created_at).format('DD/MM/YYYY HH:mm')}
                                                </div>
                                            </div>

                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    padding: '2px 8px',
                                                    borderRadius: 12,
                                                    background: isApproved ? '#dcfce7' : '#dbeafe',
                                                    color: isApproved ? '#15803d' : '#1d4ed8',
                                                    border: isApproved ? '1px solid #bbf7d0' : '1px solid #bfdbfe'
                                                }}
                                            >
                                                {session.status}
                                            </span>
                                        </div>

                                        {/* Card Metadata Row */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 6,
                                                alignItems: 'center',
                                                marginBottom: 10,
                                                paddingLeft: 28
                                            }}
                                        >
                                            {/* Indenter Badge */}
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    fontSize: 11,
                                                    padding: '2px 7px',
                                                    background: '#f1f5f9',
                                                    borderRadius: 6,
                                                    color: '#334155',
                                                    fontWeight: 500
                                                }}
                                            >
                                                <UserOutlined style={{ fontSize: 10 }} />
                                                {session.profiles?.name || 'Unknown'}
                                            </span>

                                            {/* Type Badge */}
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    padding: '2px 7px',
                                                    background: session.session_type === 'Urgent Indent' ? '#fff1f2' : '#f0fdf4',
                                                    borderRadius: 6,
                                                    color: session.session_type === 'Urgent Indent' ? '#be123c' : '#15803d',
                                                    fontWeight: 500
                                                }}
                                            >
                                                {session.session_type || 'Routine'}
                                            </span>

                                            {/* Rak if available */}
                                            {session.rak && (
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        padding: '2px 7px',
                                                        background: '#fef3c7',
                                                        borderRadius: 6,
                                                        color: '#b45309',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    Rak: {session.rak}
                                                </span>
                                            )}

                                            {/* Items count badge */}
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    color: '#64748b',
                                                    fontWeight: 500
                                                }}
                                            >
                                                ({itemCount} item{itemCount === 1 ? '' : 's'})
                                            </span>
                                        </div>

                                        {/* Action Bar on Card */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                borderTop: '1px solid #f1f5f9',
                                                paddingTop: 8,
                                                paddingLeft: 28
                                            }}
                                        >
                                            <div
                                                onClick={() => toggleExpand(session.id)}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: '#2563eb',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {isExpanded ? (
                                                    <>Hide Items <UpOutlined style={{ fontSize: 10 }} /></>
                                                ) : (
                                                    <>View Items ({itemCount}) <DownOutlined style={{ fontSize: 10 }} /></>
                                                )}
                                            </div>

                                            <Button
                                                size="mini"
                                                shape="rounded"
                                                onClick={() => previewSingleSessionPDF(session)}
                                                style={{
                                                    borderColor: '#c084fc',
                                                    color: '#6b21a8',
                                                    background: '#faf5ff',
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    padding: '2px 8px'
                                                }}
                                            >
                                                <EyeOutlined /> Kew.PS-8
                                            </Button>
                                        </div>

                                        {/* Expandable Items List */}
                                        {isExpanded && (
                                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                                                <MobileSessionItems
                                                    session={session}
                                                    debouncedSearch={debouncedSearch}
                                                />
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

                {/* Floating Batch Action Bottom Bar */}
                {selectedRowKeys.length > 0 && (
                    <div
                        style={{
                            position: 'fixed',
                            bottom: 50,
                            left: 0,
                            right: 0,
                            background: '#ffffff',
                            boxShadow: '0 -4px 16px rgba(0,0,0,0.1)',
                            borderTop: '1px solid #e2e8f0',
                            padding: '10px 16px',
                            zIndex: 99,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10
                        }}
                    >
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                            {selectedRowKeys.length} Selected
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                            <Button
                                size="small"
                                shape="rounded"
                                onClick={() => processPDFExport('preview')}
                                style={{
                                    background: '#7c3aed',
                                    color: '#ffffff',
                                    borderColor: '#7c3aed',
                                    fontWeight: 600,
                                    fontSize: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                }}
                            >
                                <EyeOutlined /> Kew.PS-8
                            </Button>

                            <Button
                                size="small"
                                shape="rounded"
                                loading={exporting}
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
                        </div>
                        {/*  <SafeArea position="bottom" />*/}
                    </div>
                )}

                {/* Indenter User Picker */}
                <Picker
                    columns={userPickerColumns}
                    visible={userPickerVisible}
                    onClose={() => setUserPickerVisible(false)}
                    value={selectedUser ? [selectedUser] : ['']}
                    onConfirm={v => {
                        const val = v[0];
                        setSelectedUser(val ? val : null);
                    }}
                    title="Select Indenter"
                />

                {/* Date Range Calendar Picker */}
                <CalendarPicker
                    visible={calendarPickerVisible}
                    onClose={() => setCalendarPickerVisible(false)}
                    selectionMode="range"
                    title="Select Date Range"
                    min={calendarMin}
                    max={new Date()}
                    closeOnMaskClick={true}
                    value={tempDateRange}
                    onChange={val => setTempDateRange(val)}
                    onConfirm={val => {
                        if (val && val[0] && val[1]) {
                            const start = dayjs(val[0]).startOf('day');
                            const end = dayjs(val[1]).endOf('day');
                            setDateRange([start, end]);
                        } else {
                            setDateRange(null);
                        }
                    }}
                />
            </div>
        </ConfigProvider>
    );
};

export default IndentRecordMobileView;
