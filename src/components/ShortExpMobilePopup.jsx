import React, { useState, useEffect } from 'react';
import {
    Popup,
    Button,
    Input,
    TextArea,
    DatePicker,
    SafeArea,
    SpinLoading,
    CapsuleTabs,
    ConfigProvider
} from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';
import {
    CloseOutlined,
    PlusOutlined,
    DeleteOutlined,
    CalendarOutlined,
    MinusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getSourceColor, getUnitColor } from '../lib/colorMappings';

const ShortExpMobilePopup = ({
    isOpen,
    onClose,
    selectedItem,
    batches,
    loading,
    saving,
    handleSave,
    handleChange,
    handleAddBatch,
    handleRemoveBatch
}) => {
    const [activeKey, setActiveKey] = useState('');
    const [datePickerVisible, setDatePickerVisible] = useState(false);

    // Keep activeKey synced with available batches
    useEffect(() => {
        if (batches.length > 0) {
            const exists = batches.some(b => b.key === activeKey);
            if (!exists) {
                setActiveKey(batches[0].key);
            }
        }
    }, [batches, activeKey]);

    const activeBatch = batches.find(b => b.key === activeKey) || batches[0];

    const onAdd = () => {
        const newKey = handleAddBatch();
        setActiveKey(newKey);
    };

    const onRemove = (keyToRemove) => {
        const remaining = batches.filter(b => b.key !== keyToRemove);
        handleRemoveBatch(keyToRemove);
        if (remaining.length > 0) {
            setActiveKey(remaining[remaining.length - 1].key);
        }
    };

    const adjustActiveQty = (delta) => {
        if (!activeBatch) return;
        const current = Number(activeBatch.qty) || 0;
        const next = Math.max(0, current + delta);
        handleChange(activeBatch.key, 'qty', next);
    };

    return (
        <Popup
            visible={isOpen}
            onMaskClick={onClose}
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
            {/* Grab Bar & Top Header */}
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
                        Edit Short Expiry
                    </span>
                    <button
                        onClick={onClose}
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

            {/* Scrollable Content */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px 14px 90px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
            }}>
                {/* Drug Info Summary */}
                {selectedItem && (
                    <div style={{
                        background: '#ffffff',
                        borderRadius: 12,
                        padding: '12px 14px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}>
                        <div style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#1e293b',
                            lineHeight: 1.3,
                            marginBottom: 6
                        }}>
                            {selectedItem.name}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {selectedItem.pku && (
                                <span style={{
                                    display: 'inline-block',
                                    background: '#fff7e6',
                                    color: '#d46b08',
                                    border: '1px solid #ffd591',
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 600
                                }}>
                                    PKU: {selectedItem.pku}
                                </span>
                            )}
                            {selectedItem.main_unit && (
                                <span style={{
                                    display: 'inline-block',
                                    background: '#f6ffed',
                                    color: '#389e0d',
                                    border: '1px solid #b7eb8f',
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 500
                                }}>
                                    {selectedItem.main_unit}
                                </span>
                            )}
                            {selectedItem.row && (
                                <span style={{
                                    display: 'inline-block',
                                    background: '#f0f5ff',
                                    color: '#1d39c4',
                                    border: '1px solid #adc6ff',
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 500
                                }}>
                                    Rak: {selectedItem.row}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {loading ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px 0',
                        gap: 10
                    }}>
                        <SpinLoading color="primary" />
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>Loading batches...</span>
                    </div>
                ) : (
                    <>
                        {/* Batches Selector Bar */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8
                        }}>
                            <div style={{ flex: 1, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                                <CapsuleTabs activeKey={activeKey} onChange={setActiveKey}>
                                    {batches.map((batch, index) => (
                                        <CapsuleTabs.Tab
                                            title={`Batch ${index + 1}`}
                                            key={batch.key}
                                        />
                                    ))}
                                </CapsuleTabs>
                            </div>
                            <Button
                                size="small"
                                shape="rounded"
                                onClick={onAdd}
                                disabled={saving}
                                style={{
                                    borderColor: '#1677ff',
                                    color: '#1677ff',
                                    fontWeight: 600,
                                    fontSize: 12,
                                    flexShrink: 0
                                }}
                            >
                                <PlusOutlined style={{ marginRight: 4 }} /> Add
                            </Button>
                        </div>

                        {/* Active Batch Form Card */}
                        {activeBatch && (
                            <div style={{
                                background: '#ffffff',
                                borderRadius: 14,
                                padding: '16px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 14
                            }}>
                                {/* Batch Number */}
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                                        Batch Number
                                    </div>
                                    <Input
                                        placeholder="Enter batch number (e.g. B24018)"
                                        value={activeBatch.batch_no}
                                        onChange={val => handleChange(activeBatch.key, 'batch_no', val)}
                                        disabled={saving}
                                        style={{
                                            border: '1px solid #cbd5e1',
                                            borderRadius: 8,
                                            padding: '8px 12px',
                                            '--font-size': '14px'
                                        }}
                                    />
                                </div>

                                {/* Quantity with Steppers */}
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                                        Quantity
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <Button
                                            size="middle"
                                            disabled={saving || !activeBatch.qty || activeBatch.qty <= 0}
                                            onClick={() => adjustActiveQty(-1)}
                                            style={{
                                                borderRadius: 8,
                                                width: 40,
                                                height: 40,
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderColor: '#cbd5e1'
                                            }}
                                        >
                                            <MinusOutlined style={{ fontSize: 14 }} />
                                        </Button>

                                        <div style={{
                                            flex: 1,
                                            border: '1px solid #cbd5e1',
                                            borderRadius: 8,
                                            padding: '4px 8px'
                                        }}>
                                            <Input
                                                type="number"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                placeholder="0"
                                                value={activeBatch.qty !== null && activeBatch.qty !== undefined ? activeBatch.qty : ''}
                                                onChange={val => handleChange(activeBatch.key, 'qty', val === '' ? null : Number(val))}
                                                disabled={saving}
                                                style={{
                                                    '--text-align': 'center',
                                                    '--font-size': '18px',
                                                    fontWeight: 700,
                                                    color: '#0f172a'
                                                }}
                                            />
                                        </div>

                                        <Button
                                            size="middle"
                                            disabled={saving}
                                            onClick={() => adjustActiveQty(1)}
                                            style={{
                                                borderRadius: 8,
                                                width: 40,
                                                height: 40,
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderColor: '#cbd5e1'
                                            }}
                                        >
                                            <PlusOutlined style={{ fontSize: 14 }} />
                                        </Button>
                                    </div>
                                </div>

                                {/* Expiry Date (Touch Trigger + Native Wheel Picker) */}
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                                        Expiry Date
                                    </div>
                                    <div
                                        onClick={() => !saving && setDatePickerVisible(true)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 14px',
                                            background: '#ffffff',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: 8,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <span style={{
                                            color: activeBatch.date ? '#0f172a' : '#94a3b8',
                                            fontSize: 14,
                                            fontWeight: activeBatch.date ? 600 : 400
                                        }}>
                                            {activeBatch.date ? activeBatch.date.format('DD/MM/YYYY') : 'Tap to select expiry date'}
                                        </span>
                                        <CalendarOutlined style={{ color: '#1677ff', fontSize: 16 }} />
                                    </div>

                                    {/* antd-mobile Wheel Date Picker */}
                                    <ConfigProvider locale={enUS}>
                                        <DatePicker
                                            title="Expiry Date"
                                            visible={datePickerVisible}
                                            onClose={() => setDatePickerVisible(false)}
                                            value={activeBatch.date ? activeBatch.date.toDate() : new Date()}
                                            onConfirm={val => {
                                                handleChange(activeBatch.key, 'date', dayjs(val));
                                                setDatePickerVisible(false);
                                            }}
                                            precision="day"
                                            locale={{
                                                okText: 'OK',
                                                dismissText: 'Cancel',
                                            }}
                                        />
                                    </ConfigProvider>
                                </div>

                                {/* Remarks */}
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                                        Remarks
                                    </div>
                                    <TextArea
                                        rows={2}
                                        placeholder="E.g. dispose, offered to other ward..."
                                        value={activeBatch.se_remarks}
                                        onChange={val => handleChange(activeBatch.key, 'se_remarks', val)}
                                        disabled={saving}
                                        showCount
                                        maxLength={100}
                                        style={{
                                            border: '1px solid #cbd5e1',
                                            borderRadius: 8,
                                            padding: '8px',
                                            '--font-size': '13px'
                                        }}
                                    />
                                </div>

                                {/* Remove Batch Button (if more than 1 batch) */}
                                {batches.length > 1 && (
                                    <div style={{ marginTop: 6, textAlign: 'right' }}>
                                        <Button
                                            size="small"
                                            color="danger"
                                            fill="none"
                                            disabled={saving}
                                            onClick={() => onRemove(activeBatch.key)}
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 600,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4
                                            }}
                                        >
                                            <DeleteOutlined /> Remove this batch
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Sticky Bottom Action Buttons */}
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
                        disabled={saving}
                        onClick={onClose}
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
                        loading={saving}
                        onClick={handleSave}
                        style={{
                            flex: 1,
                            fontWeight: 700,
                            fontSize: 15
                        }}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </Popup>
    );
};

export default ShortExpMobilePopup;
