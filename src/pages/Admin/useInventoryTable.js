import { useState, useEffect, useMemo } from 'react';
import { Form, message } from 'antd';
import { api } from '../../lib/api';

export const useInventoryTable = () => {
    const [drugs, setDrugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingDrug, setEditingDrug] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [mainUnits, setMainUnits] = useState([]);
    const [indentSources, setIndentSources] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [purchaseTypes, setPurchaseTypes] = useState([]);
    const [stdKts, setStdKts] = useState([]);

    // Additional mobile filters & sorting
    const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
    const [selectedRowFilter, setSelectedRowFilter] = useState('ALL');
    const [selectedSourceFilter, setSelectedSourceFilter] = useState('ALL');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
    const [selectedPurchaseTypeFilter, setSelectedPurchaseTypeFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('name_asc');

    const [form] = Form.useForm();

    useEffect(() => {
        fetchDrugs();
        fetchLookupValues();
    }, []);

    const fetchLookupValues = async () => {
        try {
            const [unitsData, sourcesData, typesData, pTypesData, stdKtsData] = await Promise.all([
                api.get('/lookups/units'),
                api.get('/lookups/sources'),
                api.get('/lookups/types'),
                api.get('/lookups/purchasetypes'),
                api.get('/lookups/stdkts')
            ]);
            setMainUnits(unitsData || []);
            setIndentSources(sourcesData || []);
            setItemTypes(typesData || []);
            setPurchaseTypes(pTypesData || []);
            setStdKts(stdKtsData || []);
        } catch (error) {
            console.error('Error fetching lookup values:', error);
        }
    };

    const fetchDrugs = async () => {
        try {
            setLoading(true);
            const data = await api.get('/inventory?all_units=true');
            setDrugs(data || []);
        } catch (error) {
            console.error('Error fetching drugs:', error);
            message.error('Failed to load inventory items');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingDrug(null);
        form.resetFields();
        form.setFieldsValue({
            main_unit: selectedUnitFilter !== 'ALL' ? selectedUnitFilter : 'OPD',
            convert_sku: 1,
        });
        setModalVisible(true);
    };

    const handleEdit = (drug) => {
        setEditingDrug(drug);
        form.setFieldsValue({
            ...drug,
            main_unit: drug.main_unit || 'OPD',
            convert_sku: drug.convert_sku ?? 1,
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/inventory/${id}`);
            message.success('Drug deleted successfully');
            fetchDrugs();
        } catch (error) {
            console.error('Error deleting drug:', error);
            message.error('Failed to delete drug');
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingDrug) {
                // Update existing drug
                await api.put(`/inventory/${editingDrug.id}`, values);
                message.success('Drug updated successfully');
            } else {
                // Insert new drug
                await api.post('/inventory', values);
                message.success('Drug added successfully');
            }

            setModalVisible(false);
            form.resetFields();
            fetchDrugs();
        } catch (error) {
            console.error('Error saving drug:', error);
            message.error('Failed to save drug');
        }
    };

    // Filter drugs based on search query (used directly by Desktop Table which has built-in column filters)
    const filteredDrugs = useMemo(() => {
        if (!searchQuery.trim()) return drugs;
        const query = searchQuery.toLowerCase();
        return drugs.filter((drug) => {
            return (
                drug.name?.toLowerCase().includes(query) ||
                drug.item_code?.toLowerCase().includes(query) ||
                drug.pku?.toLowerCase().includes(query) ||
                drug.main_unit?.toLowerCase().includes(query) ||
                drug.row?.toLowerCase().includes(query) ||
                drug.petak?.toLowerCase().includes(query) ||
                (drug.tingkat !== null && drug.tingkat !== undefined && String(drug.tingkat).includes(query)) ||
                drug.remarks?.toLowerCase().includes(query)
            );
        });
    }, [drugs, searchQuery]);

    // Enhanced filtered drugs for Mobile view (applies unit, row, source, type, and sorting)
    const mobileFilteredDrugs = useMemo(() => {
        let result = filteredDrugs;

        if (selectedUnitFilter !== 'ALL') {
            result = result.filter(d => (d.main_unit || 'OPD') === selectedUnitFilter);
        }

        if (selectedRowFilter !== 'ALL') {
            result = result.filter(d => d.row === selectedRowFilter);
        }

        if (selectedSourceFilter !== 'ALL') {
            result = result.filter(d => d.indent_source === selectedSourceFilter);
        }

        if (selectedTypeFilter !== 'ALL') {
            result = result.filter(d => d.type === selectedTypeFilter);
        }

        if (selectedPurchaseTypeFilter !== 'ALL') {
            result = result.filter(d => d.puchase_type === selectedPurchaseTypeFilter);
        }

        // Sorting
        return [...result].sort((a, b) => {
            if (sortBy === 'name_asc') {
                return (a.name || '').localeCompare(b.name || '');
            }
            if (sortBy === 'name_desc') {
                return (b.name || '').localeCompare(a.name || '');
            }
            if (sortBy === 'row_asc') {
                const rA = a.row || '';
                const rB = b.row || '';
                if (rA !== rB) return rA.localeCompare(rB);
                return (a.tingkat || 0) - (b.tingkat || 0);
            }
            if (sortBy === 'balance_asc') {
                return (a.balance || 0) - (b.balance || 0);
            }
            if (sortBy === 'balance_desc') {
                return (b.balance || 0) - (a.balance || 0);
            }
            return 0;
        });
    }, [
        filteredDrugs,
        selectedUnitFilter,
        selectedRowFilter,
        selectedSourceFilter,
        selectedTypeFilter,
        selectedPurchaseTypeFilter,
        sortBy
    ]);

    // Unique list of rows available for filtering
    const availableRows = useMemo(() => {
        const rows = new Set();
        drugs.forEach(d => {
            if (d.row) rows.add(d.row);
        });
        return Array.from(rows).sort();
    }, [drugs]);

    const resetFilters = () => {
        setSelectedUnitFilter('ALL');
        setSelectedRowFilter('ALL');
        setSelectedSourceFilter('ALL');
        setSelectedTypeFilter('ALL');
        setSelectedPurchaseTypeFilter('ALL');
        setSearchQuery('');
    };

    return {
        drugs,
        loading,
        modalVisible,
        setModalVisible,
        editingDrug,
        setEditingDrug,
        searchQuery,
        setSearchQuery,
        mainUnits,
        indentSources,
        itemTypes,
        purchaseTypes,
        stdKts,
        form,
        fetchDrugs,
        fetchLookupValues,
        handleAdd,
        handleEdit,
        handleDelete,
        handleSubmit,
        filteredDrugs,
        mobileFilteredDrugs,
        selectedUnitFilter,
        setSelectedUnitFilter,
        selectedRowFilter,
        setSelectedRowFilter,
        selectedSourceFilter,
        setSelectedSourceFilter,
        selectedTypeFilter,
        setSelectedTypeFilter,
        selectedPurchaseTypeFilter,
        setSelectedPurchaseTypeFilter,
        sortBy,
        setSortBy,
        availableRows,
        resetFilters,
    };
};

export default useInventoryTable;
