import React, { useState, useEffect } from 'react';
import {
    Popup,
    Button,
    Input,
    TextArea,
    SafeArea
} from 'antd-mobile';
import {
    CloseOutlined,
    MinusOutlined,
    PlusOutlined,
    ShoppingCartOutlined
} from '@ant-design/icons';
import { message } from 'antd';
import { api } from '../../lib/api';
import { getPuchaseTypeColor, getStdKtColor, getUnitColor } from '../../lib/colorMappings';

const IndentMobilePopup = ({ drug, visible, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState(0);
    const [maxQty, setMaxQty] = useState(0);
    const [quantity, setQuantity] = useState(0);
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        if (drug) {
            const bal = Number(drug.balance) || 0;
            const max = Number(drug.max_qty) || 0;
            const calcQty = Math.max(0, max - bal);

            setBalance(bal);
            setMaxQty(max);
            setQuantity(calcQty);
            setRemarks('');
        }
    }, [drug, visible]);

    if (!drug) return null;

    const handleBalanceChange = (val) => {
        const num = val === '' ? 0 : Number(val);
        setBalance(num);
        setQuantity(Math.max(0, maxQty - num));
    };

    const setBalanceQuick = (val) => {
        const num = Number(val);
        setBalance(num);
        setQuantity(Math.max(0, maxQty - num));
    };

    const adjustBalance = (delta) => {
        const next = Math.max(0, (Number(balance) || 0) + delta);
        setBalance(next);
        setQuantity(Math.max(0, maxQty - next));
    };

    const adjustQuantity = (delta) => {
        setQuantity(prev => Math.max(0, (Number(prev) || 0) + delta));
    };

    const handleSubmit = async () => {
        if (!quantity || quantity < 1) {
            message.warning('Quantity must be at least 1');
            return;
        }

        try {
            setLoading(true);
            await api.post('/indents', {
                item_id: drug.id,
                requested_qty: quantity,
                status: 'Pending',
                snapshot_max_qty: maxQty,
                snapshot_balance: balance,
                indent_remarks: remarks || null,
            });
            onSuccess();
        } catch (error) {
            console.error('Error adding to cart:', error);
            message.error('Failed to add item to cart');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Popup
            visible={visible}
            onMaskClick={() => onClose(false)}
            position="bottom"
            bodyStyle={{
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: '92vh',
                minHeight: '55vh',
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
                        Add to Urgent Indent
                    </span>
                    <button
                        onClick={() => onClose(false)}
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
                {/* Drug Info Summary Card */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: 14,
                    padding: '14px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                    <div style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#1e293b',
                        lineHeight: 1.35,
                        marginBottom: 6
                    }}>
                        {drug.name}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {drug.pku && (
                            <span style={{
                                background: '#fff7e6',
                                color: '#d46b08',
                                border: '1px solid #ffd591',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600
                            }}>
                                PKU: {drug.pku}
                            </span>
                        )}
                        {drug.main_unit && (
                            <span style={{
                                background: '#f6ffed',
                                color: '#389e0d',
                                border: '1px solid #b7eb8f',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 500
                            }}>
                                {drug.main_unit}
                            </span>
                        )}
                        {drug.row && (
                            <span style={{
                                background: '#f0f5ff',
                                color: '#1d39c4',
                                border: '1px solid #adc6ff',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 500
                            }}>
                                Row: {drug.row}
                            </span>
                        )}
                        {drug.puchase_type && (
                            <span style={{
                                background: '#fff1f0',
                                color: getPuchaseTypeColor(drug.puchase_type),
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 500
                            }}>
                                {drug.puchase_type}
                            </span>
                        )}
                        {drug.std_kt && (
                            <span style={{
                                background: '#f9f0ff',
                                color: getStdKtColor(drug.std_kt),
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 500
                            }}>
                                {drug.std_kt}
                            </span>
                        )}
                    </div>
                </div>

                {/* Stock Qty & Balance Card */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: 14,
                    padding: '14px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {/* Max Qty */}
                        <div style={{
                            background: '#f8fafc',
                            borderRadius: 10,
                            padding: '10px',
                            border: '1px solid #e2e8f0',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Max Qty</div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: '#334155' }}>{maxQty}</div>
                        </div>

                        {/* Balance */}
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
                                value={balance !== null && balance !== undefined ? balance : ''}
                                onChange={handleBalanceChange}
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
                            onClick={() => setBalanceQuick(0)}
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
                            onClick={() => setBalanceQuick(maxQty)}
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
                            MAX ({maxQty})
                        </Button>
                        <Button
                            size="small"
                            onClick={() => adjustBalance(-1)}
                            style={{ borderRadius: 8, width: 34, height: 32, padding: 0 }}
                        >
                            <MinusOutlined style={{ fontSize: 12 }} />
                        </Button>
                        <Button
                            size="small"
                            onClick={() => adjustBalance(1)}
                            style={{ borderRadius: 8, width: 34, height: 32, padding: 0 }}
                        >
                            <PlusOutlined style={{ fontSize: 12 }} />
                        </Button>
                    </div>

                    <div style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />

                    {/* Indent Quantity Target */}
                    <div style={{
                        background: '#eff6ff',
                        borderRadius: 12,
                        padding: '12px',
                        border: '1.5px solid #bfdbfe'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8
                        }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>
                                Indent Quantity
                            </span>

                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Button
                                size="middle"
                                disabled={quantity <= 0}
                                onClick={() => adjustQuantity(-1)}
                                style={{
                                    borderRadius: 8,
                                    width: 42,
                                    height: 42,
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
                                    value={quantity !== undefined && quantity !== null ? quantity : 0}
                                    onChange={val => setQuantity(val === '' ? 0 : Number(val))}
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
                                onClick={() => adjustQuantity(1)}
                                style={{
                                    borderRadius: 8,
                                    width: 42,
                                    height: 42,
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

                {/* Remarks Input */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: 14,
                    padding: '12px',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        Remarks (Optional)
                    </div>
                    <TextArea
                        rows={2}
                        placeholder="E.g. urgent quota boost, loan to ward..."
                        value={remarks}
                        onChange={setRemarks}
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

            {/* Sticky Bottom Buttons */}
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
                        disabled={loading}
                        onClick={() => onClose(false)}
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
                        loading={loading}
                        onClick={handleSubmit}
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
                        <ShoppingCartOutlined /> Add to Indent
                    </Button>
                </div>
            </div>
        </Popup>
    );
};

export default IndentMobilePopup;
