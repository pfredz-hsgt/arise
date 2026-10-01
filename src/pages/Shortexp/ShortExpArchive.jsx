import React, { useState, useEffect } from 'react';
import {
    Space,
    Typography,
    Table,
    Tag,
    message,
    Card,
    Spin,
    Button,
    Grid,
    List,
    Select
} from 'antd';
import {
    CalendarOutlined,
    HistoryOutlined,
    FileExcelOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { api } from '../../lib/api';
import { getSourceColor } from '../../lib/colorMappings';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { Option } = Select;

const ShortExpArchive = () => {
    const screens = useBreakpoint();
    const isDesktop = screens.lg;
    
    const [loading, setLoading] = useState(true);
    const [drugs, setDrugs] = useState([]);
    const [archiveDates, setArchiveDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const handlePageChange = (page, newPageSize) => {
        setCurrentPage(page);
        if (newPageSize !== pageSize) {
            setPageSize(newPageSize);
        }
    };

    useEffect(() => {
        fetchArchiveDates();
    }, []);

    useEffect(() => {
        if (selectedDate) {
            fetchArchiveData(selectedDate);
        } else {
            setDrugs([]);
        }
    }, [selectedDate]);

    const fetchArchiveDates = async () => {
        try {
            const data = await api.get('/shortexp/archive/dates');
            const dates = data.map(d => dayjs(d.archived_date).format('YYYY-MM-DD'));
            setArchiveDates(dates);
            if (dates.length > 0) {
                setSelectedDate(dates[0]);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching archive dates:', error);
            message.error('Failed to load archive dates');
            setLoading(false);
        }
    };

    const fetchArchiveData = async (date) => {
        try {
            setLoading(true);
            const data = await api.get(`/shortexp/archive/data?date=${date}`);

            const rows = data.map(record => {
                const invItem = record.inventory_items || {};
                return {
                    id: record.id,
                    item_id: record.item_id,
                    name: invItem.name,
                    puchase_type: invItem.puchase_type,
                    std_kt: invItem.std_kt,
                    pku: invItem.pku,
                    indent_source: invItem.indent_source,
                    rak: invItem.row,
                    batch_no: record.batch_no,
                    exp_date: record.exp_date,
                    qty: record.qty || 0,
                    se_remarks: record.se_remarks || '',
                    archived_by: record.archived_by || 'Unknown'
                };
            });

            rows.sort((a, b) => dayjs(a.exp_date).diff(dayjs(b.exp_date)));
            setDrugs(rows);
        } catch (error) {
            console.error('Error fetching archived items:', error);
            message.error('Failed to load archived items');
        } finally {
            setLoading(false);
        }
    };

    const getQtyForColumn = (record, targetMonth) => {
        const today = dayjs().startOf('month');
        const exp = dayjs(record.exp_date).startOf('month');
        let diffMonths = exp.diff(today, 'month');

        if (diffMonths < 1) diffMonths = 1;

        return diffMonths === targetMonth ? record.qty : null;
    };

    const exportToExcel = () => {
        const wsData = [
            ['Drug Name', 'PKU', 'Purchase Type', 'Std Kt', 'Indent Source', 'Batch No', 'Expiry Date', '6M', '5M', '4M', '3M', '2M', '1M', 'Remarks', 'Archived By'],
            ...drugs.map(item => {
                const qty6 = getQtyForColumn(item, 6);
                const qty5 = getQtyForColumn(item, 5);
                const qty4 = getQtyForColumn(item, 4);
                const qty3 = getQtyForColumn(item, 3);
                const qty2 = getQtyForColumn(item, 2);
                const qty1 = getQtyForColumn(item, 1);

                return [
                    item.name || '',
                    item.pku || '',
                    item.puchase_type || '',
                    item.std_kt || '',
                    item.indent_source || '',
                    item.batch_no || '',
                    item.exp_date ? dayjs(item.exp_date).format('DD/MM/YYYY') : '',
                    qty6 !== null ? qty6 : '-',
                    qty5 !== null ? qty5 : '-',
                    qty4 !== null ? qty4 : '-',
                    qty3 !== null ? qty3 : '-',
                    qty2 !== null ? qty2 : '-',
                    qty1 !== null ? qty1 : '-',
                    item.se_remarks || '',
                    item.archived_by || ''
                ];
            })
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
            { wch: 40 }, { wch: 15 }, { wch: 5 }, { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
            { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 },
            { wch: 30 }, { wch: 20 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Short Expiry Archive");

        const filename = `ShortExpArchive_${selectedDate || dayjs().format('YYYYMMDD')}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

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

    const renderListItem = (record) => {
        return (
            <List.Item>
                <Card 
                    size="small" 
                    style={{ borderLeft: '4px solid #d9d9d9' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text strong style={{ fontSize: 16 }}>{record.name}</Text>
                        <Tag color="geekblue">{record.batch_no}</Tag>
                    </div>
                    
                    <Space size="small" wrap style={{ marginBottom: 12 }}>
                        {record.pku && <Tag color="magenta" style={{ fontSize: '12px' }}>{record.pku}</Tag>}
                        {record.rak && <Tag color="blue" style={{ fontSize: '10px' }}>Rak: {record.rak}</Tag>}
                    </Space>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space direction="vertical" size={0}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Expiry Date</Text>
                            <Space>
                                <CalendarOutlined style={{ color: '#fa8c16' }} />
                                <Text strong>{dayjs(record.exp_date).format('DD/MM/YYYY')}</Text>
                            </Space>
                        </Space>
                        
                        <div style={{ textAlign: 'right' }}>
                            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Total Qty</Text>
                            <Text strong style={{ fontSize: 16 }}>{record.qty || '-'}</Text>
                        </div>
                    </div>
                    
                    {record.se_remarks && (
                        <div style={{ marginTop: 12, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Remarks: </Text>
                            <Text>{record.se_remarks}</Text>
                        </div>
                    )}
                    <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Archived by: {record.archived_by}</Text>
                    </div>
                </Card>
            </List.Item>
        );
    };

    if (loading && archiveDates.length === 0) {
        return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
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
                            </Space>
                        </Title>
                        <Text type="secondary">
                            View past short expiry records.
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
                <Card bodyStyle={{ padding: isDesktop ? 0 : 16 }}>
                    {isDesktop ? (
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
                    ) : (
                        <List
                            grid={{ gutter: 16, xs: 1, sm: 1, md: 2 }}
                            dataSource={drugs}
                            renderItem={renderListItem}
                            pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                total: drugs.length,
                                onChange: handlePageChange,
                                showSizeChanger: true,
                                pageSizeOptions: ['25', '50', '100'],
                            }}
                        />
                    )}
                </Card>
            </Space>
        </div>
    );
};

export default ShortExpArchive;
