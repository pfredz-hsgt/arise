import React, { useState, useEffect, useMemo } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    InputNumber,
    Space,
    Popconfirm,
    Tag,
    Tooltip
} from 'antd';
import {
    Plus,
    Search,
    Trash2,
    Edit3,
    Layers,
    ChevronDown,
    Zap,
    Building2,
    Package,
    FolderKanban,
    Sparkles,
    Check
} from 'lucide-react';
import {
    getSourceColor,
    getPuchaseTypeColor,
    getStdKtColor,
    getTypeColor,
    getUnitColor
} from '../../lib/colorMappings';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Inline quick-editable dropdown cell.
 * Renders as a crisp tag with a dropdown caret indicator.
 * Clicking directly opens the dropdown without triggering the row's click event.
 */
const QuickSelectCell = ({
    value,
    options = [],
    onChange,
    colorGetter,
    placeholder = 'Select...',
    minWidth = 100
}) => {
    return (
        <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ display: 'inline-block' }}
        >
            <Select
                size="small"
                value={value || undefined}
                placeholder={placeholder}
                onChange={onChange}
                bordered={false}
                suffixIcon={<ChevronDown size={11} color="#64748b" />}
                popupMatchSelectWidth={false}
                dropdownStyle={{
                    borderRadius: 8,
                    padding: '4px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)'
                }}
                className="arise-quick-select"
                style={{
                    minWidth: minWidth,
                    height: 28,
                    borderRadius: 6,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 4px',
                    transition: 'all 0.15s ease'
                }}
            >
                {options.map(opt => {
                    const optVal = typeof opt === 'object' ? opt.value : opt;
                    const optLabel = typeof opt === 'object' ? opt.label : opt;
                    const optColor = typeof opt === 'object' && opt.color
                        ? opt.color
                        : (colorGetter ? colorGetter(optVal) : undefined);

                    return (
                        <Option key={optVal} value={optVal}>
                            <Tag
                                color={optColor}
                                style={{
                                    margin: 0,
                                    fontWeight: 600,
                                    fontSize: '11px',
                                    borderRadius: 4,
                                    padding: '2px 8px'
                                }}
                            >
                                {optLabel}
                            </Tag>
                        </Option>
                    );
                })}
            </Select>
        </div>
    );
};

