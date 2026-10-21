import React, { useState, useEffect } from 'react';
import {
    Typography,
    Space,
    Collapse,
    List,
    Tag,
    Button,
    Empty,
    Spin,
    Modal,
    Checkbox,
    InputNumber,
    Divider,
    Segmented,
    message
} from 'antd';
import {
    EyeOutlined,
    DownloadOutlined,
    CheckCircleOutlined,
    CopyOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { getPuchaseTypeColor, getStdKtColor, getUnitColor } from '../../lib/colorMappings';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const EditQuantityModal = ({ visible, onCancel, onOk, editingItem, updatingQty }) => {
    const [localQuantity, setLocalQuantity] = useState(0);

    useEffect(() => {
        if (visible && editingItem) {
            setLocalQuantity(Number(editingItem.requested_qty) || 0);
        }
    }, [visible, editingItem]);

    return (
        <Modal
            title="Edit Quantity"
            open={visible}
            onCancel={onCancel}
            confirmLoading={updatingQty}
            width={'450px'}
            onOk={() => onOk(localQuantity)}
        >
            {editingItem && editingItem.inventory_items && (
                <div style={{ padding: '10px 0', textAlign: 'center' }}>
                    <Title level={4} style={{ marginBottom: 4 }}>
                        {editingItem.inventory_items.name}
                    </Title>

                    {/* Item Code and PKU */}
                    <Space size="large" style={{ marginBottom: 12 }}>
                        {editingItem.inventory_items.item_code && (
                            <Text type="secondary" style={{ fontSize: '13px' }}>
                                <Text>{editingItem.inventory_items.item_code}</Text>
                            </Text>
                        )}
                        {editingItem.inventory_items.pku && (
                            <Text type="secondary" style={{ fontSize: '13px' }}>
                                PKU: <Text strong>{editingItem.inventory_items.pku}</Text>
                            </Text>
                        )}
                    </Space> <br />

                    {/* Tags */}
                    <Space wrap style={{ marginBottom: 12, justifyContent: 'center' }}>
                        {editingItem.inventory_items.puchase_type && (
                            <Tag color={getPuchaseTypeColor(editingItem.inventory_items.puchase_type)}>
                                {editingItem.inventory_items.puchase_type}
                            </Tag>
                        )}
                        {editingItem.inventory_items.std_kt && (
                            <Tag color={getStdKtColor(editingItem.inventory_items.std_kt)}>
                                {editingItem.inventory_items.std_kt}
                            </Tag>
                        )}
                        {editingItem.inventory_items.row && <Tag>Row: {editingItem.inventory_items.row}</Tag>}
                    </Space>

                    {/* Inventory Info */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        background: '#fafafa',
                        padding: '12px 0',
                        borderRadius: '6px',
                        border: '1px solid #f0f0f0',
                        marginBottom: 16
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Max Qty</Text>
                            <Text strong style={{ fontSize: '18px', color: '#fa8c16' }}>
                                {editingItem.inventory_items.max_qty !== null ? editingItem.inventory_items.max_qty : '-'}
                            </Text>
                        </div>
                        <div style={{ width: '1px', background: '#d9d9d9', margin: '0 8px' }}></div>
                        <div style={{ textAlign: 'center' }}>
                            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Balance</Text>
                            <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                                {editingItem.inventory_items.balance !== null ? editingItem.inventory_items.balance : '-'}
                            </Text>
                        </div>
                    </div>

                    <div style={{ padding: '16px', background: '#f0f2f5', borderRadius: '8px' }}>
                        <Space align="center" size="middle" direction="vertical" style={{ width: '100%' }}>
                            <Text strong style={{ fontSize: '15px' }}>Request Quantity</Text>
                            <InputNumber
                                min={0}
                                value={localQuantity}
                                onChange={setLocalQuantity}
                                size="large"
                                autoFocus
                                inputMode="numeric"
                                style={{ width: '120px' }}
                            />
                        </Space>
                    </div>

                    {/* Indent Remarks (if available) */}
                    {editingItem.indent_remarks && (
                        <div style={{
                            marginTop: 16,
                            marginBottom: 16,
                            padding: '8px 12px',
                            background: '#e6f7ff',
                            border: '1px solid #91d5ff',
                            borderRadius: '4px',
                            textAlign: 'left'
                        }}>
                            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                                Remarks:
                            </Text>
                            <Text>{editingItem.indent_remarks}</Text>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

const CartDesktopView = ({
    unit,
    loading,
    sessions,
    unitFilter,
    setUnitFilter,
    unitCounts,
    selectedSessions,
    setSelectedSessions,
    editModalVisible,
    setEditModalVisible,
    editingItem,
    setEditingItem,
    updatingQty,
    isTerminalVisible,
    terminalLogs,
    successIndentNo,
    setSuccessIndentNo,
    skippedItems,
    handleUpdateQuantity,
    handlePhisIndentClick,
    handleAbortProcess,
    handleClearSession,
    previewSingleSessionPDF,
    processPDFExport
}) => {
    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;

    const isOpd = unit === 'OPD';

    return (
        <div className="cart-page">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <Title level={3} style={{ margin: 0 }}>
                            Indent Cart
                            {isOpd ? (
                                <>
                                    <Tag color={getUnitColor('OPD')} style={{ marginLeft: 8, verticalAlign: 'middle', fontWeight: 600 }}>OPD</Tag>
                                    <Tag color={getUnitColor('ED')} style={{ marginLeft: 4, verticalAlign: 'middle', fontWeight: 600 }}>ED</Tag>
                                </>
                            ) : (
                                <Tag color={getUnitColor(unit)} style={{ marginLeft: 8, verticalAlign: 'middle', fontWeight: 600 }}>{unit}</Tag>
                            )}
                        </Title>
                        <Text type="secondary">
                            {sessions.length} submitted session(s) {isOpd ? 'from OPD & ED' : `from ${unit}`} waiting for approval
                        </Text>
                    </div>
                    <Space wrap>
                        {isOpd && unitCounts && (
                            <Segmented
                                value={unitFilter}
                                onChange={setUnitFilter}
                                options={[
                                    { label: `All (${unitCounts.all})`, value: 'ALL' },
                                    { label: `OPD (${unitCounts.opd})`, value: 'OPD' },
                                    { label: `ED (${unitCounts.ed})`, value: 'ED' },
                                ]}
                                style={{ marginRight: 8 }}
                            />
                        )}
                        <Button
                            icon={<EyeOutlined style={{ fontSize: 19 }} />}
                            onClick={() => processPDFExport('preview')}
                            disabled={selectedSessions.length === 0}
                            size="medium"
                            style={{ backgroundColor: selectedSessions.length === 0 ? undefined : '#6D28D9', borderColor: selectedSessions.length === 0 ? '#d6d6d6' : '#6D28D9', color: selectedSessions.length === 0 ? undefined : '#fff' }}
                        ><span>Preview</span></Button>
                        <Button
                            icon={<DownloadOutlined style={{ fontSize: 19 }} />}
                            onClick={() => processPDFExport('download')}
                            disabled={selectedSessions.length === 0}
                            size="medium"
                            style={{ backgroundColor: selectedSessions.length === 0 ? undefined : '#0050b3', borderColor: selectedSessions.length === 0 ? '#d6d6d6' : '#0050b3', color: selectedSessions.length === 0 ? undefined : '#fff' }}
                        >
                            <span>Download</span>
                        </Button>
                    </Space>
                </div>

                {sessions.length === 0 && <Empty description="No submitted indents waiting for approval" />}

                {sessions.length > 0 && (
                    <Collapse>
                        {sessions.map((session) => (
                            <Panel
                                header={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', width: '100%', gap: '8px', paddingRight: '8px' }}>
                                        <Space wrap style={{ flex: '1 1 auto' }}>
                                            <span onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedSessions.includes(session.id)}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setSelectedSessions(prev => checked
                                                            ? [...prev, session.id]
                                                            : prev.filter(id => id !== session.id)
                                                        );
                                                    }}
                                                />
                                            </span>
                                            <Text strong>{session.profiles?.name}</Text>
                                            {session.user_main_unit && (
                                                <Tag color={getUnitColor(session.user_main_unit)} style={{ fontWeight: 600, margin: 0 }}>
                                                    {session.user_main_unit}
                                                </Tag>
                                            )}
                                            <Tag color="#d46b08">{dayjs(session.created_at).format('DD/MM/YYYY HH:mm')}</Tag>
                                            <Tag variant='outlined' color={session.session_type === 'Urgent Indent' ? 'red' : 'geekblue'}>{session.session_type}</Tag>
                                            {session.rak && <Tag color="purple">Rak: {session.rak}</Tag>}
                                            <Text type="secondary">({session.indent_items.length} items)</Text>
                                        </Space>
                                        <Space size="small" wrap onClick={(e) => e.stopPropagation()} style={{ flex: '0 0 auto' }}>
                                            <Button
                                                size="small"
                                                onClick={(e) => { e.stopPropagation(); handlePhisIndentClick(session); }}
                                            >
                                                Indent PhIS
                                            </Button>
                                            <Button
                                                size="small"
                                                type="primary"
                                                icon={<CheckCircleOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    Modal.confirm({
                                                        title: 'Do you want to Approve and Clear this indent?',
                                                        content: 'Kew.PS-8 will be automatically generated and opened',
                                                        okText: 'Approve',
                                                        cancelText: 'Cancel',
                                                        onOk: () => {
                                                            previewSingleSessionPDF(session);
                                                            handleClearSession(session.id);
                                                        }
                                                    });
                                                }}
                                            >
                                                Approve & Clear
                                            </Button>
                                        </Space>
                                    </div>
                                }
                                key={session.id}
                            >
                                <List
                                    dataSource={session.indent_items}
                                    renderItem={(item) => (
                                        <List.Item
                                            style={{
                                                padding: '12px 0',
                                                cursor: 'pointer',
                                                opacity: (Number(item.requested_qty) || 0) === 0 ? 0.4 : 1
                                            }}
                                            onClick={() => {
                                                setEditingItem(item);
                                                setEditModalVisible(true);
                                            }}
                                        >
                                            <List.Item.Meta
                                                title={
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Text strong style={{ fontSize: '14px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                                            {item.inventory_items?.name}
                                                        </Text>
                                                        <Space wrap={false} size={[4, 4]}>
                                                            {item.inventory_items?.pku && (
                                                                <Text type="secondary" style={{ color: '#d46b08', fontSize: '13px', padding: '2px 2px' }}>({item.inventory_items?.pku})</Text>
                                                            )}
                                                            {item.inventory_items?.puchase_type && (
                                                                <Tag color={getPuchaseTypeColor(item.inventory_items?.puchase_type)} style={{ margin: 0 }}>
                                                                    {item.inventory_items?.puchase_type}
                                                                </Tag>
                                                            )}
                                                            {item.inventory_items?.std_kt && (
                                                                <Tag color={getStdKtColor(item.inventory_items?.std_kt)} style={{ margin: 0 }}>
                                                                    {item.inventory_items?.std_kt}
                                                                </Tag>
                                                            )}
                                                        </Space>
                                                    </div>
                                                }
                                                description={
                                                    <div style={{ marginTop: 8 }}>
                                                        <Space
                                                            split={
                                                                <Divider
                                                                    type="vertical"
                                                                    style={{
                                                                        borderColor: "#00a2ffff",
                                                                        height: 20,
                                                                        margin: "0 4px",
                                                                    }}
                                                                />
                                                            }
                                                            size="small"
                                                            align="center"
                                                        >
                                                            <Text>Max: <Text strong>{item.snapshot_max_qty}</Text></Text>
                                                            <Text>Bal: <Text strong>{item.snapshot_balance}</Text></Text>
                                                            <Tag
                                                                style={{ fontSize: '14px', padding: '2px 8px', fontWeight: 'bold' }}
                                                                icon={(Number(item.requested_qty) || 0) !== 0 ? <CheckCircleOutlined /> : undefined}
                                                                color={(Number(item.requested_qty) || 0) === 0 ? 'default' : 'green'}
                                                                variant='filled'
                                                            >
                                                                {item.requested_qty}
                                                            </Tag>
                                                        </Space>
                                                        {item.indent_remarks && (
                                                            <div style={{ marginTop: 4 }}>
                                                                <Text type="secondary">Remarks: </Text>
                                                                <Text>{item.indent_remarks}</Text>
                                                            </div>
                                                        )}
                                                    </div>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            </Panel>
                        ))}
                    </Collapse>
                )}
            </Space>

            <EditQuantityModal
                visible={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false);
                    setEditingItem(null);
                }}
                onOk={handleUpdateQuantity}
                editingItem={editingItem}
                updatingQty={updatingQty}
            />

            <Modal
                title="PhIS Indent Logs *DO NOT CLOSE THIS WINDOW*"
                open={isTerminalVisible}
                onCancel={handleAbortProcess}
                footer={[
                    <Button
                        key="abort"
                        danger
                        type="primary"
                        size="large"
                        onClick={handleAbortProcess}
                        style={{ width: '100%', fontWeight: 'bold' }}
                    >
                        ABORT PROCESS
                    </Button>
                ]}
                width={800}
            >
                <div
                    style={{
                        backgroundColor: '#1e1e1e',
                        color: '#4af626',
                        padding: '16px',
                        height: '400px',
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        borderRadius: '6px',
                        whiteSpace: 'pre-wrap'
                    }}
                >
                    {terminalLogs.map((log, i) => (
                        <div key={i} style={{ marginBottom: '4px', color: log.startsWith('Error:') ? '#ff4d4f' : log.startsWith('The PhIS Indent Number is:') ? 'yellow' : 'inherit' }}>
                            {log}
                        </div>
                    ))}
                </div>
            </Modal>

            <Modal
                title="PhIS Indent Created Successfully"
                open={!!successIndentNo}
                onCancel={() => setSuccessIndentNo(null)}
                footer={[
                    <Button key="close" onClick={() => setSuccessIndentNo(null)}>Close</Button>
                ]}
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Typography.Text type="success" style={{ fontSize: '16px' }}>
                        The PhIS Indent Number is:
                    </Typography.Text>
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                        <Typography.Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                            {successIndentNo}
                        </Typography.Title>
                        <Button
                            type="primary"
                            icon={<CopyOutlined />}
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
                        >
                            Copy
                        </Button>
                    </div>

                    {skippedItems.length > 0 && (
                        <div style={{ marginTop: '32px', textAlign: 'left', background: '#fff1f0', padding: '16px', borderRadius: '8px', border: '1px solid #ffa39e' }}>
                            <Typography.Title level={5} style={{ color: '#cf1322', marginTop: 0 }}>
                                <ExclamationCircleOutlined style={{ marginRight: '8px' }} />
                                Items Skipped (Action Required)
                            </Typography.Title>
                            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: '12px' }}>
                                The following items were not indented and require manual action:
                            </Typography.Text>
                            <List
                                size="small"
                                dataSource={skippedItems}
                                renderItem={item => (
                                    <List.Item>
                                        <div>
                                            <Typography.Text strong>{item.item_code}</Typography.Text>
                                            {item.item_name && ` (${item.item_name})`}
                                            <br />
                                            <Typography.Text type="danger">{item.reason}</Typography.Text>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default CartDesktopView;
