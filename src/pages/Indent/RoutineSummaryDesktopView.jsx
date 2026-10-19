import React from 'react';
import { Typography, Table, Button, InputNumber, Card, Space, Tag, Modal, Spin, List, Affix, Progress, Input, Collapse } from 'antd';
import { SendOutlined, UnorderedListOutlined, TableOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ShortExpModal from '../../components/ShortExpModal';

const { Title, Text } = Typography;
const { TextArea } = Input;

const RoutineSummaryDesktopView = ({
    profile,
    sessionData,
    indentItems,
    loading,
    submitting,
    viewMode,
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
    lastItemIndex,
    progressPercent,
    handleEditClick,
    handleSaveEdit,
    handleSend,
    handleResume
}) => {
    if (loading) {
        return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
    }

    const columns = [
        {
            title: 'Item Name',
            dataIndex: ['inventory_items', 'name'],
            key: 'name',
            render: (text, record) => (
                <div>
                    <Text strong>{text}</Text>
                    {record.inventory_items?.pku && (
                        <Tag color="orange" style={{ marginLeft: 8 }}>{record.inventory_items.pku}</Tag>
                    )}
                </div>
            )
        },
        {
            title: 'Max Qty',
            key: 'max_qty',
            width: 90,
            align: 'center',
            render: (_, record) => <Text>{record.inventory_items?.max_qty ?? 0}</Text>
        },
        {
            title: 'Balance',
            key: 'balance',
            width: 90,
            align: 'center',
            render: (_, record) => <Text>{record.inventory_items?.balance ?? 0}</Text>
        },
        {
            title: 'Remarks',
            dataIndex: 'indent_remarks',
            key: 'remarks',
            render: (text) => text || <Text type="secondary" italic>No remarks</Text>
        },
        {
            title: 'Requested Qty',
            key: 'qty',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Text strong>{record.requested_qty}</Text>
                    {record.requested_qty > 0 && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                </Space>
            )
        },
        {
            title: 'Action',
            key: 'action',
            width: 80,
            align: 'center',
            render: (_, record) => (
                <Button type="text" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); handleEditClick(record); }} />
            )
        }
    ];

    const renderListItem = (record) => (
        <List.Item>
            <Card
                size="small"
                hoverable
                style={{
                    width: '100%',
                    cursor: 'pointer',
                    borderColor: record.requested_qty > 0 ? '#00df43ff' : undefined,
                    backgroundColor: record.item_id === sessionData?.last_item ? '#ffecd7ff' : undefined
                }}
                onClick={() => handleEditClick(record)}
            >
                <div style={{ marginBottom: '8px' }}>
                    <Text strong>{record.inventory_items?.name}</Text>
                    {record.inventory_items?.pku && (
                        <Tag color="orange" style={{ marginLeft: 8 }}>{record.inventory_items.pku}</Tag>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                    <Text type="secondary">Max: <Text strong>{record.inventory_items?.max_qty ?? 0}</Text></Text>
                    <Text type="secondary">Bal: <Text strong>{record.inventory_items?.balance ?? 0}</Text></Text>
                </div>
                {record.indent_remarks && (
                    <div style={{ marginBottom: '8px' }}>
                        <Text type="secondary" italic>{record.indent_remarks}</Text>
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                    <Text strong>Requested Qty:</Text>
                    <Space>
                        <Text strong style={{ fontSize: '16px' }}>{record.requested_qty}</Text>
                        {record.requested_qty > 0 && <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />}
                    </Space>
                </div>
            </Card>
        </List.Item>
    );

    return (
        <div>
            <style>{`
                .highlight-row > td { background-color: #fff1e6ff !important; }
            `}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Indent Summary</Title>
                    <Text type="secondary">Created by: {profile?.name} at {dayjs(sessionData?.created_at).format('DD/MM/YYYY HH:mm:ss')}</Text>
                    {indentItems.length > 0 && (
                        <div style={{ marginTop: 8, maxWidth: 300 }}>
                            <Progress percent={progressPercent} size="small" />
                            {lastItemIndex >= 0 && (
                                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                                    Stopped at item {lastItemIndex + 1} of {indentItems.length}
                                </Text>
                            )}
                        </div>
                    )}
                </div>
                <Space wrap style={{ alignItems: 'center' }}>
                    {sessionData?.rak && (
                        <Tag color="blue" style={{ fontSize: '16px', padding: '4px 12px' }}>Rak: {sessionData.rak}</Tag>
                    )}
                    <Affix offsetTop={16}>
                        <Button onClick={handleResume} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 100 }}>
                            Resume
                        </Button>
                    </Affix>
                    <Space>
                        <Button
                            type={viewMode === 'list' ? 'primary' : 'default'}
                            icon={<UnorderedListOutlined />}
                            onClick={() => setViewMode('list')}
                        />
                        <Button
                            type={viewMode === 'table' ? 'primary' : 'default'}
                            icon={<TableOutlined />}
                            onClick={() => setViewMode('table')}
                        />
                    </Space>
                </Space>
            </div>

            <Card style={{ marginBottom: 24 }} bodyStyle={{ padding: viewMode === 'table' ? 0 : 16 }}>
                {viewMode === 'table' ? (
                    <Table
                        columns={columns}
                        dataSource={indentItems}
                        rowKey="id"
                        pagination={false}
                        scroll={{ y: 500 }}
                        onRow={(record) => ({
                            onClick: () => handleEditClick(record),
                            style: { cursor: 'pointer' }
                        })}
                        rowClassName={(record) => record.item_id === sessionData?.last_item ? 'highlight-row' : ''}
                    />
                ) : (
                    <List
                        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
                        dataSource={indentItems}
                        renderItem={renderListItem}
                        pagination={false}
                    />
                )}
            </Card>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <Button
                    type="primary"
                    size="medium"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    loading={submitting}
                >
                    Confirm & Send
                </Button>
            </div>

            <Modal
                title={`${editingItem?.inventory_items?.name} (${editingItem?.inventory_items?.pku || ''})`}
                open={!!editingItem}
                onCancel={() => setEditingItem(null)}
                onOk={handleSaveEdit}
                confirmLoading={editSaving}
                width={800}
                destroyOnClose
            >
                {editingItem && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                        <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Max Qty</Text>
                                    <InputNumber
                                        size="large"
                                        min={0}
                                        value={editMaxQty}
                                        onChange={(val) => {
                                            setEditMaxQty(val);
                                            if (editBalance !== null && val !== null) {
                                                setEditQty(Math.max(0, val - editBalance));
                                            }
                                        }}
                                        style={{ width: '100%' }}
                                        readOnly
                                    />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Balance</Text>
                                    <InputNumber
                                        size="large"
                                        min={0}
                                        value={editBalance}
                                        inputMode="numeric"
                                        autoFocus
                                        onChange={(val) => {
                                            setEditBalance(val);
                                            const max = editMaxQty || 0;
                                            if (val !== null) {
                                                setEditQty(Math.max(0, max - val));
                                            }
                                        }}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <hr style={{ border: 0, borderTop: '1px dashed #d9d9d9', margin: '16px 0' }} />

                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>Indent Qty</Text>
                                <InputNumber
                                    size="large"
                                    min={0}
                                    value={editQty}
                                    onChange={setEditQty}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        <Card size="small" style={{ background: '#fff8f2ff', textAlign: 'center', padding: '8px 0' }}>
                            <Button
                                type="dashed"
                                icon={<EditOutlined />}
                                onClick={() => setIsShortExpModalOpen(true)}
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
                                            value={editRemarks}
                                            onChange={(e) => setEditRemarks(e.target.value)}
                                        />
                                    ),
                                },
                            ]}
                        />
                    </div>
                )}
            </Modal>

            <ShortExpModal
                isOpen={isShortExpModalOpen}
                onClose={() => setIsShortExpModalOpen(false)}
                selectedItem={editingItem?.inventory_items}
            />
        </div>
    );
};

export default RoutineSummaryDesktopView;
