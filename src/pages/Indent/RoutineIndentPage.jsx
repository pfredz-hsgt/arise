import React, { useState, useEffect, useRef } from 'react';
import { Typography, Card, Button, InputNumber, Input, Row, Col, Spin, message, DatePicker, Checkbox, Steps, Space, Collapse } from 'antd';
import { LeftOutlined, RightOutlined, EditOutlined } from '@ant-design/icons';
import { api } from '../../lib/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import ShortExpModal from '../../components/ShortExpModal';

const { Title, Text } = Typography;
const { TextArea } = Input;

const RoutineIndentPage = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [sessionId, setSessionId] = useState(null);

    // Store user inputs for the current item
    const [currentMaxQty, setCurrentMaxQty] = useState(0);
    const [currentQty, setCurrentQty] = useState(0);
    const [currentBalance, setCurrentBalance] = useState(null);
    const [currentRemarks, setCurrentRemarks] = useState('');
    const [isShortExpModalOpen, setIsShortExpModalOpen] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const rak = searchParams.get('rak');
    const resumeItemId = searchParams.get('resumeItemId');
    const initRakRef = useRef(null);
    const balanceInputRef = useRef(null);

    useEffect(() => {
        if (!loading && !loadingItem && balanceInputRef.current) {
            setTimeout(() => {
                balanceInputRef.current?.focus({ cursor: 'end' });
            }, 50);
        }
    }, [currentIndex, loading, loadingItem]);

    useEffect(() => {
        if (!rak) {
            navigate('/home');
            return;
        }
        if (initRakRef.current !== rak) {
            initRakRef.current = rak;
            initSession();
        }
    }, [rak]);

    const initSession = async () => {
        setLoading(true);
        try {
            // 1. Find or create a Draft session for this user
            let sessionData = await api.get('/indent_sessions/draft?session_type=Routine');
            let currentSessionId = sessionData?.id;

            if (!sessionData) {
                const newSession = await api.post('/indent_sessions', {
                    session_type: 'Routine',
                    status: 'Draft',
                    rak: rak
                });
                currentSessionId = newSession.id;
            } else {
                // If resuming a draft, update the rak.
                await api.put(`/indent_sessions/${currentSessionId}`, { rak: rak });
            }

            setSessionId(currentSessionId);

            // 2. Fetch inventory items for this rak
            const invItems = await api.get(`/inventory?indent_source=OPD Substor&row=${encodeURIComponent(rak)}`);

            if (!invItems || invItems.length === 0) {
                message.warning({ content: `No items found in Rak ${rak}`, key: 'no-items' });
                navigate('/home');
                return;
            }

            setItems(invItems);

            // 3. Load draft data for the specified or first item
            let startIndex = 0;
            if (resumeItemId) {
                const foundIndex = invItems.findIndex(i => i.id === resumeItemId);
                if (foundIndex !== -1) {
                    startIndex = foundIndex;
                }
            }
            setCurrentIndex(startIndex);
            await loadItemData(invItems[startIndex].id, currentSessionId, invItems);

        } catch (error) {
            console.error(error);
            message.error("Failed to initialize routine session.");
        } finally {
            setLoading(false);
        }
    };

    const loadItemData = async (itemId, sid = sessionId, sourceItems = items) => {
        const data = await api.get(`/indent_items?session_id=${sid}&item_id=${itemId}`);

        const invItem = sourceItems.find(i => i.id === itemId);
        const maxQty = invItem?.max_qty || 0;
        const balance = invItem?.balance || 0;
        const defaultQty = Math.max(0, maxQty - balance);

        if (data) {

            setCurrentRemarks(data.indent_remarks || '');
            setCurrentMaxQty(maxQty);
            setCurrentBalance(balance);
            setCurrentQty(data.requested_qty || defaultQty);
        } else {
            // Reset to defaults
            setCurrentMaxQty(maxQty);
            setCurrentQty(defaultQty);
            setCurrentBalance(balance);
            setCurrentRemarks('');
        }
    };

    const saveCurrentData = async () => {
        if (!items[currentIndex]) return true;

        setSaving(true);
        try {
            const currentItem = items[currentIndex];

            // Upsert the data
            const upsertData = {
                session_id: sessionId,
                item_id: currentItem.id,
                requested_qty: currentQty,
                indent_remarks: currentRemarks,
                snapshot_max_qty: currentMaxQty,
                snapshot_balance: currentBalance,
            };

            // check if row already exists
            const existing = await api.get(`/indent_items?session_id=${sessionId}&item_id=${currentItem.id}`);

            if (existing) {
                await api.put(`/indent_items/${existing.id}`, upsertData);
            } else {
                await api.post('/indent_items', upsertData);
            }

            // Save balance if it was adjusted
            const inventoryUpdates = {};
            if (currentBalance !== currentItem.balance) {
                inventoryUpdates.balance = currentBalance;
            }

            if (Object.keys(inventoryUpdates).length > 0) {
                await api.put(`/inventory/${currentItem.id}`, inventoryUpdates);
                // Update local items array so we don't think it changed next time
                setItems(prevItems => prevItems.map(item => item.id === currentItem.id ? { ...item, ...inventoryUpdates } : item));
            }

            return true;
        } catch (error) {
            console.error(error);
            message.error("Failed to save item data.");
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        const success = await saveCurrentData();
        if (success) {
            if (currentIndex < items.length - 1) {
                const nextIndex = currentIndex + 1;
                setLoadingItem(true);
                try {
                    api.put(`/indent_sessions/${sessionId}`, { last_item: items[nextIndex].id }).catch(console.error);
                    await loadItemData(items[nextIndex].id, sessionId);
                    setCurrentIndex(nextIndex);
                } finally {
                    setLoadingItem(false);
                }
            } else {
                // Done! Navigate to summary
                navigate('/routine-summary');
            }
        }
    };

    const handlePrevious = async () => {
        const success = await saveCurrentData();
        if (success && currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setLoadingItem(true);
            try {
                api.put(`/indent_sessions/${sessionId}`, { last_item: items[prevIndex].id }).catch(console.error);
                await loadItemData(items[prevIndex].id, sessionId);
                setCurrentIndex(prevIndex);
            } finally {
                setLoadingItem(false);
            }
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" tip="Loading Page..." /></div>;
    }

    if (items.length === 0) return null;

    const currentItem = items[currentIndex];

    // Calculate progress percentage
    const progressPercent = Math.round(((currentIndex + 1) / items.length) * 100);

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Routine Indent for Rak: {rak}</Title>
                    <Text type="secondary">Item {currentIndex + 1} of {items.length}</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Text strong style={{ color: '#1890ff', fontSize: '18px' }}>{progressPercent}%</Text>
                </div>
            </div>

            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 4, marginBottom: 24, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#1890ff', width: `${progressPercent}%`, transition: 'width 0.3s' }} />
            </div>

            <Spin spinning={loadingItem} tip="Loading Item Data...">
                <Card
                    title={
                        <div>
                            <div style={{ fontSize: '20px', whiteSpace: 'normal', lineHeight: '1.4', paddingTop: '10px' }}>{currentItem.name}</div>
                            {currentItem.pku && (
                                <div style={{
                                    display: 'inline-block',
                                    background: '#ffe58f',
                                    color: '#d46b08',
                                    padding: '4px 12px',
                                    borderRadius: 16,
                                    fontWeight: 'bold',
                                    border: '1px solid #ffd591',
                                    marginTop: '10px',
                                    fontSize: '14px',
                                    marginBottom: '10px'
                                }}>
                                    {currentItem.pku}
                                </div>
                            )}
                        </div>
                    }
                    bodyStyle={{ padding: 24 }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ marginBottom: 0, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Max Qty</Text>
                                    <InputNumber
                                        size="large"
                                        min={0}
                                        value={currentMaxQty}
                                        inputMode="numeric"
                                        onChange={(val) => {
                                            setCurrentMaxQty(val);
                                            if (currentBalance !== null && val !== null) {
                                                setCurrentQty(Math.max(0, val - currentBalance));
                                            }
                                        }}
                                        style={{ width: '100%' }}
                                        readOnly
                                        disabled={loadingItem}
                                    />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Balance</Text>
                                    <InputNumber
                                        ref={balanceInputRef}
                                        size="large"
                                        min={0}
                                        placeholder="Balance"
                                        value={currentBalance}
                                        inputMode="numeric"
                                        onChange={(val) => {
                                            setCurrentBalance(val);
                                            const max = currentMaxQty || 0;
                                            if (val !== null) {
                                                const calcQty = Math.max(0, max - val);
                                                setCurrentQty(calcQty);
                                            }
                                        }}
                                        style={{ width: '100%' }}
                                        disabled={loadingItem}
                                    />
                                </div>
                            </div>

                            <hr style={{ border: 0, borderTop: '1px dashed #d9d9d9', margin: '16px 0' }} />

                            <div style={{}}>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>Indent Qty</Text>
                                <InputNumber
                                    size="large"
                                    min={0}
                                    value={currentQty}
                                    inputMode="numeric"
                                    onChange={setCurrentQty}
                                    style={{ width: '100%' }}
                                    disabled={loadingItem}
                                />
                            </div>
                        </div>
                        <Card size="small" style={{ background: '#fff8f2ff', textAlign: 'center', padding: '8px 0' }}>
                            <Button
                                type="dashed"
                                icon={<EditOutlined />}
                                onClick={() => setIsShortExpModalOpen(true)}
                                disabled={loadingItem}
                            >
                                Edit Short Expiry Batch
                            </Button>
                        </Card>
                        <Collapse
                            ghost
                            items={[
                                {
                                    key: '1',
                                    label: <Text type="secondary">Remarks (for Issuer)</Text>,
                                    children: (
                                        <TextArea
                                            rows={2}
                                            placeholder="Put your remarks here eg: quota increased, new regimens etc"
                                            value={currentRemarks}
                                            onChange={(e) => setCurrentRemarks(e.target.value)}
                                            disabled={loadingItem}
                                        />
                                    ),
                                },
                            ]}
                        />

                    </div>
                </Card>
            </Spin>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, padding: '0 16px' }}>
                <Button
                    size="large"
                    icon={<LeftOutlined />}
                    disabled={currentIndex === 0 || loadingItem}
                    onClick={handlePrevious}
                    loading={saving || loadingItem}
                >
                    Previous
                </Button>

                <Button
                    type="primary"
                    size="large"
                    onClick={handleNext}
                    loading={saving || loadingItem}
                >
                    {currentIndex === items.length - 1 ? 'Finish' : 'Next'} <RightOutlined />
                </Button>
            </div>

            <ShortExpModal
                isOpen={isShortExpModalOpen}
                onClose={() => setIsShortExpModalOpen(false)}
                selectedItem={currentItem}
            />
        </div>
    );
};

export default RoutineIndentPage;
