import React, { useState } from 'react';
import {
    NavBar,
    SearchBar,
    Button,
    Picker,
    SafeArea,
    ConfigProvider,
    SpinLoading,
    Tag as MobileTag
} from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';
import {
    LeftOutlined,
    FilterOutlined,
    RightOutlined,
    PlusOutlined,
    ClearOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getSourceColor, getPuchaseTypeColor, getStdKtColor, getUnitColor } from '../../lib/colorMappings';
import IndentModal from './IndentModal';

const IndentMobileView = ({
    unit,
    loading,
    selectedDrug,
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
    totalPages,
    searchQuery,
    setSearchQuery,
    filteredDrugs,
    paginatedDrugs,
    handleDrugClick,
    handleIndentSuccess,
    fetchDrugs
}) => {
    const navigate = useNavigate();
    const [rowPickerVisible, setRowPickerVisible] = useState(false);
    const [sourcePickerVisible, setSourcePickerVisible] = useState(false);

    const hasActiveFilters = selectedIndentRow !== 'ALL' || selectedIndentSource !== 'ALL' || searchQuery;

    const clearFilters = () => {
        setSelectedIndentRow('ALL');
        setSelectedIndentSource('ALL');
        setSearchQuery('');
        setCurrentPage(1);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            paddingBottom: '80px',
            background: '#f8fafc'
        }}>
            {/* Header */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: '#ffffff',
                borderBottom: '1px solid #f0f0f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
                <NavBar
                    backArrow={<LeftOutlined style={{ fontSize: 16 }} />}
                    onBack={() => navigate('/home')}
                    right={
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 8px',
                            background: getUnitColor(unit),
                            color: '#ffffff',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700
                        }}>
                            {unit}
                        </span>
                    }
                >
                    <span style={{ fontWeight: 700, fontSize: 16 }}>
                        Urgent Indent
                    </span>
                </NavBar>

                {/* Search Bar */}
                <div style={{ padding: '8px 12px 6px 12px' }}>
                    <SearchBar
                        placeholder="Search name, code, PKU, or row..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                        style={{
                            '--background': '#f1f5f9',
                            '--border-radius': '10px'
                        }}
                    />
                </div>

                {/* Filter Pills Bar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '0 12px 10px 12px',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch'
                }}>
                    {/* Row Filter Button */}
                    <button
                        onClick={() => setRowPickerVisible(true)}
                        style={{
                            border: selectedIndentRow !== 'ALL' ? '1px solid #93c5fd' : '1px solid #cbd5e1',
                            background: selectedIndentRow !== 'ALL' ? '#eff6ff' : '#ffffff',
                            color: selectedIndentRow !== 'ALL' ? '#1d4ed8' : '#475569',
                            padding: '5px 10px',
                            borderRadius: 16,
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            flexShrink: 0,
                            cursor: 'pointer'
                        }}
                    >
                        <FilterOutlined style={{ fontSize: 11 }} />
                        {selectedIndentRow === 'ALL' ? 'Shelf Row' : `Row: ${selectedIndentRow}`}
                    </button>

                    {/* Source Filter Button */}
                    <button
                        onClick={() => setSourcePickerVisible(true)}
                        style={{
                            border: selectedIndentSource !== 'ALL' ? '1px solid #93c5fd' : '1px solid #cbd5e1',
                            background: selectedIndentSource !== 'ALL' ? '#eff6ff' : '#ffffff',
                            color: selectedIndentSource !== 'ALL' ? '#1d4ed8' : '#475569',
                            padding: '5px 10px',
                            borderRadius: 16,
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            flexShrink: 0,
                            cursor: 'pointer'
                        }}
                    >
                        {selectedIndentSource === 'ALL' ? 'Source' : `Source: ${selectedIndentSource}`}
                    </button>

                    {/* Reset Button */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            style={{
                                border: '1px solid #fca5a5',
                                background: '#fef2f2',
                                color: '#b91c1c',
                                padding: '5px 8px',
                                borderRadius: 16,
                                fontSize: 11,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                flexShrink: 0,
                                cursor: 'pointer'
                            }}
                        >
                            <ClearOutlined /> Clear
                        </button>
                    )}

                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto', flexShrink: 0 }}>
                        {filteredDrugs.length} items
                    </span>
                </div>
            </div>

            {/* Drug Cards List */}
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {loading ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '40vh',
                        gap: 12
                    }}>
                        <SpinLoading color="primary" />
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>Loading inventory...</span>
                    </div>
                ) : filteredDrugs.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 16px',
                        background: '#ffffff',
                        borderRadius: 12,
                        border: '1px dashed #cbd5e1',
                        color: '#94a3b8'
                    }}>
                        No drugs found matching your filter criteria.
                    </div>
                ) : (
                    paginatedDrugs.map((drug) => {
                        const calculatedQty = Math.max(0, (drug.max_qty || 0) - (drug.balance || 0));

                        return (
                            <div
                                key={drug.id}
                                onClick={() => handleDrugClick(drug)}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: 12,
                                    padding: '12px 14px',
                                    border: '1px solid #f0f0f0',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    cursor: 'pointer'
                                }}
                            >
                                {/* Name and PKU Row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: 15,
                                            fontWeight: 700,
                                            color: '#1e293b',
                                            lineHeight: 1.3
                                        }}>
                                            {drug.name}
                                        </div>
                                    </div>
                                    <div style={{
                                        background: '#eff6ff',
                                        color: '#1d4ed8',
                                        borderRadius: 6,
                                        padding: '4px 8px',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        flexShrink: 0
                                    }}>
                                        <PlusOutlined style={{ fontSize: 10 }} /> Indent
                                    </div>
                                </div>

                                {/* Tags Row */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                                    {drug.pku && (
                                        <span style={{
                                            background: '#fff7e6',
                                            color: '#d46b08',
                                            border: '1px solid #ffd591',
                                            padding: '1px 6px',
                                            borderRadius: 4,
                                            fontSize: 11,
                                            fontWeight: 600
                                        }}>
                                            {drug.pku}
                                        </span>
                                    )}
                                    {drug.row && (
                                        <span style={{
                                            background: '#f0f5ff',
                                            color: '#1d39c4',
                                            border: '1px solid #adc6ff',
                                            padding: '1px 6px',
                                            borderRadius: 4,
                                            fontSize: 11,
                                            fontWeight: 500
                                        }}>
                                            Row: {drug.row}
                                        </span>
                                    )}
                                    {drug.puchase_type && (
                                        <span style={{
                                            background: '#fff1f0',
                                            color: getPuchaseTypeColor(drug.puchase_type),
                                            padding: '1px 6px',
                                            borderRadius: 4,
                                            fontSize: 11,
                                            fontWeight: 500
                                        }}>
                                            {drug.puchase_type}
                                        </span>
                                    )}
                                    {drug.indent_source && (
                                        <span style={{
                                            background: '#f6ffed',
                                            color: getSourceColor(drug.indent_source),
                                            padding: '1px 6px',
                                            borderRadius: 4,
                                            fontSize: 11,
                                            fontWeight: 500
                                        }}>
                                            {drug.indent_source}
                                        </span>
                                    )}
                                </div>

                                {/* Stock Numbers Row */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderTop: '1px solid #f8fafc',
                                    paddingTop: 6,
                                    fontSize: 12,
                                    color: '#64748b'
                                }}>
                                    <div>
                                        <span>Max: <strong style={{ color: '#334155' }}>{drug.max_qty ?? '-'}</strong></span>
                                        <span style={{ margin: '0 8px', color: '#cbd5e1' }}>•</span>
                                        <span>Bal: <strong style={{ color: '#334155' }}>{drug.balance ?? '-'}</strong></span>
                                    </div>


                                </div>
                            </div>
                        );
                    })
                )}

                {/* Pagination Controls */}
                {!loading && filteredDrugs.length > 0 && totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#ffffff',
                        padding: '10px 14px',
                        borderRadius: 12,
                        border: '1px solid #f0f0f0',
                        marginTop: 4
                    }}>
                        <Button
                            size="small"
                            shape="rounded"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            style={{ fontSize: 12, fontWeight: 600 }}
                        >
                            <LeftOutlined style={{ marginRight: 4 }} /> Prev
                        </Button>

                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                            Page {currentPage} of {totalPages}
                        </span>

                        <Button
                            size="small"
                            shape="rounded"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            style={{ fontSize: 12, fontWeight: 600 }}
                        >
                            Next <RightOutlined style={{ marginLeft: 4 }} />
                        </Button>
                    </div>
                )}
            </div>

            {/* Row Picker */}
            <ConfigProvider locale={enUS}>
                <Picker
                    columns={[
                        [
                            { label: 'All Shelf Rows', value: 'ALL' },
                            ...indentRows.map(r => ({ label: `Row ${r}`, value: r }))
                        ]
                    ]}
                    visible={rowPickerVisible}
                    onClose={() => setRowPickerVisible(false)}
                    value={[selectedIndentRow]}
                    onConfirm={v => {
                        setSelectedIndentRow(v[0]);
                        setCurrentPage(1);
                    }}
                    title="Select Shelf Row"
                />
            </ConfigProvider>

            {/* Source Picker */}
            <ConfigProvider locale={enUS}>
                <Picker
                    columns={[
                        [
                            { label: 'All Sources', value: 'ALL' },
                            ...indentSources.map(s => ({ label: s, value: s }))
                        ]
                    ]}
                    visible={sourcePickerVisible}
                    onClose={() => setSourcePickerVisible(false)}
                    value={[selectedIndentSource]}
                    onConfirm={v => {
                        setSelectedIndentSource(v[0]);
                        setCurrentPage(1);
                    }}
                    title="Select Indent Source"
                />
            </ConfigProvider>

            {/* Indent Modal (Adaptive: slides up from bottom on mobile) */}
            <IndentModal
                drug={selectedDrug}
                visible={modalVisible}
                onClose={(shouldRefresh) => {
                    setModalVisible(false);
                    if (shouldRefresh) {
                        fetchDrugs();
                    }
                }}
                onSuccess={handleIndentSuccess}
                onDrugUpdate={fetchDrugs}
            />
        </div>
    );
};

export default IndentMobileView;
