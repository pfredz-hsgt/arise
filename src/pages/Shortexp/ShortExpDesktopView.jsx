import React from 'react';
import {
    Space,
    Typography,
    Table,
    Tag,
    Card,
    Button,
    Popconfirm
} from 'antd';
import {
    CalendarOutlined,
    WarningOutlined,
    FileExcelOutlined,
    InboxOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getSourceColor, getUnitColor } from '../../lib/colorMappings';

const { Title, Text } = Typography;

const ShortExpDesktopView = ({
    unit,
    user,
    loading,
    drugs,
    currentPage,
    pageSize,
    handlePageChange,
    openEditModal,
    getQtyForColumn,
    exportToExcel,
    handleArchiveAndClear,
    navigate
}) => {
    const columns = [
        {
            title: 'Drug Name',
            dataIndex: 'name',
            key: 'name',
            width: 250,
            fixed: 'left',
            render: (text, record) => (
                <Space direction="vertical" size={2}>
                    <Text strong>{text}</Text>
                    <Space size="small" wrap>
                        {record.pku && <Tag color="magenta" style={{ fontSize: '12px' }}>{record.pku}</Tag>}
                        {record.puchase_type && <Tag color="blue" style={{ fontSize: '10px' }}>{record.puchase_type}</Tag>}
                        {record.std_kt && <Tag color="green" style={{ fontSize: '10px' }}>{record.std_kt}</Tag>}
                        {record.rak && <Tag color="blue" style={{ fontSize: '10px' }}>Rak: {record.rak}</Tag>}
                        {record.indent_source && (
                            <Tag color={getSourceColor(record.indent_source)} style={{ fontSize: '10px' }}>{record.indent_source}</Tag>
                        )}
                    </Space>
                </Space>
            ),
        },
        {
            title: 'Batch No',
            dataIndex: 'batch_no',
            key: 'batch_no',
            width: 120,
            render: (text) => <Tag color="geekblue">{text}</Tag>
        },
        {
            title: 'Expiry Date',
            dataIndex: 'exp_date',
            key: 'exp_date',
            width: 130,
            render: (date) => {
                const daysLeft = dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day');
                const isUrgent = daysLeft < 30;
                return (
                    <Space direction="vertical" size={0} align="center">
                        <Space>
                            <CalendarOutlined style={{ color: '#fa8c16' }} />
                            <Text>{dayjs(date).format('DD/MM/YYYY')}</Text>
                        </Space>
                        <Text style={{ color: isUrgent ? 'red' : 'inherit', fontSize: '12px' }}>
                            ({daysLeft} Days)
                        </Text>
                    </Space>
                );
            },
        },
        {
            title: '6M',
            key: '6m',
            width: 70,
            align: 'center',
            render: (_, record) => {
                const qty = getQtyForColumn(record, 6);
                return qty !== null ? <Text strong>{qty}</Text> : '-';
            }
        },
        {
            title: '5M',
            key: '5m',
            width: 70,
            align: 'center',
            render: (_, record) => {
                const qty = getQtyForColumn(record, 5);
                return qty !== null ? <Text strong>{qty}</Text> : '-';
            }
        },
        {
            title: '4M',
            key: '4m',
            width: 70,
            align: 'center',
            render: (_, record) => {
                const qty = getQtyForColumn(record, 4);
                return qty !== null ? <Text strong>{qty}</Text> : '-';
            }
        },
        {
            title: '3M',
            key: '3m',
            width: 70,
            align: 'center',
            render: (_, record) => {
                const qty = getQtyForColumn(record, 3);
                return qty !== null ? <Text strong>{qty}</Text> : '-';
            }
        },
        {
            title: '2M',
            key: '2m',
            width: 70,
            align: 'center',
            render: (_, record) => {
                const qty = getQtyForColumn(record, 2);
                return qty !== null ? <Text strong style={{ color: '#fa8c16' }}>{qty}</Text> : '-';
            }
        },
        {
            title: '1M',
            key: '1m',
            width: 70,
            align: 'center',
            render: (_, record) => {
                const qty = getQtyForColumn(record, 1);
                return qty !== null ? <Text strong style={{ color: '#f5222d' }}>{qty}</Text> : '-';
            }
        },
        {
            title: 'Remarks',
            dataIndex: 'se_remarks',
            key: 'se_remarks',
            width: 250,
            render: (val) => <Text>{val || '-'}</Text>
        }
    ];

    return (
        <div>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
                            <Space>
                                <WarningOutlined style={{ color: '#fa8c16' }} />
                                Short Expiry Items
                                <Tag color={getUnitColor(unit)} style={{ marginLeft: 6, fontWeight: 600 }}>{unit}</Tag>
                            </Space>
                        </Title>
                        <Text type="secondary">
                            for {unit} Pharmacy Counter.
                        </Text>
                    </div>
                    <Space wrap>
                        <Button type="primary" onClick={() => navigate('/shortexp-entry')}>
                            Record Entry
                        </Button>
                        <Button
                            icon={<FileExcelOutlined />}
                            onClick={exportToExcel}
                            style={{ backgroundColor: '#217346', borderColor: '#217346', color: '#fff' }}
                        >
                            Export Excel
                        </Button>
                        {user?.role === 'Issuer' && (
                            <Popconfirm
                                title={`Archive & Clear (${unit})`}
                                description={`Are you sure you want to archive and clear all ${unit} short expiry records? This action cannot be undone.`}
                                onConfirm={handleArchiveAndClear}
                                okText="Yes, Archive & Clear"
                                cancelText="No"
                                okButtonProps={{ danger: true }}
                            >
                                <Button
                                    icon={<InboxOutlined />}
                                    danger
                                >
                                    Archive & Clear
                                </Button>
                            </Popconfirm>
                        )}
                    </Space>
                </div>

                {/* Content Table */}
                <Card bodyStyle={{ padding: 0 }}>
                    <Table
                        loading={loading && drugs.length > 0}
                        columns={columns}
                        dataSource={drugs}
                        rowKey="id"
                        scroll={{ x: 1200 }}
                        pagination={{
                            current: currentPage,
                            pageSize: pageSize,
                            total: drugs.length,
                            onChange: handlePageChange,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} items`,
                            pageSizeOptions: ['25', '50', '100', '200'],
                        }}
                        onRow={(record) => ({
                            onClick: () => {
                                openEditModal(record);
                            },
                        })}
                        rowClassName={() => 'clickable-row'}
                    />
                </Card>
            </Space>

            <style>{`
                .clickable-row {
                    cursor: pointer;
                }
                .clickable-row:hover td {
                    background-color: #f5f5f5 !important;
                }
            `}</style>
        </div>
    );
};

export default ShortExpDesktopView;
