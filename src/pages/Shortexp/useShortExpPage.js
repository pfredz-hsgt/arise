import { useState, useEffect, useMemo, useCallback } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Headless hook managing Short Expiry drugs fetching, filtering,
 * Excel export, editing modal state, and archival.
 */
export const useShortExpPage = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const unit = profile?.main_unit || user?.main_unit || 'OPD';

    const [loading, setLoading] = useState(true);
    const [drugs, setDrugs] = useState([]);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [urgencyFilter, setUrgencyFilter] = useState('all'); // 'all', 'critical' (<30d), 'warning' (<90d)

    // Edit modal state
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const handlePageChange = useCallback((page, newPageSize) => {
        setCurrentPage(page);
        if (newPageSize && newPageSize !== pageSize) {
            setPageSize(newPageSize);
        }
    }, [pageSize]);

    const fetchShortExpDrugs = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get(`/shortexp?main_unit=${encodeURIComponent(unit)}`);

            const rows = (data || []).map(record => {
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

            // Sort by exp_date ascending
            rows.sort((a, b) => dayjs(a.exp_date).diff(dayjs(b.exp_date)));

            setDrugs(rows);
        } catch (error) {
            console.error('Error fetching short expiry items:', error);
            message.error('Failed to load short expiry items');
        } finally {
            setLoading(false);
        }
    }, [unit]);

    useEffect(() => {
        fetchShortExpDrugs();
    }, [fetchShortExpDrugs]);

    const openEditModal = useCallback((record) => {
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
    }, []);

    const handleEditModalClose = useCallback(() => {
        setIsEditModalVisible(false);
        setEditingItem(null);
        fetchShortExpDrugs();
    }, [fetchShortExpDrugs]);

    const getQtyForColumn = useCallback((record, targetMonth) => {
        const today = dayjs().startOf('month');
        const exp = dayjs(record.exp_date).startOf('month');
        let diffMonths = exp.diff(today, 'month');

        if (diffMonths < 1) diffMonths = 1;

        return diffMonths === targetMonth ? record.qty : null;
    }, []);

    const exportToExcel = useCallback(() => {
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
        XLSX.utils.book_append_sheet(wb, ws, 'Short Expiry');

        const filename = `ShortExp_${dayjs().format('YYYYMMDD')}.xlsx`;
        XLSX.writeFile(wb, filename);
    }, [drugs, getQtyForColumn]);

    const handleArchiveAndClear = useCallback(async () => {
        try {
            setLoading(true);
            await api.post('/shortexp/archive', { main_unit: unit });
            message.success(`${unit} data archived and cleared successfully!`);
            fetchShortExpDrugs();
        } catch (error) {
            console.error('Failed to archive data:', error);
            message.error('Failed to archive and clear data');
            setLoading(false);
        }
    }, [unit, fetchShortExpDrugs]);

    // Filtered drugs for search and urgency
    const filteredDrugs = useMemo(() => {
        const today = dayjs().startOf('day');
        return drugs.filter(item => {
            // Search text match
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchName = item.name?.toLowerCase().includes(q);
                const matchBatch = item.batch_no?.toLowerCase().includes(q);
                const matchPku = item.pku?.toLowerCase().includes(q);
                if (!matchName && !matchBatch && !matchPku) return false;
            }

            // Urgency filter match
            if (urgencyFilter !== 'all') {
                const daysLeft = dayjs(item.exp_date).startOf('day').diff(today, 'day');
                if (urgencyFilter === 'critical' && daysLeft >= 30) return false;
                if (urgencyFilter === 'warning' && (daysLeft < 30 || daysLeft >= 90)) return false;
            }

            return true;
        });
    }, [drugs, searchQuery, urgencyFilter]);

    return {
        unit,
        user,
        profile,
        loading,
        drugs,
        filteredDrugs,
        searchQuery,
        setSearchQuery,
        urgencyFilter,
        setUrgencyFilter,
        isEditModalVisible,
        setIsEditModalVisible,
        editingItem,
        setEditingItem,
        currentPage,
        pageSize,
        handlePageChange,
        fetchShortExpDrugs,
        openEditModal,
        handleEditModalClose,
        getQtyForColumn,
        exportToExcel,
        handleArchiveAndClear,
        navigate
    };
};

export default useShortExpPage;
