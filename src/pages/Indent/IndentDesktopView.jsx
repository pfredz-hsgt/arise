import React, { useEffect, useMemo, useRef } from 'react';
import {
    Row,
    Col,
    Skeleton,
    Empty,
    Space,
    Button,
    Typography,
    List,
    Tag,
    Select,
    Table,
    Grid,
    Tooltip
} from 'antd';
import {
    Search,
    Zap,
    Table as TableIcon,
    LayoutGrid,
    List as ListIcon,
    Filter,
    RotateCcw,
    CheckCircle2,
    Package,
    Layers,
    Plus,
    SlidersHorizontal,
    ExternalLink
} from 'lucide-react';
import { getSourceColor, getPuchaseTypeColor, getStdKtColor, getUnitColor } from '../../lib/colorMappings';
import IndentModal from './IndentModal';
import DebouncedSearchInput from '../../components/DebouncedSearchInput';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const DRAWER_WIDTH = 500;

// Memoized Grid card for drug items in list/grid mode
const DrugListItem = React.memo(({ drug, onClick }) => {
    const maxQty = drug.max_qty !== null && drug.max_qty !== undefined ? drug.max_qty : '-';
    const balance = drug.balance !== null && drug.balance !== undefined ? drug.balance : '-';

    return (
        <List.Item style={{ marginBottom: 12 }}>
            <div
                className="arise-drug-card"
                onClick={() => onClick(drug)}
                style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '16px 18px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}
            >
                <div>
                    {/* Header tags: Main Unit, Purchase Type, Std/Kt, Row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center', marginBottom: 8 }}>
                        {drug.item_code && (
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                fontFamily: 'monospace',
                                color: '#475569',
                                background: '#f1f5f9',
                                padding: '1px 6px',
                                borderRadius: 4
                            }}>
                                {drug.item_code}
                            </span>
                        )}
                        {drug.main_unit && (
                            <Tag color={getUnitColor(drug.main_unit)} style={{ margin: 0, fontSize: '11px', fontWeight: 700, borderRadius: 4 }}>
                                {drug.main_unit}
                            </Tag>
                        )}
                        {drug.puchase_type && (
                            <Tag color={getPuchaseTypeColor(drug.puchase_type)} style={{ margin: 0, fontSize: '11px' }}>
                                {drug.puchase_type}
                            </Tag>
                        )}
                        {drug.std_kt && (
                            <Tag color={getStdKtColor(drug.std_kt)} style={{ margin: 0, fontSize: '11px' }}>
                                {drug.std_kt}
                            </Tag>
                        )}
                        {drug.row && (
                            <Tag style={{ margin: 0, fontSize: '11px' }}>Row {drug.row}</Tag>
                        )}
                    </div>

                    {/* Drug Name */}
                    <div style={{
                        fontSize: '14.5px',
                        fontWeight: 700,
                        color: '#0f172a',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        lineHeight: 1.35,
                        marginBottom: 6
                    }}>
                        {drug.name}
                    </div>

                    {/* PKU */}
                    {drug.pku && (
                        <div style={{ fontSize: '12px', color: '#d46b08', fontWeight: 600, marginBottom: 8 }}>
                            {drug.pku}
                        </div>
                    )}
                </div>

                {/* Bottom Snapshot & Action */}
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                            Max: <strong style={{ color: '#ea580c' }}>{maxQty}</strong>
                        </span>
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                            Bal: <strong style={{ color: '#16a34a' }}>{balance}</strong>
                        </span>
                    </div>

                    <Button
                        size="small"
                        type="primary"
                        icon={<Zap size={12} />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick(drug);
                        }}
                        style={{
                            background: '#0284c7',
                            borderColor: '#0284c7',
                            borderRadius: 6,
                            fontSize: '12px',
                            fontWeight: 600
                        }}
                    >
                        Indent
                    </Button>
                </div>
            </div>
        </List.Item>
    );
});

DrugListItem.displayName = 'DrugListItem';

