import React from 'react';
import {
    NavBar,
    ProgressBar,
    Button,
    Input,
    TextArea,
    Tag,
    SafeArea,
    SpinLoading
} from 'antd-mobile';
import {
    LeftOutlined,
    RightOutlined,
    EditOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    MinusOutlined,
    PlusOutlined
} from '@ant-design/icons';
import ShortExpModal from '../../components/ShortExpModal';

const RoutineIndentMobileView = ({
    rak,
    items,
    currentIndex,
    currentItem,
    progressPercent,
    loading,
    saving,
    loadingItem,
    currentMaxQty,
    currentQty,
    setCurrentQty,
    currentBalance,
    currentRemarks,
    setCurrentRemarks,
    isShortExpModalOpen,
    setIsShortExpModalOpen,
    balanceInputRef,
    handleBalanceChange,
    handleMaxQtyChange,
    setBalanceQuick,
    adjustQty,
    adjustBalance,
    handleNext,
    handlePrevious,
    navigate
}) => {
    const [remarksExpanded, setRemarksExpanded] = React.useState(false);

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
                <span style={{ color: '#8c8c8c', fontSize: 14 }}>Loading Rak items...</span>
            </div>
        );
    }

    if (!currentItem || items.length === 0) {
        return null;
    }

    const isLastItem = currentIndex === items.length - 1;
    const isFirstItem = currentIndex === 0;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            paddingBottom: '145px', // Space for sticky bottom action bar + persistent TabBar
            background: '#f8fafc'
        }}>
            {/* Mobile Header / Navigation */}
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
                    onBack={() => navigate('/routine-summary')}
                    right={
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 10px',
                            background: '#e6f4ff',
                            color: '#1677ff',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 600
                        }}>
                            {currentIndex + 1} / {items.length}
                        </span>
                    }
                >
                    <span style={{ fontWeight: 600, fontSize: 16 }}>Rak {rak}</span>
                </NavBar>

            </div>

            {/* Content Area */}
            <div style={{ padding: '12px 12px 20px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Drug Info Card */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: 14,
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    border: '1px solid #f0f0f0',
                    position: 'relative'
                }}>
                    <div style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#1f2937',
                        lineHeight: 1.35,
                        marginBottom: 8
                    }}>
                        {currentItem.name}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                        {currentItem.pku && (
                            <span style={{
                                display: 'inline-block',
                                background: '#fff7e6',
                                color: '#d46b08',
                                border: '1px solid #ffd591',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600
                            }}>
                                PKU: {currentItem.pku}
                            </span>
                        )}
                        {currentItem.main_unit && (
                            <span style={{
                                display: 'inline-block',
                                background: '#f6ffed',
                                color: '#389e0d',
                                border: '1px solid #b7eb8f',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 500
                            }}>
                                {currentItem.main_unit}
                            </span>
                        )}
                        {currentItem.row && (
                            <span style={{
                                display: 'inline-block',
                                background: '#f0f5ff',
                                color: '#1d39c4',
                                border: '1px solid #adc6ff',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 500
                            }}>
                                Row: {currentItem.row}
                            </span>
                        )}
                    </div>
                </div>

                {/* Stock Counting Section */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: 14,
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    border: '1px solid #f0f0f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14
                }}>
                    {/* Max Qty vs Balance */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {/* Max Qty */}
                        <div style={{
                            background: '#f8fafc',
                            borderRadius: 10,
                            padding: '12px',
                            border: '1px solid #e2e8f0',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginBottom: 4 }}>
                                Max Qty
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#334155' }}>
                                {currentMaxQty}
                            </div>
                        </div>

                        {/* Balance (Counted on shelf) */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: 10,
                            padding: '10px',
                            border: '2px solid #1677ff',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <div style={{ fontSize: 12, color: '#1677ff', fontWeight: 600, marginBottom: 2 }}>
                                Balance
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Input
                                    ref={balanceInputRef}
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="0"
                                    value={currentBalance !== null && currentBalance !== undefined ? currentBalance : ''}
                                    onChange={(val) => handleBalanceChange(val)}
                                    disabled={loadingItem}
                                    style={{
                                        '--text-align': 'center',
                                        '--font-size': '24px',
                                        fontWeight: 700,
                                        color: '#0f172a'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick Presets for Shelf Balance */}
                    <div style={{
                        display: 'flex',
                        gap: 6,
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                            <Button
                                size="small"
                                disabled={loadingItem}
                                onClick={() => setBalanceQuick(0)}
                                style={{
                                    flex: 1,
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    borderColor: '#ffa39e',
                                    color: '#cf1322',
                                    background: '#fff1f0',
                                    padding: '6px 0'
                                }}
                            >
                                NIL (0)
                            </Button>
                            <Button
                                size="small"
                                disabled={loadingItem}
                                onClick={() => setBalanceQuick(currentMaxQty)}
                                style={{
                                    flex: 1,
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    borderColor: '#b7eb8f',
                                    color: '#389e0d',
                                    background: '#f6ffed',
                                    padding: '6px 0'
                                }}
                            >
                                MAX ({currentMaxQty})
                            </Button>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <Button
                                size="small"
                                disabled={loadingItem}
                                onClick={() => adjustBalance(-1)}
                                style={{ borderRadius: 8, width: 34, height: 32, padding: 0 }}
                            >
                                <MinusOutlined style={{ fontSize: 12 }} />
                            </Button>
                            <Button
                                size="small"
                                disabled={loadingItem}
                                onClick={() => adjustBalance(1)}
                                style={{ borderRadius: 8, width: 34, height: 32, padding: 0 }}
                            >
                                <PlusOutlined style={{ fontSize: 12 }} />
                            </Button>
                        </div>
                    </div>

                    <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

                    {/* Indent Qty (Primary Action Target) */}
                    <div style={{
                        background: '#eff6ff',
                        borderRadius: 12,
                        padding: '14px',
                        border: '1.5px solid #bfdbfe'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8
                        }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#1e40af' }}>
                                Indent Qty
                            </span>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12
                        }}>
                            <Button
                                size="middle"
                                disabled={loadingItem || currentQty <= 0}
                                onClick={() => adjustQty(-1)}
                                style={{
                                    borderRadius: 10,
                                    width: 44,
                                    height: 44,
                                    borderColor: '#93c5fd',
                                    background: '#ffffff',
                                    color: '#1d4ed8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <MinusOutlined style={{ fontSize: 16 }} />
                            </Button>

                            <div style={{
                                flex: 1,
                                background: '#ffffff',
                                borderRadius: 10,
                                border: '1.5px solid #93c5fd',
                                padding: '4px 8px'
                            }}>
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="0"
                                    value={currentQty !== undefined && currentQty !== null ? currentQty : 0}
                                    onChange={(val) => setCurrentQty(val === '' ? 0 : Number(val))}
                                    disabled={loadingItem}
                                    style={{
                                        '--text-align': 'center',
                                        '--font-size': '24px',
                                        fontWeight: 800,
                                        color: '#1e40af'
                                    }}
                                />
                            </div>

                            <Button
                                size="middle"
                                disabled={loadingItem}
                                onClick={() => adjustQty(1)}
                                style={{
                                    borderRadius: 10,
                                    width: 44,
                                    height: 44,
                                    borderColor: '#93c5fd',
                                    background: '#ffffff',
                                    color: '#1d4ed8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <PlusOutlined style={{ fontSize: 16 }} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Short Expiry Batch Quick Action */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: 14,
                    padding: '12px 14px',
                    border: '1px solid #fed7aa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 4px rgba(251,146,60,0.08)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            background: '#ffedd5',
                            color: '#ea580c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16
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
                        disabled={loadingItem}
                        onClick={() => setIsShortExpModalOpen(true)}
                        style={{
                            borderColor: '#fdba74',
                            color: '#ea580c',
                            background: '#ffffff',
                            fontWeight: 600,
                            fontSize: 12
                        }}
                    >
                        <EditOutlined style={{ marginRight: 4 }} />
                        Edit
                    </Button>
                </div>

                {/* Remarks Section */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: 14,
                    padding: '14px',
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                    <div
                        onClick={() => setRemarksExpanded(prev => !prev)}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}
                    >
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                            Remarks for Issuer {currentRemarks ? ' • 1 added' : ''}
                        </span>
                        <span style={{ fontSize: 12, color: '#1677ff', fontWeight: 500 }}>
                            {remarksExpanded ? 'Collapse' : (currentRemarks ? 'Edit' : '+ Add')}
                        </span>
                    </div>

                    {(remarksExpanded || currentRemarks) && (
                        <div style={{ marginTop: 10 }}>
                            <TextArea
                                rows={2}
                                placeholder="E.g. quota increased, new regimen, loan to ward..."
                                value={currentRemarks}
                                onChange={(val) => setCurrentRemarks(val)}
                                disabled={loadingItem}
                                showCount
                                maxLength={150}
                                style={{
                                    '--font-size': '13px',
                                    borderRadius: 8,
                                    border: '1px solid #e2e8f0',
                                    padding: '8px'
                                }}
                            />
                        </div>
                    )}
                </div>

            </div>

            {/* Sticky Bottom Thumb-Zone Navigation Bar */}
            <div style={{
                position: 'fixed',
                bottom: 50,
                left: 0,
                right: 0,
                zIndex: 100,
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
                padding: '0 12px 12px 12px' // 🛠️ Removed top padding to let the progress bar sit at the edge
            }}>
                <ProgressBar
                    percent={progressPercent}
                    style={{
                        '--track-width': '3px',
                        '--fill-color': '#1677ff',
                        margin: '0 -12px 12px -12px' // 🛠️ Negative margin pulls it flush to the left/right edges, bottom margin adds space to the buttons
                    }}
                />
                <SafeArea position="bottom" />
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Button
                        size="large"
                        shape="rounded"
                        disabled={isFirstItem || loadingItem}
                        onClick={handlePrevious}
                        loading={saving || loadingItem}
                        style={{
                            flex: '0 0 35%',
                            fontWeight: 600,
                            fontSize: 14,
                            borderColor: '#cbd5e1',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4
                        }}
                    >
                        <LeftOutlined style={{ fontSize: 13 }} /> Prev
                    </Button>

                    <Button
                        size="large"
                        shape="rounded"
                        color="primary"
                        onClick={handleNext}
                        loading={saving || loadingItem}
                        style={{
                            flex: 1,
                            fontWeight: 700,
                            fontSize: 15,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                        }}
                    >
                        {isLastItem ? (
                            <>
                                Finish & Summary <CheckCircleOutlined style={{ fontSize: 16 }} />
                            </>
                        ) : (
                            <>
                                Next <RightOutlined style={{ fontSize: 13 }} />
                            </>
                        )}
                    </Button>
                </div>
            </div>


            {/* Short Expiry Modal */}
            <ShortExpModal
                isOpen={isShortExpModalOpen}
                onClose={() => setIsShortExpModalOpen(false)}
                selectedItem={currentItem}
            />
        </div>
    );
};

export default RoutineIndentMobileView;
