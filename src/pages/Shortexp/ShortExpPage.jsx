import React, { useState, useEffect, useRef } from 'react';
import {
    Space,
    Typography,
    Table,
    Tag,
    message,
    Input,
    Card,
    Spin,
    Button,
    Modal,
    Form,
    Popconfirm,
    Row,
    Col,
    DatePicker,
    InputNumber
} from 'antd';
import {
    CalendarOutlined,
    WarningOutlined,
    FileExcelOutlined,
    MoreOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { api } from '../../lib/api';
import { getSourceColor } from '../../lib/colorMappings';
import { useNavigate } from 'react-router-dom';
import ShortExpModal from '../../components/ShortExpModal';

const { Title, Text } = Typography;

const ShortExpPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [drugs, setDrugs] = useState([]);
    const saveTimeouts = useRef({});

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const handlePageChange = (page, newPageSize) => {
        setCurrentPage(page);
        if (newPageSize !== pageSize) {
            setPageSize(newPageSize);
        }
    };

    useEffect(() => {
        fetchShortExpDrugs();
    }, []);

    const fetchShortExpDrugs = async () => {
        try {
            setLoading(true);

            // Fetch from custom API
            const data = await api.get('/shortexp');

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
                };
            });

            // Sort by exp_date
            rows.sort((a, b) => dayjs(a.exp_date).diff(dayjs(b.exp_date)));

            setDrugs(rows);
        } catch (error) {
            console.error('Error fetching short expiry items:', error);
            message.error('Failed to load short expiry items');
        } finally {
            setLoading(false);
        }
    };

    const handleRemarkChange = (record, value) => {
        // Optimistic UI Update
        setDrugs(prev => prev.map(item =>
            item.id === record.id ? { ...item, se_remarks: value } : item
        ));

        if (saveTimeouts.current[record.id]) {
            clearTimeout(saveTimeouts.current[record.id]);
        }

        saveTimeouts.current[record.id] = setTimeout(() => {
            saveToDatabase(record, value);
        }, 800);
    };

    const saveToDatabase = async (record, value) => {
        try {
            await api.post('/shortexp/remark', {
                item_id: record.item_id,
                batch_no: record.batch_no,
                exp_date: record.exp_date,
                qty: record.qty,
                se_remarks: value
            });
        } catch (error) {
            console.error('Failed to save remark:', error);
            message.error("Failed to save remark!");
        }
    };

    const openEditModal = (record) => {
        setEditingItem({
            id: record.item_id,
            name: record.name,
            pku: record.pku,
            puchase_type: record.puchase_type,
            std_kt: record.std_kt,
            row: record.rak,
            indent_source: record.indent_source
        });
        setIsEditModalVisible(true);
    };

    const handleEditModalClose = () => {
        setIsEditModalVisible(false);
        setEditingItem(null);
        fetchShortExpDrugs();
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
            ['Drug Name', 'PKU', 'Purchase Type', 'Std Kt', 'Indent Source', 'Batch No', 'Expiry Date', '6M', '5M', '4M', '3M', '2M', '1M', 'Remarks'],
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
                    item.se_remarks || ''
                ];
            })
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
            { wch: 40 }, { wch: 15 }, { wch: 5 }, { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
            { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 },
            { wch: 30 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Short Expiry");

        const filename = `ShortExp_${dayjs().format('YYYYMMDD')}.xlsx`;
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
            render: (val, record) => (
                <Input
                    value={val}
                    placeholder="E.g. dispose, offered to other tech..."
                    bordered={false}
                    style={{ borderBottom: '1px dashed #d9d9d9', background: 'transparent' }}
                    onChange={e => handleRemarkChange(record, e.target.value)}
                />
            )
        }
    ];

    if (loading) {
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
                                <WarningOutlined style={{ color: '#fa8c16' }} />
                                Short Expiry Items
                            </Space>
                        </Title>
                        <Text type="secondary">
                            for Outpatient Pharmacy Counter.
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
                    </Space>
                </div>

                {/* Content */}
                <Card bodyStyle={{ padding: 0 }}>
                    <Table
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

            <ShortExpModal
                isOpen={isEditModalVisible}
                onClose={handleEditModalClose}
                selectedItem={editingItem}
            />
        </div>
    );
};

export default ShortExpPage;

