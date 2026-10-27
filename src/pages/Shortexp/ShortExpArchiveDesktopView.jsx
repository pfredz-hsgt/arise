import React, { useMemo } from 'react';
import {
    Table,
    Tag,
    Button,
    Select,
    Input,
    Spin
} from 'antd';
import {
    History,
    FileSpreadsheet,
    Calendar,
    Search,
    UserCheck,
    ArrowLeft,
    Clock,
    AlertCircle,
    CheckCircle2,
    Archive
} from 'lucide-react';
import dayjs from 'dayjs';
import { getSourceColor, getUnitColor } from '../../lib/colorMappings';

const { Option } = Select;

const ShortExpArchiveDesktopView = ({
    unit = 'OPD',
    loading,
    drugs = [],
    filteredDrugs,
    archiveDates = [],
    selectedDate,
    setSelectedDate,
    searchQuery = '',
    setSearchQuery,
    currentPage = 1,
    pageSize = 25,
    handlePageChange,
    getQtyForColumn,
    exportToExcel,
    navigate
}) => {
    // Determine the items list to display
    const displayedItems = useMemo(() => {
        if (filteredDrugs) return filteredDrugs;
        if (!searchQuery) return drugs;
        const q = searchQuery.toLowerCase();
        return drugs.filter(d =>
            d.name?.toLowerCase().includes(q) ||
            d.batch_no?.toLowerCase().includes(q) ||
            d.pku?.toLowerCase().includes(q)
        );
    }, [filteredDrugs, drugs, searchQuery]);

    const columns = [
        {
            title: 'DRUG SPECIFICATION',
            dataIndex: 'name',
            key: 'name',
            width: 300,
            fixed: 'left',
            render: (text, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
                    <span style={{
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: '#0f172a',
                        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                        lineHeight: 1.35
                    }}>
                        {text}
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                        {record.pku && (
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '1px 7px',
                                borderRadius: 5,
                                background: '#fdf2f8',
                                color: '#db2777',
                                border: '1px solid #fbcfe8'
                            }}>
                                {record.pku}
                            </span>
                        )}
                        {record.rak && (
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '1px 7px',
                                borderRadius: 5,
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe'
                            }}>
                                Rak: {record.rak}
                            </span>
                        )}
                        {record.puchase_type && (
                            <span style={{
                                fontSize: '10.5px',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: 5,
                                background: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #e2e8f0'
                            }}>
                                {record.puchase_type}
                            </span>
                        )}
                        {record.std_kt && (
                            <span style={{
                                fontSize: '10.5px',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: 5,
                                background: '#f0fdf4',
                                color: '#16a34a',
                                border: '1px solid #bbf7d0'
                            }}>
                                {record.std_kt}
                            </span>
                        )}
                        {record.indent_source && (
                            <Tag
                                color={getSourceColor(record.indent_source)}
                                style={{
                                    fontSize: '10.5px',
                                    fontWeight: 500,
                                    margin: 0,
                                    borderRadius: 4,
                                    lineHeight: '18px',
                                    border: 'none'
                                }}
                            >
                                {record.indent_source}
                            </Tag>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: 'BATCH NO',
            dataIndex: 'batch_no',
            key: 'batch_no',
            width: 130,
            render: (text) => (
                <span style={{
                    fontFamily: "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace",
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#0369a1',
                    background: '#f0f9ff',
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: '1px solid #bae6fd',
                    display: 'inline-block'
                }}>
                    {text || '—'}
                </span>
            )
        },
        {
            title: 'ARCHIVED EXPIRY DATE',
            dataIndex: 'exp_date',
            key: 'exp_date',
            width: 180,
            render: (date) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} color="#64748b" />
                    <span style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1e293b',
                        fontFamily: "'JetBrains Mono', monospace"
                    }}>
                        {date ? dayjs(date).format('DD/MM/YYYY') : '—'}
                    </span>
                </div>
            ),
        },
        {
            title: (
                <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>6M</span>
                    <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>6 Months</span>
                </div>
            ),
            key: '6m',
            width: 75,
            align: 'center',
            render: (_, record) => {
                const qty = getQtyForColumn(record, 6);
                return qty !== null ? (
                    <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: '12.5px',
                        color: '#334155'
                    }}>
                        {qty}
                    </span>
                ) : <span style={{ color: '#cbd5e1' }}>—</span>;
            }
        },
        {
            title: (
                <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>5M</span>
                    <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>5 Months</span>
                </div>
            ),
            key: '5m',
            width: 75,
            align: 'center',
            render: (_, record) => {
                const qty = getQtyForColumn(record, 5);
                return qty !== null ? (
                    <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: '12.5px',
                        color: '#334155'
                    }}>
                        {qty}
                    </span>
                ) : <span style={{ color: '#cbd5e1' }}>—</span>;
            }
        },
        {
            title: (
                <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>4M</span>
                    <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>4 Months</span>
                </div>
            ),
            key: '4m',
            width: 75,
            align: 'center',
            render: (_, record) => {
                const qty = getQtyForColumn(record, 4);
                return qty !== null ? (
                    <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: '12.5px',
                        color: '#334155'
                    }}>
                        {qty}
                    </span>
                ) : <span style={{ color: '#cbd5e1' }}>—</span>;
            }
        },
        {
            title: (
                <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>3M</span>
                    <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>3 Months</span>
                </div>
            ),
            key: '3m',
            width: 75,
            align: 'center',
            render: (_, record) => {
                const qty = getQtyForColumn(record, 3);
                return qty !== null ? (
                    <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: '12.5px',
                        color: '#1d4ed8'
                    }}>
                        {qty}
                    </span>
                ) : <span style={{ color: '#cbd5e1' }}>—</span>;
            }
        },
        {
            title: (
                <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#d97706' }}>2M</span>
                    <span style={{ fontSize: '9.5px', color: '#f59e0b' }}>2 Months</span>
                </div>
            ),
            key: '2m',
            width: 75,
            align: 'center',
            render: (_, record) => {
                const qty = getQtyForColumn(record, 2);
                return qty !== null ? (
                    <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: '12.5px',
                        color: '#ea580c'
                    }}>
                        {qty}
                    </span>
                ) : <span style={{ color: '#cbd5e1' }}>—</span>;
            }
        },
        {
            title: (
                <div style={{ textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#dc2626' }}>1M</span>
                    <span style={{ fontSize: '9.5px', color: '#ef4444' }}>Critical</span>
                </div>
            ),
            key: '1m',
            width: 75,
            align: 'center',
            render: (_, record) => {
                const qty = getQtyForColumn(record, 1);
                return qty !== null ? (
                    <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 6,
                        fontWeight: 800,
                        fontSize: '13px',
                        color: '#dc2626'
                    }}>
                        {qty}
                    </span>
                ) : <span style={{ color: '#cbd5e1' }}>—</span>;
            }
        },
        {
            title: 'REMARKS',
            dataIndex: 'se_remarks',
            key: 'se_remarks',
            width: 180,
            render: (val) => (
                <span style={{ fontSize: '12.5px', color: val ? '#334155' : '#94a3b8', fontStyle: val ? 'normal' : 'italic' }}>
                    {val || '—'}
                </span>
            )
        },
        {
            title: 'ARCHIVED BY',
            dataIndex: 'archived_by',
            key: 'archived_by',
            width: 160,
            render: (val) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: '#475569'
                    }}>
                        <UserCheck size={13} color="#0284c7" />
                    </div>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                        {val || 'System'}
                    </span>
                </div>
            )
        }
    ];

    if (loading && archiveDates.length === 0) {
        return (
            <div style={{
                maxWidth: 1400,
                margin: '0 auto',
                padding: '80px 20px',
                textAlign: 'center',
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0'
            }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
                    Loading Short Expiry Archive records...
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header Block */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                            border: '1px solid #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#475569',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
                        }}>
                            <History size={20} strokeWidth={2.2} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <h1 style={{
                                    margin: 0,
                                    fontSize: '20px',
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                                    letterSpacing: '-0.3px'
                                }}>
                                    Short Expiry Historical Archive
                                </h1>
                                <Tag
                                    color={getUnitColor(unit)}
                                    style={{
                                        margin: 0,
                                        fontWeight: 700,
                                        fontSize: '11px',
                                        borderRadius: 6,
                                        padding: '2px 8px',
                                        border: 'none',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {unit}
                                </Tag>
                            </div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', marginTop: 2 }}>
                                Permanent short expiry reports archived for future reference.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Back to Active Surveillance Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {navigate && (
                        <Button
                            icon={<ArrowLeft size={14} />}
                            onClick={() => navigate('/shortexp')}
                            style={{
                                height: 38,
                                borderRadius: 8,
                                fontWeight: 600,
                                fontSize: '13px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6
                            }}
                        >
                            Back to Short Exp Reports
                        </Button>
                    )}
                </div>
            </div>

            {/* Archive Filter & Date Selector Bar */}
            <div style={{
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                padding: '16px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1, minWidth: 320 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>
                            Snapshot Date:
                        </span>
                        <Select
                            style={{ width: 220 }}
                            size="large"
                            value={selectedDate}
                            onChange={setSelectedDate}
                            placeholder="Select Archive Date"
                            loading={loading && archiveDates.length === 0}
                        >
                            {archiveDates.map(date => (
                                <Option key={date} value={date}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Calendar size={13} color="#0284c7" />
                                        <span>{dayjs(date).format('DD MMM YYYY')}</span>
                                    </div>
                                </Option>
                            ))}
                        </Select>
                    </div>

                    <Input
                        placeholder="Search archived drug, batch, PKU..."
                        prefix={<Search size={16} color="#94a3b8" style={{ marginRight: 6 }} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                        allowClear
                        style={{
                            maxWidth: 320,
                            height: 40,
                            borderRadius: 8,
                            borderColor: '#cbd5e1'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                        Archived Records: <strong style={{ color: '#0f172a' }}>{drugs.length}</strong>
                    </span>

                    <Button
                        icon={<FileSpreadsheet size={15} strokeWidth={2.2} />}
                        onClick={exportToExcel}
                        disabled={drugs.length === 0}
                        style={{
                            height: 40,
                            borderRadius: 9,
                            padding: '0 18px',
                            fontWeight: 600,
                            fontSize: '13px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#107c41',
                            borderColor: '#107c41',
                            color: '#ffffff',
                            boxShadow: '0 2px 6px rgba(16, 124, 65, 0.2)'
                        }}
                    >
                        Export Excel
                    </Button>
                </div>
            </div>

            {/* Archive Table Container */}
            <div style={{
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                overflow: 'hidden'
            }}>
                <Table
                    loading={loading && archiveDates.length > 0}
                    columns={columns}
                    dataSource={displayedItems}
                    rowKey="id"
                    scroll={{ x: 1300 }}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: displayedItems.length,
                        onChange: handlePageChange,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} items`,
                        pageSizeOptions: ['25', '50', '100', '200'],
                        style: { padding: '12px 20px', margin: 0 }
                    }}
                    locale={{
                        emptyText: (
                            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                                <div style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 14,
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#94a3b8',
                                    marginBottom: 12
                                }}>
                                    <Archive size={24} />
                                </div>
                                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
                                    {archiveDates.length === 0
                                        ? `No historical archives found for ${unit}`
                                        : 'No records matching current search'}
                                </h3>
                                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 auto', maxWidth: 420 }}>
                                    {archiveDates.length === 0
                                        ? `When pharmacy staff archives the active short expiry report, a snapshot is saved here for future reference.`
                                        : 'Try modifying your search query to locate archived reports.'}
                                </p>
                            </div>
                        )
                    }}
                />
            </div>

            <style>{`
                .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    color: #475569 !important;
                    font-size: 11.5px !important;
                    font-weight: 700 !important;
                    letter-spacing: 0.5px !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    padding: 12px 14px !important;
                    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
                }
                .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 12px 14px !important;
                }
            `}</style>
        </div>
    );
};

export default ShortExpArchiveDesktopView;
