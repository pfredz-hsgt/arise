import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { api } from '../lib/api';
import dayjs from 'dayjs';

/**
 * Headless hook encapsulating batch fetching, editing, adding, removing, and saving logic
 * for Short Expiry batches.
 */
export const useShortExp = ({ isOpen, onClose, selectedItem }) => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchBatches = useCallback(async () => {
        if (!selectedItem?.id) return;
        setLoading(true);
        try {
            const data = await api.get(`/shortexp/item/${selectedItem.id}`);
            if (data && data.length > 0) {
                setBatches(data.map(b => ({
                    key: `batch_${b.id}`,
                    id: b.id,
                    batch_no: b.batch_no || '',
                    date: b.exp_date ? dayjs(b.exp_date) : null,
                    qty: b.qty || null,
                    se_remarks: b.se_remarks || ''
                })));
            } else {
                setBatches([{ key: 'batch_new_1', id: null, batch_no: '', date: null, qty: null, se_remarks: '' }]);
            }
        } catch (err) {
            console.error(err);
            message.error('Failed to load short expiry records');
        } finally {
            setLoading(false);
        }
    }, [selectedItem?.id]);

    useEffect(() => {
        if (isOpen && selectedItem) {
            fetchBatches();
        }
    }, [isOpen, selectedItem, fetchBatches]);

    const handleSave = async () => {
        if (!selectedItem?.id) return;
        setSaving(true);
        try {
            const payload = batches.map(b => ({
                id: b.id,
                batch_no: b.batch_no,
                exp_date: b.date ? b.date.format('YYYY-MM-DD') : null,
                qty: b.qty,
                se_remarks: b.se_remarks
            }));

            await api.post(`/shortexp/item/${selectedItem.id}/batches`, { batches: payload });
            message.success('Short expiry details saved');
            onClose();
        } catch (err) {
            console.error(err);
            message.error('Failed to save batches');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key, field, value) => {
        setBatches(prev => prev.map(b => b.key === key ? { ...b, [field]: value } : b));
    };

    const handleAddBatch = () => {
        const newKey = `batch_${Date.now()}`;
        setBatches(prev => [...prev, { key: newKey, id: null, batch_no: '', date: null, qty: null, se_remarks: '' }]);
        return newKey;
    };

    const handleRemoveBatch = (targetKey) => {
        setBatches(prev => prev.filter(b => b.key !== targetKey));
    };

    return {
        batches,
        setBatches,
        loading,
        saving,
        fetchBatches,
        handleSave,
        handleChange,
        handleAddBatch,
        handleRemoveBatch
    };
};

export default useShortExp;
