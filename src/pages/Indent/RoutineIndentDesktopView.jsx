import React from 'react';
import { Typography, Card, Button, InputNumber, Input, Spin, Collapse } from 'antd';
import { LeftOutlined, RightOutlined, EditOutlined } from '@ant-design/icons';
import ShortExpModal from '../../components/ShortExpModal';

const { Title, Text } = Typography;
const { TextArea } = Input;

const RoutineIndentDesktopView = ({
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
    handleNext,
    handlePrevious
}) => {
    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 50 }}>
                <Spin size="large" tip="Loading Page..." />
            </div>
        );
    }

    if (!currentItem || items.length === 0) return null;

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
                            <div style={{ fontSize: '20px', whiteSpace: 'normal', lineHeight: '1.4', paddingTop: '10px' }}>
                                {currentItem.name}
                            </div>
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
                                        onChange={handleMaxQtyChange}
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
                                        onChange={handleBalanceChange}
                                        style={{ width: '100%' }}
                                        disabled={loadingItem}
                                    />
                                </div>
                            </div>

                            <hr style={{ border: 0, borderTop: '1px dashed #d9d9d9', margin: '16px 0' }} />

                            <div>
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

export default RoutineIndentDesktopView;
