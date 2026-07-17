import React, { useState, useEffect, useMemo } from 'react';
import { Table, Typography, Card, Spin, message, DatePicker, Select, Form, Space, Input, List, Tag, Button, Row, Col } from 'antd';
import { FileExcelOutlined, EyeOutlined } from '@ant-design/icons';
import { api } from '../../lib/api';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

dayjs.extend(isBetween);

const { Title } = Typography;
const { RangePicker } = DatePicker;

const IndentRecordPage = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    // Filters
    const [dateRange, setDateRange] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [expandedRowKeys, setExpandedRowKeys] = useState([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [exporting, setExporting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const handlePageChange = (page, newPageSize) => {
        setCurrentPage(page);
        if (newPageSize !== pageSize) {
            setPageSize(newPageSize);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchText);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchText]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch users and sessions from custom API
            const { usersData, sessionsData, requestsData } = await api.get('/indents/records');
            if (usersData) setUsers(usersData);

            let processedSessions = (sessionsData || []).map(sess => {
                const uniqueItemsMap = new Map();
                sess.indent_items?.forEach(item => {
                    if (!uniqueItemsMap.has(item.item_id)) {
                        uniqueItemsMap.set(item.item_id, { ...item });
                    } else {
                        uniqueItemsMap.get(item.item_id).requested_qty += item.requested_qty;
                    }
                });
                
                const sortedItems = Array.from(uniqueItemsMap.values())
                    .filter(item => item.requested_qty >= 0)
                    .sort((a, b) => (a.inventory_items?.name || '').localeCompare(b.inventory_items?.name || ''));
                
                return { ...sess, indent_items: sortedItems };
            });

            if (requestsData && requestsData.length > 0) {
                // Group requests by user and date (YYYY-MM-DD)
                const groupedRequests = requestsData.reduce((acc, req) => {
                    const profileName = req.profiles?.name || 'Unknown Indenter';
                    const dateKey = dayjs(req.created_at).format('YYYY-MM-DD');
                    const key = `${profileName}-${dateKey}`;
                    if (!acc[key]) {
                        acc[key] = {
                            id: `adhoc-${key}`,
                            created_at: req.created_at, // Use first request's time
                            status: req.status,
                            session_type: 'Urgent Indent',
                            rak: null,
                            profiles: { name: profileName },
                            isAdhocRequests: true,
                            items: []
                        };
                    }
                    // Add item (deduplicated)
                    const existingItemIndex = acc[key].items.findIndex(i => i.item_id === req.inventory_items?.id);
                    if (existingItemIndex > -1) {
                        acc[key].items[existingItemIndex].requested_qty += req.requested_qty;
                    } else {
                        acc[key].items.push({
                            id: req.id,
                            item_id: req.inventory_items?.id,
                            requested_qty: req.requested_qty,
                            snapshot_max_qty: req.snapshot_max_qty,
                            snapshot_balance: req.snapshot_balance,
                            indent_remarks: req.indent_remarks,
                            inventory_items: req.inventory_items
                        });
                    }
                    
                    // For the group status, if any is 'Approved' keep it, else it will be the status of the item
                    if (req.status === 'Approved') {
                        acc[key].status = 'Approved';
                    }
                    return acc;
                }, {});

                processedSessions = [...processedSessions, ...Object.values(groupedRequests)];
                // Sort combined
                processedSessions.sort((a, b) => dayjs(b.created_at).unix() - dayjs(a.created_at).unix());
            }

            setSessions(processedSessions);
        } catch (error) {
            message.error("Failed to load records");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSessions = useMemo(() => {
        return sessions.filter(session => {
            let matchesDate = true;
            let matchesUser = true;
            let matchesSearch = true;

            if (dateRange && dateRange[0] && dateRange[1]) {
                const sessionDate = dayjs(session.created_at);
                matchesDate = sessionDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
            }

            if (selectedUser) {
                matchesUser = session.profiles?.name === selectedUser;
            }

            if (debouncedSearch) {
                const lowerSearch = debouncedSearch.toLowerCase();
                if (session.isAdhocRequests) {
                    matchesSearch = session.items.some(item =>
                        item.inventory_items?.name?.toLowerCase().includes(lowerSearch)
                    );
                } else {
                    matchesSearch = session.indent_items?.some(item =>
                        item.inventory_items?.name?.toLowerCase().includes(lowerSearch)
                    ) || false;
                }
            }

            return matchesDate && matchesUser && matchesSearch;
        });
    }, [sessions, dateRange, selectedUser, debouncedSearch]);

    useEffect(() => {
        if (debouncedSearch) {
            setExpandedRowKeys(filteredSessions.map(s => s.id));
        } else {
            setExpandedRowKeys([]);
        }
    }, [debouncedSearch, filteredSessions]);

    const columns = [
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm'),
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
                let color = status === 'Submitted' ? 'blue' : 'green';
                return <span style={{ color }}>{status}</span>;
            }
        },
        {
            title: '',
            key: 'totalItems',
            render: () => <span style={{ color: '#888' }}></span> // We will rely on expandable rows for details
        }
    ];

    const expandedRowRender = (record) => {
        if (record.isAdhocRequests) {
            return <ExpandedItemsTable adhocItems={record.items} debouncedSearch={debouncedSearch} />;
        }
        return <ExpandedItemsTable sessionId={record.id} debouncedSearch={debouncedSearch} />;
    };

    const generatePDFDocument = (session) => {
        const doc = new jsPDF({ orientation: 'portrait' });
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPosition = 10;

        // Header
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Pekeliling Perbendaharaan Malaysia', 10, yPosition);
        doc.text('AM 6.5 Lampiran B', pageWidth - 10, yPosition, { align: 'right' });
        yPosition += 5;

        // Top Right
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('KEW.PS-8', pageWidth - 10, yPosition, { align: 'right' });
        yPosition += 5;
        doc.setFont(undefined, 'normal');
        doc.text('No. BPSI : .........', pageWidth - 10, yPosition, { align: 'right' });
        yPosition += 5;

        // Title
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('BORANG PERMOHONAN STOK', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
        doc.text('(INDIVIDU KEPADA STOR)', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;

        const itemsToPrint = session.isAdhocRequests ? session.items : session.indent_items;

        const tableData = (itemsToPrint || []).map((item) => [
            '', // No Kod
            (item.inventory_items?.name || '') + (item.inventory_items?.pku ? ` (${item.inventory_items.pku})` : ''),
            item.requested_qty || 0,
            item.indent_remarks || '',
            '', // Baki Sedia Ada
            '', // Kuantiti Diluluskan
            '', // Catatan
            '', // Kuantiti Diterima
            '', // Catatan
        ]);

        // Add Signatures Row
        tableData.push([
            {
                content: `Pemohon:\n\n\n\n..............................\n(Tandatangan)\n\nNama: ${session.profiles?.name || ''}\nJawatan:\nTarikh: ${dayjs(session.created_at).format('DD/MM/YYYY')}`,
                colSpan: 4,
                styles: { minCellHeight: 35, halign: 'left', valign: 'top', fillColor: [255, 255, 255], fontStyle: 'normal', fontSize: 9 }
            },
            {
                content: `Pegawai Pelulus:\n\n\n\n.........................\n(Tandatangan)\n\nNama:\nJawatan:\nTarikh:`,
                colSpan: 3,
                styles: { minCellHeight: 35, halign: 'left', valign: 'top', fillColor: [255, 255, 255], fontStyle: 'normal', fontSize: 9 }
            },
            {
                content: `Pemohon/ Wakil:\n\n\n..........................\n(Tandatangan)\n\nNama:\nJawatan:\nTarikh:`,
                colSpan: 2,
                styles: { minCellHeight: 35, halign: 'left', valign: 'top', fillColor: [255, 255, 255], fontStyle: 'normal', fontSize: 9 }
            }
        ]);

        autoTable(doc, {
            startY: yPosition,
            rowPageBreak: 'avoid',
            head: [
                [
                    { content: 'Permohonan', colSpan: 4, styles: { halign: 'center', fillColor: [230, 230, 230], fontSize: 9 } },
                    { content: 'Pegawai Pelulus', colSpan: 3, styles: { halign: 'center', fillColor: [230, 230, 230], fontSize: 6.5 } },
                    { content: 'Perakuan Penerimaan', colSpan: 2, styles: { halign: 'center', fillColor: [230, 230, 230], fontSize: 6.5 } },
                ],
                [
                    { content: 'No.\nKod', styles: { halign: 'center', fillColor: [230, 230, 230], fontSize: 8 } },
                    { content: 'Perihal Stok', styles: { halign: 'center', fillColor: [230, 230, 230], fontSize: 9 } },
                    { content: 'Kuantiti\nDimohon', styles: { halign: 'center', fillColor: [230, 230, 230], fontSize: 8 } },
                    { content: 'Catatan', styles: { halign: 'center', fillColor: [230, 230, 230], fontSize: 9 } },
                    { content: 'Baki Sedia\nAda', styles: { halign: 'center', fillColor: [230, 230, 230], fontSize: 6.5 } },
                    { content: 'Kuantiti\nDiluluskan', styles: { halign: 'center', fillColor: [230, 230, 230], fontSize: 6.5 } },
                    { content: 'Catatan', styles: { halign: 'center', fillColor: [230, 230, 230], fontSize: 6.5 } },
                    { content: 'Kuantiti\nDiterima', styles: { halign: 'center', fillColor: [230, 230, 230], fontSize: 6.5 } },
                    { content: 'Catatan', styles: { halign: 'center', fillColor: [230, 230, 230], fontSize: 6.5 } },
                ]
            ],
            body: tableData,
            theme: 'grid',
            styles: { cellPadding: 1.3, textColor: [0, 0, 0], valign: 'middle' },
            headStyles: {
                fontStyle: 'bold',
                lineWidth: 0.2,
                lineColor: [0, 0, 0],
            },
            bodyStyles: {
                lineWidth: 0.2,
                lineColor: [0, 0, 0],
                minCellHeight: 8,
            },
            columnStyles: {
                0: { cellWidth: 8, halign: 'center', fontSize: 8 },
                1: { cellWidth: 'auto', fontSize: 9.5, minCellHeight: 10 },
                2: { cellWidth: 15, halign: 'center', fontSize: 9.5 },
                3: { cellWidth: 18, fontSize: 8 },
                4: { cellWidth: 12, halign: 'center', fontSize: 6.5 },
                5: { cellWidth: 12, halign: 'center', fontSize: 6.5 },
                6: { cellWidth: 14, fontSize: 6.5 },
                7: { cellWidth: 12, halign: 'center', fontSize: 6.5 },
                8: { cellWidth: 14, fontSize: 6.5 },
            },
            margin: { left: 10, right: 10 },
            didDrawCell: function (data) {
                let rightEdge = false;
                if (data.section === 'head' && data.row.index === 0) {
                    if (data.column.index === 0 || data.column.index === 4) rightEdge = true;
                } else if (data.section === 'body' && data.row.index === tableData.length - 1) {
                    if (data.column.index === 0 || data.column.index === 4) rightEdge = true;
                } else {
                    if (data.column.index === 3 || data.column.index === 6) rightEdge = true;
                }

                if (rightEdge) {
                    doc.setLineWidth(0.8);
                    doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                    doc.setLineWidth(0.2); // reset
                }
            },
        });

        return doc;
    };

    const processPDFExport = async (mode) => {
        try {
            const sessionsToExport = filteredSessions.filter(s => selectedRowKeys.includes(s.id));
            if (sessionsToExport.length === 0) return;

            const sessionIds = sessionsToExport.filter(s => !s.isAdhocRequests).map(s => s.id);

            let fetchedSessionItems = [];
            if (sessionIds.length > 0) {
                const data = await api.get(`/indent_items?session_ids=${sessionIds.join(',')}`);
                if (data) fetchedSessionItems = data;
            }

            let exportCount = 0;

            sessionsToExport.forEach(session => {
                let items = [];
                if (session.isAdhocRequests) {
                    items = session.items;
                } else {
                    items = fetchedSessionItems.filter(item => item.session_id === session.id);
                }

                if (items.length === 0) return;

                // Deduplicate items
                const uniqueItemsMap = new Map();
                items.forEach(item => {
                    const itemId = item.item_id || item.inventory_items?.id;
                    if (!uniqueItemsMap.has(itemId)) {
                        uniqueItemsMap.set(itemId, { ...item });
                    } else {
                        uniqueItemsMap.get(itemId).requested_qty += item.requested_qty;
                    }
                });

                // Sort items alphabetically
                const sortedItems = Array.from(uniqueItemsMap.values())
                    .filter(item => item.requested_qty >= 0)
                    .sort((a, b) => (a.inventory_items?.name || '').localeCompare(b.inventory_items?.name || ''));

                const sessionWithItems = { ...session, indent_items: sortedItems };
                const doc = generatePDFDocument(sessionWithItems);
                const timestamp = dayjs(session.created_at).format('YYYYMMDD_HHmm');
                const safeName = (session.profiles?.name || 'User').replace(/[^a-z0-9]/gi, '_');
                const filename = `Indent_${safeName}_${timestamp}.pdf`;

                if (mode === 'download') {
                    doc.save(filename);
                } else {
                    doc.setProperties({ title: filename });
                    const pdfBlob = doc.output('blob');
                    const pdfUrl = URL.createObjectURL(pdfBlob);

                    const newWindow = window.open('', '_blank');
                    if (newWindow) {
                        newWindow.document.title = filename;
                        newWindow.document.body.style.margin = '0';
                        newWindow.document.body.style.overflow = 'hidden';

                        const iframe = newWindow.document.createElement('iframe');
                        iframe.src = pdfUrl;
                        iframe.style.width = '100vw';
                        iframe.style.height = '100vh';
                        iframe.style.border = 'none';
                        iframe.title = filename;

                        newWindow.document.body.appendChild(iframe);
                    } else {
                        window.open(pdfUrl, '_blank');
                    }
                }
                exportCount++;
            });

            if (exportCount > 0) {
                message.success(`Successfully processed ${exportCount} PDF(s)!`);
            } else {
                message.warning('No sessions selected to process.');
            }
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            message.error('Failed to export to PDF');
        }
    };

    const exportToExcel = async () => {
        try {
            setExporting(true);
            const sessionsToExport = filteredSessions.filter(s => selectedRowKeys.includes(s.id));
            if (sessionsToExport.length === 0) return;

            const sessionIds = sessionsToExport.filter(s => !s.isAdhocRequests).map(s => s.id);

            let fetchedSessionItems = [];
            if (sessionIds.length > 0) {
                const data = await api.get(`/indent_items?session_ids=${sessionIds.join(',')}`);
                if (data) fetchedSessionItems = data;
            }

            const excelData = [];
            excelData.push(['Date', 'Indenter', 'Type', 'Rak', 'Status', 'Item Name', 'Max Qty', 'Balance', 'Indent Qty', 'Remarks']);

            sessionsToExport.forEach(session => {
                const sessionDate = dayjs(session.created_at).format('DD/MM/YYYY HH:mm');
                const indenter = session.profiles?.name || '-';
                const type = session.session_type || '-';
                const rak = session.rak || '-';
                const status = session.status || '-';

                let items = [];
                if (session.isAdhocRequests) {
                    items = session.items;
                } else {
                    items = fetchedSessionItems.filter(item => item.session_id === session.id);
                }

                if (items.length === 0) {
                    excelData.push([sessionDate, indenter, type, rak, status, '', '', '', '', '']);
                } else {
                    items.forEach(item => {
                        excelData.push([
                            sessionDate,
                            indenter,
                            type,
                            rak,
                            status,
                            item.inventory_items?.name || '-',
                            item.snapshot_max_qty !== null ? item.snapshot_max_qty : '-',
                            item.snapshot_balance !== null ? item.snapshot_balance : '-',
                            item.requested_qty || 0,
                            item.indent_remarks || ''
                        ]);
                    });
                }
            });

            const ws = XLSX.utils.aoa_to_sheet(excelData);

            ws['!cols'] = [
                { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 12 },
                { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 30 }
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Selected Records");

            const filename = `Indent_Records_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`;
            XLSX.writeFile(wb, filename);

            message.success('Export completed successfully');
        } catch (error) {
            console.error('Export error:', error);
            message.error('Failed to export to Excel');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0 }}>Indent Records</Title>
                <Space>
                    <Button
                        icon={<EyeOutlined style={{ fontSize: 19 }} />}
                        onClick={() => processPDFExport('preview')}
                        disabled={selectedRowKeys.length === 0}
                        title="Preview Selected"
                        style={{ backgroundColor: selectedRowKeys.length === 0 ? undefined : '#6D28D9', borderColor: selectedRowKeys.length === 0 ? '#d6d6d6' : '#6D28D9', color: selectedRowKeys.length === 0 ? undefined : '#fff' }}
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
                                <RangePicker style={{ width: '100%' }} onChange={(dates) => setDateRange(dates)} />
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
                                    {users.map(u => <Select.Option key={u.id} value={u.name}>{u.name}</Select.Option>)}
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
                        onChange: (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys),
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
                        showTotal: (total) => `Total ${total} items`,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    expandable={{
                        expandedRowRender,
                        expandedRowKeys,
                        onExpandedRowsChange: (keys) => setExpandedRowKeys(keys)
                    }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>
        </div>
    );
};

// Subcomponent to lazy load items for a given session when expanded
const ExpandedItemsTable = ({ sessionId, adhocItems, debouncedSearch }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const displayItems = useMemo(() => {
        if (!debouncedSearch) return items;
        const lowerSearch = debouncedSearch.toLowerCase();
        return items.filter(item => item.inventory_items?.name?.toLowerCase().includes(lowerSearch));
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
                            <Typography.Text>{item.snapshot_max_qty !== null && item.snapshot_max_qty !== undefined ? item.snapshot_max_qty : '-'}</Typography.Text>
                        </Space>
                        <Space>
                            <Typography.Text type="secondary">Balance:</Typography.Text>
                            <Typography.Text>{item.snapshot_balance !== null && item.snapshot_balance !== undefined ? item.snapshot_balance : '-'}</Typography.Text>
                        </Space>
                        <Space>
                            <Typography.Text type="secondary">Indent Qty:</Typography.Text>
                            <Typography.Text strong style={{ color: '#1890ff' }}>{item.requested_qty}</Typography.Text>
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

export default IndentRecordPage;
