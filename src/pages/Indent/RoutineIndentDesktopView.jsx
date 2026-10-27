import React, { useEffect, useMemo } from 'react';
import { Typography, Button, InputNumber, Input, Spin, Collapse, Tooltip, Tag, Modal } from 'antd';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Edit3,
    Calendar,
    AlertTriangle,
    Layers,
    ClipboardList,
    Clock,
    Sparkles,
    CornerDownLeft,
    XCircle
} from 'lucide-react';
import ShortExpModal from '../../components/ShortExpModal';
import { getPuchaseTypeColor, getStdKtColor, getUnitColor } from '../../lib/colorMappings';

const { Title, Text } = Typography;
const { TextArea } = Input;

const RoutineIndentDesktopView = ({
    rak,
    items = [],
    currentIndex = 0,
    currentItem,
    progressPercent = 0,
    loading,
    saving,
    loadingItem,
    cancelling = false,
    cancelIndent,
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
    handleNext,
    handlePrevious
}) => {
    const handleConfirmCancel = () => {
        Modal.confirm({
            title: 'Cancel Routine Indent?',
            icon: <AlertTriangle color="#ef4444" size={22} style={{ marginRight: 8 }} />,
            content: (
                <div>
                    Are you sure you want to cancel this routine indent for <strong>Rak {rak}</strong>?
                    <div style={{ marginTop: 6, fontSize: '13px', color: '#64748b' }}>
                        All recorded indent quantities and progress for this shelf will be cleared and discarded.
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
    // Focus balance input whenever current item changes
    useEffect(() => {
        if (!loadingItem && balanceInputRef?.current) {
            const timer = setTimeout(() => {
                try {
                    balanceInputRef.current.focus();
                    if (typeof balanceInputRef.current.select === 'function') {
                        balanceInputRef.current.select();
                    }
                } catch (e) {
                    // Ignore focus exceptions
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, loadingItem, balanceInputRef]);

    const isLastItem = currentIndex === items.length - 1;
    const suggestedQuota = currentMaxQty !== null && currentBalance !== null
        ? Math.max(0, (Number(currentMaxQty) || 0) - (Number(currentBalance) || 0))
        : null;

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: 400 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, fontSize: '14px', color: '#64748b', fontWeight: 600 }}>
                    Initializing shelf inventory for Rak {rak}...
                </div>
            </div>
        );
    }

    if (!currentItem || items.length === 0) {
        return (
            <div style={{
                maxWidth: 600,
                margin: '60px auto',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '40px 24px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                    No Items Found for Rak: {rak}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: 20 }}>
                    There are no drugs mapped to this storage shelf in the inventory catalog.
                </div>
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
                    Cancel Indent & Return
                </Button>
            </div>
        );
    }

    return (
        <div className="routine-indent-desktop-view" style={{ maxWidth: 840, margin: '0 auto', paddingBottom: 50 }}>
            {/* 1. Header & Shelf Progress Stepper */}
            <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '18px 22px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                marginBottom: 16
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                                Rak {rak}
                            </span>
                            <h2 style={{
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: 800,
                                color: '#0f172a',
                                fontFamily: "'Plus Jakarta Sans', sans-serif"
                            }}>
                                Routine Indent Entry
                            </h2>
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: 3 }}>
                            Please input balance for each item · Item <strong>{currentIndex + 1}</strong> of <strong>{items.length}</strong>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                            fontSize: '13px',
                            fontWeight: 800,
                            color: '#0284c7',
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            padding: '4px 12px',
                            borderRadius: 20
                        }}>
                            {progressPercent}% Complete
                        </span>

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
                                fontSize: '13px',
                                borderColor: '#fca5a5',
                                color: '#dc2626',
                                background: '#fef2f2',
                                boxShadow: '0 1px 2px rgba(220, 38, 38, 0.05)'
                            }}
                        >
                            Cancel Indent
                        </Button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #0284c7 0%, #6366f1 100%)',
                        width: `${progressPercent}%`,
                        borderRadius: 4,
                        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 0 10px rgba(2, 132, 199, 0.4)'
                    }} />
                </div>
            </div>

            {/* 2. Main Drug Inspection Card */}
            <Spin spinning={loadingItem} tip="Loading drug details...">
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    padding: '24px 26px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                    marginBottom: 16,
                    position: 'relative'
                }}>
                    {/* Item Badge & Specifications */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 10 }}>
                        {currentItem.item_code && (
                            <span style={{
                                fontSize: '11.5px',
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                color: '#334155',
                                background: '#f1f5f9',
                                padding: '2px 8px',
                                borderRadius: 4
                            }}>
                                {currentItem.item_code}
                            </span>
                        )}
                        {currentItem.pku && (
                            <span style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#c2410c',
                                background: '#fff7ed',
                                border: '1px solid #ffedd5',
                                padding: '2px 9px',
                                borderRadius: 6
                            }}>
                                {currentItem.pku}
                            </span>
                        )}
                        {currentItem.puchase_type && (
                            <Tag color={getPuchaseTypeColor(currentItem.puchase_type)} style={{ margin: 0, fontSize: '11px', fontWeight: 600 }}>
                                {currentItem.puchase_type}
                            </Tag>
                        )}
                        {currentItem.std_kt && (
                            <Tag color={getStdKtColor(currentItem.std_kt)} style={{ margin: 0, fontSize: '11px', fontWeight: 600 }}>
                                {currentItem.std_kt}
                            </Tag>
                        )}
                        {currentItem.main_unit && (
                            <Tag color={getUnitColor(currentItem.main_unit)} style={{ margin: 0, fontSize: '11px', fontWeight: 700 }}>
                                {currentItem.main_unit}
                            </Tag>
                        )}
                    </div>

                    {/* Drug Name Heading */}
                    <div style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        color: '#0f172a',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        lineHeight: 1.3,
                        marginBottom: 20
                    }}>
                        {currentItem.name}
                    </div>

                    {/* Shelf Counting Inputs Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 14,
                        marginBottom: 18
                    }}>
                        {/* Max Quota Card */}
                        <div style={{
                            background: '#fff7ed',
                            border: '1px solid #ffedd5',
                            borderRadius: 12,
                            padding: '16px 18px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontSize: '11.5px', color: '#c2410c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                    Max Qty
                                </span>
                            </div>
                            <div style={{ fontSize: '26px', fontWeight: 800, color: '#ea580c', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                {currentMaxQty !== null ? currentMaxQty : '-'}
                            </div>
                        </div>

                        {/* Current Shelf Balance (Input) */}
                        <div style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: 12,
                            padding: '16px 18px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontSize: '11.5px', color: '#0f172a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                    Balance
                                </span>
                            </div>
                            <InputNumber
                                ref={balanceInputRef}
                                size="large"
                                min={0}
                                placeholder="Count balance"
                                value={currentBalance}
                                inputMode="numeric"
                                onChange={handleBalanceChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleNext();
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    borderRadius: 8,
                                    fontSize: '20px',
                                    fontWeight: 800
                                }}
                                disabled={loadingItem}
                            />
                            <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                                {[0, 1, 2, 5, 10].map(val => (
                                    <Button
                                        key={val}
                                        size="small"
                                        onClick={() => handleBalanceChange(val)}
                                        style={{ fontSize: '11px', padding: '0 8px', borderRadius: 4 }}
                                    >
                                        {val}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Indent Request Quantity (Input) */}
                        <div style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 12,
                            padding: '16px 18px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontSize: '11.5px', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                    Indent Quantity
                                </span>
                            </div>
                            <InputNumber
                                size="large"
                                min={0}
                                value={currentQty}
                                inputMode="numeric"
                                onChange={setCurrentQty}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleNext();
                                    }
                                }}
                                style={{
                                    width: '100%',
                                    borderRadius: 8,
                                    fontSize: '20px',
                                    fontWeight: 800
                                }}
                                disabled={loadingItem}
                            />
                            <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                                <Button size="small" onClick={() => setCurrentQty(0)} style={{ fontSize: '11px' }}>Set 0</Button>
                                <Button size="small" onClick={() => setCurrentQty(q => Math.max(0, (q || 0) + 1))} style={{ fontSize: '11px' }}>+1</Button>
                                {suggestedQuota !== null && (
                                    <Button
                                        size="small"
                                        type="dashed"
                                        style={{ color: '#16a34a', borderColor: '#86efac', fontSize: '11px' }}
                                        onClick={() => setCurrentQty(suggestedQuota)}
                                    >
                                        Suggested ({suggestedQuota})
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 3. Short Expiry & Remarks Row */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                        padding: '12px 16px',
                        background: '#fafafa',
                        border: '1px solid #f1f5f9',
                        borderRadius: 12,
                        marginBottom: 16
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: '#fef3c7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#d97706'
                            }}>
                                <Calendar size={16} />
                            </div>
                            <div>
                                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b' }}>
                                    Record Short Expiry Batch
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                    Add near-expiry batches detected during checking.
                                </div>
                            </div>
                        </div>

                        <Button
                            icon={<Edit3 size={13} />}
                            onClick={() => setIsShortExpModalOpen(true)}
                            disabled={loadingItem}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                borderRadius: 8,
                                fontSize: '12.5px',
                                fontWeight: 600,
                                borderColor: '#fcd34d',
                                color: '#b45309'
                            }}
                        >
                            Add Short Expiry
                        </Button>
                    </div>

                    {/* 4. Remarks (for Issuer) */}
                    <Collapse
                        ghost
                        items={[
                            {
                                key: '1',
                                label: (
                                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b' }}>
                                        + Add Remarks (for Issuer)
                                    </span>
                                ),
                                children: (
                                    <TextArea
                                        rows={2}
                                        placeholder=""
                                        value={currentRemarks}
                                        onChange={(e) => setCurrentRemarks(e.target.value)}
                                        disabled={loadingItem}
                                        style={{ borderRadius: 8, fontSize: '13px' }}
                                    />
                                ),
                            },
                        ]}
                    />
                </div>
            </Spin>

            {/* 5. Navigation Bar */}
            <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '14px 20px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Button
                        size="large"
                        icon={<ArrowLeft size={16} />}
                        disabled={currentIndex === 0 || loadingItem}
                        onClick={handlePrevious}
                        loading={saving || loadingItem}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: '13.5px'
                        }}
                    >
                        Previous
                    </Button>

                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#94a3b8' }}>
                    <CornerDownLeft size={13} />
                    <span>Press <strong>Enter</strong> to advance</span>
                </div>

                <Button
                    type="primary"
                    size="large"
                    onClick={handleNext}
                    loading={saving || loadingItem}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: '14px',
                        background: isLastItem ? '#10b981' : '#0284c7',
                        borderColor: isLastItem ? '#10b981' : '#0284c7',
                        boxShadow: isLastItem ? '0 2px 8px rgba(16, 185, 129, 0.3)' : '0 2px 8px rgba(2, 132, 199, 0.3)'
                    }}
                >
                    {isLastItem ? (
                        <>Finish Rak Audit <Check size={16} /></>
                    ) : (
                        <>Next Drug <ArrowRight size={16} /></>
                    )}
                </Button>
            </div>

            {/* Short Expiry Modal Component */}
            <ShortExpModal
                isOpen={isShortExpModalOpen}
                onClose={() => setIsShortExpModalOpen(false)}
                selectedItem={currentItem}
            />
        </div>
    );
};

export default RoutineIndentDesktopView;
