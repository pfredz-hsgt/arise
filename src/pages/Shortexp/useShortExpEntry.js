import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Headless hook managing Short Expiry entry wizard, Rak selection,
 * batch recording iteration, and single-drug search.
 */
export const useShortExpEntry = () => {
    const { user, profile } = useAuth();
    const unit = profile?.main_unit || user?.main_unit || 'OPD';
    const navigate = useNavigate();

    // Setup state
    const [raks, setRaks] = useState([]);
    const [loadingRaks, setLoadingRaks] = useState(true);
    const [selectedRak, setSelectedRak] = useState(null);
    const [isStarted, setIsStarted] = useState(false);

    // Iteration state
    const [items, setItems] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Current item data
    const [iteratorBatches, setIteratorBatches] = useState([]);

    // Search and Modal state
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Search effect
    useEffect(() => {
        const search = async () => {
            if (!debouncedSearchTerm) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const data = await api.get(
                    `/inventory?search=${encodeURIComponent(debouncedSearchTerm)}&main_unit=${encodeURIComponent(unit)}`
                );
                setSearchResults(data || []);
            } catch (err) {
                console.error(err);
                message.error('Search failed');
            } finally {
                setIsSearching(false);
            }
        };
        search();
    }, [debouncedSearchTerm, unit]);

    const openItemModal = useCallback((item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    }, []);

    useEffect(() => {
        const fetchRaks = async () => {
            setLoadingRaks(true);
            try {
                const uniqueRaks = await api.get(`/inventory/raks?main_unit=${encodeURIComponent(unit)}`);
                const raksList = Array.isArray(uniqueRaks)
                    ? uniqueRaks.map(r => (typeof r === 'object' ? r.row : r))
                    : [];
                setRaks(raksList);
            } catch (err) {
                console.error('Error fetching raks', err);
                message.error('Failed to load Raks');
            } finally {
                setLoadingRaks(false);
            }
        };

        fetchRaks();
    }, [unit]);

    const loadItemData = useCallback(async (itemId) => {
        const data = await api.get(`/shortexp/item/${itemId}`);

        if (data && data.length > 0) {
            setIteratorBatches(
                data.map(b => ({
                    key: `batch_${b.id}`,
                    id: b.id,
                    batch_no: b.batch_no || '',
                    date: b.exp_date ? dayjs(b.exp_date) : null,
                    qty: b.qty || null,
                    se_remarks: b.se_remarks || ''
                }))
            );
        } else {
            setIteratorBatches([
                { key: 'batch_new_1', id: null, batch_no: '', date: null, qty: null, se_remarks: '' }
            ]);
        }
    }, []);

    const initSessionAndItems = useCallback(async (rak) => {
        setLoading(true);
        try {
            const invItems = await api.get(
                `/inventory?row=${encodeURIComponent(rak)}&main_unit=${encodeURIComponent(unit)}`
            );

            if (!invItems || invItems.length === 0) {
                message.warning(`No items found in Rak ${rak} for ${unit}`);
                return false;
            }

            setItems(invItems);
            setCurrentIndex(0);
            await loadItemData(invItems[0].id);
            return true;
        } catch (error) {
            console.error(error);
            message.error('Failed to initialize items.');
            return false;
        } finally {
            setLoading(false);
        }
    }, [unit, loadItemData]);

    const handleStart = useCallback(async () => {
        if (!selectedRak) {
            message.warning('Please select a Rak first!');
            return;
        }
        const success = await initSessionAndItems(selectedRak);
        if (success) {
            setIsStarted(true);
        }
    }, [selectedRak, initSessionAndItems]);

    const saveCurrentData = useCallback(async () => {
        if (!items[currentIndex]) return true;

        setSaving(true);
        try {
            const currentItem = items[currentIndex];

            const payload = iteratorBatches.map(b => ({
                id: b.id,
                batch_no: b.batch_no,
                exp_date: b.date ? b.date.format('YYYY-MM-DD') : null,
                qty: b.qty,
                se_remarks: b.se_remarks
            }));

            await api.post(`/shortexp/item/${currentItem.id}/batches`, { batches: payload });
            return true;
        } catch (error) {
            console.error(error);
            message.error('Failed to save item data.');
            return false;
        } finally {
            setSaving(false);
        }
    }, [items, currentIndex, iteratorBatches]);

    const handleNext = useCallback(async () => {
        const success = await saveCurrentData();
        if (success) {
            if (currentIndex < items.length - 1) {
                const nextIndex = currentIndex + 1;
                setCurrentIndex(nextIndex);
                await loadItemData(items[nextIndex].id);
            } else {
                message.success('Completed Rak!');
                navigate('/shortexp');
            }
        }
    }, [saveCurrentData, currentIndex, items, loadItemData, navigate]);

    const handlePrevious = useCallback(async () => {
        const success = await saveCurrentData();
        if (success && currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            await loadItemData(items[prevIndex].id);
        }
    }, [saveCurrentData, currentIndex, items, loadItemData]);

    return {
        unit,
        user,
        profile,
        raks,
        loadingRaks,
        selectedRak,
        setSelectedRak,
        isStarted,
        setIsStarted,
        items,
        currentIndex,
        setCurrentIndex,
        loading,
        saving,
        iteratorBatches,
        setIteratorBatches,
        searchTerm,
        setSearchTerm,
        debouncedSearchTerm,
        searchResults,
        isSearching,
        isModalOpen,
        setIsModalOpen,
        selectedItem,
        setSelectedItem,
        openItemModal,
        handleStart,
        handleNext,
        handlePrevious,
        navigate
    };
};

export default useShortExpEntry;