const IndentDesktopView = ({
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
    pageSize,
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
}) => {
    const screens = useBreakpoint();
    const isDesktop = screens.lg;
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        setViewMode(isDesktop ? 'table' : 'list');
    }, [isDesktop, setViewMode]);

    // When modal closes, smoothly restore horizontal scroll to starting position
    useEffect(() => {
        if (!modalVisible && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        }
    }, [modalVisible]);

    const resetFilters = () => {
        setSelectedIndentRow('ALL');
        setSelectedIndentSource('ALL');
        setSearchQuery('');
    };

    const hasActiveFilters = (selectedIndentRow && selectedIndentRow !== 'ALL') ||
        (selectedIndentSource && selectedIndentSource !== 'ALL') ||
        Boolean(searchQuery);

    const columns = [

        {
            title: 'Drug Name & Specifications',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            width: 320,
            render: (name, record) => (
                <div>
                    <div style={{
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: '#0f172a',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        lineHeight: 1.3,
                        marginBottom: 3
                    }}>
                        {name}
                    </div>
                    {record.remarks && (
                        <div style={{ fontSize: '11.5px', color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: 4, display: 'inline-block', fontWeight: 500 }}>
                            Note: {record.remarks}
                        </div>
                    )}
                </div>
            )
        },
        {
            title: 'PKU',
            dataIndex: 'pku',
            key: 'pku',
            width: 130,
            align: 'center',
            render: (pku) => pku ? (
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#c2410c', background: '#fff7ed', padding: '2px 8px', borderRadius: 6 }}>
                    {pku}
                </span>
            ) : <span style={{ color: '#cbd5e1' }}>-</span>
        },
        {
            title: 'Purchase Type',
            dataIndex: 'puchase_type',
            key: 'puchase_type',
            width: 120,
            align: 'center',
            filters: [
                { text: 'LP', value: 'LP' },
                { text: 'APPL', value: 'APPL' },
            ],
            onFilter: (value, record) => record.puchase_type === value,
            render: (type) => type && (
                <Tag style={{ fontSize: '12px', fontWeight: 600, borderRadius: 4 }} color={getPuchaseTypeColor(type)}>
                    {type}
                </Tag>
            ),
        },
        {
            title: 'STD/KT',
            dataIndex: 'std_kt',
            key: 'std_kt',
            width: 100,
            align: 'center',
            filters: [
                { text: 'STD', value: 'STD' },
                { text: 'KT', value: 'KT' },
            ],
            onFilter: (value, record) => record.std_kt === value,
            render: (type) => type && (
                <Tag style={{ fontSize: '12px', fontWeight: 600, borderRadius: 4 }} color={getStdKtColor(type)}>
                    {type}
                </Tag>
            ),
        },
        {
            title: 'Row',
            dataIndex: 'row',
            key: 'row',
            width: 90,
            align: 'center',
            render: (row) => row ? (
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                    {row}
                </span>
            ) : <span style={{ color: '#cbd5e1' }}>-</span>
        },
        {
            title: 'Max Qty',
            dataIndex: 'max_qty',
            key: 'max_qty',
            width: 100,
            align: 'center',
            render: (val) => (
                <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#ea580c',
                    background: '#fff7ed',
                    padding: '2px 8px',
                    borderRadius: 6
                }}>
                    {val !== null && val !== undefined ? val : '-'}
                </span>
            )
        },
        {
            title: 'Balance',
            dataIndex: 'balance',
            key: 'balance',
            width: 110,
            align: 'center',
            render: (val) => (
                <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#16a34a',
                    background: '#f0fdf4',
                    padding: '2px 8px',
                    borderRadius: 6
                }}>
                    {val !== null && val !== undefined ? val : '-'}
                </span>
            )
        },
        {
            title: 'Indent Source',
            dataIndex: 'indent_source',
            key: 'indent_source',
            width: 120,
            align: 'center',
            render: (source) => source && (
                <Tag style={{ fontSize: '12px', borderRadius: 4 }} color={getSourceColor(source)}>
                    {source}
                </Tag>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            width: 100,
            align: 'right',
            render: (_, record) => (
                <Button
                    size="small"
                    type="primary"
                    icon={<Zap size={12} />}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDrugClick(record);
                    }}
                    style={{
                        background: '#0284c7',
                        borderColor: '#0284c7',
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: '12px'
                    }}
                >
                    Indent
                </Button>
            )
        }
    ];

    return (
        <div
            ref={scrollContainerRef}
            className="arise-indent-desktop-scroll-container"
            style={{ width: '100%', overflowX: 'auto', paddingBottom: 40 }}
        >
            <div style={{
                minWidth: 1400,
                maxWidth: 1400,
                margin: '0 auto',
                boxSizing: 'content-box',
                paddingRight: modalVisible ? DRAWER_WIDTH : 0,
                transition: 'padding-right 0.25s ease',
            }}>
                {/* 1. Header & Catalog Banner */}
                <div style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <h1 style={{
                            margin: 0,
                            fontSize: '24px',
                            fontWeight: 800,
                            color: '#0f172a',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            letterSpacing: '0.3px'
                        }}>
                            Urgent Indent Page
                        </h1>
                        <Tag color={getUnitColor(unit)} style={{ margin: 0, fontWeight: 700, fontSize: '12px', padding: '2px 8px', borderRadius: 4, border: 'none' }}>
                            {unit}
                        </Tag>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#b91c1c',
                            background: '#fef2f2',
                            border: '1px solid #fee2e2',
                            padding: '2px 8px',
                            borderRadius: 6
                        }}>
                            <Zap size={11} /> Urgent Items Only
                        </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                        Search by drug name, filter by row or by source to quickly find items.
                    </div>
                </div>

                {/* 2. Search & Filter Bar */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '14px 18px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    marginBottom: 16,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                }}>
                    {/* Left: Search Input */}
                    <div style={{ flex: '1 1 320px', minWidth: 260 }}>
                        <DebouncedSearchInput
                            placeholder="Search by drug name..."
                            prefix={<Search size={16} color="#94a3b8" style={{ marginRight: 6 }} />}
                            onSearch={setSearchQuery}
                            allowClear
                            size="large"
                            style={{
                                width: '100%',
                                borderRadius: 8,
                                fontSize: '13.5px'
                            }}
                        />
                    </div>

                    {/* Center: Row & Source Selectors */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <Select
                            placeholder="Filter by Row"
                            style={{ width: 150 }}
                            size="large"
                            allowClear
                            value={selectedIndentRow === 'ALL' ? null : selectedIndentRow}
                            onChange={(value) => setSelectedIndentRow(value || 'ALL')}
                        >
                            {indentRows.map(row => (
                                <Select.Option key={row} value={row}>
                                    Row {row}
                                </Select.Option>
                            ))}
                        </Select>

                        <Select
                            placeholder="Filter by Source"
                            style={{ width: 170 }}
                            size="large"
                            allowClear
                            value={selectedIndentSource === 'ALL' ? null : selectedIndentSource}
                            onChange={(value) => setSelectedIndentSource(value || 'ALL')}
                        >
                            {indentSources.map(source => (
                                <Select.Option key={source} value={source}>
                                    {source}
                                </Select.Option>
                            ))}
                        </Select>

                        <Tooltip title="Reset search & filters">
                            <Button
                                size="large"
                                icon={<RotateCcw size={14} />}
                                onClick={resetFilters}
                                style={{ borderRadius: 8, color: '#64748b' }}
                            >
                                Reset
                            </Button>
                        </Tooltip>

                    </div>

                    {/* Right: View Mode Toggle & Total Counter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: '13px', fontWeight: 200, color: '#64748b' }}>
                            <strong style={{ color: '#64748b' }}>{filteredDrugs.length}</strong> items
                        </span>

                        <div style={{
                            display: 'flex',
                            background: '#f1f5f9',
                            padding: 3,
                            borderRadius: 8,
                            border: '1px solid #e2e8f0'
                        }}>
                            <Button
                                size="small"
                                type={viewMode === 'table' ? 'primary' : 'text'}
                                icon={<TableIcon size={15} />}
                                onClick={() => setViewMode('table')}
                                style={{
                                    borderRadius: 6,
                                    background: viewMode === 'table' ? '#0284c7' : 'transparent',
                                    borderColor: viewMode === 'table' ? '#0284c7' : 'transparent',
                                    color: viewMode === 'table' ? '#ffffff' : '#64748b'
                                }}
                            />
                            <Button
                                size="small"
                                type={viewMode === 'list' ? 'primary' : 'text'}
                                icon={<LayoutGrid size={15} />}
                                onClick={() => setViewMode('list')}
                                style={{
                                    borderRadius: 6,
                                    background: viewMode === 'list' ? '#0284c7' : 'transparent',
                                    borderColor: viewMode === 'list' ? '#0284c7' : 'transparent',
                                    color: viewMode === 'list' ? '#ffffff' : '#64748b'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Loading State */}
                {loading && (
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 14,
                        padding: 24,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}>
                        <Row gutter={[16, 16]}>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Col xs={24} sm={12} md={8} lg={6} key={i}>
                                    <Skeleton active paragraph={{ rows: 3 }} />
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}

                {/* 4. Empty State */}
                {!loading && filteredDrugs.length === 0 && (
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 16,
                        padding: '60px 24px',
                        textAlign: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}>
                        <Empty
                            description={
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                                        No drugs match your search criteria
                                    </div>
                                    <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                                        Try adjusting your search query, row selection, or active source filter.
                                    </div>
                                </div>
                            }
                        />
                        {hasActiveFilters && (
                            <Button
                                onClick={resetFilters}
                                icon={<RotateCcw size={14} />}
                                style={{ marginTop: 16, borderRadius: 8 }}
                            >
                                Clear All Filters
                            </Button>
                        )}
                    </div>
                )}

                {/* 5. Table View */}
                {!loading && filteredDrugs.length > 0 && viewMode === 'table' && (
                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 14,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        overflow: 'hidden'
                    }}>
                        <Table
                            columns={columns}
                            dataSource={paginatedDrugs}
                            rowKey="id"
                            showSorterTooltip={false}
                            pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                total: filteredDrugs.length,
                                onChange: handlePageChange,
                                showSizeChanger: true,
                                showTotal: (total, range) => (
                                    <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>
                                        Showing {range[0]}-{range[1]} of <strong>{total}</strong> drugs
                                    </span>
                                ),
                                pageSizeOptions: ['25', '50', '100', '200'],
                                style: { padding: '12px 18px', margin: 0 }
                            }}
                            onRow={(record) => ({
                                onClick: () => handleDrugClick(record),
                                style: { cursor: 'pointer' },
                                className: 'arise-table-row'
                            })}
                            scroll={{ x: 1000 }}
                        />
                    </div>
                )}

                {/* 6. List / Grid View */}
                {!loading && filteredDrugs.length > 0 && viewMode === 'list' && (
                    <div>
                        <List
                            grid={{
                                gutter: 14,
                                xs: 1,
                                sm: 1,
                                md: 2,
                                lg: 2,
                                xl: 3,
                                xxl: 3,
                            }}
                            dataSource={paginatedDrugs}
                            pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                total: filteredDrugs.length,
                                onChange: handlePageChange,
                                onShowSizeChange: handlePageChange,
                                showSizeChanger: true,
                                showTotal: (total, range) => (
                                    <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>
                                        Showing {range[0]}-{range[1]} of <strong>{total}</strong> drugs
                                    </span>
                                ),
                                pageSizeOptions: ['25', '50', '100', '200'],
                                style: {
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 12,
                                    padding: '12px 18px',
                                    marginTop: 14
                                }
                            }}
                            renderItem={(drug) => (
                                <DrugListItem drug={drug} onClick={handleDrugClick} />
                            )}
                        />
                    </div>
                )}
            </div>

            {/* Indent Modal / Drawer */}
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

            <style>{`
                .arise-drug-card:hover {
                    border-color: #38bdf8 !important;
                    box-shadow: 0 4px 14px rgba(2, 132, 199, 0.12) !important;
                    transform: translateY(-2px);
                }
                .arise-table-row:hover > td {
                    background-color: #f8fafc !important;
                }
                .arise-indent-desktop-scroll-container::-webkit-scrollbar {
                    height: 7px;
                }
                .arise-indent-desktop-scroll-container::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                .arise-indent-desktop-scroll-container::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .arise-indent-desktop-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
};

export default IndentDesktopView;
