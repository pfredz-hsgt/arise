import React, { useState, useEffect, useMemo } from 'react';
import {
    Table,
    Typography,
    Card,
    Spin,
    DatePicker,
    Select,
    Form,
    Space,
    Input,
    List,
    Tag,
    Button,
    Row,
    Col
} from 'antd';
import { FileExcelOutlined, EyeOutlined } from '@ant-design/icons';
import { api } from '../../lib/api';
import { getUnitColor } from '../../lib/colorMappings';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

// Subcomponent to lazy load items for a given session when expanded
const ExpandedItemsTable = ({ sessionId, adhocItems, debouncedSearch }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const displayItems = useMemo(() => {
        if (!debouncedSearch) return items;
        const lowerSearch = debouncedSearch.toLowerCase();
        return items.filter(item =>
            item.inventory_items?.name?.toLowerCase().includes(lowerSearch)
        );
    }, [items, debouncedSearch]);

    useEffect(() => {
        if (adhocItems) {
            setItems(adhocItems);
            setLoading(false);
            return;
        }

        const fetchItems = async () => {
            const data = await api.get(`/indent_items?session_id=${sessionId}`);
            if (data) setItems(data);
            setLoading(false);
        };
        fetchItems();
    }, [sessionId, adhocItems]);

    if (loading) return <Spin size="small" />;

    return (
        <List
            size="small"
            dataSource={displayItems}
            rowKey="id"
            renderItem={item => (
                <List.Item>
                    <List.Item.Meta
                        title={<Typography.Text strong>{item.inventory_items?.name}</Typography.Text>}
                    />
                    <Space size="large" wrap>
                        <Space>
                            <Typography.Text type="secondary">Max Qty:</Typography.Text>
                            <Typography.Text>
                                {item.snapshot_max_qty !== null && item.snapshot_max_qty !== undefined
                                    ? item.snapshot_max_qty
                                    : '-'}
                            </Typography.Text>
                        </Space>
                        <Space>
                            <Typography.Text type="secondary">Balance:</Typography.Text>
                            <Typography.Text>
                                {item.snapshot_balance !== null && item.snapshot_balance !== undefined
                                    ? item.snapshot_balance
                                    : '-'}
                            </Typography.Text>
                        </Space>
                        <Space>
                            <Typography.Text type="secondary">Indent Qty:</Typography.Text>
                            <Typography.Text strong style={{ color: '#1890ff' }}>
                                {item.requested_qty}
                            </Typography.Text>
                        </Space>
                        {item.indent_remarks && (
                            <Space>
                                <Typography.Text type="secondary">Remarks:</Typography.Text>
                                <Typography.Text>{item.indent_remarks}</Typography.Text>
                            </Space>
                        )}
                    </Space>
                </List.Item>
            )}
        />
    );
};

const IndentRecordDesktopView = ({
    unit,
    loading,
    users,
    setDateRange,
    setSelectedUser,
    setSearchText,
    debouncedSearch,
    expandedRowKeys,
    setExpandedRowKeys,
    selectedRowKeys,
    setSelectedRowKeys,
    exporting,
    currentPage,
    pageSize,
    handlePageChange,
    filteredSessions,
    processPDFExport,
    exportToExcel
}) => {
    const columns = [
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text, record) => {
                const itemCount = record.isAdhocRequests
                    ? record.items?.length || 0
                    : record.indent_items?.length || 0;
                return `${dayjs(text).format('DD/MM/YYYY HH:mm')} (${itemCount} items)`;
            },
            sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
        },
        {
            title: 'Indenter',
            dataIndex: ['profiles', 'name'],
            key: 'indenter',
        },
        {
            title: 'Type',
            dataIndex: 'session_type',
            key: 'type',
        },
        {
            title: 'Rak',
            dataIndex: 'rak',
            key: 'rak',
            render: text => text || '-'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => {
                const color = status === 'Submitted' ? 'blue' : 'green';
                return <span style={{ color }}>{status}</span>;
            }
        },
        {
            title: '',
            key: 'totalItems',
            render: () => <span style={{ color: '#888' }}></span>
        }
    ];

    const expandedRowRender = (record) => {
        if (record.isAdhocRequests) {
            return (
                <ExpandedItemsTable
                    adhocItems={record.items}
                    debouncedSearch={debouncedSearch}
                />
            );
        }
        return (
            <ExpandedItemsTable
                sessionId={record.id}
                debouncedSearch={debouncedSearch}
            />
        );
    };

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16
                }}
            >
                <Title level={3} style={{ margin: 0 }}>
                    Indent Records
                    <Tag
                        color={getUnitColor(unit)}
                        style={{ marginLeft: 8, verticalAlign: 'middle', fontWeight: 600 }}
                    >
                        {unit}
                    </Tag>
                </Title>
                <Space>
                    <Button
                        icon={<EyeOutlined style={{ fontSize: 19 }} />}
                        onClick={() => processPDFExport('preview')}
                        disabled={selectedRowKeys.length === 0}
                        title="Preview Selected"
                        style={{
                            backgroundColor: selectedRowKeys.length === 0 ? undefined : '#6D28D9',
                            borderColor: selectedRowKeys.length === 0 ? '#d6d6d6' : '#6D28D9',
                            color: selectedRowKeys.length === 0 ? undefined : '#fff'
                        }}
                    />
                    <Button
                        type="primary"
                        icon={<FileExcelOutlined />}
                        onClick={exportToExcel}
                        disabled={selectedRowKeys.length === 0}
                        loading={exporting}
                        style={{ backgroundColor: '#217346', borderColor: '#d6d6d6' }}
                    >
                        Export
                    </Button>
                </Space>
            </div>

            <Card style={{ marginBottom: 24 }}>
                <Form layout="vertical">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Search Item" style={{ margin: 0 }}>
                                <Input.Search
                                    placeholder="Search by item name..."
                                    allowClear
                                    onChange={e => setSearchText(e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Date Range" style={{ margin: 0 }}>
                                <RangePicker
                                    style={{ width: '100%' }}
                                    onChange={dates => setDateRange(dates)}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label="Indenter" style={{ margin: 0 }}>
                                <Select
                                    style={{ width: '100%' }}
                                    allowClear
                                    placeholder="All Users"
                                    onChange={v => setSelectedUser(v)}
                                >
                                    {users.map(u => (
                                        <Select.Option key={u.id} value={u.name}>
                                            {u.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>

            <Card bodyStyle={{ padding: 0 }}>
                <Table
                    rowSelection={{
                        selectedRowKeys,
                        onChange: newSelectedRowKeys => setSelectedRowKeys(newSelectedRowKeys),
                    }}
                    columns={columns}
                    dataSource={filteredSessions}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: filteredSessions.length,
                        onChange: handlePageChange,
                        showSizeChanger: true,
                        showTotal: total => `Total ${total} items`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    expandable={{
                        expandedRowRender,
                        expandedRowKeys,
                        onExpandedRowsChange: keys => setExpandedRowKeys(keys)
                    }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>
        </div>
    );
};

export default IndentRecordDesktopView;
