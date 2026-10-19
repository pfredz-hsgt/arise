import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { message } from 'antd';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Headless hook encapsulating drug catalog data fetching, filtering by search/row/source,
 * pagination, and modal selection for Urgent Indent.
 */
export const useIndentPage = () => {
    const { user, profile } = useAuth();
    const unit = profile?.main_unit || user?.main_unit || 'OPD';

    const [drugs, setDrugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [indentRows, setIndentRows] = useState([]);
    const [selectedIndentRow, setSelectedIndentRow] = useState('ALL');
    const [indentSources, setIndentSources] = useState([]);
    const [selectedIndentSource, setSelectedIndentSource] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const debounceTimerRef = useRef(null);

    const fetchDrugs = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get(`/inventory?main_unit=${encodeURIComponent(unit)}`);
            const drugList = data || [];
            setDrugs(drugList);

            // Extract unique indent rows
            const uniqueRows = [...new Set(drugList.map(d => d.row).filter(Boolean))].sort();
            setIndentRows(uniqueRows);

            // Extract unique indent sources
            const uniqueSources = [...new Set(drugList.map(d => d.indent_source).filter(Boolean))].sort();
            setIndentSources(uniqueSources);
        } catch (error) {
            console.error('Error fetching drugs:', error);
            message.error('Failed to load inventory items');
        } finally {
            setLoading(false);
        }
    }, [unit]);

    useEffect(() => {
        fetchDrugs();
    }, [fetchDrugs]);

    // Reset to page 1 when query or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedIndentRow, selectedIndentSource]);

    // Memoize filtered drugs
    const filteredDrugs = useMemo(() => {
        let result = drugs;

        // Filter by indent row
        if (selectedIndentRow !== 'ALL') {
            result = result.filter(drug => drug.row === selectedIndentRow);
        }

        // Filter by indent source
        if (selectedIndentSource !== 'ALL') {
            result = result.filter(drug => drug.indent_source === selectedIndentSource);
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(drug =>
                drug.name?.toLowerCase().includes(query) ||
                drug.item_code?.toLowerCase().includes(query) ||
                drug.pku?.toLowerCase().includes(query) ||
                drug.row?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [searchQuery, selectedIndentRow, selectedIndentSource, drugs]);

    // Memoize paginated drugs
    const paginatedDrugs = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredDrugs.slice(startIndex, endIndex);
    }, [filteredDrugs, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredDrugs.length / pageSize) || 1;

    const handleDrugClick = useCallback((drug) => {
        setSelectedDrug(drug);
        setModalVisible(true);
    }, []);

    const handlePageChange = useCallback((page, newPageSize) => {
        setCurrentPage(page);
        if (newPageSize && newPageSize !== pageSize) {
            setPageSize(newPageSize);
        }
    }, [pageSize]);

    const handleIndentSuccess = useCallback(() => {
        setModalVisible(false);
        message.success('Item added to cart successfully!');
    }, []);

    return {
        unit,
        user,
        profile,
        drugs,
        loading,
        selectedDrug,
        setSelectedDrug,
        modalVisible,
        setModalVisible,
        indentRows,
        selectedIndentRow,
        setSelectedIndentRow,
        indentSources,
        selectedIndentSource,
        setSelectedIndentSource,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        totalPages,
        searchQuery,
        setSearchQuery,
        viewMode,
        setViewMode,
        filteredDrugs,
        paginatedDrugs,
        handleDrugClick,
        handlePageChange,
        handleIndentSuccess,
        fetchDrugs
    };
};

export default useIndentPage;
