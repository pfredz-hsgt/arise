import React from 'react';
import {
    Space,
    Typography,
    Table,
    Tag,
    Card,
    Spin,
    Button,
    Select
} from 'antd';
import {
    CalendarOutlined,
    HistoryOutlined,
    FileExcelOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getSourceColor, getUnitColor } from '../../lib/colorMappings';

const { Title, Text } = Typography;
const { Option } = Select;

const ShortExpArchiveDesktopView = ({
    unit,
    loading,
    drugs,
    archiveDates,
    selectedDate,
    setSelectedDate,
    currentPage,
    pageSize,
    handlePageChange,
    getQtyForColumn,
    exportToExcel
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
            render: (date) => (
                <Space direction="vertical" size={0} align="center">
                    <Space>
                        <CalendarOutlined style={{ color: '#fa8c16' }} />
                        <Text>{dayjs(date).format('DD/MM/YYYY')}</Text>
                    </Space>
                </Space>
            ),
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
            width: 200,
            render: (val) => <Text>{val || '-'}</Text>
        },
        {
            title: 'Archived By',
            dataIndex: 'archived_by',
            key: 'archived_by',
            width: 150,
            render: (val) => <Text>{val || 'Unknown'}</Text>
        }
    ];

    if (loading && archiveDates.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: 50 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
                            <Space>
                                <HistoryOutlined style={{ color: '#8c8c8c' }} />
                                Short Expiry Archive
                                <Tag color={getUnitColor(unit)} style={{ marginLeft: 6, fontWeight: 600 }}>{unit}</Tag>
                            </Space>
                        </Title>
                        <Text type="secondary">
                            View past short expiry records for {unit}.
                        </Text>
                    </div>
                    <Space wrap>
                        <Select
                            style={{ width: 200 }}
                            value={selectedDate}
                            onChange={setSelectedDate}
                            placeholder="Select Date"
                            loading={loading && archiveDates.length === 0}
                        >
                            {archiveDates.map(date => (
                                <Option key={date} value={date}>{dayjs(date).format('DD MMM YYYY')}</Option>
                            ))}
                        </Select>
                        <Button
                            icon={<FileExcelOutlined />}
                            onClick={exportToExcel}
                            disabled={drugs.length === 0}
                            style={{ backgroundColor: '#217346', borderColor: '#217346', color: '#fff' }}
                        >
                            Export Excel
                        </Button>
                    </Space>
                </div>

                {/* Content */}
                <Card bodyStyle={{ padding: 0 }}>
                    <Table
                        loading={loading && archiveDates.length > 0}
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
                    />
                </Card>
            </Space>
        </div>
    );
};

export default ShortExpArchiveDesktopView;
