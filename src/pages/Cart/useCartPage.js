import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

/**
 * Headless hook encapsulating Cart session data loading, PhIS automation,
 * item quantity editing, approval/clearing, and Kew.PS-8 PDF generation.
 */
export const useCartPage = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const unit = profile?.main_unit || user?.main_unit || 'OPD';

    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [selectedSessions, setSelectedSessions] = useState([]);
    const [unitFilter, setUnitFilter] = useState('ALL'); // 'ALL' | 'OPD' | 'ED'

    // Edit Modal State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [updatingQty, setUpdatingQty] = useState(false);

    // PhIS Automation State
    const [isTerminalVisible, setIsTerminalVisible] = useState(false);
    const [terminalLogs, setTerminalLogs] = useState([]);
    const [successIndentNo, setSuccessIndentNo] = useState(null);
    const [skippedItems, setSkippedItems] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const abortControllerRef = useRef(null);

    const fetchCartSessions = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);

            // Fetch sessions that are "Submitted" (Pending Issuer Action) for user's main_unit
            const { sessionsData, requestsData } = await api.get(`/indents/cart?main_unit=${encodeURIComponent(unit)}`);

            // Sort and deduplicate items inside each session
            const processedSessions = (sessionsData || [])
                .map(sess => {
                    const uniqueItemsMap = new Map();
                    sess.indent_items.forEach(item => {
                        const parsedQty = Number(item.requested_qty) || 0;
                        if (!uniqueItemsMap.has(item.item_id)) {
                            uniqueItemsMap.set(item.item_id, { ...item, requested_qty: parsedQty });
                        } else {
                            uniqueItemsMap.get(item.item_id).requested_qty += parsedQty;
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

            // Map indent_requests to a mock session grouped by user and unit
            if (requestsData && requestsData.length > 0) {
                const groupedRequests = requestsData.reduce((acc, req) => {
                    const profileName = req.profiles?.name || 'Unknown Indenter';
                    const userUnit = req.user_main_unit || req.inventory_items?.main_unit || unit;
                    const groupKey = `${profileName}_${userUnit}`;
                    if (!acc[groupKey]) {
                        acc[groupKey] = {
                            profileName,
                            userUnit,
                            reqs: []
                        };
                    }
                    acc[groupKey].reqs.push(req);
                    return acc;
                }, {});

                Object.values(groupedRequests).forEach((group, index) => {
                    const { profileName, userUnit, reqs } = group;
                    const uniqueMappedItems = new Map();
                    reqs.forEach(req => {
                        const parsedQty = Number(req.requested_qty) || 0;
                        if (!uniqueMappedItems.has(req.item_id)) {
                            uniqueMappedItems.set(req.item_id, {
                                id: `req-${req.id}`,
                                original_req_id: req.id,
                                item_id: req.inventory_items?.id,
                                requested_qty: parsedQty,
                                snapshot_max_qty: req.snapshot_max_qty,
                                snapshot_balance: req.snapshot_balance,
                                indent_remarks: req.indent_remarks,
                                inventory_items: req.inventory_items,
                                created_at: req.created_at
                            });
                        } else {
                            uniqueMappedItems.get(req.item_id).requested_qty += parsedQty;
                        }
                    });

                    const mappedItems = Array.from(uniqueMappedItems.values())
                        .sort((a, b) =>
                            (a.inventory_items?.name || '').localeCompare(b.inventory_items?.name || '')
                        );

                    processedSessions.push({
                        id: `adhoc-requests-${profileName}-${userUnit}-${index}`,
                        created_at: reqs[0].created_at,
                        session_type: 'Urgent Indent',
                        rak: null,
                        profiles: {
                            name: profileName,
                            phis_username: reqs[0].profiles?.phis_username,
                            phis_password: reqs[0].profiles?.phis_password
                        },
                        user_main_unit: userUnit,
                        indent_items: mappedItems,
                        isAdhocRequests: true,
                        profileName: profileName
                    });
                });
            }

            setSessions(processedSessions);
            setSelectedSessions([]);
        } catch (error) {
            console.error('Error fetching cart items:', error);
            message.error('Failed to load cart items');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [unit]);

    useEffect(() => {
        fetchCartSessions();
    }, [fetchCartSessions]);

    const handleUpdateQuantity = async (updatedQuantity) => {
        if (!editingItem) return;

        try {
            setUpdatingQty(true);

            if (editingItem.original_req_id) {
                // Update Ad-hoc Request
                await api.put(`/indents/${editingItem.original_req_id}`, { requested_qty: updatedQuantity });
            } else {
                // Update Session Item
                await api.put(`/indent_items/${editingItem.id}`, { requested_qty: updatedQuantity });
            }

            message.success('Quantity updated successfully');
            setEditModalVisible(false);
            setEditingItem(null);
            fetchCartSessions(true);
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
            icon: ExclamationCircleOutlined,
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
            const session = sessions.find(s => s.id === sessionId);

            if (session && session.isAdhocRequests) {
                const requestIdsToApprove = session.indent_items.map(item => item.original_req_id);
                if (requestIdsToApprove.length > 0) {
                    await api.post('/indents/batch-update', { ids: requestIdsToApprove, status: 'Approved' });
                }
            } else {
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

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Pekeliling Perbendaharaan Malaysia', 10, yPosition);
        doc.text('AM 6.5 Lampiran B', pageWidth - 10, yPosition, { align: 'right' });
        yPosition += 5;

        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('KEW.PS-8', pageWidth - 10, yPosition, { align: 'right' });
        yPosition += 5;
        doc.setFont(undefined, 'normal');
        doc.text('No. BPSI : .........', pageWidth - 10, yPosition, { align: 'right' });
        yPosition += 5;

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('BORANG PERMOHONAN STOK', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;
        doc.text('(INDIVIDU KEPADA STOR)', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 5;

        const tableData = session.indent_items.map((item) => [
            '',
            (item.inventory_items?.name || '') + (item.inventory_items?.pku ? ` (${item.inventory_items.pku})` : ''),
            item.requested_qty || 0,
            item.indent_remarks || '',
            '',
            '',
            '',
            '',
            '',
        ]);

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
                    doc.setLineWidth(0.2);
                }
            },
        });

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        return doc;
    };

    const previewSingleSessionPDF = (session) => {
        try {
            const doc = generatePDFDocument(session);
            const timestamp = dayjs(session.created_at).format('YYYYMMDD_HHmm');
            const filename = `Indent_${timestamp}.pdf`;

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
        } catch (error) {
            console.error('Error previewing single PDF:', error);
            message.error('Failed to preview PDF');
        }
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

    const filteredSessions = useMemo(() => {
        if (unit !== 'OPD' || unitFilter === 'ALL') {
            return sessions;
        }
        return sessions.filter(s => (s.user_main_unit || unit) === unitFilter);
    }, [sessions, unit, unitFilter]);

    const unitCounts = useMemo(() => {
        const counts = { all: sessions.length, opd: 0, ed: 0 };
        sessions.forEach(s => {
            const u = s.user_main_unit || unit;
            if (u === 'OPD') counts.opd++;
            else if (u === 'ED') counts.ed++;
        });
        return counts;
    }, [sessions, unit]);

    const toggleSessionSelect = (sessionId) => {
        setSelectedSessions(prev =>
            prev.includes(sessionId)
                ? prev.filter(id => id !== sessionId)
                : [...prev, sessionId]
        );
    };

    const toggleSelectAll = () => {
        const currentList = filteredSessions;
        const allSelected = currentList.length > 0 && currentList.every(s => selectedSessions.includes(s.id));
        if (allSelected) {
            const currentIds = new Set(currentList.map(s => s.id));
            setSelectedSessions(prev => prev.filter(id => !currentIds.has(id)));
        } else {
            const newSelected = new Set([...selectedSessions, ...currentList.map(s => s.id)]);
            setSelectedSessions(Array.from(newSelected));
        }
    };

    return {
        unit,
        user,
        profile,
        loading,
        sessions: filteredSessions,
        allSessions: sessions,
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
        setIsTerminalVisible,
        terminalLogs,
        successIndentNo,
        setSuccessIndentNo,
        skippedItems,
        fetchCartSessions,
        handleUpdateQuantity,
        handlePhisIndentClick,
        startPhisIndent,
        handleAbortProcess,
        handleClearSession,
        previewSingleSessionPDF,
        processPDFExport,
        generatePDFDocument,
        toggleSessionSelect,
        toggleSelectAll,
        navigate
    };
};

export default useCartPage;
