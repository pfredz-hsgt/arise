import { useState, useEffect, useCallback } from 'react';
import { message, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { confirm } = Modal;

/**
 * Headless hook containing all Routine Summary data loading, session handling,
 * item editing, and submission logic.
 */
export const useRoutineSummary = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [sessionData, setSessionData] = useState(null);
    const [indentItems, setIndentItems] = useState([]);
    const [viewMode, setViewMode] = useState('list');

    // Editing states for item modal / drawer
    const [editingItem, setEditingItem] = useState(null);
    const [editMaxQty, setEditMaxQty] = useState(0);
    const [editBalance, setEditBalance] = useState(0);
    const [editQty, setEditQty] = useState(0);
    const [editRemarks, setEditRemarks] = useState('');
    const [editSaving, setEditSaving] = useState(false);

    // Short expiry modal trigger
    const [isShortExpModalOpen, setIsShortExpModalOpen] = useState(false);

    const fetchSummaryData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch current Draft session
            const session = await api.get('/indent_sessions/draft');

            if (!session) {
                message.info({ content: "You don't have any active indent drafts at the moment.", key: 'no-drafts' });
                navigate('/home');
                return;
            }

            setSessionData(session);

            // 2. Fetch items for this session
            const items = await api.get(`/indent_items?session_id=${session.id}`);
            let finalItems = items || [];

            // 3. If session has a rak, fetch full inventory to fill in un-indented items as mock items
            if (session.rak) {
                const unit = profile?.main_unit || user?.main_unit || 'OPD';
                const invItems = await api.get(`/inventory?row=${encodeURIComponent(session.rak)}&main_unit=${encodeURIComponent(unit)}`);

                if (invItems) {
                    const existingItemIds = new Set(finalItems.map(item => item.item_id));
                    const missingItems = invItems
                        .filter(invItem => !existingItemIds.has(invItem.id))
                        .map(invItem => ({
                            id: `mock-${invItem.id}`,
                            session_id: session.id,
                            item_id: invItem.id,
                            requested_qty: 0,
                            inventory_items: invItem,
                            is_mock: true
                        }));

                    finalItems = [...finalItems, ...missingItems];
                    finalItems.sort((a, b) => a.inventory_items?.name?.localeCompare(b.inventory_items?.name));
                }
            }

            setIndentItems(finalItems);
        } catch (error) {
            console.error("Error fetching summary data:", error);
            message.error("Failed to load summary.");
        } finally {
            setLoading(false);
        }
    }, [navigate, profile, user]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSummaryData();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchSummaryData]);

    const handleEditClick = (record) => {
        setEditingItem(record);
        setEditMaxQty(record.inventory_items?.max_qty || 0);
        setEditBalance(record.inventory_items?.balance || 0);
        setEditQty(record.requested_qty || 0);
        setEditRemarks(record.indent_remarks || '');
    };

    const handleSaveEdit = async () => {
        if (!editingItem) return;
        setEditSaving(true);
        try {
            const upsertData = {
                session_id: sessionData.id,
                item_id: editingItem.item_id,
                requested_qty: editQty || 0,
                indent_remarks: editRemarks,
                snapshot_max_qty: editMaxQty,
                snapshot_balance: editBalance,
            };

            if (editingItem.is_mock) {
                if (upsertData.requested_qty > 0 || editRemarks) {
                    const data = await api.post('/indent_items', upsertData);
                    setIndentItems(prevItems =>
                        prevItems.map(item =>
                            item.id === editingItem.id ? { ...item, ...data, is_mock: false } : item
                        )
                    );
                }
            } else {
                if (upsertData.requested_qty === 0 && !editRemarks) {
                    await api.delete(`/indent_items/${editingItem.id}`);
                    setIndentItems(prevItems =>
                        prevItems.map(item =>
                            item.id === editingItem.id ? {
                                ...item,
                                ...upsertData,
                                id: `mock-${item.item_id}`,
                                is_mock: true
                            } : item
                        )
                    );
                } else {
                    await api.put(`/indent_items/${editingItem.id}`, upsertData);
                    setIndentItems(prevItems =>
                        prevItems.map(item =>
                            item.id === editingItem.id ? { ...item, ...upsertData } : item
                        )
                    );
                }
            }

            // Sync inventory balance if adjusted
            const inventoryUpdates = {};
            if (editBalance !== editingItem.inventory_items?.balance) {
                inventoryUpdates.balance = editBalance;
                await api.put(`/inventory/${editingItem.item_id}`, inventoryUpdates);
                setIndentItems(prevItems =>
                    prevItems.map(item =>
                        item.id === editingItem.id
                            ? { ...item, inventory_items: { ...item.inventory_items, ...inventoryUpdates } }
                            : item
                    )
                );
            }

            setEditingItem(null);
            message.success("Item updated");
        } catch (error) {
            console.error(error);
            message.error("Failed to update item.");
        } finally {
            setEditSaving(false);
        }
    };

    const submitIndent = async () => {
        setSubmitting(true);
        try {
            const mockItemsToInsert = indentItems
                .filter(item => item.is_mock)
                .map(item => ({
                    session_id: item.session_id,
                    item_id: item.item_id,
                    requested_qty: 0,
                    snapshot_max_qty: item.inventory_items?.max_qty || 0,
                    snapshot_balance: item.inventory_items?.balance || 0,
                }));

            if (mockItemsToInsert.length > 0) {
                await api.post('/indent_items/bulk', { items: mockItemsToInsert });
            }

            await api.put(`/indent_sessions/${sessionData.id}`, { status: 'Submitted' });

            message.success({ content: "Indent submitted successfully to Issuer!", duration: 5 });
            navigate('/home');
        } catch (error) {
            message.error("Failed to submit indent.");
            console.error(error);
            setSubmitting(false);
        }
    };

    const handleSend = () => {
        confirm({
            title: 'Send this indent to Substore?',
            icon: ExclamationCircleOutlined,
            content: 'Once sent you won\'t be able to edit anymore.',
            onOk() {
                submitIndent();
            },
        });
    };

    const handleResume = () => {
        if (!sessionData?.rak) {
            navigate(-1);
            return;
        }

        let url = `/routine-indent?rak=${sessionData.rak}`;
        if (sessionData.last_item) {
            url += `&resumeItemId=${sessionData.last_item}`;
        } else {
            const firstZeroItem = indentItems.find(item => item.requested_qty === 0 || !item.requested_qty);
            if (firstZeroItem) {
                url += `&resumeItemId=${firstZeroItem.item_id}`;
            }
        }

        navigate(url);
    };

    // Quick helpers for balance adjustments
    const setEditBalanceQuick = (val) => {
        const numVal = Number(val);
        setEditBalance(numVal);
        const max = editMaxQty || 0;
        setEditQty(Math.max(0, max - numVal));
    };

    const adjustEditBalance = (delta) => {
        const current = Number(editBalance) || 0;
        const next = Math.max(0, current + delta);
        setEditBalance(next);
        const max = editMaxQty || 0;
        setEditQty(Math.max(0, max - next));
    };

    const adjustEditQty = (delta) => {
        setEditQty(prev => Math.max(0, (Number(prev) || 0) + delta));
    };

    const lastItemIndex = sessionData?.last_item
        ? indentItems.findIndex(i => i.item_id === sessionData.last_item)
        : -1;

    const progressPercent = indentItems.length > 0
        ? Math.round(((lastItemIndex >= 0 ? lastItemIndex + 1 : 0) / indentItems.length) * 100)
        : 0;

    const indentedCount = indentItems.filter(i => (i.requested_qty || 0) > 0).length;

    return {
        user,
        profile,
        sessionData,
        indentItems,
        setIndentItems,
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
        indentedCount,
        handleEditClick,
        handleSaveEdit,
        handleSend,
        submitIndent,
        handleResume,
        setEditBalanceQuick,
        adjustEditBalance,
        adjustEditQty,
        navigate
    };
};

export default useRoutineSummary;
