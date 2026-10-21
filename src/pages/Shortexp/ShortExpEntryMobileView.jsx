import React, { useState, useMemo } from 'react';
import {
    NavBar,
    SearchBar,
    Button,
    Picker,
    DatePicker,
    CapsuleTabs,
    Dialog,
    SafeArea,
    SpinLoading,
    ConfigProvider
} from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';
import {
    LeftOutlined,
    RightOutlined,
    CalendarOutlined,
    PlusOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    SearchOutlined,
    WarningOutlined,
    MinusOutlined,
    CloseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getUnitColor } from '../../lib/colorMappings';
import ShortExpModal from '../../components/ShortExpModal';

// Mobile Touch Batch Editor Component
const MobileBatchEditor = ({ batches, onChange, disabled }) => {
    const [activeKey, setActiveKey] = useState(batches.length > 0 ? batches[0].key : '1');
    const [datePickerVisible, setDatePickerVisible] = useState(false);

    // Keep activeKey valid
    const currentBatch = useMemo(() => {
        return batches.find(b => b.key === activeKey) || batches[0] || null;
    }, [batches, activeKey]);

    const handleFieldChange = (key, field, val) => {
        const updated = batches.map(b => (b.key === key ? { ...b, [field]: val } : b));
        onChange(updated);
    };

    const handleAddBatch = () => {
        const newKey = `batch_${Date.now()}`;
        const newBatches = [
            ...batches,
            { key: newKey, id: null, batch_no: '', date: null, qty: null, se_remarks: '' }
        ];
        onChange(newBatches);
        setActiveKey(newKey);
    };

    const handleRemoveBatch = (keyToRemove) => {
        if (batches.length <= 1) return;
        const updated = batches.filter(b => b.key !== keyToRemove);
        onChange(updated);
        if (activeKey === keyToRemove && updated.length > 0) {
            setActiveKey(updated[updated.length - 1].key);
        }
    };

    if (!currentBatch) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Batch Capsule Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1, overflowX: 'auto', whiteSpace: 'nowrap' }}>
                    <CapsuleTabs activeKey={activeKey} onChange={setActiveKey}>
                        {batches.map((b, idx) => (
                            <CapsuleTabs.Tab title={`Batch ${idx + 1}`} key={b.key} />
                        ))}
                    </CapsuleTabs>
                </div>
                <Button
                    size="mini"
                    shape="rounded"
                    onClick={handleAddBatch}
                    disabled={disabled}
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        flexShrink: 0
                    }}
                >
                    <PlusOutlined /> Add
                </Button>
            </div>

            {/* Batch Fields Card */}
            <div
                style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
            >
                {/* Batch No */}
                <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                        Batch Number
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. B12345"
                        value={currentBatch.batch_no || ''}
                        disabled={disabled}
                        onChange={e => handleFieldChange(currentBatch.key, 'batch_no', e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid #cbd5e1',
                            fontSize: 14,
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Expiry Date */}
                <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                        Expiry Date
                    </label>
                    <div
                        onClick={() => {
                            if (!disabled) setDatePickerVisible(true);
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: 8,
                            border: '1px solid #cbd5e1',
                            background: '#f8fafc',
                            cursor: 'pointer',
                            fontSize: 14,
                            color: currentBatch.date ? '#0f172a' : '#94a3b8'
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CalendarOutlined style={{ color: '#2563eb' }} />
                            {currentBatch.date ? currentBatch.date.format('DD/MM/YYYY') : 'Select expiry date'}
                        </span>
                        <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>Choose</span>
                    </div>

                    <DatePicker
                        visible={datePickerVisible}
                        onClose={() => setDatePickerVisible(false)}
                        defaultValue={currentBatch.date ? currentBatch.date.toDate() : new Date()}
                        min={new Date()}
                        title="Select Expiry Date"
                        onConfirm={val => {
                            handleFieldChange(currentBatch.key, 'date', dayjs(val));
                        }}
                    />
                </div>

                {/* Quantity with touch stepper */}
                <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                        Quantity
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Button
                            size="small"
                            shape="rounded"
                            disabled={disabled || (currentBatch.qty || 0) <= 0}
                            onClick={() =>
                                handleFieldChange(currentBatch.key, 'qty', Math.max(0, (currentBatch.qty || 0) - 1))
                            }
                            style={{ width: 36, height: 36, padding: 0 }}
                        >
                            <MinusOutlined />
                        </Button>
                        <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={currentBatch.qty === null || currentBatch.qty === undefined ? '' : currentBatch.qty}
                            disabled={disabled}
                            onChange={e => {
                                const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                                handleFieldChange(currentBatch.key, 'qty', isNaN(val) ? null : val);
                            }}
                            style={{
                                flex: 1,
                                textAlign: 'center',
                                padding: '8px',
                                borderRadius: 8,
                                border: '1px solid #cbd5e1',
                                fontSize: 16,
                                fontWeight: 700,
                                outline: 'none'
                            }}
                        />
                        <Button
                            size="small"
                            shape="rounded"
                            disabled={disabled}
                            onClick={() =>
                                handleFieldChange(currentBatch.key, 'qty', (currentBatch.qty || 0) + 1)
                            }
                            style={{ width: 36, height: 36, padding: 0 }}
                        >
                            <PlusOutlined />
                        </Button>
                    </div>
                </div>

                {/* Remarks */}
                <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                        Remarks (Optional)
                    </label>
                    <input
                        type="text"
                        placeholder="Add remarks..."
                        value={currentBatch.se_remarks || ''}
                        disabled={disabled}
                        onChange={e => handleFieldChange(currentBatch.key, 'se_remarks', e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid #cbd5e1',
                            fontSize: 13,
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Remove Batch Button */}
                {batches.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                        <Button
                            size="mini"
                            color="danger"
                            fill="none"
                            onClick={() => handleRemoveBatch(currentBatch.key)}
                            disabled={disabled}
                            style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}
                        >
                            <DeleteOutlined /> Remove this batch
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ShortExpEntryMobileView = ({
    unit,
    raks,
    loadingRaks,
    selectedRak,
    setSelectedRak,
    isStarted,
    setIsStarted,
    items,
    currentIndex,
    loading,
    saving,
    iteratorBatches,
    setIteratorBatches,
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    isModalOpen,
    setIsModalOpen,
    selectedItem,
    openItemModal,
    handleStart,
    handleNext,
    handlePrevious,
    navigate
}) => {
    const [rakPickerVisible, setRakPickerVisible] = useState(false);

    const rakPickerColumns = useMemo(() => {
        const options = (raks || []).map(r => ({ label: `Rak: ${r}`, value: r }));
        return [options];
    }, [raks]);

    // Handle exit during active session
    const handleExit = () => {
        Dialog.confirm({
            title: 'Exit Recording',
            content: 'Are you sure you want to exit? Unsaved changes for current item will be lost.',
            confirmText: 'Yes, Exit',
            cancelText: 'Stay',
            onConfirm: () => setIsStarted(false)
        });
    };

    // ------------------------------------------------------------------------
    // Phase 1: Setup View
    // ------------------------------------------------------------------------
    if (!isStarted) {
        return (
            <ConfigProvider locale={enUS}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: '100%',
                        paddingBottom: '80px',
                        background: '#f8fafc'
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 20,
                            background: '#ffffff',
                            borderBottom: '1px solid #f0f0f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}
                    >
                        <NavBar
                            backArrow={<LeftOutlined style={{ fontSize: 16 }} />}
                            onBack={() => navigate('/shortexp')}
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
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                                Start Expiry Check
                            </span>
                        </NavBar>
                    </div>

                    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Start by Rak Card */}
                        <div
                            style={{
                                background: '#ffffff',
                                borderRadius: 14,
                                border: '1px solid #e2e8f0',
                                padding: 16,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                            }}
                        >
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                                Shelf-wise Monitoring
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
                                Select a shelf from {unit} to check each medication expiry date sequentially.
                            </div>

                            {loadingRaks ? (
                                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                    <SpinLoading color="primary" />
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div
                                        onClick={() => setRakPickerVisible(true)}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 14px',
                                            borderRadius: 10,
                                            border: '1px solid #cbd5e1',
                                            background: '#f8fafc',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <span style={{ fontSize: 14, fontWeight: 600, color: selectedRak ? '#0f172a' : '#94a3b8' }}>
                                            {selectedRak ? `Rak: ${selectedRak}` : 'Tap to select Rak'}
                                        </span>
                                        <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>Choose &gt;</span>
                                    </div>

                                    <Button
                                        color="primary"
                                        size="large"
                                        shape="rounded"
                                        block
                                        onClick={handleStart}
                                        disabled={!selectedRak}
                                        style={{ fontWeight: 700, fontSize: 14 }}
                                    >
                                        Start Expiry Check
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Search & Direct Edit Card */}
                        <div
                            style={{
                                background: '#ffffff',
                                borderRadius: 14,
                                border: '1px solid #e2e8f0',
                                padding: 16,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                            }}
                        >
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                                Quick Edit Any Drug
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                                Or search for a single drug to view/update its batches immediately:
                            </div>

                            <SearchBar
                                placeholder="Search drug name..."
                                value={searchTerm}
                                onChange={setSearchTerm}
                                onClear={() => setSearchTerm('')}
                                style={{
                                    '--background': '#f1f5f9',
                                    '--height': '38px',
                                    '--border-radius': '10px',
                                    fontSize: 13
                                }}
                            />

                            {isSearching && (
                                <div style={{ textAlign: 'center', padding: '14px 0' }}>
                                    <SpinLoading color="primary" style={{ '--size': '20px' }} />
                                </div>
                            )}

                            {searchResults.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                                    {searchResults.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => openItemModal(item)}
                                            style={{
                                                padding: '10px 12px',
                                                background: '#f8fafc',
                                                borderRadius: 8,
                                                border: '1px solid #e2e8f0',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                                                    {item.name}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                                    {item.row ? `Rak: ${item.row}` : 'No Rak'}
                                                    {item.pku ? ` • PKU: ${item.pku}` : ''}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>Edit &gt;</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rak Picker */}
                    <Picker
                        columns={rakPickerColumns}
                        visible={rakPickerVisible}
                        onClose={() => setRakPickerVisible(false)}
                        value={selectedRak ? [selectedRak] : []}
                        onConfirm={v => {
                            if (v && v[0]) setSelectedRak(v[0]);
                        }}
                        title="Select Rak"
                    />

                    {/* Quick Edit Modal */}
                    <ShortExpModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        selectedItem={selectedItem}
                    />
                </div>
            </ConfigProvider>
        );
    }

    // ------------------------------------------------------------------------
    // Phase 2: Active Iteration View
    // ------------------------------------------------------------------------
    if (loading) {
        return (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <SpinLoading color="primary" />
                <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>Loading items in Rak...</div>
            </div>
        );
    }

    if (items.length === 0) return null;

    const currentItem = items[currentIndex];
    const progressPercent = Math.round(((currentIndex + 1) / items.length) * 100);
    const isLastItem = currentIndex === items.length - 1;
    const isFirstItem = currentIndex === 0;

    return (
        <ConfigProvider locale={enUS}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100%',
                    paddingBottom: '140px',
                    background: '#f8fafc'
                }}
            >
                {/* Sticky Header with Progress */}
                <div
                    style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 20,
                        background: '#ffffff',
                        borderBottom: '1px solid #f0f0f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                >
                    <NavBar
                        backArrow={<LeftOutlined style={{ fontSize: 16 }} />}
                        onBack={handleExit}
                        right={
                            <span
                                style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: 12,
                                    background: '#dbeafe',
                                    color: '#1d4ed8'
                                }}
                            >
                                {currentIndex + 1} / {items.length}
                            </span>
                        }
                    >
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                            Rak: {selectedRak}
                        </span>
                    </NavBar>

                    {/* Progress Bar */}
                    <div style={{ height: 4, background: '#f1f5f9', overflow: 'hidden' }}>
                        <div
                            style={{
                                height: '100%',
                                background: '#2563eb',
                                width: `${progressPercent}%`,
                                transition: 'width 0.3s ease'
                            }}
                        />
                    </div>
                </div>

                {/* Content Container */}
                <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Current Drug Card */}
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 12,
                            border: '1px solid #e2e8f0',
                            padding: 14,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                        }}
                    >
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1.3, marginBottom: 6 }}>
                            {currentItem.name}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                            {currentItem.pku && (
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        background: '#fef3c7',
                                        color: '#b45309',
                                        border: '1px solid #fde68a'
                                    }}
                                >
                                    PKU: {currentItem.pku}
                                </span>
                            )}
                            {currentItem.row && (
                                <span
                                    style={{
                                        fontSize: 11,
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        background: '#f1f5f9',
                                        color: '#475569',
                                        fontWeight: 600
                                    }}
                                >
                                    Rak: {currentItem.row}
                                </span>
                            )}
                            {currentItem.puchase_type && (
                                <span
                                    style={{
                                        fontSize: 11,
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        background: '#f0fdf4',
                                        color: '#15803d',
                                        fontWeight: 500
                                    }}
                                >
                                    {currentItem.puchase_type}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Batch Details Section */}
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8, paddingLeft: 4 }}>
                            Short Expiry Batches
                        </div>
                        <MobileBatchEditor
                            batches={iteratorBatches}
                            onChange={setIteratorBatches}
                            disabled={saving}
                        />
                    </div>
                </div>

                {/* Sticky Stepper Footer */}
                <div
                    style={{
                        position: 'fixed',
                        bottom: 50,
                        left: 0,
                        right: 0,
                        background: '#ffffff',
                        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
                        borderTop: '1px solid #e2e8f0',
                        padding: '10px 16px',
                        zIndex: 99,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                    }}
                >
                    <Button
                        size="middle"
                        shape="rounded"
                        disabled={saving}
                        onClick={isFirstItem ? handleExit : handlePrevious}
                        style={{
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                        }}
                    >
                        {isFirstItem ? (
                            <>
                                <CloseOutlined /> Cancel
                            </>
                        ) : (
                            <>
                                <LeftOutlined /> Previous
                            </>
                        )}

                    </Button>

                    <Button
                        size="middle"
                        shape="rounded"
                        color="primary"
                        loading={saving}
                        onClick={handleNext}
                        style={{
                            flex: 1,
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                        }}
                    >
                        {isLastItem ? (
                            <>
                                Finish <CheckCircleOutlined />
                            </>
                        ) : (
                            <>
                                Next <RightOutlined />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </ConfigProvider>
    );
};

export default ShortExpEntryMobileView;
