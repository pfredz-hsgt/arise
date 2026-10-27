import React, { useState, useEffect, useMemo } from 'react';
import {
    Table,
    Spin,
    DatePicker,
    Select,
    Input,
    Tag,
    Button,
    Tooltip
} from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons'
import {
    History,
    FileSpreadsheet,
    Eye,
    Calendar,
    Search,
    User,
    ClipboardList,
    Zap,
    CheckCircle2,
    Clock,
    Layers,
    ChevronDown,
    ChevronRight,
    Sparkles,
    Package
} from 'lucide-react';
import { api } from '../../lib/api';
import { getUnitColor } from '../../lib/colorMappings';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

// Generates two-letter initials for user avatar chip
const getInitials = (name) => {
    if (!name) return 'US';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

// Subcomponent to lazy load items for a given session when expanded
const ExpandedItemsTable = ({ sessionId, adhocItems, debouncedSearch }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const displayItems = useMemo(() => {
        if (!debouncedSearch) return items;
        const lowerSearch = debouncedSearch.toLowerCase();
        return items.filter(item =>
            item.inventory_items?.name?.toLowerCase().includes(lowerSearch)
        );
    }, [items, debouncedSearch]);

    useEffect(() => {
        if (adhocItems) {
            setItems(adhocItems);
            setLoading(false);
            return;
        }

        const fetchItems = async () => {
            try {
                const data = await api.get(`/indent_items?session_id=${sessionId}`);
                if (data) setItems(data);
            } catch (err) {
                console.error('Failed to fetch session items', err);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [sessionId, adhocItems]);

    if (loading) {
        return (
            <div style={{ padding: '20px 24px', textAlign: 'center', background: '#f8fafc', borderRadius: 8 }}>
                <Spin size="small" />
                <span style={{ marginLeft: 8, fontSize: '12px', color: '#64748b' }}>Loading session items...</span>
            </div>
        );
    }

    if (displayItems.length === 0) {
        return (
            <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 8, textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                No items recorded in this session.
            </div>
        );
    }

    return (
        <div style={{
            background: '#ffffff',
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            margin: '-18px 0 0px 0'
        }}>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '-1px' }}>
                <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>ITEM NAME ({displayItems.length})</th>
                        <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 700, color: '#64748b', textAlign: 'center', width: 110 }}>MAX STOCK</th>
                        <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 700, color: '#64748b', textAlign: 'center', width: 110 }}>BALANCE</th>
                        <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 700, color: '#64748b', textAlign: 'center', width: 130 }}>REQUESTED QTY</th>
                        <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 700, color: '#64748b', width: 220 }}>REMARKS</th>
                    </tr>
                </thead>
                <tbody>
                    {displayItems.map((item, idx) => (
                        <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 16px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                                    {item.inventory_items?.name || 'Unknown Item'}
                                </div>
                            </td>
                            <td style={{ padding: '10px 16px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', color: '#475569' }}>
                                {item.snapshot_max_qty !== null && item.snapshot_max_qty !== undefined ? item.snapshot_max_qty : '—'}
                            </td>
                            <td style={{ padding: '10px 16px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', color: '#475569' }}>
                                {item.snapshot_balance !== null && item.snapshot_balance !== undefined ? item.snapshot_balance : '—'}
                            </td>
                            <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '2px 10px',
                                    borderRadius: 6,
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    border: '1px solid #bfdbfe',
                                    fontWeight: 800,
                                    fontSize: '14px',
                                    fontFamily: "'JetBrains Mono', monospace"
                                }}>
                                    {item.requested_qty}
                                </span>
                            </td>
                            <td style={{ padding: '10px 16px', fontSize: '12px', color: item.indent_remarks ? '#334155' : '#94a3b8', fontStyle: item.indent_remarks ? 'normal' : 'italic' }}>
                                {item.indent_remarks || 'No remarks'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const IndentRecordDesktopView = ({
    unit = 'OPD',
    loading,
    users = [],
    setDateRange,
    setSelectedUser,
    setSearchText,
    debouncedSearch,
    expandedRowKeys,
    setExpandedRowKeys,
    selectedRowKeys = [],
    setSelectedRowKeys,
    exporting,
    currentPage = 1,
    pageSize = 10,
    handlePageChange,
    filteredSessions = [],
    processPDFExport,
    exportToExcel
}) => {
    // Telemetry computations
    const telemetry = useMemo(() => {
        let routineCount = 0;
        let urgentCount = 0;
        let totalItems = 0;

        filteredSessions.forEach(s => {
            if (s.isAdhocRequests) {
                urgentCount++;
                totalItems += s.items?.length || 0;
            } else {
                routineCount++;
                totalItems += s.indent_items?.length || 0;
            }
        });

        return {
            totalSessions: filteredSessions.length,
            routineCount,
            urgentCount,
            totalItems
        };
    }, [filteredSessions]);

    const columns = [
        {
            title: 'DATE & TIME',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            render: (text, record) => {
                const itemCount = record.isAdhocRequests
                    ? record.items?.length || 0
                    : record.indent_items?.length || 0;

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={14} color="#0284c7" />
                            <span style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#0f172a',
                                fontFamily: "'JetBrains Mono', monospace"
                            }}>
                                {dayjs(text).format('DD/MM/YYYY HH:mm')}
                            </span>
                        </div>
                        <span style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#64748b',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                        }}>
                            <Package size={11} />
                            {itemCount} {itemCount === 1 ? 'item' : 'items'} in session
                        </span>
                    </div>
                );
            },
            sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
        },
        {
            title: 'INDENTER',
            dataIndex: ['profiles', 'name'],
            key: 'indenter',
            width: 280,
            render: (name) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#475569'
                    }}>
                        {getInitials(name)}
                    </div>
                    <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#1e293b' }}>
                        {name || 'Unknown'}
                    </span>
                </div>
            )
        },
        {
            title: 'INDENT TYPE',
            dataIndex: 'session_type',
            key: 'type',
            width: 160,
            render: (type, record) => {
                const isRoutine = !record.isAdhocRequests && type !== 'Urgent Indent';
                return (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '11.5px',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: 6,
                        background: isRoutine ? '#eff6ff' : '#fffbeb',
                        color: isRoutine ? '#1d4ed8' : '#b45309',
                        border: `1px solid ${isRoutine ? '#bfdbfe' : '#fde68a'}`
                    }}>
                        {isRoutine ? <ClipboardList size={12} strokeWidth={2.4} /> : <Zap size={12} strokeWidth={2.4} />}
                        {isRoutine ? 'Routine Indent' : 'Urgent Indent'}
                    </span>
                );
            }
        },
        {
            title: 'SHELF (RAK)',
            dataIndex: 'rak',
            key: 'rak',
            width: 130,
            render: text => text ? (
                <span style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 5,
                    background: '#f8fafc',
                    color: '#334155',
                    border: '1px solid #cbd5e1'
                }}>
                    Rak: {text}
                </span>
            ) : <span style={{ color: '#cbd5e1' }}>—</span>
        },
        {
            title: 'STATUS',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            render: status => {
                const isApproved = status === 'Approved';
                return (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '11.5px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: isApproved ? '#ecfdf5' : '#eff6ff',
                        color: isApproved ? '#059669' : '#1d4ed8',
                        border: `1px solid ${isApproved ? '#a7f3d0' : '#bfdbfe'}`
                    }}>
                        {isApproved ? <CheckCircle2 size={12} strokeWidth={2.4} /> : <Clock size={12} strokeWidth={2.4} />}
                        {status || 'Submitted'}
                    </span>
                );
            }
        }
    ];

    const expandedRowRender = (record) => {
        if (record.isAdhocRequests) {
            return (
                <ExpandedItemsTable
                    adhocItems={record.items}
                    debouncedSearch={debouncedSearch}
                />
            );
        }
        return (
            <ExpandedItemsTable
                sessionId={record.id}
                debouncedSearch={debouncedSearch}
            />
        );
    };

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header Block */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        border: '1px solid #bbf7d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#16a34a',
                        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.15)'
                    }}>
                        <History size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h1 style={{
                                margin: 0,
                                fontSize: '20px',
                                fontWeight: 800,
                                color: '#0f172a',
                                fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                                letterSpacing: '-0.3px'
                            }}>
                                Indent Records History
                            </h1>
                            <Tag
                                color={getUnitColor(unit)}
                                style={{
                                    margin: 0,
                                    fontWeight: 700,
                                    fontSize: '11px',
                                    borderRadius: 6,
                                    padding: '2px 8px',
                                    border: 'none',
                                    textTransform: 'uppercase'
                                }}
                            >
                                {unit}
                            </Tag>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', marginTop: 2 }}>
                            Archived records of routine and urgent indents for {unit} Pharmacy.
                        </p>
                    </div>
                </div>

                {/* Primary Export Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {selectedRowKeys.length > 0 && (
                        <span style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#6366f1',
                            background: '#e0e7ff',
                            padding: '4px 10px',
                            borderRadius: 6
                        }}>
                            {selectedRowKeys.length} indent {selectedRowKeys.length === 1 ? '' : 's'} selected
                        </span>
                    )}

                    <Tooltip title={selectedRowKeys.length === 0 ? "Select at least one indent via checkbox" : "Preview Kew.PS-8 PDF"}>
                        <Button
                            icon={<Eye size={15} strokeWidth={2.2} />}
                            onClick={() => processPDFExport('preview')}
                            disabled={selectedRowKeys.length === 0}
                            style={{
                                height: 40,
                                borderRadius: 9,
                                padding: '0 16px',
                                fontWeight: 600,
                                fontSize: '13px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: selectedRowKeys.length === 0 ? '#f1f5f9' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                                borderColor: selectedRowKeys.length === 0 ? '#e2e8f0' : '#6d28d9',
                                color: selectedRowKeys.length === 0 ? '#94a3b8' : '#ffffff',
                                boxShadow: selectedRowKeys.length === 0 ? 'none' : '0 2px 6px rgba(124, 58, 237, 0.25)'
                            }}
                        >
                            Preview Kew.PS-8
                        </Button>
                    </Tooltip>

                    <Tooltip title={selectedRowKeys.length === 0 ? "Select sessions via checkbox to export" : "Export selected sessions to Excel"}>
                        <Button
                            type="primary"
                            icon={<FileSpreadsheet size={15} strokeWidth={2.2} />}
                            onClick={exportToExcel}
                            disabled={selectedRowKeys.length === 0}
                            loading={exporting}
                            style={{
                                height: 40,
                                borderRadius: 9,
                                padding: '0 18px',
                                fontWeight: 600,
                                fontSize: '13px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: selectedRowKeys.length === 0 ? '#f1f5f9' : '#107c41',
                                borderColor: selectedRowKeys.length === 0 ? '#e2e8f0' : '#107c41',
                                color: selectedRowKeys.length === 0 ? '#94a3b8' : '#ffffff',
                                boxShadow: selectedRowKeys.length === 0 ? 'none' : '0 2px 6px rgba(16, 124, 65, 0.2)'
                            }}
                        >
                            Export Excel
                        </Button>
                    </Tooltip>
                </div>
            </div>

            {/* Metric KPI Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14
            }}>
                <div style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    padding: '16px 18px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14
                }}>
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0284c7',
                        flexShrink: 0
                    }}>
                        <History size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Total Indent Sessions
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginTop: 2 }}>
                            {telemetry.totalSessions}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>
                            Recorded for {unit}
                        </div>
                    </div>
                </div>

                <div style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    padding: '16px 18px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14
                }}>
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2563eb',
                        flexShrink: 0
                    }}>
                        <ClipboardList size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Routine Indent
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginTop: 2 }}>
                            {telemetry.routineCount}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>
                            sessions
                        </div>
                    </div>
                </div>

                <div style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    padding: '16px 18px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14
                }}>
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#d97706',
                        flexShrink: 0
                    }}>
                        <Zap size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Urgent Indent
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginTop: 2 }}>
                            {telemetry.urgentCount}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>
                            urgent requests
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Toolbar Card */}
            <div style={{
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                padding: '16px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 14,
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1, minWidth: 320 }}>
                    <Input
                        placeholder="Search by medication name in session..."
                        prefix={<Search size={15} color="#94a3b8" style={{ marginRight: 6 }} />}
                        allowClear
                        onChange={e => setSearchText(e.target.value)}
                        style={{ maxWidth: 300, height: 38, borderRadius: 8, borderColor: '#cbd5e1' }}
                    />

                    <RangePicker
                        placeholder={['Start date', 'End date']}
                        onChange={dates => setDateRange(dates)}
                        style={{ height: 38, borderRadius: 8, borderColor: '#cbd5e1' }}
                    />

                    <Select
                        style={{ width: 180, height: 38 }}
                        allowClear
                        placeholder="Filter by Indenter"
                        onChange={v => setSelectedUser(v)}
                    >
                        {users.map(u => (
                            <Select.Option key={u.id} value={u.name}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <User size={13} color="#64748b" />
                                    <span>{u.name}</span>
                                </div>
                            </Select.Option>
                        ))}
                    </Select>
                </div>

                <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Showing <strong style={{ color: '#0f172a' }}>{filteredSessions.length}</strong> recorded sessions
                </div>
            </div>

            {/* Main Indent Sessions Table */}
            <div style={{
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                overflow: 'hidden'
            }}>
                <Table
                    rowSelection={{
                        selectedRowKeys,
                        onChange: newSelectedRowKeys => setSelectedRowKeys(newSelectedRowKeys),
                    }}
                    columns={columns}
                    dataSource={filteredSessions}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: filteredSessions.length,
                        onChange: handlePageChange,
                        showSizeChanger: true,
                        showTotal: total => `Total ${total} sessions`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        style: { padding: '12px 20px', margin: 0 }
                    }}
                    expandable={{
                        expandedRowRender,
                        expandedRowKeys,
                        onExpandedRowsChange: keys => setExpandedRowKeys(keys),

                    }}
                    // --- ADDED ONROW HANDLER ---
                    onRow={(record) => ({
                        onClick: (event) => {
                            // Standard JavaScript syntax (no TypeScript type casting)
                            const target = event.target;

                            // 1. Safe Check: Ignore if clicking checkbox, buttons, or action links
                            if (
                                target.closest('.ant-table-selection-column') ||
                                target.closest('.ant-checkbox-wrapper') ||
                                ['BUTTON', 'A', 'INPUT'].includes(target.tagName) ||
                                target.closest('button')
                            ) {
                                return;
                            }

                            // 2. Toggle the row key inside your expandedRowKeys state array
                            const isExpanded = expandedRowKeys.includes(record.id);
                            const newKeys = isExpanded
                                ? expandedRowKeys.filter((key) => key !== record.id)
                                : [...expandedRowKeys, record.id];

                            setExpandedRowKeys(newKeys);
                        },
                        style: { cursor: 'pointer' },
                    })}

                    // ---------------------------
                    scroll={{ x: 1000 }}
                    locale={{
                        emptyText: (
                            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                                <div style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 14,
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#94a3b8',
                                    marginBottom: 12
                                }}>
                                    <Sparkles size={24} />
                                </div>
                                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
                                    No indent records found
                                </h3>
                                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 auto', maxWidth: 400 }}>
                                    Try modifying your search filter or selecting a different date range.
                                </p>
                            </div>
                        )
                    }}
                />
            </div>

            <style>{`
                .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    color: #475569 !important;
                    font-size: 11.5px !important;
                    font-weight: 700 !important;
                    letter-spacing: 0.5px !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    padding: 12px 14px !important;
                    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
                }
                .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 12px 14px !important;
                }
            `}</style>
        </div>
    );
};

export default IndentRecordDesktopView;
