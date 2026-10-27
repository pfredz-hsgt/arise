import React, { useState, useMemo } from 'react';
import {
    NavBar,
    ProgressBar,
    Button,
    Input,
    TextArea,
    Popup,
    Dialog,
    SafeArea,
    SpinLoading,
    CapsuleTabs,
    SearchBar
} from 'antd-mobile';
import {
    LeftOutlined,
    SendOutlined,
    EditOutlined,
    CheckCircleOutlined,
    CalendarOutlined,
    MinusOutlined,
    PlusOutlined,
    CloseOutlined,
    PlayCircleOutlined,
    MessageOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ShortExpModal from '../../components/ShortExpModal';

const RoutineSummaryMobileView = ({
    profile,
    sessionData,
    indentItems,
    loading,
    submitting,
    cancelling = false,
    cancelIndent,
    editingItem,
    setEditingItem,
    editMaxQty,
    editBalance,
    editQty,
    setEditQty,
    editRemarks,
    setEditRemarks,
    editSaving,
    isShortExpModalOpen,
    setIsShortExpModalOpen,
    lastItemIndex,
    progressPercent,
    indentedCount,
    handleEditClick,
    handleSaveEdit,
    submitIndent,
    handleResume,
    setEditBalanceQuick,
    adjustEditBalance,
    adjustEditQty,
    navigate
}) => {
    const [filterTab, setFilterTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const handleConfirmCancel = () => {
        Dialog.confirm({
            title: 'Cancel Routine Indent?',
            content: `Are you sure you want to cancel this indent session for Rak ${sessionData?.rak}? All progress for this shelf will be cleared and discarded.`,
            confirmText: 'Cancel Indent',
            cancelText: 'Keep Auditing',
            onConfirm: async () => {
                if (cancelIndent) {
                    await cancelIndent();
                }
            }
        });
    };

    // Filter items based on active tab and search query
    const filteredItems = useMemo(() => {
        return indentItems.filter(item => {
            const matchesSearch = !searchQuery ||
                item.inventory_items?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.inventory_items?.pku?.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (filterTab === 'indented') {
                return (item.requested_qty || 0) > 0;
            }
            if (filterTab === 'zero') {
                return !item.requested_qty || item.requested_qty === 0;
            }
            return true;
        });
    }, [indentItems, filterTab, searchQuery]);

    const handleConfirmSend = () => {
        Dialog.confirm({
            title: 'Send Indent to Substore?',
            content: 'Once submitted, this indent cannot be edited anymore.',
            confirmText: 'Submit',
            cancelText: 'Cancel',
            onConfirm: async () => {
                await submitIndent();
            }
        });
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
                <span style={{ color: '#8c8c8c', fontSize: 14 }}>Loading summary...</span>
            </div>
        );
    }

    const totalCount = indentItems.length;
    const zeroCount = totalCount - indentedCount;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            paddingBottom: '140px', // Space for fixed bottom action bar + persistent TabBar
            background: '#f8fafc'
        }}>
            {/* Mobile Header */}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Button
                                size="small"
                                shape="rounded"
                                color="danger"
                                fill="outline"
                                onClick={handleConfirmCancel}
                                loading={cancelling}
                                style={{
                                    fontWeight: 600,
                                    fontSize: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    borderColor: '#fca5a5',
                                    color: '#dc2626',
                                    background: '#fff5f5'
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="small"
                                shape="rounded"
                                color="primary"
                                fill="outline"
                                onClick={handleResume}
                                style={{
                                    fontWeight: 600,
                                    fontSize: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                }}
                            >
                                <PlayCircleOutlined /> Resume
                            </Button>
                        </div>
                    }
                >
                    <span style={{ fontWeight: 700, fontSize: 16 }}>
                        Indent Summary - Rak {sessionData?.rak}
                    </span>
                </NavBar>
            </div>

            {/* Content Area */}
            <div style={{ padding: '12px 12px 20px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Session Metrics Card */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: 14,
                    padding: '14px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    border: '1px solid #f0f0f0'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 10
                    }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                                Routine Indent Session
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                By {profile?.name || 'Staff'} • {dayjs(sessionData?.created_at).format('DD/MM/YYYY HH:mm')}
                            </div>
                        </div>
                        {sessionData?.rak && (
                            <span style={{
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600
                            }}>
                                Rak: {sessionData.rak}
                            </span>
                        )}
                    </div>

                    {/* Progress Bar & Stopped Indicator */}
                    <div style={{ marginTop: 6, marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                            <span>Progress</span>
                            <span style={{ fontWeight: 600, color: '#1677ff' }}>{progressPercent}%</span>
                        </div>
                        <ProgressBar
                            percent={progressPercent}
                            style={{
                                '--track-width': '5px',
                                '--fill-color': '#1677ff'
                            }}
                        />
                        {lastItemIndex >= 0 && (
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                                Stopped at item {lastItemIndex + 1} of {totalCount}
                            </div>
                        )}
                    </div>

                    {/* Metrics 3-Col Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 8,
                        background: '#f8fafc',
                        borderRadius: 10,
                        padding: '10px 8px',
                        textAlign: 'center'
                    }}>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{totalCount}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Items Checked</div>
                        </div>
                        <div style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>{indentedCount}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Indent Items</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#64748b' }}>{zeroCount}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Not Indented</div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <SearchBar
                    placeholder="Search medicine or PKU..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    style={{
                        '--background': '#ffffff',
                        '--border-radius': '10px',
                        border: '1px solid #e2e8f0'
                    }}
                />

                {/* Filter Tabs */}
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <CapsuleTabs activeKey={filterTab} onChange={setFilterTab}>
                        <CapsuleTabs.Tab title={`All (${totalCount})`} key="all" />
                        <CapsuleTabs.Tab title={`Indent (${indentedCount})`} key="indented" />
                        <CapsuleTabs.Tab title={`No Indent (${zeroCount})`} key="zero" />
                    </CapsuleTabs>
                </div>

                {/* Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filteredItems.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '30px 16px',
                            color: '#94a3b8',
                            fontSize: 13,
                            background: '#ffffff',
                            borderRadius: 12,
                            border: '1px dashed #cbd5e1'
                        }}>
                            No medicines match the selected filter.
                        </div>
                    ) : (
                        filteredItems.map((item, index) => {
                            const isLastItem = item.item_id === sessionData?.last_item;
                            const isIndented = (item.requested_qty || 0) > 0;

                            return (
                                <div
                                    key={item.id || index}
                                    onClick={() => handleEditClick(item)}
                                    style={{
                                        background: isLastItem ? '#fffaf5' : '#ffffff',
                                        borderRadius: 12,
                                        padding: '12px 14px',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                                        border: isLastItem
                                            ? '1.5px solid #fdba74'
                                            : isIndented
                                                ? '1.5px solid #83ffaeff'
                                                : '1px solid #f0f0f0',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                >
                                    {/* Top Row: Name + Action Badge */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        gap: 8,
                                        marginBottom: 6
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <span style={{
                                                fontSize: 15,
                                                fontWeight: 700,
                                                color: '#1e293b',
                                                lineHeight: 1.3
                                            }}>
                                                {item.inventory_items?.name}
                                            </span>
                                            {item.inventory_items?.pku && (
                                                <span style={{
                                                    display: 'inline-block',
                                                    background: '#fff7e6',
                                                    color: '#d46b08',
                                                    border: '1px solid #ffd591',
                                                    padding: '1px 6px',
                                                    borderRadius: 4,
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    marginLeft: 6
                                                }}>
                                                    {item.inventory_items.pku}
                                                </span>
                                            )}
                                        </div>

                                        {isLastItem && (
                                            <span style={{
                                                background: '#ffedd5',
                                                color: '#ea580c',
                                                padding: '2px 6px',
                                                borderRadius: 6,
                                                fontSize: 10,
                                                fontWeight: 700,
                                                textTransform: 'uppercase'
                                            }}>
                                                LAST CHECKED
                                            </span>
                                        )}
                                    </div>

                                    {/* Middle Row: Shelf Metrics (Max & Bal) */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 16,
                                        fontSize: 12,
                                        color: '#64748b',
                                        marginBottom: 8
                                    }}>
                                        <span>Max: <strong style={{ color: '#334155' }}>{item.inventory_items?.max_qty ?? 0}</strong></span>
                                        <span>Bal: <strong style={{ color: '#334155' }}>{item.inventory_items?.balance ?? 0}</strong></span>
                                    </div>

                                    {/* Remarks Preview */}
                                    {item.indent_remarks && (
                                        <div style={{
                                            fontSize: 11,
                                            color: '#64748b',
                                            background: '#f8fafc',
                                            padding: '4px 8px',
                                            borderRadius: 6,
                                            marginBottom: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4
                                        }}>
                                            <MessageOutlined style={{ color: '#1677ff' }} />
                                            <span style={{ fontStyle: 'italic' }}>{item.indent_remarks}</span>
                                        </div>
                                    )}

                                    {/* Bottom Row: Requested Qty & Edit Trigger */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderTop: '1px solid #f1f5f9',
                                        paddingTop: 8
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                                                Requested Qty:
                                            </span>
                                            <span style={{
                                                fontSize: 17,
                                                fontWeight: 500,
                                                color: isIndented ? '#16a34a' : '#94a3b8'
                                            }}>
                                                {item.requested_qty || 0}
                                            </span>
                                            {isIndented && (
                                                <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 15 }} />
                                            )}
                                        </div>

                                        <button
                                            style={{
                                                background: '#f1f5f9',
                                                border: 'none',
                                                borderRadius: 6,
                                                padding: '4px 8px',
                                                fontSize: 11,
                                                color: '#475569',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <EditOutlined /> Edit
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Sticky Bottom Action Bar */}
            <div style={{
                position: 'fixed',
                bottom: 50,
                left: 0,
                right: 0,
                zIndex: 100,
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
                padding: '10px 14px'
            }}>
                <SafeArea position="bottom" />
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Button
                        size="large"
                        shape="rounded"
                        color="danger"
                        fill="outline"
                        loading={cancelling}
                        onClick={handleConfirmCancel}
                        style={{
                            fontWeight: 600,
                            fontSize: 14,
                            borderColor: '#fca5a5',
                            color: '#dc2626',
                            background: '#fff5f5',
                            padding: '0 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}
                    >
                        <CloseCircleOutlined style={{ fontSize: 14 }} /> Cancel
                    </Button>
                    <Button
                        size="large"
                        shape="rounded"
                        color="primary"
                        loading={submitting}
                        onClick={handleConfirmSend}
                        style={{
                            flex: 1,
                            fontWeight: 600,
                            fontSize: 15,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                        }}
                    >
                        <SendOutlined /> Confirm & Submit ({indentedCount} Items)
                    </Button>
                </div>
            </div>

            {/* Item Edit Bottom Sheet Popup */}
            <Popup
                visible={!!editingItem}
                onMaskClick={() => setEditingItem(null)}
                position="bottom"
                bodyStyle={{
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    maxHeight: '92vh',
                    minHeight: '60vh',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#f8fafc',
                    overflow: 'hidden'
                }}
            >
                {/* Grab Bar & Header */}
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
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                            Edit Item
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

                {/* Edit Form Content */}
                {editingItem && (
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '14px 14px 90px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                    }}>
                        {/* Drug Name Card */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: 12,
                            padding: '12px 14px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                                {editingItem.inventory_items?.name}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {editingItem.inventory_items?.pku && (
                                    <span style={{
                                        background: '#fff7e6',
                                        color: '#d46b08',
                                        border: '1px solid #ffd591',
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        fontSize: 11,
                                        fontWeight: 600
                                    }}>
                                        PKU: {editingItem.inventory_items.pku}
                                    </span>
                                )}
                                {editingItem.inventory_items?.main_unit && (
                                    <span style={{
                                        background: '#f6ffed',
                                        color: '#389e0d',
                                        border: '1px solid #b7eb8f',
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        fontSize: 11,
                                        fontWeight: 500
                                    }}>
                                        {editingItem.inventory_items.main_unit}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Stock Counting Section */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: 14,
                            padding: '14px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                        }}>
                            {/* Max Qty vs Balance */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div style={{
                                    background: '#f8fafc',
                                    borderRadius: 10,
                                    padding: '10px',
                                    border: '1px solid #e2e8f0',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Max Qty</div>
                                    <div style={{ fontSize: 22, fontWeight: 700, color: '#334155' }}>{editMaxQty}</div>
                                </div>

                                <div style={{
                                    background: '#ffffff',
                                    borderRadius: 10,
                                    padding: '8px',
                                    border: '2px solid #1677ff',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 11, color: '#1677ff', fontWeight: 600, marginBottom: 2 }}>Balance</div>
                                    <Input
                                        type="number"
                                        inputMode="numeric"
                                        value={editBalance !== null && editBalance !== undefined ? editBalance : ''}
                                        onChange={val => {
                                            const num = val === '' ? 0 : Number(val);
                                            setEditBalance(num);
                                            setEditQty(Math.max(0, editMaxQty - num));
                                        }}
                                        style={{
                                            '--text-align': 'center',
                                            '--font-size': '22px',
                                            fontWeight: 700,
                                            color: '#0f172a'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Quick Presets for Balance */}
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <Button
                                    size="small"
                                    onClick={() => setEditBalanceQuick(0)}
                                    style={{
                                        flex: 1,
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        borderColor: '#ffa39e',
                                        color: '#cf1322',
                                        background: '#fff1f0'
                                    }}
                                >
                                    NIL (0)
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => setEditBalanceQuick(editMaxQty)}
                                    style={{
                                        flex: 1,
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        borderColor: '#b7eb8f',
                                        color: '#389e0d',
                                        background: '#f6ffed'
                                    }}
                                >
                                    MAX ({editMaxQty})
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => adjustEditBalance(-1)}
                                    style={{ borderRadius: 8, width: 34, height: 32, padding: 0 }}
                                >
                                    <MinusOutlined style={{ fontSize: 12 }} />
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => adjustEditBalance(1)}
                                    style={{ borderRadius: 8, width: 34, height: 32, padding: 0 }}
                                >
                                    <PlusOutlined style={{ fontSize: 12 }} />
                                </Button>
                            </div>

                            <div style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />

                            {/* Indent Qty */}
                            <div style={{
                                background: '#eff6ff',
                                borderRadius: 10,
                                padding: '12px',
                                border: '1.5px solid #bfdbfe'
                            }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 8 }}>
                                    Indent Qty
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Button
                                        size="middle"
                                        disabled={editQty <= 0}
                                        onClick={() => adjustEditQty(-1)}
                                        style={{
                                            borderRadius: 8,
                                            width: 40,
                                            height: 40,
                                            borderColor: '#93c5fd',
                                            background: '#ffffff',
                                            color: '#1d4ed8'
                                        }}
                                    >
                                        <MinusOutlined style={{ fontSize: 14 }} />
                                    </Button>

                                    <div style={{
                                        flex: 1,
                                        background: '#ffffff',
                                        borderRadius: 8,
                                        border: '1.5px solid #93c5fd',
                                        padding: '4px'
                                    }}>
                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            value={editQty !== undefined && editQty !== null ? editQty : 0}
                                            onChange={val => setEditQty(val === '' ? 0 : Number(val))}
                                            style={{
                                                '--text-align': 'center',
                                                '--font-size': '22px',
                                                fontWeight: 800,
                                                color: '#1e40af'
                                            }}
                                        />
                                    </div>

                                    <Button
                                        size="middle"
                                        onClick={() => adjustEditQty(1)}
                                        style={{
                                            borderRadius: 8,
                                            width: 40,
                                            height: 40,
                                            borderColor: '#93c5fd',
                                            background: '#ffffff',
                                            color: '#1d4ed8'
                                        }}
                                    >
                                        <PlusOutlined style={{ fontSize: 14 }} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Short Expiry Batch Quick Button */}
                        <div style={{
                            background: '#fffaf5',
                            borderRadius: 12,
                            padding: '12px',
                            border: '1px solid #fed7aa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 16,
                                    background: '#ffedd5',
                                    color: '#ea580c',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 14
                                }}>
                                    <CalendarOutlined />
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#9a3412' }}>
                                        Short Expiry Batch
                                    </div>
                                    <div style={{ fontSize: 11, color: '#c2410c' }}>
                                        If available
                                    </div>
                                </div>
                            </div>
                            <Button
                                size="small"
                                shape="rounded"
                                onClick={() => setIsShortExpModalOpen(true)}
                                style={{
                                    borderColor: '#fdba74',
                                    color: '#ea580c',
                                    background: '#ffffff',
                                    fontWeight: 600,
                                    fontSize: 12
                                }}
                            >
                                <EditOutlined style={{ marginRight: 4 }} /> Edit
                            </Button>
                        </div>

                        {/* Remarks */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: 12,
                            padding: '12px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                                Remarks (for Issuer)
                            </div>
                            <TextArea
                                rows={2}
                                placeholder=""
                                value={editRemarks}
                                onChange={setEditRemarks}
                                showCount
                                maxLength={150}
                                style={{
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 8,
                                    padding: '8px',
                                    '--font-size': '13px'
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Edit Sticky Bottom Buttons */}
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
                            disabled={editSaving}
                            onClick={() => setEditingItem(null)}
                            style={{
                                flex: '0 0 32%',
                                fontWeight: 600,
                                fontSize: 14,
                                borderColor: '#cbd5e1',
                                color: '#475569'
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="large"
                            shape="rounded"
                            color="primary"
                            loading={editSaving}
                            onClick={handleSaveEdit}
                            style={{
                                flex: 1,
                                fontWeight: 700,
                                fontSize: 15
                            }}
                        >
                            Save Item
                        </Button>
                    </div>
                </div>
            </Popup>

            {/* Short Expiry Modal */}
            <ShortExpModal
                isOpen={isShortExpModalOpen}
                onClose={() => setIsShortExpModalOpen(false)}
                selectedItem={editingItem?.inventory_items}
            />
        </div>
    );
};

export default RoutineSummaryMobileView;
