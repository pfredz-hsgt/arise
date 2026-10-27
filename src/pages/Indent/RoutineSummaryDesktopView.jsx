import React, { useState, useMemo } from 'react';
import {
    Typography,
    Table,
    Button,
    InputNumber,
    Card,
    Space,
    Tag,
    Modal,
    Spin,
    List,
    Input,
    Segmented,
    Tooltip
} from 'antd';
import {
    Send,
    PlayCircle,
    CheckCircle2,
    Check,
    Edit3,
    Table as TableIcon,
    LayoutGrid,
    Search,
    RotateCcw,
    Clock,
    AlertTriangle,
    Calendar,
    ArrowRight,
    Sparkles,
    Package,
    Layers,
    XCircle
} from 'lucide-react';
import dayjs from 'dayjs';
import ShortExpModal from '../../components/ShortExpModal';
import { getPuchaseTypeColor, getStdKtColor, getUnitColor } from '../../lib/colorMappings';

const { Title, Text } = Typography;
const { TextArea } = Input;

const RoutineSummaryDesktopView = ({
    profile,
    sessionData,
    indentItems = [],
    loading,
    submitting,
    cancelling = false,
    cancelIndent,
    viewMode = 'table',
    setViewMode,
    editingItem,
    setEditingItem,
    editMaxQty,
    setEditMaxQty,
    editBalance,
    setEditBalance,
    editQty,
    setEditQty,
    editRemarks,
    setEditRemarks,
    editSaving,
    isShortExpModalOpen,
    setIsShortExpModalOpen,
    lastItemIndex = -1,
    progressPercent = 0,
    handleEditClick,
    handleSaveEdit,
    handleSend,
    submitIndent,
    handleResume
}) => {
    const handleConfirmCancel = () => {
        Modal.confirm({
            title: 'Cancel Routine Indent?',
            icon: <AlertTriangle color="#ef4444" size={22} style={{ marginRight: 8 }} />,
            content: (
                <div>
                    Are you sure you want to cancel this routine indent for <strong>Rak {sessionData?.rak}</strong>?
                    <div style={{ marginTop: 6, fontSize: '13px', color: '#64748b' }}>
                        All recorded indent quantities and progress for this shelf will be permanently cleared.
                    </div>
                </div>
            ),
            okText: 'Yes, Cancel Indent',
            okType: 'danger',
            cancelText: 'Keep Auditing',
            okButtonProps: {
                style: { borderRadius: 8, fontWeight: 600 }
            },
            cancelButtonProps: {
                style: { borderRadius: 8 }
            },
            onOk: async () => {
                if (cancelIndent) {
                    await cancelIndent();
                }
            }
        });
    };

    // Search & Filter Tab State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'INDENTED' | 'ZERO' | 'REMARKS'

    // Summary calculations
    const stats = useMemo(() => {
        const total = indentItems.length;
        const indentedCount = indentItems.filter(i => (Number(i.requested_qty) || 0) > 0).length;
        const zeroCount = total - indentedCount;
        const remarksCount = indentItems.filter(i => Boolean(i.indent_remarks)).length;
        return { total, indentedCount, zeroCount, remarksCount };
    }, [indentItems]);

    const handleConfirmSubmit = () => {
        Modal.confirm({
            title: 'Send Indent to Substore?',
            icon: <Send color="#0284c7" size={22} style={{ marginRight: 8 }} />,
            content: (
                <div>
                    Are you sure you want to submit this routine indent for <strong>Rak {sessionData?.rak}</strong>?
                    <div style={{ marginTop: 6, fontSize: '13px', color: '#64748b' }}>
                        Once submitted, this indent will be sent to the issuer for review and cannot be edited anymore.
                    </div>
                </div>
            ),
            okText: `Yes, Submit Indent (${stats.indentedCount} Items)`,
            cancelText: 'Cancel',
            okButtonProps: {
                style: { borderRadius: 8, background: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }
            },
            cancelButtonProps: {
                style: { borderRadius: 8 }
            },
            onOk: async () => {
                if (submitIndent) {
                    await submitIndent();
                } else if (handleSend) {
                    handleSend();
                }
            }
        });
    };

    // Client-side filtered list
    const filteredItems = useMemo(() => {
        return indentItems.filter(item => {
            const qty = Number(item.requested_qty) || 0;
            if (filterTab === 'INDENTED' && qty === 0) return false;
            if (filterTab === 'ZERO' && qty > 0) return false;
            if (filterTab === 'REMARKS' && !item.indent_remarks) return false;

            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const name = (item.inventory_items?.name || '').toLowerCase();
                const code = (item.inventory_items?.item_code || '').toLowerCase();
                const pku = (item.inventory_items?.pku || '').toLowerCase();
                return name.includes(query) || code.includes(query) || pku.includes(query);
            }
            return true;
        });
    }, [indentItems, filterTab, searchQuery]);

    const resetFilters = () => {
        setSearchQuery('');
        setFilterTab('ALL');
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: 400 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, fontSize: '14px', color: '#64748b', fontWeight: 600 }}>
                    Loading routine indent summary...
                </div>
            </div>
        );
    }

    const columns = [

        {
            title: 'Drug Name',
            key: 'name',
            sorter: (a, b) => (a.inventory_items?.name || '').localeCompare(b.inventory_items?.name || ''),
            width: 520,
            render: (_, record) => {
                const isLastAudited = record.item_id === sessionData?.last_item;
                return (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                                fontSize: '13.5px',
                                fontWeight: 700,
                                color: '#0f172a',
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                lineHeight: 1.3
                            }}>
                                {record.inventory_items?.name || 'Unknown Item'}
                            </span>
                            {isLastAudited && (
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: '#ea580c',
                                    background: '#fff7ed',
                                    border: '1px solid #ffedd5',
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    textTransform: 'uppercase'
                                }}>
                                    📍 stopped here
                                </span>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center', marginTop: 4 }}>
                            {record.inventory_items?.pku && (
                                <span style={{ fontSize: '11.5px', color: '#d46b08', fontWeight: 600 }}>
                                    ({record.inventory_items.pku})
                                </span>
                            )}
                            {record.inventory_items?.puchase_type && (
                                <Tag color={getPuchaseTypeColor(record.inventory_items.puchase_type)} style={{ margin: 0, fontSize: '10.5px' }}>
                                    {record.inventory_items.puchase_type}
                                </Tag>
                            )}
                            {record.inventory_items?.std_kt && (
                                <Tag color={getStdKtColor(record.inventory_items.std_kt)} style={{ margin: 0, fontSize: '10.5px' }}>
                                    {record.inventory_items.std_kt}
                                </Tag>
                            )}
                            {record.indent_remarks && (
                                <span style={{ fontSize: '11px', color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>
                                    Note: {record.indent_remarks}
                                </span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            title: 'Max Qty',
            key: 'max_qty',
            width: 110,
            align: 'center',
            render: (_, record) => (
                <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#ea580c',
                    background: '#fff7ed',
                    padding: '2px 8px',
                    borderRadius: 6
                }}>
                    {record.inventory_items?.max_qty ?? record.snapshot_max_qty ?? 0}
                </span>
            )
        },
        {
            title: 'Balance',
            key: 'balance',
            width: 110,
            align: 'center',
            render: (_, record) => (
                <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#16a34a',
                    background: '#f0fdf4',
                    padding: '2px 8px',
                    borderRadius: 6
                }}>
                    {record.inventory_items?.balance ?? record.snapshot_balance ?? 0}
                </span>
            )
        },
        {
            title: 'Indent Qty',
            key: 'requested_qty',
            width: 150,
            align: 'center',
            render: (_, record) => {
                const qty = Number(record.requested_qty) || 0;
                return qty > 0 ? (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#065f46',
                        background: '#d1fae5',
                        border: '1px solid #a7f3d0',
                        padding: '3px 12px',
                        borderRadius: 16
                    }}>
                        <Check size={13} strokeWidth={3} />
                        {qty}
                    </span>
                ) : (
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#94a3b8',
                        background: '#f1f5f9',
                        padding: '3px 9px',
                        borderRadius: 6
                    }}>
                        0 (Skipped)
                    </span>
                );
            }
        },
        {
            title: 'Action',
            key: 'action',
            width: 90,
            align: 'right',
            render: (_, record) => (
                <Button
                    size="small"
                    icon={<Edit3 size={13} />}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(record);
                    }}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        borderRadius: 6,
                        fontSize: '12px'
                    }}
                >
                    Edit
                </Button>
            )
        }
    ];

    const renderListItem = (record) => {
        const qty = Number(record.requested_qty) || 0;
        const isLastAudited = record.item_id === sessionData?.last_item;

        return (
            <List.Item style={{ marginBottom: 12 }}>
                <div
                    className="arise-summary-card"
                    onClick={() => handleEditClick(record)}
                    style={{
                        background: `${isLastAudited ? '#fffaf5ff' : '#ffffff'}`,
                        border: `1px solid ${isLastAudited ? '#fed7aa' : '#e2e8f0'}`,
                        borderRadius: 14,
                        padding: '16px 18px',
                        boxShadow: isLastAudited
                            ? '0 4px 14px rgba(249, 115, 22, 0.12)'
                            : '0 1px 3px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}
                >
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                {record.inventory_items?.item_code && (
                                    <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>
                                        {record.inventory_items.item_code}
                                    </span>
                                )}
                                {record.inventory_items?.pku && (
                                    <Tag color="orange" style={{ margin: 0, fontSize: '11px', fontWeight: 600 }}>
                                        {record.inventory_items.pku}
                                    </Tag>
                                )}
                            </div>
                            {isLastAudited && (
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#ea580c', background: '#fff7ed', padding: '1px 6px', borderRadius: 4 }}>
                                    📍 Stopped Here
                                </span>
                            )}
                        </div>

                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.35, marginBottom: 8 }}>
                            {record.inventory_items?.name}
                        </div>

                        <div style={{ display: 'flex', gap: 12, fontSize: '12px', color: '#64748b', marginBottom: 8 }}>
                            <span>Max: <strong style={{ color: '#ea580c' }}>{record.inventory_items?.max_qty ?? 0}</strong></span>
                            <span>Bal: <strong style={{ color: '#16a34a' }}>{record.inventory_items?.balance ?? 0}</strong></span>
                        </div>

                        {record.indent_remarks && (
                            <div style={{ fontSize: '11.5px', color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: 6, marginBottom: 8 }}>
                                Note: {record.indent_remarks}
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            {qty > 0 ? (
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#065f46', background: '#d1fae5', padding: '2px 10px', borderRadius: 12 }}>
                                    ✓ {qty}
                                </span>
                            ) : (
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>0 (Skipped)</span>
                            )}
                        </div>

                        <Button size="small" icon={<Edit3 size={12} />} onClick={(e) => { e.stopPropagation(); handleEditClick(record); }}>
                            Edit
                        </Button>
                    </div>
                </div>
            </List.Item>
        );
    };

    return (
        <div className="routine-summary-desktop-view" style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 60 }}>
            {/* 1. Header & Main Telemetry Strip */}
            <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h1 style={{
                                margin: 0,
                                fontSize: '24px',
                                fontWeight: 800,
                                color: '#0f172a',
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                letterSpacing: '0.3px'
                            }}>
                                Routine Indent Summary
                            </h1>
                            {sessionData?.rak && (
                                <span style={{
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    color: '#7c3aed',
                                    background: '#f5f3ff',
                                    border: '1px solid #ede9fe',
                                    padding: '3px 10px',
                                    borderRadius: 6,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.4px'
                                }}>
                                    Rak {sessionData.rak}
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: 4, fontWeight: 500 }}>
                            Draft created by <strong>{profile?.name || 'Staff'}</strong> on {dayjs(sessionData?.created_at).format('DD/MM/YYYY, HH:mm')}. Review items before submitting to issuer.
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Button
                            danger
                            onClick={handleConfirmCancel}
                            loading={cancelling}
                            icon={<XCircle size={15} />}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                borderRadius: 8,
                                fontWeight: 600,
                                borderColor: '#fca5a5',
                                color: '#dc2626',
                                background: '#fef2f2'
                            }}
                        >
                            Cancel Indent
                        </Button>

                        <Button
                            type="primary"
                            icon={<PlayCircle size={15} />}
                            onClick={handleResume}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#4f46e5',
                                borderColor: '#4f46e5',
                                borderRadius: 8,
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)'
                            }}
                        >
                            Resume Routine Indent
                        </Button>
                    </div>
                </div>

                {/* 3 Metric Summary Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 14,
                    marginBottom: 16
                }}>
                    {/* KPI 1: Shelf Audit Progress */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 14,
                        padding: '16px 20px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Indent Progress
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7' }}>
                                {progressPercent}%
                            </span>
                        </div>
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                            <div style={{ height: '100%', background: 'linear-gradient(90deg, #0284c7 0%, #6366f1 100%)', width: `${progressPercent}%`, borderRadius: 3 }} />
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>
                            {lastItemIndex >= 0 ? `Stopped at item ${lastItemIndex + 1} of ${stats.total}` : 'Audit started'}
                        </div>
                    </div>

                    {/* KPI 2: To Order Count */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 14,
                        padding: '16px 20px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Number of Drugs indented
                            </span>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.2, marginTop: 2 }}>
                                {stats.indentedCount} <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>of {stats.total} items</span>
                            </div>

                        </div>
                        <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: '#f0fdf4',
                            border: '1px solid #dcfce7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#16a34a'
                        }}>
                            <CheckCircle2 size={22} />
                        </div>
                    </div>

                    {/* KPI 3: Zero / Skipped Items */}
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 14,
                        padding: '16px 20px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Number of Drugs with 0 Qty
                            </span>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.2, marginTop: 2 }}>
                                {stats.zeroCount} <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>drugs</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: 4, fontWeight: 500 }}>
                                Have Sufficient Balance
                            </div>
                        </div>
                        <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b'
                        }}>
                            <Package size={22} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Search & Segmented Filtering Toolbar */}
            <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '12px 18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
            }}>
                {/* Left: Search input */}
                <div style={{ flex: '1 1 280px', minWidth: 220 }}>
                    <Input
                        placeholder="Search items by drug name..."
                        prefix={<Search size={15} color="#94a3b8" style={{ marginRight: 6 }} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        allowClear
                        size="large"
                        style={{ borderRadius: 8, fontSize: '13px' }}
                    />
                </div>

                {/* Center: Segmented Filter Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Segmented
                        value={filterTab}
                        onChange={setFilterTab}
                        options={[
                            { label: `All (${stats.total})`, value: 'ALL' },
                            { label: `To Order (${stats.indentedCount})`, value: 'INDENTED' },
                            { label: `Zero (${stats.zeroCount})`, value: 'ZERO' },
                            { label: `Remarks (${stats.remarksCount})`, value: 'REMARKS' },
                        ]}
                    />


                    <Tooltip title="Reset filters">
                        <Button size="middle" icon={<RotateCcw size={13} />} onClick={resetFilters} style={{ borderRadius: 8 }}>
                            Reset
                        </Button>
                    </Tooltip>

                </div>

                {/* Right: Table vs Grid Mode */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>
                        Showing <strong>{filteredItems.length}</strong> items
                    </span>

                    <div style={{
                        display: 'flex',
                        background: '#f1f5f9',
                        padding: 3,
                        borderRadius: 8,
                        border: '1px solid #e2e8f0'
                    }}>
                        <Button
                            size="small"
                            type={viewMode === 'table' ? 'primary' : 'text'}
                            icon={<TableIcon size={15} />}
                            onClick={() => setViewMode('table')}
                            style={{
                                borderRadius: 6,
                                background: viewMode === 'table' ? '#0284c7' : 'transparent',
                                borderColor: viewMode === 'table' ? '#0284c7' : 'transparent',
                                color: viewMode === 'table' ? '#ffffff' : '#64748b'
                            }}
                        />
                        <Button
                            size="small"
                            type={viewMode === 'list' ? 'primary' : 'text'}
                            icon={<LayoutGrid size={15} />}
                            onClick={() => setViewMode('list')}
                            style={{
                                borderRadius: 6,
                                background: viewMode === 'list' ? '#0284c7' : 'transparent',
                                borderColor: viewMode === 'list' ? '#0284c7' : 'transparent',
                                color: viewMode === 'list' ? '#ffffff' : '#64748b'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* 3. Empty Search State */}
            {filteredItems.length === 0 && (
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    padding: '60px 24px',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                        No items match your active filter
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: 16 }}>
                        Try clearing your search term or switching to the 'All' tab.
                    </div>
                    <Button onClick={resetFilters} icon={<RotateCcw size={14} />} style={{ borderRadius: 8 }}>
                        Reset Filters
                    </Button>
                </div>
            )}

            {/* 4. Main Table / List View */}
            {filteredItems.length > 0 && viewMode === 'table' && (
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    overflow: 'hidden',
                    marginBottom: 20
                }}>
                    <Table
                        columns={columns}
                        dataSource={filteredItems}
                        rowKey="id"
                        pagination={false}
                        scroll={{ y: 560 }}
                        onRow={(record) => ({
                            onClick: () => handleEditClick(record),
                            style: { cursor: 'pointer' },
                            className: record.item_id === sessionData?.last_item ? 'highlight-stopped-row' : 'arise-summary-row'
                        })}
                    />
                </div>
            )}

            {filteredItems.length > 0 && viewMode === 'list' && (
                <div style={{ marginBottom: 20 }}>
                    <List
                        grid={{ gutter: 14, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
                        dataSource={filteredItems}
                        renderItem={renderListItem}
                        pagination={false}
                    />
                </div>
            )}

            {/* 5. Sticky Bottom Dispatch Action Bar */}
            <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '14px 22px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
                position: 'sticky',
                bottom: 20,
                zIndex: 80
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Indent Progress: <strong style={{ color: '#0284c7' }}>{stats.indentedCount}</strong> of {stats.total} items requested
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

                    <Button
                        size="large"
                        onClick={handleResume}
                        style={{ borderRadius: 8, fontWeight: 600, fontSize: '13.5px' }}
                    >
                        Resume Indent
                    </Button>

                    <Button
                        type="primary"
                        size="large"
                        icon={<Send size={15} />}
                        onClick={handleConfirmSubmit}
                        loading={submitting}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: '14px',
                            background: '#0284c7',
                            borderColor: '#0284c7',
                            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                        }}
                    >
                        Confirm & Submit Indent
                    </Button>
                </div>
            </div>

            {/* 6. Edit Item Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 6 }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0284c7'
                        }}>
                            <Edit3 size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                Edit Indent
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>
                                Update balance, requested quantity, or add remarks.
                            </div>
                        </div>
                    </div>
                }
                open={!!editingItem}
                onCancel={() => setEditingItem(null)}
                onOk={handleSaveEdit}
                confirmLoading={editSaving}
                width={500}
                okText="Save Changes"
                cancelText="Cancel"
                okButtonProps={{
                    style: { background: '#0284c7', borderColor: '#0284c7', borderRadius: 8, fontWeight: 600 }
                }}
                cancelButtonProps={{ style: { borderRadius: 8 } }}
                destroyOnClose
            >
                {editingItem && (
                    <div style={{ paddingTop: 8 }}>
                        {/* Drug Identity Banner */}
                        <div style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: '14px 16px',
                            marginBottom: 16
                        }}>
                            <div style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#0f172a',
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                lineHeight: 1.35,
                                marginBottom: 6
                            }}>
                                {editingItem.inventory_items?.name}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                                {editingItem.inventory_items?.item_code && (
                                    <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#475569', background: '#e2e8f0', padding: '1px 6px', borderRadius: 4 }}>
                                        {editingItem.inventory_items.item_code}
                                    </span>
                                )}
                                {editingItem.inventory_items?.pku && (
                                    <Tag color="#d46b08" style={{ margin: 0, fontSize: '11px', fontWeight: 600 }}>
                                        {editingItem.inventory_items.pku}
                                    </Tag>
                                )}
                                {editingItem.inventory_items?.puchase_type && (
                                    <Tag color={getPuchaseTypeColor(editingItem.inventory_items.puchase_type)} style={{ margin: 0, fontSize: '11px' }}>
                                        {editingItem.inventory_items.puchase_type}
                                    </Tag>
                                )}
                                {editingItem.inventory_items?.std_kt && (
                                    <Tag color={getStdKtColor(editingItem.inventory_items.std_kt)} style={{ margin: 0, fontSize: '11px' }}>
                                        {editingItem.inventory_items.std_kt}
                                    </Tag>
                                )}
                            </div>
                        </div>

                        {/* Snapshot Values */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 10,
                            marginBottom: 16
                        }}>
                            <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                                <span style={{ fontSize: '11px', color: '#c2410c', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                                    Max Qty
                                </span>
                                <span style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                    {editMaxQty ?? 0}
                                </span>
                            </div>

                            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                                <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                                    Balance
                                </span>
                                <InputNumber
                                    size="small"
                                    min={0}
                                    value={editBalance}
                                    onChange={(val) => {
                                        setEditBalance(val);
                                        const max = editMaxQty || 0;
                                        if (val !== null) {
                                            setEditQty(Math.max(0, max - val));
                                        }
                                    }}
                                    style={{ width: '100%', marginTop: 2, fontWeight: 700 }}
                                />
                            </div>

                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                                <span style={{ fontSize: '11px', color: '#166534', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>
                                    Order Qty
                                </span>
                                <InputNumber
                                    size="small"
                                    min={0}
                                    value={editQty}
                                    onChange={setEditQty}
                                    style={{ width: '100%', marginTop: 2, fontWeight: 800, color: '#16a34a' }}
                                />
                            </div>
                        </div>

                        {/* Short Expiry Batch Trigger */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: '#fffbeb',
                            border: '1px solid #fef3c7',
                            borderRadius: 10,
                            marginBottom: 16
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#92400e', fontWeight: 600 }}>
                                <Calendar size={14} color="#d97706" />
                                <span>Short Expiry Batch</span>
                            </div>
                            <Button
                                size="small"
                                icon={<Edit3 size={12} />}
                                onClick={() => setIsShortExpModalOpen(true)}
                                style={{ borderRadius: 6, fontSize: '12px', borderColor: '#fcd34d', color: '#b45309' }}
                            >
                                Edit Batches
                            </Button>
                        </div>

                        {/* Issuer Remarks */}
                        <div>
                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                                Remarks for Issuer (Optional)
                            </div>
                            <TextArea
                                rows={2}
                                placeholder=""
                                value={editRemarks}
                                onChange={(e) => setEditRemarks(e.target.value)}
                                style={{ borderRadius: 8, fontSize: '13px' }}
                            />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Short Expiry Modal */}
            <ShortExpModal
                isOpen={isShortExpModalOpen}
                onClose={() => setIsShortExpModalOpen(false)}
                selectedItem={editingItem?.inventory_items}
            />

            <style>{`
                .highlight-stopped-row > td {
                    background-color: #fffaf5ff !important;
                }
                .arise-summary-row:hover > td {
                    background-color: #f8fafc !important;
                }
                .arise-summary-card:hover {
                    border-color: #38bdf8 !important;
                    box-shadow: 0 4px 14px rgba(2, 132, 199, 0.12) !important;
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
};

export default RoutineSummaryDesktopView;
