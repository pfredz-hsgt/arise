import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Typography,
    Space,
    Tag,
    Button,
    Empty,
    Spin,
    Modal,
    Checkbox,
    InputNumber,
    Segmented,
    Tooltip,
    Divider,
    message
} from 'antd';
import {
    Eye,
    Download,
    CheckCircle2,
    Check,
    Zap,
    ClipboardList,
    Clock,
    User,
    Copy,
    Edit3,
    AlertCircle,
    Terminal,
    ChevronDown,
    ChevronUp,
    SlidersHorizontal,
    Package,
    ShoppingCart,
    ExternalLink,
    Info,
    CheckSquare,
    Square,
    Send,
    Trash2
} from 'lucide-react';
import { getPuchaseTypeColor, getStdKtColor, getUnitColor } from '../../lib/colorMappings';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Generates two-letter initials for staff avatar
const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

/**
 * EditQuantityModal Component
 * Allows issuers to fine-tune requested drug quantities before dispatch approval.
 */
const EditQuantityModal = ({ visible, onCancel, onOk, editingItem, updatingQty, isIndenter, handleDeleteItem }) => {
    const [localQuantity, setLocalQuantity] = useState(0);

    useEffect(() => {
        if (visible && editingItem) {
            setLocalQuantity(Number(editingItem.requested_qty) || 0);
        }
    }, [visible, editingItem]);

    const maxQty = editingItem?.inventory_items?.max_qty ?? editingItem?.snapshot_max_qty ?? null;
    const balance = editingItem?.inventory_items?.balance ?? editingItem?.snapshot_balance ?? null;
    const suggestedQuota = maxQty !== null && balance !== null ? Math.max(0, maxQty - balance) : null;

    return (
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
                            {isIndenter ? 'Edit Indent Quantity' : 'Modify Allocation Quantity'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>
                            {isIndenter
                                ? 'Adjust requested units before submitting to pharmacy issuer.'
                                : 'Adjust requested units before finalizing the Kew.PS-8 order.'}
                        </div>
                    </div>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            confirmLoading={updatingQty}
            width={480}
            footer={[
                isIndenter && editingItem?.original_req_id ? (
                    <Button
                        key="delete"
                        danger
                        style={{ float: 'left', borderRadius: 8 }}
                        onClick={() => {
                            Modal.confirm({
                                title: 'Remove item from cart?',
                                content: `Are you sure you want to remove "${editingItem.inventory_items?.name || 'this item'}" from your draft cart?`,
                                okText: 'Remove',
                                okButtonProps: { danger: true },
                                onOk: () => {
                                    handleDeleteItem(editingItem);
                                    onCancel();
                                }
                            });
                        }}
                    >
                        Remove Item
                    </Button>
                ) : null,
                <Button key="cancel" onClick={onCancel} style={{ borderRadius: 8 }}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={updatingQty}
                    onClick={() => onOk(localQuantity)}
                    style={{
                        background: '#0284c7',
                        borderColor: '#0284c7',
                        fontWeight: 600,
                        borderRadius: 8
                    }}
                >
                    Save Quantity
                </Button>
            ]}
        >
            {editingItem && editingItem.inventory_items && (
                <div style={{ paddingTop: 8 }}>
                    {/* Drug Identity Card */}
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
                            marginBottom: 8
                        }}>
                            {editingItem.inventory_items.name}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                            {editingItem.inventory_items.item_code && (
                                <span style={{
                                    fontSize: '11.5px',
                                    fontWeight: 600,
                                    fontFamily: 'monospace',
                                    color: '#475569',
                                    background: '#e2e8f0',
                                    padding: '2px 7px',
                                    borderRadius: 4
                                }}>
                                    {editingItem.inventory_items.item_code}
                                </span>
                            )}
                            {editingItem.inventory_items.pku && (
                                <Tag color="#d46b08" style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                                    {editingItem.inventory_items.pku}
                                </Tag>
                            )}
                            {editingItem.inventory_items.puchase_type && (
                                <Tag color={getPuchaseTypeColor(editingItem.inventory_items.puchase_type)} style={{ margin: 0, fontSize: '11px' }}>
                                    {editingItem.inventory_items.puchase_type}
                                </Tag>
                            )}
                            {editingItem.inventory_items.std_kt && (
                                <Tag color={getStdKtColor(editingItem.inventory_items.std_kt)} style={{ margin: 0, fontSize: '11px' }}>
                                    {editingItem.inventory_items.std_kt}
                                </Tag>
                            )}
                            {editingItem.inventory_items.row && (
                                <Tag style={{ margin: 0, fontSize: '11px' }}>Row {editingItem.inventory_items.row}</Tag>
                            )}
                        </div>
                    </div>

                    {/* Shelf Inventory Snapshots */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 10,
                        marginBottom: 16
                    }}>
                        <div style={{
                            background: '#fff7ed',
                            border: '1px solid #ffedd5',
                            borderRadius: 10,
                            padding: '10px 12px',
                            textAlign: 'center'
                        }}>
                            <span style={{ fontSize: '11px', color: '#c2410c', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Max Qty
                            </span>
                            <span style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                {maxQty !== null ? maxQty : '-'}
                            </span>
                        </div>

                        <div style={{
                            background: '#f0fdf4',
                            border: '1px solid #dcfce7',
                            borderRadius: 10,
                            padding: '10px 12px',
                            textAlign: 'center'
                        }}>
                            <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Shelf Balance
                            </span>
                            <span style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                {balance !== null ? balance : '-'}
                            </span>
                        </div>

                        <div style={{
                            background: '#f0f9ff',
                            border: '1px solid #e0f2fe',
                            borderRadius: 10,
                            padding: '10px 12px',
                            textAlign: 'center'
                        }}>
                            <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Suggested Qty
                            </span>
                            <span style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                {suggestedQuota !== null ? suggestedQuota : '-'}
                            </span>
                        </div>
                    </div>

                    {/* Numeric Stepper Box */}
                    <div style={{
                        padding: '16px 20px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        marginBottom: 16
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                                Indent Quantity
                            </span>
                            {localQuantity === 0 && (
                                <Tag color="default" style={{ margin: 0, fontWeight: 600 }}>Will Not Indent</Tag>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <InputNumber
                                min={0}
                                value={localQuantity}
                                onChange={setLocalQuantity}
                                size="large"
                                autoFocus
                                inputMode="numeric"
                                style={{
                                    width: 140,
                                    borderRadius: 8,
                                    fontSize: '18px',
                                    fontWeight: 700
                                }}
                            />

                            {/* Quick Presets */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                <Button size="small" onClick={() => setLocalQuantity(0)}>Set 0</Button>
                                <Button size="small" onClick={() => setLocalQuantity(q => Math.max(0, (q || 0) + 1))}>+1</Button>
                                <Button size="small" onClick={() => setLocalQuantity(q => Math.max(0, (q || 0) + 5))}>+5</Button>
                                {suggestedQuota !== null && (
                                    <Button
                                        size="small"
                                        type="dashed"
                                        style={{ color: '#0284c7', borderColor: '#bae6fd' }}
                                        onClick={() => setLocalQuantity(suggestedQuota)}
                                    >
                                        Suggested Qty ({suggestedQuota})
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Remarks Banner (if any) */}
                    {editingItem.indent_remarks && (
                        <div style={{
                            padding: '10px 14px',
                            background: '#fefce8',
                            border: '1px solid #fef08a',
                            borderRadius: 8,
                            textAlign: 'left'
                        }}>
                            <div style={{ fontSize: '11px', color: '#a16207', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>
                                Indenter Remark:
                            </div>
                            <div style={{ fontSize: '13px', color: '#854d0e', fontWeight: 500 }}>
                                "{editingItem.indent_remarks}"
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

/**
 * CartDesktopView Component
 * Executive Cart & Dispatch interface for pharmacy issuers.
 */
const CartDesktopView = ({
    unit,
    loading,
    sessions = [],
    unitFilter,
    setUnitFilter,
    unitCounts,
    selectedSessions = [],
    setSelectedSessions,
    toggleSessionSelect,
    toggleSelectAll,
    editModalVisible,
    setEditModalVisible,
    editingItem,
    setEditingItem,
    updatingQty,
    submittingSession,
    isTerminalVisible,
    terminalLogs = [],
    successIndentNo,
    setSuccessIndentNo,
    skippedItems = [],
    handleUpdateQuantity,
    handlePhisIndentClick,
    handleAbortProcess,
    handleClearSession,
    handleSubmitSession,
    handleDeleteItem,
    previewSingleSessionPDF,
    processPDFExport,
    isIssuer,
    isIndenter,
    navigate
}) => {
    // Accordion state: default expand all sessions for rapid issuer review
    const [expandedIds, setExpandedIds] = useState(() => new Set(sessions.map(s => s.id)));

    // Keep expanded set updated when new sessions load
    useEffect(() => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            sessions.forEach(s => next.add(s.id));
            return next;
        });
    }, [sessions]);

    const toggleExpand = useCallback((id) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        setExpandedIds(new Set(sessions.map(s => s.id)));
    }, [sessions]);

    const collapseAll = useCallback(() => {
        setExpandedIds(new Set());
    }, []);

    // Summary calculations
    const stats = useMemo(() => {
        const total = sessions.length;
        const totalItems = sessions.reduce((acc, s) => acc + (s.indent_items?.length || 0), 0);
        const urgentCount = sessions.filter(s => s.session_type === 'Urgent Indent').length;
        const routineCount = sessions.filter(s => s.session_type !== 'Urgent Indent').length;
        return { total, totalItems, urgentCount, routineCount };
    }, [sessions]);

    const isOpd = unit === 'OPD';
    const allSelected = sessions.length > 0 && sessions.every(s => selectedSessions.includes(s.id));
    const isIndeterminate = selectedSessions.length > 0 && !allSelected;

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px', minHeight: 400 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, fontSize: '14px', color: '#64748b', fontWeight: 600 }}>
                    Loading pending indent sessions...
                </div>
            </div>
        );
    }

    return (
        <div className="cart-desktop-view" style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
            {/* 1. Header & Live Telemetry Strip */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
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
                                {isIndenter ? 'My Indent Cart' : 'Indent Cart'}
                            </h1>
                            {isOpd && !isIndenter ? (
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <Tag color={getUnitColor('OPD')} style={{ margin: 0, fontWeight: 700, fontSize: '12px', padding: '2px 8px', borderRadius: 4, border: 'none' }}>OPD</Tag>
                                    <Tag color={getUnitColor('ED')} style={{ margin: 0, fontWeight: 700, fontSize: '12px', padding: '2px 8px', borderRadius: 4, border: 'none' }}>ED</Tag>
                                </div>
                            ) : (
                                <Tag color={getUnitColor(unit)} style={{ margin: 0, fontWeight: 700, fontSize: '12px', padding: '2px 8px', borderRadius: 4, border: 'none' }}>{unit}</Tag>
                            )}
                            {isIndenter && (
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#b91c1c',
                                    background: '#fef2f2',
                                    border: '1px solid #fee2e2',
                                    padding: '2px 8px',
                                    borderRadius: 6
                                }}>
                                    <Zap size={11} /> Urgent Items Only
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: 4, fontWeight: 500 }}>
                            {isIndenter
                                ? 'Review your urgent indent DRAFTS and submit to issuer for approval.'
                                : 'Review submitted indents, approve and print Kew.PS-8 Issue Notes.'}
                        </div>
                    </div>
                </div>

                {/* 3 Metric Summary Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 14,
                    marginBottom: 16
                }}>
                    {/* KPI 1 */}
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
                                {isIndenter ? 'Draft' : 'Pending'}
                            </span>
                            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.2, marginTop: 2 }}>
                                {stats.total} <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>{stats.total === 1 ? 'indent' : 'indents'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: isIndenter ? '#f59e0b' : '#10b981', boxShadow: isIndenter ? '0 0 6px #f59e0b' : '0 0 6px #10b981' }} />
                                <span style={{ fontSize: '11px', color: isIndenter ? '#d97706' : '#10b981', fontWeight: 700 }}>
                                    {isIndenter ? 'Ready to Submit' : 'Awaiting Approval'}
                                </span>
                            </div>
                        </div>
                        <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: isIndenter ? '#fffbeb' : '#f0f9ff',
                            border: `1px solid ${isIndenter ? '#fef3c7' : '#e0f2fe'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isIndenter ? '#d97706' : '#0284c7'
                        }}>
                            <ClipboardList size={22} />
                        </div>
                    </div>

                    {/* KPI 2: Total Items */}
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
                                Total
                            </span>
                            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.2, marginTop: 2 }}>
                                {stats.totalItems} <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>drugs</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: 4, fontWeight: 500 }}>
                                {isIndenter ? 'in your URGENT indent drafts' : 'Across all active indent requests'}
                            </div>
                        </div>
                        <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: '#f5f3ff',
                            border: '1px solid #ede9fe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#7c3aed'
                        }}>
                            <ShoppingCart size={22} />
                        </div>
                    </div>

                    {/* KPI 3: Workflow Mix / Destination */}
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
                                {isIndenter ? 'Create Urgent Indent First' : 'Indent Type'}
                            </span>
                            {isIndenter ? (
                                <div style={{ marginTop: 6 }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#0284c7',
                                        background: '#f0f9ff',
                                        border: '1px solid #bae6fd',
                                        padding: '6px 10px',
                                        borderRadius: 6
                                    }}>
                                        <Send size={18} /> Next: Submit to Issuer
                                    </span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: '#dc2626',
                                        background: '#fef2f2',
                                        border: '1px solid #fee2e2',
                                        padding: '3px 8px',
                                        borderRadius: 6
                                    }}>
                                        <Zap size={12} /> {stats.urgentCount} Urgent
                                    </span>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: '#0369a1',
                                        background: '#f0f9ff',
                                        border: '1px solid #e0f2fe',
                                        padding: '3px 8px',
                                        borderRadius: 6
                                    }}>
                                        <ClipboardList size={12} /> {stats.routineCount} Routine
                                    </span>
                                </div>
                            )}
                        </div>
                        <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: '#fffbeb',
                            border: '1px solid #fef3c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#d97706'
                        }}>
                            <Package size={22} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Control Toolbar (Selection, Unit Filter & Batch PDF Export) */}
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
                {/* Left Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    {!isIndenter && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Checkbox
                                    checked={allSelected}
                                    indeterminate={isIndeterminate}
                                    onChange={toggleSelectAll}
                                    style={{ fontWeight: 600, fontSize: '13px' }}
                                >
                                    Select All ({sessions.length})
                                </Checkbox>
                                {selectedSessions.length > 0 && (
                                    <span style={{
                                        fontSize: '11.5px',
                                        fontWeight: 700,
                                        background: '#f0fdf4',
                                        color: '#16a34a',
                                        border: '1px solid #bbf7d0',
                                        padding: '2px 8px',
                                        borderRadius: 12
                                    }}>
                                        {selectedSessions.length} selected
                                    </span>
                                )}
                            </div>
                            <Divider type="vertical" style={{ height: 20, borderColor: '#e2e8f0' }} />
                        </>
                    )}

                    {!isIndenter && isOpd && unitCounts && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Unit:</span>
                                <Segmented
                                    value={unitFilter}
                                    onChange={setUnitFilter}
                                    options={[
                                        { label: `All (${unitCounts.all})`, value: 'ALL' },
                                        { label: `OPD (${unitCounts.opd})`, value: 'OPD' },
                                        { label: `ED (${unitCounts.ed})`, value: 'ED' },
                                    ]}
                                />
                            </div>
                            <Divider type="vertical" style={{ height: 20, borderColor: '#e2e8f0' }} />
                        </>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Button size="small" type="text" onClick={expandAll} style={{ fontSize: '12px', color: '#64748b' }}>
                            Expand All
                        </Button>
                        <span style={{ color: '#cbd5e1' }}>·</span>
                        <Button size="small" type="text" onClick={collapseAll} style={{ fontSize: '12px', color: '#64748b' }}>
                            Collapse All
                        </Button>
                    </div>
                </div>

                {/* Right Controls */}
                {!isIndenter ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Tooltip title={selectedSessions.length === 0 ? "Select at least 1 session to preview Kew.PS-8" : "Preview combined Kew.PS-8 voucher for selected sessions"}>
                            <Button
                                icon={<Eye size={15} />}
                                onClick={() => processPDFExport('preview')}
                                disabled={selectedSessions.length === 0}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    background: selectedSessions.length === 0 ? undefined : '#4f46e5',
                                    borderColor: selectedSessions.length === 0 ? undefined : '#4f46e5',
                                    color: selectedSessions.length === 0 ? undefined : '#ffffff',
                                    boxShadow: selectedSessions.length === 0 ? undefined : '0 2px 8px rgba(79, 70, 229, 0.25)'
                                }}
                            >
                                Preview PDF
                            </Button>
                        </Tooltip>

                        <Tooltip title={selectedSessions.length === 0 ? "Select at least 1 session to download Kew.PS-8" : "Download PDF document for selected indents"}>
                            <Button
                                icon={<Download size={15} />}
                                onClick={() => processPDFExport('download')}
                                disabled={selectedSessions.length === 0}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    background: selectedSessions.length === 0 ? undefined : '#0284c7',
                                    borderColor: selectedSessions.length === 0 ? undefined : '#0284c7',
                                    color: selectedSessions.length === 0 ? undefined : '#ffffff',
                                    boxShadow: selectedSessions.length === 0 ? undefined : '0 2px 8px rgba(2, 132, 199, 0.25)'
                                }}
                            >
                                Download PDF
                            </Button>
                        </Tooltip>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Button
                            icon={<Zap size={15} />}
                            onClick={() => navigate ? navigate('/indent') : (window.location.href = '/indent')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                borderRadius: 8,
                                fontWeight: 600,
                                fontSize: '13px'
                            }}
                        >
                            + Add Urgent Indent
                        </Button>
                    </div>
                )}
            </div>

            {/* 3. Empty State */}
            {sessions.length === 0 && (
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    padding: '60px 24px',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}>
                    <div style={{
                        width: 64,
                        height: 64,
                        borderRadius: 20,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isIndenter ? '#3b82f6' : '#10b981',
                        marginBottom: 16
                    }}>
                        {isIndenter ? <ShoppingCart size={32} color="#0284c7" /> : <CheckCircle2 size={32} color="#10b981" />}
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {isIndenter ? 'Your Indent Cart is Empty' : 'All Indents Cleared'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', maxWidth: 460, margin: '6px auto 16px' }}>
                        {isIndenter
                            ? 'You have no indents waiting to be submitted. Go to the Urgent Indent page to select drugs and add them to your cart.'
                            : `There are currently no submitted indents waiting for approval from ${isOpd ? 'OPD or ED' : unit}.`}
                    </div>
                    {isIndenter && (
                        <Button
                            type="primary"
                            icon={<Zap size={15} />}
                            onClick={() => navigate ? navigate('/indent') : (window.location.href = '/indent')}
                            style={{
                                background: '#0284c7',
                                borderColor: '#0284c7',
                                borderRadius: 8,
                                fontWeight: 600,
                                fontSize: '13px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '0 20px',
                                height: 38
                            }}
                        >
                            Add Urgent Indent
                        </Button>
                    )}
                </div>
            )}

            {/* 4. Active Sessions Cards */}
            {sessions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {sessions.map((session) => {
                        const isSelected = selectedSessions.includes(session.id);
                        const isExpanded = expandedIds.has(session.id);
                        const isUrgent = session.session_type === 'Urgent Indent';
                        const itemCount = session.indent_items?.length || 0;

                        return (
                            <div
                                key={session.id}
                                style={{
                                    background: '#ffffff',
                                    border: `1px solid ${isSelected ? '#38bdf8' : '#e2e8f0'}`,
                                    borderRadius: 14,
                                    boxShadow: isSelected
                                        ? '0 4px 14px rgba(2, 132, 199, 0.12)'
                                        : '0 1px 3px rgba(0, 0, 0, 0.02)',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                {/* Card Header */}
                                <div
                                    onClick={() => toggleExpand(session.id)}
                                    style={{
                                        padding: '14px 18px',
                                        background: isExpanded ? '#fafafa' : '#ffffff',
                                        borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 12,
                                        cursor: 'pointer',
                                        userSelect: 'none'
                                    }}
                                >
                                    {/* Left Details */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                        {/* Checkbox */}
                                        <span onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={isSelected}
                                                onChange={() => {
                                                    if (toggleSessionSelect) {
                                                        toggleSessionSelect(session.id);
                                                    } else {
                                                        setSelectedSessions(prev =>
                                                            prev.includes(session.id)
                                                                ? prev.filter(id => id !== session.id)
                                                                : [...prev, session.id]
                                                        );
                                                    }
                                                }}
                                            />
                                        </span>

                                        {/* Workflow Badge */}
                                        {isUrgent ? (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                color: '#b91c1c',
                                                background: '#fef2f2',
                                                border: '1px solid #fecaca',
                                                padding: '2px 8px',
                                                borderRadius: 6,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.4px'
                                            }}>
                                                <Zap size={12} /> Urgent
                                            </span>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    color: '#0369a1',
                                                    background: '#f0f9ff',
                                                    border: '1px solid #bae6fd',
                                                    padding: '2px 8px',
                                                    borderRadius: 6,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.4px'
                                                }}>
                                                    <ClipboardList size={12} /> Routine
                                                </span>
                                                {session.rak && (
                                                    <Tag color="purple" style={{ margin: 0, fontWeight: 700, borderRadius: 4 }}>
                                                        Rak: {session.rak}
                                                    </Tag>
                                                )}
                                            </div>
                                        )}

                                        {/* Indenter Staff Tag */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <div style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontSize: '10px',
                                                fontWeight: 700
                                            }}>
                                                {getInitials(session.profiles?.name || 'AD')}
                                            </div>
                                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                                {session.profiles?.name || 'Unknown Staff'}
                                            </span>
                                        </div>

                                        {/* Unit Tag */}
                                        {session.user_main_unit && (
                                            <Tag color={getUnitColor(session.user_main_unit)} style={{ fontWeight: 700, margin: 0, borderRadius: 4 }}>
                                                {session.user_main_unit}
                                            </Tag>
                                        )}

                                        {/* Timestamp */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                                            <Clock size={13} color="#94a3b8" />
                                            <span>{dayjs(session.created_at).format('DD/MM/YYYY HH:mm')}</span>
                                        </div>

                                        {/* Items count */}
                                        <span style={{
                                            fontSize: '11.5px',
                                            fontWeight: 600,
                                            color: '#475569',
                                            background: '#f1f5f9',
                                            padding: '2px 8px',
                                            borderRadius: 12
                                        }}>
                                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                        </span>
                                    </div>

                                    {/* Right Section: Actions & Accordion */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {/* Action Buttons */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                                            {isIndenter ? (
                                                <Tooltip title="Submit this draft urgent indent to the pharmacy issuer for approval">
                                                    <Button
                                                        size="middle"
                                                        type="primary"
                                                        loading={submittingSession}
                                                        icon={<Send size={15} />}
                                                        onClick={() => {
                                                            Modal.confirm({
                                                                title: 'Submit Urgent Indent to Issuer?',
                                                                content: 'Once submitted, the status will change to Pending and appear on the Issuer cart for approval.',
                                                                okText: 'Submit Indent',
                                                                cancelText: 'Cancel',
                                                                okButtonProps: {
                                                                    style: { background: '#16a34a', borderColor: '#16a34a', fontWeight: 600 }
                                                                },
                                                                onOk: () => {
                                                                    handleSubmitSession(session.id);
                                                                }
                                                            });
                                                        }}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                            background: '#16a34a',
                                                            borderColor: '#16a34a',
                                                            borderRadius: 8,
                                                            fontSize: '12.5px',
                                                            fontWeight: 600,
                                                            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
                                                        }}
                                                    >
                                                        Submit Indent
                                                    </Button>
                                                </Tooltip>
                                            ) : (
                                                <>
                                                    {/*}
                                                    <Tooltip title="Trigger automated background PhIS submission for this session">
                                                        <Button
                                                            size="middle"
                                                            icon={<Terminal size={14} color="#0284c7" />}
                                                            onClick={() => handlePhisIndentClick(session)}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                                borderRadius: 8,
                                                                fontSize: '12.5px',
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            Indent PhIS
                                                        </Button>
                                                    </Tooltip>
*/}
                                                    <Tooltip title="Approve indent, generate Kew.PS-8 voucher, and clear session">
                                                        <Button
                                                            size="middle"
                                                            type="primary"
                                                            icon={<CheckCircle2 size={15} />}
                                                            onClick={() => {
                                                                Modal.confirm({
                                                                    title: 'Approve Indent?',
                                                                    content: 'Kew.PS-8 forms will be generated automatically.',
                                                                    okText: 'Approve',
                                                                    cancelText: 'Cancel',
                                                                    okButtonProps: {
                                                                        style: { background: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }
                                                                    },
                                                                    onOk: () => {
                                                                        previewSingleSessionPDF(session);
                                                                        handleClearSession(session.id);
                                                                    }
                                                                });
                                                            }}
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                                background: '#0284c7',
                                                                borderColor: '#0284c7',
                                                                borderRadius: 8,
                                                                fontSize: '12.5px',
                                                                fontWeight: 600,
                                                                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                                                            }}
                                                        >
                                                            Approve & Clear
                                                        </Button>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </div>

                                        {/* Accordion Arrow Button */}
                                        <div style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 6,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: isExpanded ? '#0284c7' : '#64748b',
                                            background: isExpanded ? '#e0f2fe' : 'transparent',
                                            marginLeft: 4,
                                            transition: 'all 0.2s ease'
                                        }}>
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body: Items Table/List */}
                                {isExpanded && (
                                    <div style={{ padding: '0 18px 14px' }}>
                                        {/* Table Header Bar */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'minmax(280px, 1.8fr) 140px 140px 140px 90px',
                                            padding: '10px 14px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            color: '#64748b',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            borderBottom: '1px solid #f1f5f9',
                                            background: '#f8fafc',
                                            borderRadius: '8px 8px 0 0',
                                            marginTop: 10
                                        }}>
                                            <span>Drug Name</span>
                                            <span style={{ textAlign: 'center' }}>Max Qty</span>
                                            <span style={{ textAlign: 'center' }}>Balance</span>
                                            <span style={{ textAlign: 'center' }}>Indent Qty</span>
                                            <span style={{ textAlign: 'right' }}>Action</span>
                                        </div>

                                        {/* Item Rows */}
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            {session.indent_items?.map((item, idx) => {
                                                const requestedQty = Number(item.requested_qty) || 0;
                                                const isZeroQty = requestedQty === 0;

                                                return (
                                                    <div
                                                        key={item.id || idx}
                                                        onClick={() => {
                                                            setEditingItem(item);
                                                            setEditModalVisible(true);
                                                        }}
                                                        className="cart-drug-row"
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'minmax(280px, 1.8fr) 140px 140px 140px 90px',
                                                            alignItems: 'center',
                                                            padding: '12px 14px',
                                                            borderBottom: idx === session.indent_items.length - 1 ? 'none' : '1px solid #f1f5f9',
                                                            opacity: isZeroQty ? 0.45 : 1,
                                                            cursor: 'pointer',
                                                            transition: 'background 0.15s ease'
                                                        }}
                                                    >
                                                        {/* Col 1: Name and Specifications */}
                                                        <div style={{ paddingRight: 16 }}>
                                                            <div style={{
                                                                fontSize: '13.5px',
                                                                fontWeight: 700,
                                                                color: '#0f172a',
                                                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                                lineHeight: 1.35,
                                                                marginBottom: 4
                                                            }}>
                                                                {item.inventory_items?.name || 'Unknown Item'}
                                                            </div>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                                                                {item.inventory_items?.pku && (
                                                                    <span style={{ fontSize: '11.5px', color: '#d46b08', fontWeight: 600 }}>
                                                                        ({item.inventory_items.pku})
                                                                    </span>
                                                                )}
                                                                {item.inventory_items?.puchase_type && (
                                                                    <Tag color={getPuchaseTypeColor(item.inventory_items.puchase_type)} style={{ margin: 0, fontSize: '10.5px' }}>
                                                                        {item.inventory_items.puchase_type}
                                                                    </Tag>
                                                                )}
                                                                {item.inventory_items?.std_kt && (
                                                                    <Tag color={getStdKtColor(item.inventory_items.std_kt)} style={{ margin: 0, fontSize: '10.5px' }}>
                                                                        {item.inventory_items.std_kt}
                                                                    </Tag>
                                                                )}
                                                                {item.indent_remarks && (
                                                                    <span style={{ fontSize: '11px', color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                                                                        Note: {item.indent_remarks}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Col 2: Max Qty */}
                                                        <div style={{ textAlign: 'center' }}>
                                                            <span style={{
                                                                fontSize: '13px',
                                                                fontWeight: 600,
                                                                color: '#c2410c',
                                                                background: '#fff7ed',
                                                                padding: '3px 9px',
                                                                borderRadius: 6
                                                            }}>
                                                                {item.snapshot_max_qty !== null ? item.snapshot_max_qty : '-'}
                                                            </span>
                                                        </div>

                                                        {/* Col 3: Balance */}
                                                        <div style={{ textAlign: 'center' }}>
                                                            <span style={{
                                                                fontSize: '13px',
                                                                fontWeight: 600,
                                                                color: '#15803d',
                                                                background: '#f0fdf4',
                                                                padding: '3px 9px',
                                                                borderRadius: 6
                                                            }}>
                                                                {item.snapshot_balance !== null ? item.snapshot_balance : '-'}
                                                            </span>
                                                        </div>

                                                        {/* Col 4: Requested Qty */}
                                                        <div style={{ textAlign: 'center' }}>
                                                            {isZeroQty ? (
                                                                <span style={{
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    color: '#8997aaff',
                                                                    background: '#f1f5f9',
                                                                    padding: '4px 10px',
                                                                    borderRadius: 6
                                                                }}>
                                                                    0 (Not Indented)
                                                                </span>
                                                            ) : (
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
                                                                    {requestedQty}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Col 5: Action Button */}
                                                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                                            <Button
                                                                size="small"
                                                                icon={<Edit3 size={13} />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingItem(item);
                                                                    setEditModalVisible(true);
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
                                                            {isIndenter && item.original_req_id && (
                                                                <Tooltip title="Remove item from draft cart">
                                                                    <Button
                                                                        size="small"
                                                                        danger
                                                                        icon={<Trash2 size={13} />}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            Modal.confirm({
                                                                                title: 'Remove item from cart?',
                                                                                content: `Remove "${item.inventory_items?.name || 'this item'}" from your cart?`,
                                                                                okText: 'Remove',
                                                                                okButtonProps: { danger: true },
                                                                                onOk: () => handleDeleteItem(item)
                                                                            });
                                                                        }}
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            borderRadius: 6
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 5. Modals */}
            {/* Edit Quantity Modal */}
            <EditQuantityModal
                visible={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false);
                    setEditingItem(null);
                }}
                onOk={handleUpdateQuantity}
                editingItem={editingItem}
                updatingQty={updatingQty}
                isIndenter={isIndenter}
                handleDeleteItem={handleDeleteItem}
            />

            {/* PhIS Automated Terminal Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: '#0f172a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#38bdf8'
                        }}>
                            <Terminal size={17} />
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                PhIS Automation Bridge · Live Terminal
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                Submitting indent items to Hospital Segamat PhIS automatically. Do not close this dialog.
                            </div>
                        </div>
                    </div>
                }
                open={isTerminalVisible}
                onCancel={handleAbortProcess}
                footer={[
                    <Button
                        key="abort"
                        danger
                        type="primary"
                        size="large"
                        onClick={handleAbortProcess}
                        style={{
                            width: '100%',
                            fontWeight: 700,
                            borderRadius: 8,
                            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                        }}
                    >
                        ABORT PHIS PROCESS
                    </Button>
                ]}
                width={820}
            >
                {/* Terminal Window Box */}
                <div style={{
                    marginTop: 12,
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid #1e293b',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
                }}>
                    {/* Simulated macOS Traffic Lights Header */}
                    <div style={{
                        background: '#0f172a',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #1e293b'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginLeft: 8 }}>
                                node-playwright-worker :: session-dispatch
                            </span>
                        </div>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: '11px',
                            color: '#38bdf8',
                            fontWeight: 600
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} />
                            Live Sync Active
                        </span>
                    </div>

                    {/* Console Logs Output */}
                    <div
                        style={{
                            backgroundColor: '#060a14',
                            color: '#4ade80',
                            padding: '16px',
                            height: '400px',
                            overflowY: 'auto',
                            fontFamily: "'Fira Code', Menlo, Monaco, Consolas, monospace",
                            fontSize: '12.5px',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap'
                        }}
                    >
                        {terminalLogs.length === 0 ? (
                            <div style={{ color: '#64748b', fontStyle: 'italic' }}>Initializing automated headless browser...</div>
                        ) : (
                            terminalLogs.map((log, i) => {
                                const isErr = log.startsWith('Error:');
                                const isIndentNo = log.startsWith('The PhIS Indent Number is:');
                                const isInfo = log.includes('Navigating') || log.includes('Logging in') || log.includes('Starting');

                                return (
                                    <div
                                        key={i}
                                        style={{
                                            marginBottom: 4,
                                            color: isErr ? '#f87171' : isIndentNo ? '#fbbf24' : isInfo ? '#38bdf8' : '#4ade80',
                                            fontWeight: isIndentNo ? 800 : 400
                                        }}
                                    >
                                        {log}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </Modal>

            {/* Success Indent Modal */}
            <Modal
                title={null}
                open={!!successIndentNo}
                onCancel={() => setSuccessIndentNo(null)}
                footer={[
                    <Button
                        key="close"
                        type="primary"
                        onClick={() => setSuccessIndentNo(null)}
                        style={{ background: '#0284c7', borderColor: '#0284c7', borderRadius: 8, fontWeight: 600, width: '100%' }}
                    >
                        Done
                    </Button>
                ]}
                width={520}
            >
                <div style={{ textAlign: 'center', padding: '24px 8px 12px' }}>
                    <div style={{
                        width: 58,
                        height: 58,
                        borderRadius: '50%',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#059669',
                        marginBottom: 16,
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                    }}>
                        <CheckCircle2 size={32} />
                    </div>

                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        PhIS Indent Successfully Created
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: 4 }}>
                        The automated indent order has been officially recorded in hospital PhIS.
                    </div>

                    <div style={{
                        marginTop: 20,
                        padding: '16px 20px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 16
                    }}>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7', fontFamily: 'monospace', letterSpacing: '0.8px' }}>
                            {successIndentNo}
                        </div>
                        <Button
                            type="primary"
                            icon={<Copy size={15} />}
                            onClick={() => {
                                if (navigator.clipboard && window.isSecureContext) {
                                    navigator.clipboard.writeText(successIndentNo).then(() => {
                                        message.success('Indent Number copied!');
                                    }).catch(() => {
                                        message.error('Failed to copy. Please copy manually.');
                                    });
                                } else {
                                    const textArea = document.createElement("textarea");
                                    textArea.value = successIndentNo;
                                    textArea.style.position = "fixed";
                                    textArea.style.opacity = "0";
                                    document.body.appendChild(textArea);
                                    textArea.focus();
                                    textArea.select();
                                    try {
                                        document.execCommand('copy');
                                        message.success('Indent Number copied!');
                                    } catch (err) {
                                        message.error('Failed to copy. Please copy manually.');
                                    }
                                    document.body.removeChild(textArea);
                                }
                            }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#0284c7',
                                borderColor: '#0284c7',
                                borderRadius: 8,
                                fontWeight: 600
                            }}
                        >
                            Copy
                        </Button>
                    </div>

                    {/* Skipped Items Notice */}
                    {skippedItems.length > 0 && (
                        <div style={{
                            marginTop: 24,
                            textAlign: 'left',
                            background: '#fff1f0',
                            padding: '16px',
                            borderRadius: 12,
                            border: '1px solid #ffa39e'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#cf1322', fontWeight: 700, fontSize: '13.5px', marginBottom: 4 }}>
                                <AlertCircle size={16} />
                                <span>Items Skipped (Manual Review Required)</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#78350f', marginBottom: 10 }}>
                                The following items were not indented and require manual action:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {skippedItems.map((item, idx) => (
                                    <div key={idx} style={{ padding: '6px 10px', background: '#ffffff', borderRadius: 6, border: '1px solid #fecaca' }}>
                                        <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b' }}>
                                            {item.item_code} {item.item_name && `(${item.item_name})`}
                                        </div>
                                        <div style={{ fontSize: '11.5px', color: '#dc2626' }}>
                                            {item.reason}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <style>{`
        .cart-drug-row:hover {
          background: #f8fafc !important;
        }
      `}</style>
        </div>
    );
};

export default CartDesktopView;
