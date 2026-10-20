import { useState, useEffect, useCallback, useMemo } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Headless hook managing Short Expiry Archive data fetching, date selection,
 * search filtering, and Excel export.
 */
export const useShortExpArchive = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const unit = profile?.main_unit || user?.main_unit || 'OPD';

    const [loading, setLoading] = useState(true);
    const [drugs, setDrugs] = useState([]);
    const [archiveDates, setArchiveDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const handlePageChange = useCallback((page, newPageSize) => {
        setCurrentPage(page);
        if (newPageSize && newPageSize !== pageSize) {
            setPageSize(newPageSize);
        }
    }, [pageSize]);

    const fetchArchiveDates = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get(`/shortexp/archive/dates?main_unit=${encodeURIComponent(unit)}`);
            const dates = (data || []).map(d => dayjs(d.archived_date).format('YYYY-MM-DD'));
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
    }, [unit]);

    const fetchArchiveData = useCallback(async (date) => {
        try {
            setLoading(true);
            const data = await api.get(`/shortexp/archive/data?date=${date}&main_unit=${encodeURIComponent(unit)}`);

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
    }, [unit]);

    useEffect(() => {
        fetchArchiveDates();
    }, [fetchArchiveDates]);

    useEffect(() => {
        if (selectedDate) {
            fetchArchiveData(selectedDate);
        } else {
            setDrugs([]);
        }
    }, [selectedDate, fetchArchiveData]);

    const getQtyForColumn = useCallback((record, targetMonth) => {
        const today = dayjs().startOf('month');
        const exp = dayjs(record.exp_date).startOf('month');
        let diffMonths = exp.diff(today, 'month');

        if (diffMonths < 1) diffMonths = 1;

        return diffMonths === targetMonth ? record.qty : null;
    }, []);

    const exportToExcel = useCallback(() => {
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
        XLSX.utils.book_append_sheet(wb, ws, 'Short Expiry Archive');

        const filename = `ShortExpArchive_${selectedDate || dayjs().format('YYYYMMDD')}.xlsx`;
        XLSX.writeFile(wb, filename);
    }, [drugs, selectedDate, getQtyForColumn]);

    const filteredDrugs = useMemo(() => {
        if (!searchQuery) return drugs;
        const q = searchQuery.toLowerCase();
        return drugs.filter(d =>
            d.name?.toLowerCase().includes(q) ||
            d.batch_no?.toLowerCase().includes(q) ||
            d.pku?.toLowerCase().includes(q)
        );
    }, [drugs, searchQuery]);

    return {
        unit,
        user,
        profile,
        loading,
        drugs,
        filteredDrugs,
        archiveDates,
        selectedDate,
        setSelectedDate,
        searchQuery,
        setSearchQuery,
        currentPage,
        pageSize,
        handlePageChange,
        getQtyForColumn,
        exportToExcel,
        navigate
    };
};

export default useShortExpArchive;
