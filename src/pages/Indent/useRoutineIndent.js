import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export const useRoutineIndent = () => {
    const { user, profile } = useAuth();
    const [items, setItems] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [sessionId, setSessionId] = useState(null);

    // Store user inputs for the current item
    const [currentMaxQty, setCurrentMaxQty] = useState(0);
    const [currentQty, setCurrentQty] = useState(0);
    const [currentBalance, setCurrentBalance] = useState(null);
    const [currentRemarks, setCurrentRemarks] = useState('');
    const [isShortExpModalOpen, setIsShortExpModalOpen] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const rak = searchParams.get('rak');
    const resumeItemId = searchParams.get('resumeItemId');
    const initRakRef = useRef(null);
    const balanceInputRef = useRef(null);

    useEffect(() => {
        if (!loading && !loadingItem && balanceInputRef.current) {
            setTimeout(() => {
                balanceInputRef.current?.focus({ cursor: 'end' });
            }, 50);
        }
    }, [currentIndex, loading, loadingItem]);

    const loadItemData = useCallback(async (itemId, sid = sessionId, sourceItems = items) => {
        try {
            const data = await api.get(`/indent_items?session_id=${sid}&item_id=${itemId}`);

            const invItem = sourceItems.find(i => i.id === itemId);
            const maxQty = invItem?.max_qty || 0;
            const balance = invItem?.balance || 0;
            const defaultQty = Math.max(0, maxQty - balance);

            if (data) {
                setCurrentRemarks(data.indent_remarks || '');
                setCurrentMaxQty(maxQty);
                setCurrentBalance(balance);
                setCurrentQty(data.requested_qty !== undefined && data.requested_qty !== null ? data.requested_qty : defaultQty);
            } else {
                // Reset to defaults
                setCurrentMaxQty(maxQty);
                setCurrentQty(defaultQty);
                setCurrentBalance(balance);
                setCurrentRemarks('');
            }
        } catch (err) {
            console.error('Error loading item data:', err);
        }
    }, [sessionId, items]);

    const initSession = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Find or create a Draft session for this user
            let sessionData = await api.get('/indent_sessions/draft?session_type=Routine');
            let currentSessionId = sessionData?.id;

            if (!sessionData) {
                const newSession = await api.post('/indent_sessions', {
                    session_type: 'Routine',
                    status: 'Draft',
                    rak: rak
                });
                currentSessionId = newSession.id;
            } else {
                // If resuming a draft, update the rak.
                await api.put(`/indent_sessions/${currentSessionId}`, { rak: rak });
            }

            setSessionId(currentSessionId);

            // 2. Fetch inventory items for this rak and unit
            const unit = profile?.main_unit || user?.main_unit || 'OPD';
            const invItems = await api.get(`/inventory?row=${encodeURIComponent(rak)}&main_unit=${encodeURIComponent(unit)}`);

            if (!invItems || invItems.length === 0) {
                message.warning({ content: `No items found in Rak ${rak} for ${unit}`, key: 'no-items' });
                navigate('/home');
                return;
            }

            setItems(invItems);

            // 3. Load draft data for the specified or first item
            let startIndex = 0;
            if (resumeItemId) {
                const foundIndex = invItems.findIndex(i => i.id === resumeItemId);
                if (foundIndex !== -1) {
                    startIndex = foundIndex;
                }
            }
            setCurrentIndex(startIndex);
            await loadItemData(invItems[startIndex].id, currentSessionId, invItems);

        } catch (error) {
            console.error(error);
            message.error("Failed to initialize routine session.");
        } finally {
            setLoading(false);
        }
    }, [rak, profile, user, resumeItemId, loadItemData, navigate]);

    useEffect(() => {
        if (!rak) {
            navigate('/home');
            return;
        }
        if (initRakRef.current !== rak) {
            initRakRef.current = rak;
            initSession();
        }
    }, [rak, initSession, navigate]);

    const saveCurrentData = async () => {
        if (!items[currentIndex]) return true;

        setSaving(true);
        try {
            const currentItem = items[currentIndex];

            // Upsert the data
            const upsertData = {
                session_id: sessionId,
                item_id: currentItem.id,
                requested_qty: currentQty,
                indent_remarks: currentRemarks,
                snapshot_max_qty: currentMaxQty,
                snapshot_balance: currentBalance,
            };

            // check if row already exists
            const existing = await api.get(`/indent_items?session_id=${sessionId}&item_id=${currentItem.id}`);

            if (existing) {
                await api.put(`/indent_items/${existing.id}`, upsertData);
            } else {
                await api.post('/indent_items', upsertData);
            }

            // Save balance if it was adjusted
            const inventoryUpdates = {};
            if (currentBalance !== currentItem.balance) {
                inventoryUpdates.balance = currentBalance;
            }

            if (Object.keys(inventoryUpdates).length > 0) {
                await api.put(`/inventory/${currentItem.id}`, inventoryUpdates);
                // Update local items array so we don't think it changed next time
                setItems(prevItems => prevItems.map(item => item.id === currentItem.id ? { ...item, ...inventoryUpdates } : item));
            }

            return true;
        } catch (error) {
            console.error(error);
            message.error("Failed to save item data.");
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        const success = await saveCurrentData();
        if (success) {
            if (currentIndex < items.length - 1) {
                const nextIndex = currentIndex + 1;
                setLoadingItem(true);
                try {
                    api.put(`/indent_sessions/${sessionId}`, { last_item: items[nextIndex].id }).catch(console.error);
                    await loadItemData(items[nextIndex].id, sessionId);
                    setCurrentIndex(nextIndex);
                } finally {
                    setLoadingItem(false);
                }
            } else {
                // Done! Navigate to summary
                navigate('/routine-summary');
            }
        }
    };

    const handlePrevious = async () => {
        const success = await saveCurrentData();
        if (success && currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setLoadingItem(true);
            try {
                api.put(`/indent_sessions/${sessionId}`, { last_item: items[prevIndex].id }).catch(console.error);
                await loadItemData(items[prevIndex].id, sessionId);
                setCurrentIndex(prevIndex);
            } finally {
                setLoadingItem(false);
            }
        }
    };

    const handleBalanceChange = (val) => {
        const numericVal = val === null || val === undefined || val === '' ? null : Number(val);
        setCurrentBalance(numericVal);
        const max = currentMaxQty || 0;
        if (numericVal !== null) {
            setCurrentQty(Math.max(0, max - numericVal));
        }
    };

    const handleMaxQtyChange = (val) => {
        const numericVal = val === null || val === undefined || val === '' ? 0 : Number(val);
        setCurrentMaxQty(numericVal);
        if (currentBalance !== null) {
            setCurrentQty(Math.max(0, numericVal - currentBalance));
        }
    };

    // Quick helper for mobile (e.g. out of stock or full stock presets)
    const setBalanceQuick = (val) => {
        handleBalanceChange(val);
    };

    const adjustQty = (delta) => {
        setCurrentQty(prev => Math.max(0, (Number(prev) || 0) + delta));
    };

    const adjustBalance = (delta) => {
        const current = currentBalance !== null && currentBalance !== undefined ? Number(currentBalance) : 0;
        const nextVal = Math.max(0, current + delta);
        handleBalanceChange(nextVal);
    };

    const currentItem = items[currentIndex] || null;
    const progressPercent = items.length > 0 ? Math.round(((currentIndex + 1) / items.length) * 100) : 0;

    return {
        rak,
        items,
        currentIndex,
        currentItem,
        progressPercent,
        loading,
        saving,
        loadingItem,
        sessionId,
        currentMaxQty,
        setCurrentMaxQty,
        currentQty,
        setCurrentQty,
        currentBalance,
        setCurrentBalance,
        currentRemarks,
        setCurrentRemarks,
        isShortExpModalOpen,
        setIsShortExpModalOpen,
        balanceInputRef,
        handleBalanceChange,
        handleMaxQtyChange,
        setBalanceQuick,
        adjustQty,
        adjustBalance,
        handleNext,
        handlePrevious,
        saveCurrentData,
        navigate
    };
};

export default useRoutineIndent;
