import React, { useMemo } from 'react';
import {
    Table,
    Tag,
    Button,
    Popconfirm,
    Input,
    Segmented,
    Tooltip
} from 'antd';
import {
    AlertTriangle,
    FileSpreadsheet,
    Plus,
    Inbox,
    Clock,
    AlertCircle,
    CheckCircle2,
    Search,
    Layers,
    Edit3,
    Calendar,
    Sparkles
} from 'lucide-react';
import dayjs from 'dayjs';
import { getSourceColor, getUnitColor } from '../../lib/colorMappings';

const ShortExpDesktopView = ({
    unit = 'OPD',
    user,
    loading,
    drugs = [],
    filteredDrugs,
    searchQuery = '',
    setSearchQuery,
    urgencyFilter = 'all',
    setUrgencyFilter,
    currentPage = 1,
    pageSize = 25,
    handlePageChange,
    openEditModal,
    getQtyForColumn,
    exportToExcel,
    handleArchiveAndClear,
    navigate
}) => {
    // Determine the items list to display
    const displayedItems = useMemo(() => {
        if (filteredDrugs) return filteredDrugs;

        // Fallback local filtering if filteredDrugs is not passed directly
        const today = dayjs().startOf('day');
        return drugs.filter(item => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchName = item.name?.toLowerCase().includes(q);
                const matchBatch = item.batch_no?.toLowerCase().includes(q);
                const matchPku = item.pku?.toLowerCase().includes(q);
                if (!matchName && !matchBatch && !matchPku) return false;
            }
            if (urgencyFilter !== 'all') {
                const daysLeft = dayjs(item.exp_date).startOf('day').diff(today, 'day');
                if (urgencyFilter === 'critical' && daysLeft >= 30) return false;
                if (urgencyFilter === 'warning' && (daysLeft < 30 || daysLeft >= 90)) return false;
            }
            return true;
        });
    }, [filteredDrugs, drugs, searchQuery, urgencyFilter]);

    // Telemetry computations
    const telemetry = useMemo(() => {
        const today = dayjs().startOf('day');
        let critical = 0;
        let warning = 0;
        let standard = 0;

        drugs.forEach(d => {
            const days = dayjs(d.exp_date).startOf('day').diff(today, 'day');
            if (days < 30) {
                critical++;
            } else if (days <= 90) {
                warning++;
            } else {
                standard++;
            }
        });

        return {
            total: drugs.length,
            critical,
            warning,
            standard
        };
    }, [drugs]);

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
            title: 'EXPIRY DATE & COUNTDOWN',
            dataIndex: 'exp_date',
            key: 'exp_date',
            width: 200,
            render: (date) => {
                if (!date) return <span style={{ color: '#94a3b8' }}>—</span>;
                const daysLeft = dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day');
                const isCritical = daysLeft < 30;
                const isWarning = daysLeft >= 30 && daysLeft <= 90;

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={13} color={isCritical ? '#dc2626' : isWarning ? '#ea580c' : '#0284c7'} />
                            <span style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#0f172a',
                                fontFamily: "'JetBrains Mono', monospace"
                            }}>
                                {dayjs(date).format('DD/MM/YYYY')}
                            </span>
                        </div>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            width: 'fit-content',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: isCritical ? '#fef2f2' : isWarning ? '#fffbeb' : '#f0fdf4',
                            color: isCritical ? '#dc2626' : isWarning ? '#b45309' : '#15803d',
                            border: `1px solid ${isCritical ? '#fecaca' : isWarning ? '#fde68a' : '#bbf7d0'}`
                        }}>
                            {isCritical && <AlertCircle size={11} strokeWidth={2.5} />}
                            {isWarning && <Clock size={11} strokeWidth={2.5} />}
                            {!isCritical && !isWarning && <CheckCircle2 size={11} strokeWidth={2.5} />}
                            {daysLeft < 0 ? `Expired (${Math.abs(daysLeft)}d ago)` : `${daysLeft} days remaining`}
                        </span>
                    </div>
                );
            },
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
                        color: '#dc2626',
                        boxShadow: '0 1px 3px rgba(220, 38, 38, 0.15)'
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
                    {val || 'No remarks recorded'}
                </span>
            )
        },
        {
            title: '',
            key: 'action',
            width: 60,
            fixed: 'right',
            align: 'center',
            render: () => (
                <Tooltip title="Edit Short Expiry Batches">
                    <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        transition: 'all 0.15s ease'
                    }}>
                        <Edit3 size={14} />
                    </div>
                </Tooltip>
            )
        }
    ];

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Top Executive Header */}
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
                            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                            border: '1px solid #fed7aa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ea580c',
                            boxShadow: '0 2px 6px rgba(234, 88, 12, 0.12)'
                        }}>
                            <AlertTriangle size={20} strokeWidth={2.2} />
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
                                    Short Expiry Reports
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
                                Active monitoring of items expiring within 6 months for {unit} Pharmacy.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Header Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Button
                        type="primary"
                        icon={<Plus size={15} strokeWidth={2.4} />}
                        onClick={() => navigate('/shortexp-entry')}
                        style={{
                            height: 40,
                            borderRadius: 9,
                            padding: '0 18px',
                            fontWeight: 600,
                            fontSize: '13px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.28)',
                            border: 'none'
                        }}
                    >
                        Record Entry
                    </Button>

                    <Button
                        icon={<FileSpreadsheet size={15} strokeWidth={2.2} />}
                        onClick={exportToExcel}
                        disabled={drugs.length === 0}
                        style={{
                            height: 40,
                            borderRadius: 9,
                            padding: '0 16px',
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

                    {user?.role === 'Issuer' && (
                        <Popconfirm
                            title={`Archive & Clear (${unit})`}
                            description={`Are you sure you want to snapshot and archive all ${unit} short expiry records? This will clear the active table and save a permanent audit snapshot.`}
                            onConfirm={handleArchiveAndClear}
                            okText="Yes, Archive & Clear"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                danger
                                icon={<Inbox size={15} strokeWidth={2.2} />}
                                style={{
                                    height: 40,
                                    borderRadius: 9,
                                    padding: '0 16px',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    background: '#ffffff',
                                    borderColor: '#fca5a5',
                                    color: '#dc2626'
                                }}
                            >
                                Archive & Clear
                            </Button>
                        </Popconfirm>
                    )}
                </div>
            </div>

            {/* Telemetry Metric Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14
            }}>
                {/* Total Batches */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    padding: '16px 18px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14
                }}>
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0284c7',
                        flexShrink: 0
                    }}>
                        <Layers size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Tracked Batches
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginTop: 2 }}>
                            {telemetry.total}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>
                            in {unit} Pharmacy
                        </div>
                    </div>
                </div>

                {/* Critical Expiry (<30d) */}
                <div style={{
                    background: telemetry.critical > 0 ? '#fffdfd' : '#ffffff',
                    borderRadius: 12,
                    padding: '16px 18px',
                    border: `1px solid ${telemetry.critical > 0 ? '#fecaca' : '#e2e8f0'}`,
                    boxShadow: telemetry.critical > 0 ? '0 2px 8px rgba(239, 68, 68, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14
                }}>
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#dc2626',
                        flexShrink: 0
                    }}>
                        <AlertCircle size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Less than 30 days
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#dc2626', lineHeight: 1.15, marginTop: 2 }}>
                            {telemetry.critical}
                        </div>
                        <div style={{ fontSize: '11px', color: '#ef4444', marginTop: 2, fontWeight: 500 }}>
                            Immediate Action Required
                        </div>
                    </div>
                </div>

                {/* Warning Expiry (30-90d) */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    padding: '16px 18px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14
                }}>
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#d97706',
                        flexShrink: 0
                    }}>
                        <Clock size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Less than 3 Months
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', lineHeight: 1.15, marginTop: 2 }}>
                            {telemetry.warning}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 2 }}>
                            May start offering to other facility
                        </div>
                    </div>
                </div>

                {/* Standard (3M-6M) */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    padding: '16px 18px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14
                }}>
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#16a34a',
                        flexShrink: 0
                    }}>
                        <CheckCircle2 size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Less than 6 Months
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', lineHeight: 1.15, marginTop: 2 }}>
                            {telemetry.standard}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>
                            Monitor usage
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter and Search Toolbar */}
            <div style={{
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                padding: '12px 18px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 14,
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 280 }}>
                    <Input
                        placeholder="Search by drug name, batch, PKU..."
                        prefix={<Search size={16} color="#94a3b8" style={{ marginRight: 6 }} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                        allowClear
                        style={{
                            maxWidth: 380,
                            height: 38,
                            borderRadius: 8,
                            borderColor: '#cbd5e1'
                        }}
                    />

                    {setUrgencyFilter && (
                        <Segmented
                            value={urgencyFilter}
                            onChange={setUrgencyFilter}
                            options={[
                                { label: `All (${telemetry.total})`, value: 'all' },
                                {
                                    label: (
                                        <span style={{ color: telemetry.critical > 0 ? '#dc2626' : 'inherit', fontWeight: 600 }}>
                                            Alert ({telemetry.critical})
                                        </span>
                                    ),
                                    value: 'critical'
                                },
                                {
                                    label: (
                                        <span style={{ color: telemetry.warning > 0 ? '#d97706' : 'inherit', fontWeight: 600 }}>
                                            Warning ({telemetry.warning})
                                        </span>
                                    ),
                                    value: 'warning'
                                }
                            ]}
                            style={{
                                background: '#f1f5f9',
                                padding: 3,
                                borderRadius: 8,
                                fontWeight: 500
                            }}
                        />
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', color: '#64748b' }}>
                    <span>Showing</span>
                    <strong style={{ color: '#0f172a' }}>{displayedItems.length}</strong>
                    <span>of</span>
                    <strong style={{ color: '#0f172a' }}>{drugs.length}</strong>
                    <span>batches</span>
                </div>
            </div>

            {/* Main Surveillance Table Card */}
            <div style={{
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                overflow: 'hidden'
            }}>
                <Table
                    loading={loading && drugs.length > 0}
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
                    onRow={(record) => ({
                        onClick: () => {
                            openEditModal(record);
                        },
                    })}
                    rowClassName={() => 'arise-shortexp-row'}
                    locale={{
                        emptyText: (
                            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
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
                                    <Sparkles size={24} />
                                </div>
                                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
                                    {searchQuery ? 'No matching short-expiry records found' : 'No short-expiry items currently tracked'}
                                </h3>
                                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
                                    {searchQuery ? 'Try adjusting your search terms or filter.' : `No items recorded. To enter new short expiry details, click on the "Record Entry" button.`}
                                </p>
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<Plus size={14} />}
                                    onClick={() => navigate('/shortexp-entry')}
                                    style={{ borderRadius: 8, fontWeight: 600 }}
                                >
                                    Record Entry
                                </Button>
                            </div>
                        )
                    }}
                />
            </div>

            <style>{`
                .arise-shortexp-row {
                    cursor: pointer;
                    transition: background-color 0.15s ease;
                }
                .arise-shortexp-row:hover > td {
                    background-color: #f8fafc !important;
                }
                .arise-shortexp-row:hover .lucide-edit-3 {
                    color: #0284c7 !important;
                }
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

export default ShortExpDesktopView;
