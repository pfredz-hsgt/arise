import React, { useState } from 'react';
import {
    NavBar,
    Button,
    Popup,
    Dialog,
    SafeArea,
    SpinLoading,
    Checkbox,
    Input
} from 'antd-mobile';
import {
    LeftOutlined,
    CheckCircleOutlined,
    EyeOutlined,
    DownloadOutlined,
    CopyOutlined,
    CloseOutlined,
    MinusOutlined,
    PlusOutlined,
    DownOutlined,
    UpOutlined,
    ExclamationCircleOutlined,
    RobotOutlined
} from '@ant-design/icons';
import { message } from 'antd';
import { getPuchaseTypeColor, getStdKtColor, getUnitColor } from '../../lib/colorMappings';
import dayjs from 'dayjs';

const CartMobileView = ({
    unit,
    loading,
    sessions,
    selectedSessions,
    editingItem,
    setEditingItem,
    updatingQty,
    isTerminalVisible,
    terminalLogs,
    successIndentNo,
    setSuccessIndentNo,
    skippedItems,
    handleUpdateQuantity,
    startPhisIndent,
    handleAbortProcess,
    handleClearSession,
    previewSingleSessionPDF,
    processPDFExport,
    toggleSessionSelect,
    toggleSelectAll,
    navigate
}) => {
    // Keep track of which session cards are expanded
    const [expandedSessions, setExpandedSessions] = useState(() => {
        // Expand first session by default
        return sessions.length > 0 ? [sessions[0].id] : [];
    });

    // Local state for quantity editing popup
    const [localQty, setLocalQty] = useState(0);

    const toggleExpand = (sessionId) => {
        setExpandedSessions(prev =>
            prev.includes(sessionId)
                ? prev.filter(id => id !== sessionId)
                : [...prev, sessionId]
        );
    };

    const openEditItem = (item) => {
        setEditingItem(item);
        setLocalQty(item.requested_qty || 0);
    };

    const handleConfirmPhis = (session) => {
        Dialog.confirm({
            title: 'Confirm PhIS Indent',
            content: `Proceed with automated PhIS indent for ${session.profiles?.name || 'this session'} (${session.indent_items?.length} items)?`,
            confirmText: 'Yes, Proceed',
            cancelText: 'Cancel',
            onConfirm: () => {
                startPhisIndent(session);
            }
        });
    };

    const handleConfirmApprove = (session) => {
        Dialog.confirm({
            title: 'Approve & Clear Indent?',
            content: 'Kew.PS-8 PDF will be automatically generated and opened in a new tab.',
            confirmText: 'Approve',
            cancelText: 'Cancel',
            onConfirm: () => {
                previewSingleSessionPDF(session);
                handleClearSession(session.id);
            }
        });
    };

    const copyIndentNo = () => {
        if (!successIndentNo) return;
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
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                gap: 12
            }}>
                <SpinLoading color="primary" style={{ '--size': '42px' }} />
                <span style={{ color: '#8c8c8c', fontSize: 14 }}>Loading cart sessions...</span>
            </div>
        );
    }

    const allSelected = sessions.length > 0 && selectedSessions.length === sessions.length;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            paddingBottom: '30px',
            background: '#f8fafc'
        }}>
            {/* Header */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: '#ffffff',
                borderBottom: '1px solid #f0f0f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
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
                    <span style={{ fontWeight: 700, fontSize: 16 }}>
                        Issuer Cart
                    </span>
                </NavBar>

                {/* Bulk Actions & Selection Bar */}
                {sessions.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: 12
                    }}>
                        <div
                            onClick={toggleSelectAll}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                        >
                            <Checkbox checked={allSelected} />
                            <span style={{ fontWeight: 600, color: '#334155' }}>
                                Select All ({selectedSessions.length}/{sessions.length})
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                            <Button
                                size="small"
                                shape="rounded"
                                disabled={selectedSessions.length === 0}
                                onClick={() => processPDFExport('preview')}
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    borderColor: selectedSessions.length > 0 ? '#7c3aed' : '#cbd5e1',
                                    color: selectedSessions.length > 0 ? '#7c3aed' : '#94a3b8',
                                    background: selectedSessions.length > 0 ? '#f5f3ff' : '#ffffff'
                                }}
                            >
                                <EyeOutlined style={{ marginRight: 3 }} /> PDF
                            </Button>
                            <Button
                                size="small"
                                shape="rounded"
                                disabled={selectedSessions.length === 0}
                                onClick={() => processPDFExport('download')}
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    borderColor: selectedSessions.length > 0 ? '#0284c7' : '#cbd5e1',
                                    color: selectedSessions.length > 0 ? '#0284c7' : '#94a3b8',
                                    background: selectedSessions.length > 0 ? '#f0f9ff' : '#ffffff'
                                }}
                            >
                                <DownloadOutlined style={{ marginRight: 3 }} /> Download
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sessions.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 16px',
                        background: '#ffffff',
                        borderRadius: 14,
                        border: '1px dashed #cbd5e1',
                        color: '#94a3b8'
                    }}>
                        <CheckCircleOutlined style={{ fontSize: 32, color: '#16a34a', marginBottom: 8 }} />
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>All clear!</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>No submitted indents waiting for approval.</div>
                    </div>
                ) : (
                    sessions.map((session) => {
                        const isExpanded = expandedSessions.includes(session.id);
                        const isSelected = selectedSessions.includes(session.id);
                        const isUrgent = session.session_type === 'Urgent Indent';

                        return (
                            <div
                                key={session.id}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: 14,
                                    border: isSelected ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Session Header */}
                                <div style={{ padding: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                            <div onClick={(e) => { e.stopPropagation(); toggleSessionSelect(session.id); }}>
                                                <Checkbox checked={isSelected} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                                                    {session.profiles?.name || 'Unknown Indenter'}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                                                    {dayjs(session.created_at).format('DD/MM/YYYY HH:mm')}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            <span style={{
                                                background: isUrgent ? '#fef2f2' : '#eff6ff',
                                                color: isUrgent ? '#dc2626' : '#2563eb',
                                                border: `1px solid ${isUrgent ? '#fecaca' : '#bfdbfe'}`,
                                                padding: '1px 6px',
                                                borderRadius: 4,
                                                fontSize: 10,
                                                fontWeight: 600
                                            }}>
                                                {session.session_type}
                                            </span>
                                            {session.rak && (
                                                <span style={{
                                                    background: '#faf5ff',
                                                    color: '#7e22ce',
                                                    border: '1px solid #e9d5ff',
                                                    padding: '1px 6px',
                                                    borderRadius: 4,
                                                    fontSize: 10,
                                                    fontWeight: 600
                                                }}>
                                                    Rak: {session.rak}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons Row */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', justifyContent: 'end', marginTop: 10 }}>
                                        <Button
                                            size="small"
                                            shape="rounded"
                                            onClick={() => handleConfirmApprove(session)}
                                            style={{
                                                borderColor: '#86efac',
                                                color: '#15803d',
                                                background: '#f0fdf4',
                                                fontSize: 12,
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 4,
                                                gridColumnStart: 2 // Forces the button into the second column (right side)
                                            }}
                                        >
                                            <CheckCircleOutlined /> Approve & Clear
                                        </Button>
                                    </div>


                                    {/* Expand / Collapse Bar */}
                                    <div
                                        onClick={() => toggleExpand(session.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginTop: 10,
                                            paddingTop: 8,
                                            borderTop: '1px solid #f1f5f9',
                                            fontSize: 12,
                                            color: '#64748b',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <span style={{ fontWeight: 600 }}>
                                            {session.indent_items?.length} medicine(s) to issue
                                        </span>
                                        <span style={{ color: '#1677ff', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {isExpanded ? 'Hide' : 'View'} {isExpanded ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />}
                                        </span>
                                    </div>
                                </div>

                                {/* Collapsible Items List */}
                                {isExpanded && (
                                    <div style={{
                                        background: '#f8fafc',
                                        borderTop: '1px solid #e2e8f0',
                                        padding: '8px 12px 12px 12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 8
                                    }}>
                                        {session.indent_items.map((item, idx) => (
                                            <div
                                                key={item.id || idx}
                                                onClick={() => openEditItem(item)}
                                                style={{
                                                    background: '#ffffff',
                                                    borderRadius: 10,
                                                    padding: '10px 12px',
                                                    border: '1px solid #e2e8f0',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 4
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                                                        {item.inventory_items?.name}
                                                    </div>
                                                    <span style={{
                                                        background: '#dcfce7',
                                                        color: '#15803d',
                                                        border: '1px solid #86efac',
                                                        borderRadius: 6,
                                                        padding: '1px 8px',
                                                        fontSize: 13,
                                                        fontWeight: 800,
                                                        flexShrink: 0
                                                    }}>
                                                        Qty: {item.requested_qty || 0}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                                                    {item.inventory_items?.pku && (
                                                        <span style={{
                                                            background: '#fff7e6',
                                                            color: '#d46b08',
                                                            border: '1px solid #ffd591',
                                                            padding: '1px 5px',
                                                            borderRadius: 4,
                                                            fontSize: 10,
                                                            fontWeight: 600
                                                        }}>
                                                            {item.inventory_items.pku}
                                                        </span>
                                                    )}
                                                    {item.inventory_items?.puchase_type && (
                                                        <span style={{
                                                            background: '#fff1f0',
                                                            color: getPuchaseTypeColor(item.inventory_items.puchase_type),
                                                            padding: '1px 5px',
                                                            borderRadius: 4,
                                                            fontSize: 10
                                                        }}>
                                                            {item.inventory_items.puchase_type}
                                                        </span>
                                                    )}
                                                    <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>
                                                        Max: {item.snapshot_max_qty ?? '-'} • Bal: {item.snapshot_balance ?? '-'}
                                                    </span>
                                                </div>

                                                {item.indent_remarks && (
                                                    <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', background: '#f1f5f9', padding: '3px 6px', borderRadius: 4, marginTop: 2 }}>
                                                        Remarks: {item.indent_remarks}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Edit Quantity Bottom Sheet Popup */}
            <Popup
                visible={!!editingItem}
                onMaskClick={() => setEditingItem(null)}
                position="bottom"
                bodyStyle={{
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    maxHeight: '85vh',
                    minHeight: '45vh',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#f8fafc',
                    overflow: 'hidden'
                }}
            >
                <div style={{
                    padding: '12px 16px 8px 16px',
                    background: '#ffffff',
                    borderBottom: '1px solid #f0f0f0',
                    position: 'relative'
                }}>
                    <div style={{
                        width: 38,
                        height: 4,
                        background: '#cbd5e1',
                        borderRadius: 2,
                        margin: '0 auto 10px auto'
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                            Edit Item Quantity
                        </span>
                        <button
                            onClick={() => setEditingItem(null)}
                            style={{
                                background: '#f1f5f9',
                                border: 'none',
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#64748b'
                            }}
                        >
                            <CloseOutlined style={{ fontSize: 14 }} />
                        </button>
                    </div>
                </div>

                {editingItem && (
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '14px 14px 80px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                    }}>
                        <div style={{ background: '#ffffff', borderRadius: 12, padding: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                                {editingItem.inventory_items?.name}
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {editingItem.inventory_items?.pku && (
                                    <span style={{ background: '#fff7e6', color: '#d46b08', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                                        PKU: {editingItem.inventory_items.pku}
                                    </span>
                                )}
                                {editingItem.inventory_items?.row && (
                                    <span style={{ background: '#f0f5ff', color: '#1d39c4', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
                                        Row: {editingItem.inventory_items.row}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Stock Balance vs Max */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div style={{ background: '#ffffff', borderRadius: 10, padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                <div style={{ fontSize: 11, color: '#64748b' }}>Max Qty</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#d97706' }}>
                                    {editingItem.inventory_items?.max_qty ?? '-'}
                                </div>
                            </div>
                            <div style={{ background: '#ffffff', borderRadius: 10, padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                <div style={{ fontSize: 11, color: '#64748b' }}>Balance</div>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>
                                    {editingItem.inventory_items?.balance ?? '-'}
                                </div>
                            </div>
                        </div>

                        {/* Quantity Stepper */}
                        <div style={{ background: '#eff6ff', borderRadius: 12, padding: '14px', border: '1.5px solid #bfdbfe' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 8, textAlign: 'center' }}>
                                Requested Quantity
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                <Button
                                    size="middle"
                                    disabled={localQty <= 0}
                                    onClick={() => setLocalQty(prev => Math.max(0, prev - 1))}
                                    style={{ width: 44, height: 44, borderRadius: 10, borderColor: '#93c5fd', background: '#ffffff', color: '#1d4ed8' }}
                                >
                                    <MinusOutlined style={{ fontSize: 16 }} />
                                </Button>

                                <div style={{ width: 120, background: '#ffffff', borderRadius: 10, border: '1.5px solid #93c5fd', padding: '4px' }}>
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        value={localQty}
                                        onChange={val => setLocalQty(val === '' ? 0 : Number(val))}
                                        style={{ '--text-align': 'center', '--font-size': '22px', fontWeight: 800, color: '#1e40af' }}
                                    />
                                </div>

                                <Button
                                    size="middle"
                                    onClick={() => setLocalQty(prev => prev + 1)}
                                    style={{ width: 44, height: 44, borderRadius: 10, borderColor: '#93c5fd', background: '#ffffff', color: '#1d4ed8' }}
                                >
                                    <PlusOutlined style={{ fontSize: 16 }} />
                                </Button>
                            </div>
                        </div>

                        {editingItem.indent_remarks && (
                            <div style={{ background: '#ffffff', borderRadius: 10, padding: '10px 12px', border: '1px solid #e2e8f0', fontSize: 12 }}>
                                <span style={{ fontWeight: 600, color: '#475569' }}>Remarks: </span>
                                <span style={{ color: '#0f172a' }}>{editingItem.indent_remarks}</span>
                            </div>
                        )}
                    </div>
                )}

                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    background: '#ffffff',
                    borderTop: '1px solid #e2e8f0',
                    padding: '10px 14px',
                    boxShadow: '0 -4px 12px rgba(0,0,0,0.06)'
                }}>
                    <SafeArea position="bottom" />
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Button
                            size="large"
                            shape="rounded"
                            onClick={() => setEditingItem(null)}
                            style={{ flex: '0 0 32%', fontWeight: 600, color: '#475569' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="large"
                            shape="rounded"
                            color="primary"
                            loading={updatingQty}
                            onClick={() => handleUpdateQuantity(localQty)}
                            style={{ flex: 1, fontWeight: 700 }}
                        >
                            Save Quantity
                        </Button>
                    </div>
                </div>
            </Popup>

            {/* PhIS Terminal Logs Bottom Sheet */}
            <Popup
                visible={isTerminalVisible}
                onMaskClick={() => { }}
                position="bottom"
                bodyStyle={{
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    height: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#121212',
                    overflow: 'hidden'
                }}
            >
                <div style={{
                    padding: '12px 16px',
                    background: '#1e1e1e',
                    borderBottom: '1px solid #333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#ffffff'
                }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#4af626' }}>
                        PhIS Indent Terminal
                    </span>
                    <span style={{ fontSize: 11, color: '#ff4d4f' }}>
                        DO NOT CLOSE WINDOW
                    </span>
                </div>

                <div
                    style={{
                        flex: 1,
                        padding: '14px',
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: '#4af626',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5
                    }}
                >
                    {terminalLogs.map((log, i) => (
                        <div
                            key={i}
                            style={{
                                marginBottom: 4,
                                color: log.startsWith('Error:') ? '#ff4d4f' : log.startsWith('The PhIS Indent Number is:') ? '#facc15' : 'inherit'
                            }}
                        >
                            {log}
                        </div>
                    ))}
                </div>

                <div style={{ padding: '12px', background: '#1e1e1e', borderTop: '1px solid #333' }}>
                    <SafeArea position="bottom" />
                    <Button
                        size="large"
                        shape="rounded"
                        color="danger"
                        onClick={handleAbortProcess}
                        style={{ width: '100%', fontWeight: 700 }}
                    >
                        ABORT PROCESS
                    </Button>
                </div>
            </Popup>

            {/* PhIS Success Popup */}
            <Popup
                visible={!!successIndentNo}
                onMaskClick={() => setSuccessIndentNo(null)}
                position="bottom"
                bodyStyle={{
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    padding: '20px 16px',
                    background: '#ffffff',
                    maxHeight: '80vh'
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <CheckCircleOutlined style={{ fontSize: 42, color: '#16a34a', marginBottom: 8 }} />
                    <div style={{ fontSize: 14, color: '#16a34a', fontWeight: 600 }}>
                        PhIS Indent Created Successfully
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#1e40af', margin: '14px 0' }}>
                        {successIndentNo}
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
                        <Button
                            size="middle"
                            shape="rounded"
                            color="primary"
                            onClick={copyIndentNo}
                            style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            <CopyOutlined /> Copy Number
                        </Button>
                        <Button
                            size="middle"
                            shape="rounded"
                            onClick={() => setSuccessIndentNo(null)}
                        >
                            Done
                        </Button>
                    </div>

                    {skippedItems.length > 0 && (
                        <div style={{ textAlign: 'left', background: '#fff1f0', padding: '12px', borderRadius: 10, border: '1px solid #ffa39e', marginTop: 12 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#cf1322', marginBottom: 6 }}>
                                Items Skipped (Action Required)
                            </div>
                            {skippedItems.map((item, i) => (
                                <div key={i} style={{ fontSize: 11, marginBottom: 4 }}>
                                    <strong>{item.item_code}</strong> {item.item_name && `(${item.item_name})`}
                                    <div style={{ color: '#dc2626' }}>{item.reason}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Popup>
        </div>
    );
};

export default CartMobileView;
