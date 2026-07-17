import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Typography,
    Space,
    Collapse,
    List,
    Tag,
    Button,
    Empty,
    Spin,
    message,
    Modal,
    Popconfirm,
    Checkbox,
    InputNumber,
    Form,
    Input,
    Divider,
} from 'antd';
import {
    HistoryOutlined,
    EyeOutlined,
    DownloadOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    CopyOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { api } from '../../lib/api';
import { getPuchaseTypeColor, getStdKtColor } from '../../lib/colorMappings';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const CartPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [selectedSessions, setSelectedSessions] = useState([]);

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [newQuantity, setNewQuantity] = useState(0);
    const [updatingQty, setUpdatingQty] = useState(false);

    // PhIS Automation State
    const [isTerminalVisible, setIsTerminalVisible] = useState(false);
    const [terminalLogs, setTerminalLogs] = useState([]);
    const [successIndentNo, setSuccessIndentNo] = useState(null);
    const [skippedItems, setSkippedItems] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const abortControllerRef = useRef(null);

    useEffect(() => {
        fetchCartSessions();
    }, []);

    const fetchCartSessions = async () => {
        try {
            setLoading(true);

            // Fetch sessions that are "Submitted" (Pending Issuer Action)
            const { sessionsData, requestsData } = await api.get('/indents/cart');

            // Sort and deduplicate items inside each session
            const processedSessions = (sessionsData || [])
                .map(sess => {
                    const uniqueItemsMap = new Map();
                    sess.indent_items.forEach(item => {
                        if (!uniqueItemsMap.has(item.item_id)) {
                            uniqueItemsMap.set(item.item_id, { ...item });
                        } else {
                            uniqueItemsMap.get(item.item_id).requested_qty += item.requested_qty;
                        }
                    });

                    const sortedItems = Array.from(uniqueItemsMap.values())
                        .filter(item => item.requested_qty >= 0)
                        .sort((a, b) =>
                            (a.inventory_items?.name || '').localeCompare(b.inventory_items?.name || '')
                        );
                    return { ...sess, indent_items: sortedItems };
                })
                .filter(sess => sess.indent_items.length > 0);

            // Map indent_requests to a mock session grouped by user
            if (requestsData && requestsData.length > 0) {
                // Group by profile name
                const groupedRequests = requestsData.reduce((acc, req) => {
                    const profileName = req.profiles?.name || 'Unknown Indenter';
                    if (!acc[profileName]) {
                        acc[profileName] = [];
                    }
                    acc[profileName].push(req);
                    return acc;
                }, {});

                // Create a session for each group
                Object.entries(groupedRequests).forEach(([profileName, reqs], index) => {
                    const uniqueMappedItems = new Map();
                    reqs.forEach(req => {
                        if (!uniqueMappedItems.has(req.item_id)) {
                            uniqueMappedItems.set(req.item_id, {
                                id: `req-${req.id}`,
                                original_req_id: req.id,
                                item_id: req.inventory_items?.id,
                                requested_qty: req.requested_qty,
                                snapshot_max_qty: req.snapshot_max_qty,
                                snapshot_balance: req.snapshot_balance,
                                indent_remarks: req.indent_remarks,
                                inventory_items: req.inventory_items,
                                created_at: req.created_at
                            });
                        } else {
                            uniqueMappedItems.get(req.item_id).requested_qty += req.requested_qty;
                        }
                    });

                    const mappedItems = Array.from(uniqueMappedItems.values())
                        .sort((a, b) =>
                            (a.inventory_items?.name || '').localeCompare(b.inventory_items?.name || '')
                        );

                    processedSessions.push({
                        id: `adhoc-requests-${profileName}-${index}`, // Make id unique per group
                        created_at: reqs[0].created_at,
                        session_type: 'Urgent Indent',
                        rak: null,
                        profiles: {
                            name: profileName,
                            phis_username: reqs[0].profiles?.phis_username,
                            phis_password: reqs[0].profiles?.phis_password
                        },
                        indent_items: mappedItems,
                        isAdhocRequests: true,
                        profileName: profileName // useful for clearing logic
                    });
                });
            }

            setSessions(processedSessions);
            setSelectedSessions([]);

        } catch (error) {
            console.error('Error fetching cart items:', error);
            message.error('Failed to load cart items');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuantity = async () => {
        if (!editingItem) return;

        try {
            setUpdatingQty(true);

            if (editingItem.original_req_id) {
                // Update Ad-hoc Request
                await api.put(`/indents/${editingItem.original_req_id}`, { requested_qty: newQuantity });
            } else {
                // Update Session Item
                await api.put(`/indent_items/${editingItem.id}`, { requested_qty: newQuantity });
            }

            message.success('Quantity updated successfully');
            setEditModalVisible(false);
            fetchCartSessions(); // Refresh data
        } catch (error) {
            console.error('Error updating quantity:', error);
            message.error('Failed to update quantity');
        } finally {
            setUpdatingQty(false);
        }
    };

    const handlePhisIndentClick = (session) => {
        Modal.confirm({
            title: 'Confirm PhIS Indent',
            icon: <ExclamationCircleOutlined style={{ color: '#1890ff' }} />,
            content: 'Are you sure you want to proceed with this PhIS Indent?',
            okText: 'Yes, Proceed',
            cancelText: 'Cancel',
            centered: true,
            okButtonProps: { type: 'primary' },
            onOk: () => {
                startPhisIndent(session);
            }
        });
    };

    const startPhisIndent = async (session) => {
        const username = session.profiles?.phis_username;
        const password = session.profiles?.phis_password;

        if (!username || !password) {
            message.error(`Indenter '${session.profiles?.name || 'Unknown'}' has not set their PHIS credentials. Please update their profile.`);
            return;
        }

        setIsTerminalVisible(true);
        setTerminalLogs(['Connecting to backend...']);
        setSkippedItems([]);
        setActiveSessionId(session.id);

        abortControllerRef.current = new AbortController();

        try {
            const items = session.indent_items.map(item => ({
                item_code: item.inventory_items?.item_code,
                item_name: item.inventory_items?.name,
                requested_qty: item.requested_qty * (item.inventory_items?.convert_sku || 1)
            })).filter(i => i.item_code && i.requested_qty > 0);

            if (items.length === 0) {
                setTerminalLogs(prev => [...prev, 'Error: No valid items (with code and qty > 0) to indent.']);
                return;
            }

            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.PROD ? '/arise/api' : 'http://localhost:3005/api';

            const response = await fetch(`${apiUrl}/indents/phis-indent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    items,
                    username,
                    password,
                    sessionId: session.id
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.body) {
                throw new Error('ReadableStream not yet supported in this browser.');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(l => l.trim().length > 0);
                if (lines.length > 0) {
                    const displayLines = lines.filter(l => !l.startsWith('JSON_SKIPPED_ITEMS:'));
                    if (displayLines.length > 0) {
                        setTerminalLogs(prev => [...prev, ...displayLines]);
                    }

                    // Check if indent number was returned or skipped items
                    for (const line of lines) {
                        if (line.startsWith('The PhIS Indent Number is: ')) {
                            const indentNo = line.replace('The PhIS Indent Number is: ', '').trim();
                            setSuccessIndentNo(indentNo);
                        } else if (line.startsWith('JSON_SKIPPED_ITEMS:')) {
                            try {
                                const jsonStr = line.replace('JSON_SKIPPED_ITEMS:', '').trim();
                                setSkippedItems(JSON.parse(jsonStr));
                            } catch (e) {
                                console.error('Failed to parse skipped items', e);
                            }
                        }
                    }
                }
            }
            setTerminalLogs(prev => [...prev, 'Process finished.']);
        } catch (error) {
            if (error.name === 'AbortError') {
                setTerminalLogs(prev => [...prev, 'PhIS indenting process terminated by user']);
                console.log('Indent process aborted by user.');
            } else {
                console.error('Error in PhIS indent:', error);
                setTerminalLogs(prev => [...prev, `Error: ${error.message}`]);
            }
        }
    };

    const handleAbortProcess = async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        if (activeSessionId) {
            try {
                const token = localStorage.getItem('token');
                const apiUrl = import.meta.env.PROD ? '/arise/api' : 'http://localhost:3005/api';
                await fetch(`${apiUrl}/indents/abort-phis-indent`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ sessionId: activeSessionId })
                });
            } catch (err) {
                console.error("Failed to abort process remotely", err);
            }
        }
        setIsTerminalVisible(false);
        setActiveSessionId(null);
    };

    const handleClearSession = async (sessionId) => {
        try {
            // Find if this session is an adhoc session
            const session = sessions.find(s => s.id === sessionId);

            if (session && session.isAdhocRequests) {
                // If this is an adhoc-requests group, we need to extract the original request IDs
                // and mark ONLY those requests as Approved to avoid clearing requests from other users
                const requestIdsToApprove = session.indent_items.map(item => item.original_req_id);

                if (requestIdsToApprove.length > 0) {
                    await api.post('/indents/batch-update', { ids: requestIdsToApprove, status: 'Approved' });
                }
            } else {
                // Mark as Approved/Completed
                await api.put(`/indent_sessions/${sessionId}`, { status: 'Approved' });
            }

            message.success('Indent Session cleared successfully!');
            fetchCartSessions();
        } catch (error) {
            console.error('Error clearing indent:', error);
            message.error('Failed to clear indent');
        }
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

        const tableData = session.indent_items.map((item) => [
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

    const processPDFExport = (mode) => {
        try {
            let exportCount = 0;

            sessions.forEach(session => {
                if (!selectedSessions.includes(session.id) || session.indent_items.length === 0) return;

                const doc = generatePDFDocument(session);
                const timestamp = dayjs(session.created_at).format('YYYYMMDD_HHmm');
                const filename = `Indent_${timestamp}.pdf`;

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

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>;

    return (
        <div className="cart-page">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <Title level={3} style={{ margin: 0 }}>Indent Cart</Title>
                        <Text type="secondary">{sessions.length} submitted session(s) waiting for approval</Text>
                    </div>
                    <Space wrap>

                        <Button
                            icon={<EyeOutlined style={{ fontSize: 19 }} />}
                            onClick={() => processPDFExport('preview')}
                            disabled={selectedSessions.length === 0}
                            tooltip={<span>Preview</span>}
                            size="medium"
                            style={{ backgroundColor: selectedSessions.length === 0 ? undefined : '#6D28D9', borderColor: selectedSessions.length === 0 ? '#d6d6d6' : '#6D28D9', color: selectedSessions.length === 0 ? undefined : '#fff' }}
                        />
                        <Button
                            icon={<DownloadOutlined style={{ fontSize: 19 }} />}
                            onClick={() => processPDFExport('download')}
                            disabled={selectedSessions.length === 0}
                            tooltip={<span>Download Selected</span>}
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
                                            <Popconfirm
                                                title="Clear this session?"
                                                description="Mark this indent as approved and processed?"
                                                onConfirm={(e) => {
                                                    e.stopPropagation();
                                                    handleClearSession(session.id);
                                                }}
                                                onCancel={(e) => e.stopPropagation()}
                                                okText="Yes"
                                                cancelText="No"
                                            >
                                                <Button
                                                    size="small"
                                                    type="primary"
                                                    icon={<CheckCircleOutlined />}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Approve & Clear
                                                </Button>
                                            </Popconfirm>
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
                                                opacity: item.requested_qty === 0 ? 0.4 : 1
                                            }}
                                            onClick={() => {
                                                setEditingItem(item);
                                                setNewQuantity(item.requested_qty);
                                                setEditModalVisible(true);
                                            }}
                                            className="hover:bg-gray-50 transition-colors"
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
                                                            <Tag style={{ fontSize: '14px', padding: '2px 8px', fontWeight: 'bold' }} icon={<CheckCircleOutlined />} color='green' variant='filled' >{item.requested_qty}</Tag>
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

            <Modal
                title="Edit Quantity"
                open={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                confirmLoading={updatingQty}
                width={'450px'}
                onOk={handleUpdateQuantity}
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
                                    value={newQuantity}
                                    onChange={setNewQuantity}
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
                    ref={el => { if (el) el.scrollTop = el.scrollHeight; }}
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
                                        const successful = document.execCommand('copy');
                                        if (successful) {
                                            message.success('Indent Number copied!');
                                        } else {
                                            message.error('Browser blocked copying. Please highlight and copy manually.');
                                        }
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
        </div >
    );
};

export default CartPage;
