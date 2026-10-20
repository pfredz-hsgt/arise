import React, { useState, useMemo, useEffect } from 'react';
import {
    SearchBar,
    Button,
    Popup,
    SpinLoading,
    ConfigProvider as MobileConfigProvider,
    Selector,
} from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';
import {
    Form,
    Input,
    Select,
    InputNumber,
    Modal,
    Popconfirm,
    Tag,
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    EditOutlined,
    FilterOutlined,
    CheckOutlined,
    CloseOutlined,
    SortAscendingOutlined,
    EnvironmentOutlined,
    InboxOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import {
    getUnitColor,
    getSourceColor,
    getPuchaseTypeColor,
    getStdKtColor,
    getTypeColor
} from '../../lib/colorMappings';

const { TextArea } = Input;

const InventoryMobileView = ({
    loading,
    modalVisible,
    setModalVisible,
    editingDrug,
    searchQuery,
    setSearchQuery,
    mainUnits,
    indentSources,
    itemTypes,
    purchaseTypes,
    stdKts,
    form,
    handleAdd,
    handleEdit,
    handleDelete,
    handleSubmit,
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
}) => {
    // Mobile pagination (15 items per page)
    const [page, setPage] = useState(1);
    const pageSize = 15;

    // Filter popup state
    const [filterPopupVisible, setFilterPopupVisible] = useState(false);
    // Sort popup state
    const [sortPopupVisible, setSortPopupVisible] = useState(false);

    // Form submission loading
    const [submitting, setSubmitting] = useState(false);

    // Reset pagination when search or filters change
    useEffect(() => {
        setPage(1);
    }, [
        searchQuery,
        selectedUnitFilter,
        selectedRowFilter,
        selectedSourceFilter,
        selectedTypeFilter,
        selectedPurchaseTypeFilter,
        sortBy,
    ]);

    const totalPages = Math.max(1, Math.ceil(mobileFilteredDrugs.length / pageSize));
    const paginatedDrugs = useMemo(() => {
        const start = (page - 1) * pageSize;
        return mobileFilteredDrugs.slice(start, start + pageSize);
    }, [mobileFilteredDrugs, page, pageSize]);

    // Active secondary filters count (excluding unit filter)
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (selectedRowFilter !== 'ALL') count++;
        if (selectedSourceFilter !== 'ALL') count++;
        if (selectedTypeFilter !== 'ALL') count++;
        if (selectedPurchaseTypeFilter !== 'ALL') count++;
        return count;
    }, [
        selectedRowFilter,
        selectedSourceFilter,
        selectedTypeFilter,
        selectedPurchaseTypeFilter
    ]);

    const onFormFinish = async (values) => {
        setSubmitting(true);
        try {
            await handleSubmit(values);
        } finally {
            setSubmitting(false);
        }
    };

    const sortOptions = [
        { label: 'Name (A to Z)', value: 'name_asc' },
        { label: 'Name (Z to A)', value: 'name_desc' },
        { label: 'Shelf Row & Tingkat', value: 'row_asc' },
        { label: 'Balance (Low to High)', value: 'balance_asc' },
        { label: 'Balance (High to Low)', value: 'balance_desc' },
    ];

    return (
        <MobileConfigProvider locale={enUS}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Search Bar & New Drug Action */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <SearchBar
                            placeholder="Search drug, code, PKU, row..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onClear={() => setSearchQuery('')}
                            style={{
                                '--background': '#ffffff',
                                '--height': '38px',
                                '--border-radius': '19px',
                                fontSize: 13,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                            }}
                        />
                    </div>
                    <Button
                        size="small"
                        shape="rounded"
                        color="primary"
                        onClick={handleAdd}
                        style={{
                            fontWeight: 600,
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '8px 12px',
                            height: '38px',
                            boxShadow: '0 2px 6px rgba(24,144,255,0.25)'
                        }}
                    >
                        <PlusOutlined /> New Drug
                    </Button>
                </div>

                {/* Department / Unit Pills */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        overflowX: 'auto',
                        paddingBottom: 2,
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setSelectedUnitFilter('ALL')}
                        style={{
                            border: selectedUnitFilter === 'ALL' ? '1.5px solid #1890ff' : '1px solid #e2e8f0',
                            background: selectedUnitFilter === 'ALL' ? '#e6f7ff' : '#ffffff',
                            color: selectedUnitFilter === 'ALL' ? '#0958d9' : '#64748b',
                            fontWeight: selectedUnitFilter === 'ALL' ? 700 : 500,
                            padding: '5px 12px',
                            borderRadius: 16,
                            fontSize: 12,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s',
                        }}
                    >
                        All Units
                    </button>
                    {mainUnits.map((u) => {
                        const isSelected = selectedUnitFilter === u.name;
                        const unitColor = u.color || getUnitColor(u.name);
                        return (
                            <button
                                key={u.name}
                                type="button"
                                onClick={() => setSelectedUnitFilter(u.name)}
                                style={{
                                    border: isSelected ? `1.5px solid ${unitColor || '#1890ff'}` : '1px solid #e2e8f0',
                                    background: isSelected ? (unitColor ? `${unitColor}18` : '#e6f7ff') : '#ffffff',
                                    color: isSelected ? (unitColor || '#0958d9') : '#64748b',
                                    fontWeight: isSelected ? 700 : 500,
                                    padding: '5px 12px',
                                    borderRadius: 16,
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {u.name}
                            </button>
                        );
                    })}
                </div>

                {/* Secondary Controls Bar: Count, Sort, and Advanced Filter */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0 2px',
                    }}
                >
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                        Showing <strong style={{ color: '#0f172a' }}>{mobileFilteredDrugs.length}</strong> {mobileFilteredDrugs.length === 1 ? 'drug' : 'drugs'}
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                        {/* Sort Trigger */}
                        <Button
                            size="mini"
                            shape="rounded"
                            onClick={() => setSortPopupVisible(true)}
                            style={{
                                fontSize: 11,
                                padding: '4px 10px',
                                color: sortBy !== 'name_asc' ? '#1890ff' : '#475569',
                                borderColor: sortBy !== 'name_asc' ? '#91caff' : '#cbd5e1',
                                background: sortBy !== 'name_asc' ? '#e6f7ff' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <SortAscendingOutlined /> Sort
                        </Button>

                        {/* Filter Trigger */}
                        <Button
                            size="mini"
                            shape="rounded"
                            onClick={() => setFilterPopupVisible(true)}
                            style={{
                                fontSize: 11,
                                padding: '4px 10px',
                                color: activeFilterCount > 0 ? '#1890ff' : '#475569',
                                borderColor: activeFilterCount > 0 ? '#91caff' : '#cbd5e1',
                                background: activeFilterCount > 0 ? '#e6f7ff' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <FilterOutlined /> Filters
                            {activeFilterCount > 0 && (
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: 16,
                                        height: 16,
                                        lineHeight: '16px',
                                        borderRadius: '50%',
                                        background: '#1890ff',
                                        color: '#ffffff',
                                        fontSize: 10,
                                        textAlign: 'center',
                                        fontWeight: 700,
                                    }}
                                >
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Drugs List */}
                {loading ? (
                    <div style={{ padding: '48px 0', textAlign: 'center' }}>
                        <SpinLoading color="primary" />
                        <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>
                            Loading inventory items...
                        </div>
                    </div>
                ) : paginatedDrugs.length === 0 ? (
                    <div
                        style={{
                            padding: '40px 16px',
                            textAlign: 'center',
                            background: '#ffffff',
                            borderRadius: 14,
                            border: '1px dashed #cbd5e1',
                            color: '#64748b',
                        }}
                    >
                        <InboxOutlined style={{ fontSize: 32, color: '#94a3b8', marginBottom: 8 }} />
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                            No drugs found
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
                            {searchQuery || activeFilterCount > 0 || selectedUnitFilter !== 'ALL'
                                ? 'Try adjusting your search query or filters'
                                : 'No inventory items recorded yet'}
                        </div>
                        {(searchQuery || activeFilterCount > 0 || selectedUnitFilter !== 'ALL') && (
                            <Button
                                size="small"
                                shape="rounded"
                                onClick={resetFilters}
                                style={{ fontSize: 12 }}
                            >
                                Reset All Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {paginatedDrugs.map((drug) => {
                            const uObj = mainUnits.find(u => u.name === drug.main_unit);
                            const unitColor = uObj?.color || getUnitColor(drug.main_unit);
                            const pTypeColor = getPuchaseTypeColor(drug.puchase_type);
                            const stdColor = getStdKtColor(drug.std_kt);
                            const srcColor = getSourceColor(drug.indent_source);
                            const typeColor = getTypeColor(drug.type);

                            // Balance status color
                            const balance = drug.balance ?? 0;
                            const maxQty = drug.max_qty;
                            let stockColor = '#10b981'; // Green
                            let stockBg = '#ecfdf5';
                            if (balance === 0) {
                                stockColor = '#ef4444'; // Red
                                stockBg = '#fef2f2';
                            } else if (maxQty && balance <= maxQty * 0.25) {
                                stockColor = '#f59e0b'; // Amber
                                stockBg = '#fffbeb';
                            }

                            return (
                                <div
                                    key={drug.id}
                                    onClick={() => handleEdit(drug)}
                                    style={{
                                        background: '#ffffff',
                                        borderRadius: 14,
                                        border: '1px solid #e2e8f0',
                                        padding: '12px 14px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 8,
                                        cursor: 'pointer',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {/* Card Header: Drug Name & Main Unit Badge */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 700,
                                                    color: '#0f172a',
                                                    lineHeight: 1.35,
                                                    marginBottom: 2,
                                                }}
                                            >
                                                {drug.name}
                                            </div>
                                            {/* Codes subtext */}
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 6,
                                                    fontSize: 11,
                                                    color: '#64748b',
                                                    alignItems: 'center',
                                                    marginTop: 2,
                                                }}
                                            >
                                                {drug.item_code && (
                                                    <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>
                                                        Code: {drug.item_code}
                                                    </span>
                                                )}
                                                {drug.pku && (
                                                    <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, fontWeight: 500 }}>
                                                        PKU: {drug.pku}
                                                    </span>
                                                )}

                                            </div>
                                        </div>

                                        <Tag
                                            color={unitColor || 'blue'}
                                            style={{
                                                margin: 0,
                                                fontWeight: 600,
                                                borderRadius: 12,
                                                padding: '2px 8px',
                                                fontSize: 11,
                                            }}
                                        >
                                            {drug.main_unit || 'OPD'}
                                        </Tag>
                                    </div>

                                    {/* Location & Stock Summary Row */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            background: '#f8fafc',
                                            padding: '6px 10px',
                                            borderRadius: 8,
                                            border: '1px solid #f1f5f9',
                                        }}
                                    >
                                        {/* Storage Location Capsule */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                fontSize: 12,
                                                color: '#334155',
                                                fontWeight: 600,
                                            }}
                                        >
                                            <EnvironmentOutlined style={{ color: '#64748b' }} />
                                            <span>{drug.row || '-'}</span>

                                            {/* Only show dot if drug.tingkat has a value */}
                                            {drug.tingkat && (
                                                <>
                                                    <span style={{ color: '#334155' }}>•</span>
                                                    <span> {drug.tingkat}</span>
                                                </>
                                            )}

                                            {/* Only show dot if drug.petak has a value */}
                                            {drug.petak && (
                                                <>
                                                    <span style={{ color: '#334155' }}>•</span>
                                                    <span> {drug.petak}</span>
                                                </>
                                            )}
                                        </div>



                                    </div>

                                    {/* Classification Tags & Action Row */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: 6,
                                            paddingTop: 2,
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                                            {drug.puchase_type && (
                                                <Tag color={pTypeColor || 'default'} style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
                                                    {drug.puchase_type}
                                                </Tag>
                                            )}
                                            {drug.std_kt && (
                                                <Tag color={stdColor || 'default'} style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
                                                    {drug.std_kt}
                                                </Tag>
                                            )}
                                            {drug.indent_source && (
                                                <Tag color={srcColor || 'default'} style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
                                                    {drug.indent_source}
                                                </Tag>
                                            )}
                                            {drug.type && (
                                                <Tag color={typeColor || 'default'} style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
                                                    {drug.type}
                                                </Tag>
                                            )}
                                        </div>

                                        {/* Edit & Delete Action Buttons */}
                                        <div
                                            style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(drug)}
                                                style={{
                                                    background: '#f1f5f9',
                                                    border: 'none',
                                                    borderRadius: 6,
                                                    padding: '5px 8px',
                                                    color: '#334155',
                                                    fontSize: 12,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <EditOutlined /> Edit
                                            </button>

                                            <Popconfirm
                                                title="Delete this drug?"
                                                description="Are you sure you want to remove this drug from inventory?"
                                                onConfirm={() => handleDelete(drug.id)}
                                                okText="Yes, Delete"
                                                cancelText="No"
                                            >
                                                <button
                                                    type="button"
                                                    style={{
                                                        background: '#fee2e2',
                                                        border: 'none',
                                                        borderRadius: 6,
                                                        padding: '5px 8px',
                                                        color: '#dc2626',
                                                        fontSize: 12,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    <DeleteOutlined />
                                                </button>
                                            </Popconfirm>
                                        </div>
                                    </div>

                                    {/* Remarks if available */}
                                    {drug.remarks && (
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: '#64748b',
                                                fontStyle: 'italic',
                                                background: '#f8fafc',
                                                padding: '4px 8px',
                                                borderRadius: 6,
                                                borderLeft: '3px solid #cbd5e1',
                                                marginTop: 2,
                                            }}
                                        >
                                            {drug.remarks}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Mobile Pagination Controls */}
                {totalPages > 1 && (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 4px',
                            background: '#ffffff',
                            borderRadius: 12,
                            border: '1px solid #e2e8f0',
                            marginTop: 4,
                        }}
                    >
                        <Button
                            size="small"
                            shape="rounded"
                            disabled={page <= 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            style={{ fontSize: 12, fontWeight: 600, padding: '4px 14px' }}
                        >
                            Previous
                        </Button>

                        <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                            Page {page} of {totalPages}
                        </div>

                        <Button
                            size="small"
                            shape="rounded"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            style={{ fontSize: 12, fontWeight: 600, padding: '4px 14px' }}
                        >
                            Next
                        </Button>
                    </div>
                )}

                {/* Filter Popup Bottom Sheet */}
                <Popup
                    visible={filterPopupVisible}
                    onMaskClick={() => setFilterPopupVisible(false)}
                    position="bottom"
                    bodyStyle={{
                        borderTopLeftRadius: 18,
                        borderTopRightRadius: 18,
                        maxHeight: '75vh',
                        padding: '16px',
                        overflowY: 'auto',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                            Filter Inventory
                        </div>
                        <button
                            type="button"
                            onClick={() => setFilterPopupVisible(false)}
                            style={{ background: 'transparent', border: 'none', fontSize: 16, color: '#64748b', cursor: 'pointer' }}
                        >
                            <CloseOutlined />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Row Filter */}
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                                Shelf Row
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedRowFilter('ALL')}
                                    style={{
                                        border: selectedRowFilter === 'ALL' ? '1.5px solid #1890ff' : '1px solid #e2e8f0',
                                        background: selectedRowFilter === 'ALL' ? '#e6f7ff' : '#f8fafc',
                                        color: selectedRowFilter === 'ALL' ? '#0958d9' : '#475569',
                                        fontWeight: 600,
                                        padding: '4px 10px',
                                        borderRadius: 8,
                                        fontSize: 11,
                                    }}
                                >
                                    All
                                </button>
                                {availableRows.map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setSelectedRowFilter(r)}
                                        style={{
                                            border: selectedRowFilter === r ? '1.5px solid #1890ff' : '1px solid #e2e8f0',
                                            background: selectedRowFilter === r ? '#e6f7ff' : '#f8fafc',
                                            color: selectedRowFilter === r ? '#0958d9' : '#475569',
                                            fontWeight: 600,
                                            padding: '4px 10px',
                                            borderRadius: 8,
                                            fontSize: 11,
                                        }}
                                    >
                                        Row {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Purchase Type Filter */}
                        {purchaseTypes.length > 0 && (
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                                    Purchase Type
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPurchaseTypeFilter('ALL')}
                                        style={{
                                            border: selectedPurchaseTypeFilter === 'ALL' ? '1.5px solid #1890ff' : '1px solid #e2e8f0',
                                            background: selectedPurchaseTypeFilter === 'ALL' ? '#e6f7ff' : '#f8fafc',
                                            color: selectedPurchaseTypeFilter === 'ALL' ? '#0958d9' : '#475569',
                                            fontWeight: 600,
                                            padding: '4px 10px',
                                            borderRadius: 8,
                                            fontSize: 11,
                                        }}
                                    >
                                        All
                                    </button>
                                    {purchaseTypes.map((p) => (
                                        <button
                                            key={p.name}
                                            type="button"
                                            onClick={() => setSelectedPurchaseTypeFilter(p.name)}
                                            style={{
                                                border: selectedPurchaseTypeFilter === p.name ? '1.5px solid #1890ff' : '1px solid #e2e8f0',
                                                background: selectedPurchaseTypeFilter === p.name ? '#e6f7ff' : '#f8fafc',
                                                color: selectedPurchaseTypeFilter === p.name ? '#0958d9' : '#475569',
                                                fontWeight: 600,
                                                padding: '4px 10px',
                                                borderRadius: 8,
                                                fontSize: 11,
                                            }}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Indent Source Filter */}
                        {indentSources.length > 0 && (
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                                    Indent Source
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedSourceFilter('ALL')}
                                        style={{
                                            border: selectedSourceFilter === 'ALL' ? '1.5px solid #1890ff' : '1px solid #e2e8f0',
                                            background: selectedSourceFilter === 'ALL' ? '#e6f7ff' : '#f8fafc',
                                            color: selectedSourceFilter === 'ALL' ? '#0958d9' : '#475569',
                                            fontWeight: 600,
                                            padding: '4px 10px',
                                            borderRadius: 8,
                                            fontSize: 11,
                                        }}
                                    >
                                        All
                                    </button>
                                    {indentSources.map((s) => (
                                        <button
                                            key={s.name}
                                            type="button"
                                            onClick={() => setSelectedSourceFilter(s.name)}
                                            style={{
                                                border: selectedSourceFilter === s.name ? '1.5px solid #1890ff' : '1px solid #e2e8f0',
                                                background: selectedSourceFilter === s.name ? '#e6f7ff' : '#f8fafc',
                                                color: selectedSourceFilter === s.name ? '#0958d9' : '#475569',
                                                fontWeight: 600,
                                                padding: '4px 10px',
                                                borderRadius: 8,
                                                fontSize: 11,
                                            }}
                                        >
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Item Type Filter */}
                        {itemTypes.length > 0 && (
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                                    Item Type
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTypeFilter('ALL')}
                                        style={{
                                            border: selectedTypeFilter === 'ALL' ? '1.5px solid #1890ff' : '1px solid #e2e8f0',
                                            background: selectedTypeFilter === 'ALL' ? '#e6f7ff' : '#f8fafc',
                                            color: selectedTypeFilter === 'ALL' ? '#0958d9' : '#475569',
                                            fontWeight: 600,
                                            padding: '4px 10px',
                                            borderRadius: 8,
                                            fontSize: 11,
                                        }}
                                    >
                                        All
                                    </button>
                                    {itemTypes.map((t) => (
                                        <button
                                            key={t.name}
                                            type="button"
                                            onClick={() => setSelectedTypeFilter(t.name)}
                                            style={{
                                                border: selectedTypeFilter === t.name ? '1.5px solid #1890ff' : '1px solid #e2e8f0',
                                                background: selectedTypeFilter === t.name ? '#e6f7ff' : '#f8fafc',
                                                color: selectedTypeFilter === t.name ? '#0958d9' : '#475569',
                                                fontWeight: 600,
                                                padding: '4px 10px',
                                                borderRadius: 8,
                                                fontSize: 11,
                                            }}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Filter Action Buttons */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <Button
                                block
                                size="middle"
                                shape="rounded"
                                onClick={() => {
                                    setSelectedRowFilter('ALL');
                                    setSelectedSourceFilter('ALL');
                                    setSelectedTypeFilter('ALL');
                                    setSelectedPurchaseTypeFilter('ALL');
                                }}
                                style={{ flex: 1, fontSize: 13 }}
                            >
                                Reset Filters
                            </Button>
                            <Button
                                block
                                size="middle"
                                shape="rounded"
                                color="primary"
                                onClick={() => setFilterPopupVisible(false)}
                                style={{ flex: 1, fontSize: 13, fontWeight: 600 }}
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </Popup>

                {/* Sort Selector Popup Bottom Sheet */}
                <Popup
                    visible={sortPopupVisible}
                    onMaskClick={() => setSortPopupVisible(false)}
                    position="bottom"
                    bodyStyle={{
                        borderTopLeftRadius: 18,
                        borderTopRightRadius: 18,
                        padding: '16px',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                            Sort Inventory Items
                        </div>
                        <button
                            type="button"
                            onClick={() => setSortPopupVisible(false)}
                            style={{ background: 'transparent', border: 'none', fontSize: 16, color: '#64748b', cursor: 'pointer' }}
                        >
                            <CloseOutlined />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {sortOptions.map((opt) => {
                            const isSelected = sortBy === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        setSortBy(opt.value);
                                        setSortPopupVisible(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 14px',
                                        background: isSelected ? '#f0f9ff' : '#ffffff',
                                        border: isSelected ? '1px solid #bae6fd' : '1px solid #f1f5f9',
                                        borderRadius: 10,
                                        fontSize: 13,
                                        fontWeight: isSelected ? 700 : 500,
                                        color: isSelected ? '#0284c7' : '#334155',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <span>{opt.label}</span>
                                    {isSelected && <CheckOutlined style={{ color: '#0284c7' }} />}
                                </button>
                            );
                        })}
                    </div>
                </Popup>

                {/* Mobile Add / Edit Modal */}
                <Modal
                    title={editingDrug ? 'Edit Drug' : 'Add New Drug'}
                    open={modalVisible}
                    onCancel={() => {
                        setModalVisible(false);
                        form.resetFields();
                    }}
                    footer={null}
                    width="92%"
                    style={{ maxWidth: 460, top: 20 }}
                    styles={{
                        body: {
                            maxHeight: 'calc(85vh - 60px)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            padding: '14px 12px 10px 12px',
                        }
                    }}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFormFinish}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            maxHeight: 'calc(85vh - 120px)',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                paddingRight: 6,
                                paddingBottom: 4,
                                WebkitOverflowScrolling: 'touch',
                            }}
                        >
                            {/* Section: Drug Identification */}
                            <Form.Item
                                name="name"
                                label="Drug Name"
                                rules={[{ required: true, message: 'Please enter drug name' }]}
                            >
                                <Input placeholder="e.g., Paracetamol 500mg" size="middle" />
                            </Form.Item>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <Form.Item
                                    name="main_unit"
                                    label="Main Unit"
                                    rules={[{ required: true, message: 'Select unit' }]}
                                >
                                    <Select placeholder="Select unit">
                                        {mainUnits.map(u => (
                                            <Select.Option key={u.name} value={u.name}>
                                                <Tag color={u.color || getUnitColor(u.name)} style={{ margin: 0 }}>
                                                    {u.name}
                                                </Tag>
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="convert_sku"
                                    label="Convert SKU"
                                    initialValue={1}
                                >
                                    <InputNumber
                                        placeholder="1"
                                        min={1}
                                        inputMode="numeric"
                                        style={{ width: '100%' }}
                                    />
                                </Form.Item>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <Form.Item
                                    name="item_code"
                                    label="Item Code"
                                >
                                    <Input placeholder="e.g., ITEM001" />
                                </Form.Item>

                                <Form.Item
                                    name="pku"
                                    label="PKU"
                                >
                                    <Input placeholder="e.g., PKU001" />
                                </Form.Item>
                            </div>

                            {/* Section: Storage Location */}
                            <div
                                style={{
                                    background: '#f8fafc',
                                    padding: '10px 12px',
                                    borderRadius: 10,
                                    border: '1px solid #e2e8f0',
                                    marginBottom: 14,
                                }}
                            >
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <EnvironmentOutlined /> Shelf Location
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                    <Form.Item
                                        name="row"
                                        label="Row"
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Input placeholder="e.g., A" />
                                    </Form.Item>

                                    <Form.Item
                                        name="tingkat"
                                        label="Tingkat"
                                        style={{ marginBottom: 0 }}
                                    >
                                        <InputNumber placeholder="1" min={0} inputMode="numeric" style={{ width: '100%' }} />
                                    </Form.Item>

                                    <Form.Item
                                        name="petak"
                                        label="Petak"
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Input placeholder="e.g., 2" />
                                    </Form.Item>
                                </div>
                            </div>

                            {/* Section: Quantities */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <Form.Item
                                    name="max_qty"
                                    label="Max Quantity"
                                >
                                    <InputNumber placeholder="Max Qty" min={0} inputMode="numeric" style={{ width: '100%' }} />
                                </Form.Item>

                                <Form.Item
                                    name="balance"
                                    label="Balance"
                                >
                                    <InputNumber placeholder="Balance" min={0} inputMode="numeric" style={{ width: '100%' }} />
                                </Form.Item>
                            </div>

                            {/* Section: Procurement & Classification */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <Form.Item
                                    name="puchase_type"
                                    label="Purchase Type"
                                >
                                    <Select placeholder="Select type" allowClear>
                                        {purchaseTypes.map(p => (
                                            <Select.Option key={p.name} value={p.name}>{p.name}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="std_kt"
                                    label="STD / KT"
                                >
                                    <Select placeholder="Select" allowClear>
                                        {stdKts.map(s => (
                                            <Select.Option key={s.name} value={s.name}>{s.name}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <Form.Item
                                    name="indent_source"
                                    label="Indent Source"
                                >
                                    <Select placeholder="Select source" allowClear>
                                        {indentSources.map(s => (
                                            <Select.Option key={s.name} value={s.name}>{s.name}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="type"
                                    label="Item Type"
                                >
                                    <Select placeholder="Select type" allowClear>
                                        {itemTypes.map(t => (
                                            <Select.Option key={t.name} value={t.name}>{t.name}</Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </div>

                            {/* Section: Remarks & Image URL */}
                            <Form.Item
                                name="remarks"
                                label="Remarks"
                            >
                                <TextArea
                                    rows={2}
                                    placeholder="Special handling, storage notes, instructions..."
                                />
                            </Form.Item>

                            <Form.Item
                                name="image_url"
                                label="Image URL"
                            >
                                <Input placeholder="https://..." />
                            </Form.Item>
                        </div>

                        {/* Modal Action Buttons (Sticky at bottom) */}
                        <div
                            style={{
                                display: 'flex',
                                gap: 8,
                                paddingTop: 10,
                                marginTop: 6,
                                borderTop: '1px solid #f1f5f9',
                                background: '#ffffff',
                                flexShrink: 0,
                            }}
                        >
                            <Button
                                block
                                size="middle"
                                shape="rounded"
                                color="primary"
                                loading={submitting}
                                onClick={() => form.submit()}
                                style={{ flex: 1, fontWeight: 400, height: 40 }}
                            >
                                {editingDrug ? 'Update' : 'Add Drug'}
                            </Button>

                            {editingDrug && (
                                <Popconfirm
                                    title="Delete this drug?"
                                    description="Are you sure you want to remove this drug permanently?"
                                    onConfirm={async () => {
                                        await handleDelete(editingDrug.id);
                                        setModalVisible(false);
                                    }}
                                    okText="Yes, Delete"
                                    cancelText="No"
                                >
                                    <Button
                                        size="middle"
                                        shape="rounded"
                                        color="danger"
                                        style={{ height: 40, fontWeight: 600 }}
                                    >
                                        Delete
                                    </Button>
                                </Popconfirm>
                            )}

                            <Button
                                size="middle"
                                shape="rounded"
                                onClick={() => {
                                    setModalVisible(false);
                                    form.resetFields();
                                }}
                                style={{ height: 40 }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Form>
                </Modal>
            </div>
        </MobileConfigProvider>
    );
};

export default InventoryMobileView;