const InventoryDesktopView = ({
    drugs = [],
    loading,
    modalVisible,
    setModalVisible,
    editingDrug,
    searchQuery,
    setSearchQuery,
    mainUnits = [],
    indentSources = [],
    itemTypes = [],
    purchaseTypes = [],
    stdKts = [],
    form,
    handleAdd,
    handleEdit,
    handleDelete,
    handleSubmit,
    handleQuickUpdate,
    filteredDrugs = [],
    availableRows = []
}) => {
    // Additional quick toolbar filters
    const [filterUnit, setFilterUnit] = useState('ALL');
    const [filterRow, setFilterRow] = useState('ALL');
    const [filterSource, setFilterSource] = useState('ALL');

    // Combine standard shelf letters with any custom database rows
    const allRowOptions = useMemo(() => {
        const standardLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T'];
        const combined = new Set([...availableRows, ...standardLetters]);
        return Array.from(combined).filter(Boolean).sort().map(r => ({
            value: r,
            label: `${r}`
        }));
    }, [availableRows]);

    // Active displayed items with client toolbar filters
    const displayedDrugs = useMemo(() => {
        return filteredDrugs.filter(d => {
            if (filterUnit !== 'ALL' && (d.main_unit || 'OPD') !== filterUnit) return false;
            if (filterRow !== 'ALL' && d.row !== filterRow) return false;
            if (filterSource !== 'ALL' && d.indent_source !== filterSource) return false;
            return true;
        });
    }, [filteredDrugs, filterUnit, filterRow, filterSource]);

    // Top metrics
    const metrics = useMemo(() => {
        return {
            total: drugs.length,
            units: mainUnits.length,
            raks: availableRows.length,
            sources: indentSources.length
        };
    }, [drugs, mainUnits, availableRows, indentSources]);

    const columns = [
        {
            title: 'DRUG SPECIFICATION',
            dataIndex: 'name',
            key: 'name',
            width: 280,
            fixed: 'left',
            sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
            render: (text, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '4px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                            fontSize: '13.5px',
                            fontWeight: 700,
                            color: '#0f172a',
                            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                            lineHeight: 1.35
                        }}>
                            {text}
                        </span>

                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                        {record.pku && (
                            <span style={{
                                fontSize: '10.5px',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: '#fdf2f8',
                                color: '#db2777',
                                border: '1px solid #fbcfe8'
                            }}>
                                {record.pku}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            title: 'MAIN UNIT',
            dataIndex: 'main_unit',
            key: 'main_unit',
            width: 120,
            filters: mainUnits.map(u => ({ text: u.name, value: u.name })),
            onFilter: (value, record) => record.main_unit === value,
            render: (unit, record) => (
                <QuickSelectCell
                    value={unit || 'OPD'}
                    options={mainUnits.map(u => ({ value: u.name, label: u.name, color: u.color }))}
                    onChange={(val) => handleQuickUpdate && handleQuickUpdate(record.id, 'main_unit', val)}
                    colorGetter={getUnitColor}
                    minWidth={95}
                />
            )
        },
        {
            title: 'SHELF (RAK)',
            dataIndex: 'row',
            key: 'row',
            width: 110,
            filters: allRowOptions.map(r => ({ text: r.label, value: r.value })),
            onFilter: (value, record) => record.row === value,
            render: (row, record) => (
                <QuickSelectCell
                    value={row}
                    options={allRowOptions}
                    placeholder="No Rak"
                    onChange={(val) => handleQuickUpdate && handleQuickUpdate(record.id, 'row', val)}
                    minWidth={90}
                />
            )
        },
        /*{
            title: 'LOCATION (T/P)',
            key: 'coordinates',
            width: 110,
            align: 'center',
            render: (_, record) => (
                <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    color: '#475569',
                    background: '#f8fafc',
                    padding: '2px 8px',
                    borderRadius: 5,
                    border: '1px solid #e2e8f0'
                }}>
                    T:{record.tingkat ?? '-'} · P:{record.petak || '-'}
                </span>
            )
        }, */
        {
            title: 'PURCHASE TYPE',
            dataIndex: 'puchase_type',
            key: 'puchase_type',
            width: 120,
            filters: purchaseTypes.map(p => ({ text: p.name, value: p.name })),
            onFilter: (value, record) => record.puchase_type === value,
            render: (val, record) => (
                <QuickSelectCell
                    value={val}
                    options={purchaseTypes.map(p => ({ value: p.name, label: p.name, color: p.color }))}
                    onChange={(newVal) => handleQuickUpdate && handleQuickUpdate(record.id, 'puchase_type', newVal)}
                    colorGetter={getPuchaseTypeColor}
                    minWidth={95}
                />
            )
        },
        {
            title: 'STD / KT',
            dataIndex: 'std_kt',
            key: 'std_kt',
            width: 105,
            filters: stdKts.map(s => ({ text: s.name, value: s.name })),
            onFilter: (value, record) => record.std_kt === value,
            render: (val, record) => (
                <QuickSelectCell
                    value={val}
                    options={stdKts.map(s => ({ value: s.name, label: s.name, color: s.color }))}
                    onChange={(newVal) => handleQuickUpdate && handleQuickUpdate(record.id, 'std_kt', newVal)}
                    colorGetter={getStdKtColor}
                    minWidth={85}
                />
            )
        },
        {
            title: 'INDENT SOURCE',
            dataIndex: 'indent_source',
            key: 'indent_source',
            width: 155,
            filters: indentSources.map(s => ({ text: s.name, value: s.name })),
            onFilter: (value, record) => record.indent_source === value,
            render: (val, record) => (
                <QuickSelectCell
                    value={val}
                    options={indentSources.map(s => ({ value: s.name, label: s.name, color: s.color }))}
                    onChange={(newVal) => handleQuickUpdate && handleQuickUpdate(record.id, 'indent_source', newVal)}
                    colorGetter={getSourceColor}
                    minWidth={125}
                />
            )
        },
        {
            title: 'ITEM TYPE',
            dataIndex: 'type',
            key: 'type',
            width: 135,
            filters: itemTypes.map(t => ({ text: t.name, value: t.name })),
            onFilter: (value, record) => record.type === value,
            render: (val, record) => (
                <QuickSelectCell
                    value={val}
                    options={itemTypes.map(t => ({ value: t.name, label: t.name, color: t.color }))}
                    onChange={(newVal) => handleQuickUpdate && handleQuickUpdate(record.id, 'type', newVal)}
                    colorGetter={getTypeColor}
                    minWidth={110}
                />
            )
        },
        {
            title: 'MAX / BAL',
            key: 'stock',
            width: 110,
            align: 'center',
            sorter: (a, b) => (a.balance || 0) - (b.balance || 0),
            render: (_, record) => {
                const bal = record.balance ?? 0;
                const isZero = bal === 0;

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '12px',
                            fontWeight: 700,
                            color: isZero ? '#dc2626' : '#15803d'
                        }}>
                            {bal} / {record.max_qty ?? '—'}
                        </span>
                        <span style={{
                            fontSize: '9.5px',
                            color: isZero ? '#ef4444' : '#64748b',
                            fontWeight: 600
                        }}>
                            {isZero ? 'Out of stock' : 'In stock'}
                        </span>
                    </div>
                );
            }
        },
        {
            title: 'REMARKS',
            dataIndex: 'remarks',
            key: 'remarks',
            width: 140,
            ellipsis: true,
            render: (val) => (
                <Tooltip title={val}>
                    <span style={{ fontSize: '12px', color: val ? '#334155' : '#cbd5e1' }}>
                        {val || '—'}
                    </span>
                </Tooltip>
            )
        },
        {
            title: '',
            key: 'actions',
            width: 80,
            fixed: 'right',
            align: 'center',
            render: (_, record) => (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                >
                    <Tooltip title="Edit Full Drug Details">
                        <Button
                            type="text"
                            size="small"
                            icon={<Edit3 size={14} color="#0284c7" />}
                            onClick={() => handleEdit(record)}
                            style={{ borderRadius: 4 }}
                        />
                    </Tooltip>

                    <Popconfirm
                        title="Delete this medication?"
                        description="This will permanently delete this drug from the inventory database."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Delete Medication">
                            <Button
                                type="text"
                                danger
                                size="small"
                                icon={<Trash2 size={14} />}
                                style={{ borderRadius: 4 }}
                            />
                        </Tooltip>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    // Handle Enter key for modal submission
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!modalVisible) return;
            if (e.target.tagName.toLowerCase() === 'textarea') return;
            if (e.key === 'Enter') {
                e.preventDefault();
                form.submit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modalVisible, form]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top Inventory Metrics */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12
            }}>
                <div style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Registered Items</span>
                    <strong style={{ fontSize: '18px', color: '#0f172a' }}>{metrics.total}</strong>
                </div>

                <div style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0284c7' }}>Pharmacy Units</span>
                    <strong style={{ fontSize: '18px', color: '#0284c7' }}>{metrics.units}</strong>
                </div>

                <div style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb' }}>Raks / Shelves</span>
                    <strong style={{ fontSize: '18px', color: '#2563eb' }}>{metrics.raks}</strong>
                </div>

                <div style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981' }}>Indent Sources</span>
                    <strong style={{ fontSize: '18px', color: '#10b981' }}>{metrics.sources}</strong>
                </div>
            </div>

            {/* Quick-Edit Banner */}
            <div style={{
                background: '#eff6ff',
                borderRadius: 8,
                border: '1px solid #bfdbfe',
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '12px',
                color: '#1e40af'
            }}>
                <Zap size={14} color="#2563eb" strokeWidth={2.4} />
                <span>
                    <strong>Quick-Edit Enabled:</strong> You can edit <em>Main Unit</em>, <em>Shelf</em>, <em>Purchase Type</em>, <em>STD/KT</em>, <em>Source</em>, and <em>Item Type</em> directly using the dropdown chips inside the table cells.
                </span>
            </div>

            {/* Filter & Action Toolbar */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 320, flexWrap: 'wrap' }}>
                    <Input
                        placeholder="Search by name, item code, PKU, row, remarks..."
                        prefix={<Search size={15} color="#94a3b8" style={{ marginRight: 6 }} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        allowClear
                        style={{ maxWidth: 360, height: 38, borderRadius: 8, borderColor: '#cbd5e1' }}
                    />

                    <Select
                        value={filterUnit}
                        onChange={setFilterUnit}
                        style={{ width: 140, height: 38 }}
                    >
                        <Option value="ALL">All Units</Option>
                        {mainUnits.map(u => (
                            <Option key={u.name} value={u.name}>{u.name}</Option>
                        ))}
                    </Select>

                    <Select
                        value={filterRow}
                        onChange={setFilterRow}
                        style={{ width: 130, height: 38 }}
                    >
                        <Option value="ALL">All Shelves</Option>
                        {allRowOptions.map(r => (
                            <Option key={r.value} value={r.value}>{r.label}</Option>
                        ))}
                    </Select>

                    <Select
                        value={filterSource}
                        onChange={setFilterSource}
                        style={{ width: 160, height: 38 }}
                    >
                        <Option value="ALL">All Sources</Option>
                        {indentSources.map(s => (
                            <Option key={s.name} value={s.name}>{s.name}</Option>
                        ))}
                    </Select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Showing <strong style={{ color: '#0f172a' }}>{displayedDrugs.length}</strong> items
                    </span>

                    <Button
                        type="primary"
                        icon={<Plus size={15} strokeWidth={2.4} />}
                        onClick={handleAdd}
                        style={{
                            height: 38,
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: '13px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            border: 'none',
                            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                        }}
                    >
                        New Drug Item
                    </Button>
                </div>
            </div>

            {/* Main Interactive Inventory Table */}
            <Table
                columns={columns}
                dataSource={displayedDrugs}
                showSorterTooltip={false}
                rowKey="id"
                loading={loading}
                scroll={{ x: 1450 }}
                onRow={(record) => ({
                    onClick: () => handleEdit(record),
                    style: { cursor: 'pointer' },
                    className: 'arise-inventory-table-row'
                })}
                pagination={{
                    defaultPageSize: 15,
                    showSizeChanger: true,
                    pageSizeOptions: ['15', '25', '50', '100'],
                    showTotal: (total) => `Total ${total} items`,
                    style: { padding: '12px 14px', margin: 0 }
                }}
            />

            {/* Full Edit / Create Drug Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 6 }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0284c7'
                        }}>
                            <Package size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                {editingDrug ? 'Edit Inventory Specification' : 'Register New Inventory Item'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                Manage item details, location coordinates, and stock limits.
                            </div>
                        </div>
                    </div>
                }
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={() => form.submit()}
                okText={editingDrug ? 'Save Changes' : 'Create Drug'}
                width={680}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{ marginTop: 14 }}
                >
                    <Form.Item
                        name="name"
                        label={<span style={{ fontWeight: 600 }}>Drug Full Name</span>}
                        rules={[{ required: true, message: 'Please enter drug name' }]}
                    >
                        <Input placeholder="e.g., Paracetamol 500mg Tablet" size="large" style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: 12,
                        marginBottom: 12
                    }}>
                        <Form.Item
                            name="main_unit"
                            label={<span style={{ fontWeight: 600 }}>Main Unit</span>}
                            rules={[{ required: true, message: 'Select unit' }]}
                        >
                            <Select placeholder="Select unit" size="large">
                                {mainUnits.map(u => (
                                    <Option key={u.name} value={u.name}>
                                        <Tag color={u.color}>{u.name}</Tag>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="item_code" label={<span style={{ fontWeight: 600 }}>Item Code</span>}>
                            <Input placeholder="e.g., ITEM001" size="large" style={{ borderRadius: 8 }} />
                        </Form.Item>

                        <Form.Item name="pku" label={<span style={{ fontWeight: 600 }}>PKU</span>}>
                            <Input placeholder="e.g., PKU001" size="large" style={{ borderRadius: 8 }} />
                        </Form.Item>

                        <Form.Item name="convert_sku" label={<span style={{ fontWeight: 600 }}>Convert SKU</span>} initialValue={1}>
                            <InputNumber placeholder="1" style={{ width: '100%', borderRadius: 8 }} size="large" min={1} inputMode="numeric" />
                        </Form.Item>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12,
                        marginBottom: 12
                    }}>
                        <Form.Item name="puchase_type" label={<span style={{ fontWeight: 600 }}>Purchase Type</span>}>
                            <Select placeholder="Select purchase type" size="large">
                                {purchaseTypes.map(p => (
                                    <Option key={p.name} value={p.name}>{p.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="std_kt" label={<span style={{ fontWeight: 600 }}>STD / KT</span>}>
                            <Select placeholder="Select STD or KT" size="large">
                                {stdKts.map(s => (
                                    <Option key={s.name} value={s.name}>{s.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    {/* Shelf Coordinates & Stock Box */}
                    <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: '14px 16px',
                        marginBottom: 14
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 10 }}>
                            Shelf Coordinates &amp; Stock Thresholds
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                            gap: 10
                        }}>
                            <Form.Item name="row" label="Row / Rak" style={{ marginBottom: 0 }}>
                                <Input placeholder="e.g., A" style={{ borderRadius: 6 }} />
                            </Form.Item>

                            <Form.Item name="tingkat" label="Tingkat" style={{ marginBottom: 0 }}>
                                <InputNumber placeholder="1" style={{ width: '100%', borderRadius: 6 }} min={0} inputMode="numeric" />
                            </Form.Item>

                            <Form.Item name="petak" label="Petak" style={{ marginBottom: 0 }}>
                                <Input placeholder="e.g., 2" style={{ borderRadius: 6 }} />
                            </Form.Item>

                            <Form.Item name="max_qty" label="Max Qty" style={{ marginBottom: 0 }}>
                                <InputNumber placeholder="100" style={{ width: '100%', borderRadius: 6 }} min={0} inputMode="numeric" />
                            </Form.Item>

                            <Form.Item name="balance" label="Balance" style={{ marginBottom: 0 }}>
                                <InputNumber placeholder="0" style={{ width: '100%', borderRadius: 6 }} min={0} inputMode="numeric" />
                            </Form.Item>
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12,
                        marginBottom: 12
                    }}>
                        <Form.Item name="indent_source" label={<span style={{ fontWeight: 600 }}>Indent Source</span>}>
                            <Select placeholder="Select indent source" size="large">
                                {indentSources.map(s => (
                                    <Option key={s.name} value={s.name}>{s.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="type" label={<span style={{ fontWeight: 600 }}>Item Type</span>}>
                            <Select placeholder="Select type" size="large">
                                {itemTypes.map(t => (
                                    <Option key={t.name} value={t.name}>{t.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item name="remarks" label={<span style={{ fontWeight: 600 }}>Remarks &amp; Special Handling</span>}>
                        <TextArea rows={2} placeholder="Any storage or dispensing instructions..." style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Form.Item name="image_url" label={<span style={{ fontWeight: 600 }}>Medication Image URL (Optional)</span>} style={{ marginBottom: 0 }}>
                        <Input placeholder="https://..." style={{ borderRadius: 8 }} />
                    </Form.Item>
                </Form>
            </Modal>

            <style>{`
                .arise-quick-select:hover {
                    border-color: #0284c7 !important;
                    background: #f0f9ff !important;
                }
                .arise-inventory-table-row:hover td {
                    background-color: #f8fafc !important;
                }
            `}</style>
        </div>
    );
};

export default InventoryDesktopView;
