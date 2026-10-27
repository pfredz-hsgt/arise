import React from 'react';
import {
    Button,
    Input,
    Spin,
    Select,
    Tag,
    Popconfirm,
    Empty
} from 'antd';
import {
    Footprints,
    Search,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Calendar,
    Layers,
    Sparkles,
    AlertTriangle,
    Edit3,
    Compass,
    Info,
    XCircle
} from 'lucide-react';
import { getUnitColor, getSourceColor } from '../../lib/colorMappings';
import ShortExpModal from '../../components/ShortExpModal';
import ShortExpTabs from '../../components/ShortExpTabs';

const { Option } = Select;

const ShortExpEntryDesktopView = ({
    unit = 'OPD',
    raks = [],
    loadingRaks,
    selectedRak,
    setSelectedRak,
    isStarted,
    setIsStarted,
    items = [],
    currentIndex = 0,
    loading,
    saving,
    iteratorBatches = [],
    setIteratorBatches,
    searchTerm = '',
    setSearchTerm,
    searchResults = [],
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
    // -------------------------------------------------------------
    // STATE 1: PRE-START / SETUP LAUNCHPAD
    // -------------------------------------------------------------
    if (!isStarted) {
        return (
            <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 16,
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                            border: '1px solid #bfdbfe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#2563eb',
                            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)'
                        }}>
                            <Compass size={22} strokeWidth={2.2} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <h1 style={{
                                    margin: 0,
                                    fontSize: '20px',
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
                                }}>
                                    Short Expiry Data Entry Console
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
                                Perform a sequential entry by shelf or quickly search and record batches for specific medications.
                            </p>
                        </div>
                    </div>

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

                {/* Dual Column Action Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
                    gap: 20
                }}>
                    {/* Method 1: Sequential Shelf Audit */}
                    <div style={{
                        background: '#ffffff',
                        borderRadius: 14,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                        padding: 24,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: '#f0f9ff',
                                    border: '1px solid #bae6fd',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#0284c7'
                                }}>
                                    <Footprints size={18} strokeWidth={2.2} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                                        Sequential Entry by Shelf
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                        Go through each shelf and update
                                    </div>
                                </div>
                            </div>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: '#ecfdf5',
                                color: '#059669',
                                border: '1px solid #a7f3d0'
                            }}>
                                Recommended
                            </span>
                        </div>

                        <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: 20 }}>
                            Select a Rak location to iterate item-by-item through every registered drug on the shelf. Record batch numbers, quantities, and expiration dates seamlessly.
                        </p>

                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                                    Select Target Shelf (Rak):
                                </label>
                                {loadingRaks ? (
                                    <div style={{ textAlign: 'center', padding: '12px 0' }}><Spin /></div>
                                ) : (
                                    <Select
                                        style={{ width: '100%' }}
                                        size="large"
                                        placeholder="Choose Rak (e.g. A, B, C, Eye Drop...)"
                                        value={selectedRak}
                                        onChange={setSelectedRak}
                                    >
                                        {raks.map(r => (
                                            <Option key={r} value={r}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Layers size={14} color="#0284c7" />
                                                    <span style={{ fontWeight: 600 }}>Rak: {r}</span>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>
                                )}
                            </div>

                            <Button
                                type="primary"
                                size="large"
                                block
                                onClick={handleStart}
                                disabled={!selectedRak || loadingRaks}
                                icon={<ArrowRight size={16} />}
                                style={{
                                    height: 44,
                                    borderRadius: 10,
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.28)',
                                    border: 'none'
                                }}
                            >
                                Start Checking {selectedRak ? `(Rak: ${selectedRak})` : ''}
                            </Button>
                        </div>
                    </div>

                    {/* Method 2: Direct Search & Single Drug Edit */}
                    <div style={{
                        background: '#ffffff',
                        borderRadius: 14,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                        padding: 24,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: '#f5f3ff',
                                    border: '1px solid #ddd6fe',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#7c3aed'
                                }}>
                                    <Search size={18} strokeWidth={2.2} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                                        Direct Drug Search
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                        Quick single medication update
                                    </div>
                                </div>
                            </div>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: '#f5f3ff',
                                color: '#7c3aed',
                                border: '1px solid #ddd6fe'
                            }}>
                                Fast Edit
                            </span>
                        </div>

                        <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: 16 }}>
                            Need to update short expiry details for an individual drug right now? Search below to open its batch editor without iterating through the whole shelf.
                        </p>

                        <Input
                            placeholder="Type drug name or PKU to search..."
                            prefix={<Search size={16} color="#94a3b8" style={{ marginRight: 6 }} />}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            allowClear
                            style={{
                                height: 42,
                                borderRadius: 8,
                                borderColor: '#cbd5e1',
                                marginBottom: 12
                            }}
                        />

                        {/* Search Results Box */}
                        <div style={{
                            flex: 1,
                            minHeight: 160,
                            maxHeight: 220,
                            overflowY: 'auto',
                            border: '1px solid #e2e8f0',
                            borderRadius: 10,
                            background: '#f8fafc',
                            padding: searchResults.length > 0 ? '6px' : '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: searchResults.length > 0 ? 'flex-start' : 'center'
                        }}>
                            {isSearching ? (
                                <div style={{ textAlign: 'center', padding: 20 }}>
                                    <Spin />
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: 8 }}>Searching inventory...</div>
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {searchResults.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => openItemModal(item)}
                                            className="arise-search-result-row"
                                            style={{
                                                padding: '10px 12px',
                                                background: '#ffffff',
                                                borderRadius: 8,
                                                border: '1px solid #e2e8f0',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                                                <div style={{
                                                    fontSize: '13px',
                                                    fontWeight: 700,
                                                    color: '#0f172a',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {item.name}
                                                </div>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                                                    {item.pku && (
                                                        <span style={{ fontSize: '10.5px', color: '#db2777', fontWeight: 600 }}>
                                                            {item.pku}
                                                        </span>
                                                    )}
                                                    {item.row && (
                                                        <span style={{ fontSize: '10.5px', color: '#2563eb', fontWeight: 600 }}>
                                                            · Rak: {item.row}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                size="small"
                                                type="text"
                                                icon={<Edit3 size={13} color="#0284c7" />}
                                                style={{ borderRadius: 6, fontWeight: 600, color: '#0284c7' }}
                                            >
                                                Edit
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                    <Sparkles size={20} style={{ margin: '0 auto 6px', display: 'block', opacity: 0.6 }} />
                                    <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                                        {searchTerm ? 'No medications found matching search' : 'Search for a medication to edit its batches'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>



                {/* Direct Edit Modal */}
                <ShortExpModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    selectedItem={selectedItem}
                />

                <style>{`
                    .arise-search-result-row:hover {
                        border-color: #0284c7 !important;
                        background: #f0f9ff !important;
                        transform: translateY(-1px);
                    }
                `}</style>
            </div>
        );
    }

    // -------------------------------------------------------------
    // STATE 2: ACTIVE SHELF AUDIT CONSOLE
    // -------------------------------------------------------------
    if (loading) {
        return (
            <div style={{
                maxWidth: 900,
                margin: '60px auto',
                padding: '60px 20px',
                textAlign: 'center',
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0'
            }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
                    Loading Shelf Items for Rak {selectedRak}...
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div style={{
                maxWidth: 600,
                margin: '60px auto',
                padding: '50px 20px',
                textAlign: 'center',
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0'
            }}>
                <Empty description={`No items found in Rak: ${selectedRak}`} />
                <Button
                    style={{ marginTop: 16 }}
                    onClick={() => setIsStarted(false)}
                >
                    Select Another Shelf
                </Button>
            </div>
        );
    }

    const currentItem = items[currentIndex] || {};
    const progressPercent = Math.round(((currentIndex + 1) / items.length) * 100);
    const isLastItem = currentIndex === items.length - 1;

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Top Audit Header & Progress Banner */}
            <div style={{
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                padding: '16px 22px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0284c7'
                        }}>
                            <Footprints size={20} strokeWidth={2.2} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    fontSize: '15px',
                                    fontWeight: 800,
                                    color: '#0f172a',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                                }}>
                                    Sequential Items Monitoring:
                                </span>
                                <span style={{
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    padding: '2px 10px',
                                    borderRadius: 6,
                                    background: '#0284c7',
                                    color: '#ffffff'
                                }}>
                                    Rak {selectedRak}
                                </span>
                                <Tag color={getUnitColor(unit)} style={{ margin: 0, fontWeight: 700, borderRadius: 5 }}>
                                    {unit}
                                </Tag>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>
                                Checking Item <strong style={{ color: '#0f172a' }}>{currentIndex + 1}</strong> of <strong style={{ color: '#0f172a' }}>{items.length}</strong>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: '#0284c7', fontFamily: "'JetBrains Mono', monospace" }}>
                                {progressPercent}%
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>completed</span>
                        </div>

                        <Popconfirm
                            title="Do you want to Exit?"
                            description="Unsaved changes for the current item will be lost."
                            onConfirm={() => {
                                setIsStarted(false);
                            }}
                            okText="Exit"
                            cancelText="Cancel"
                        >
                            <Button
                                size="small"
                                icon={<XCircle size={14} />}
                                style={{
                                    borderRadius: 6,
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#64748b'
                                }}
                            >
                                Exit
                            </Button>
                        </Popconfirm>
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{
                    height: 6,
                    background: '#f1f5f9',
                    borderRadius: 999,
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${progressPercent}%`,
                        background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                        borderRadius: 999,
                        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                </div>
            </div>

            {/* Current Item Focus Card */}
            <div style={{
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 20
            }}>
                {/* Item Specification Header */}
                <div style={{
                    paddingBottom: 16,
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                        <h2 style={{
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: 800,
                            color: '#0f172a',
                            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                            lineHeight: 1.35
                        }}>
                            {currentItem.name}
                        </h2>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                        {currentItem.pku && (
                            <span style={{
                                fontSize: '11.5px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: '#fdf2f8',
                                color: '#db2777',
                                border: '1px solid #fbcfe8'
                            }}>
                                {currentItem.pku}
                            </span>
                        )}
                        <span style={{
                            fontSize: '11.5px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe'
                        }}>
                            Rak: {currentItem.row || selectedRak}
                        </span>
                        {currentItem.puchase_type && (
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #e2e8f0'
                            }}>
                                {currentItem.puchase_type}
                            </span>
                        )}
                        {currentItem.std_kt && (
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: '#f0fdf4',
                                color: '#16a34a',
                                border: '1px solid #bbf7d0'
                            }}>
                                {currentItem.std_kt}
                            </span>
                        )}
                        {currentItem.indent_source && (
                            <Tag color={getSourceColor(currentItem.indent_source)} style={{ margin: 0, borderRadius: 5 }}>
                                {currentItem.indent_source}
                            </Tag>
                        )}
                    </div>
                </div>

                {/* Batch Editor Panel */}
                <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 18
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Layers size={16} color="#0284c7" />
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
                                Recorded Batches ({iteratorBatches.length})
                            </span>
                        </div>
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                            Click '+' to add another batch for this medication
                        </span>
                    </div>

                    <ShortExpTabs
                        batches={iteratorBatches}
                        onChange={setIteratorBatches}
                        disabled={saving}
                    />
                </div>

                {/* Stepper Footer Controls */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 12,
                    borderTop: '1px solid #f1f5f9'
                }}>
                    <Button
                        size="large"
                        icon={<ArrowLeft size={16} />}
                        disabled={currentIndex === 0}
                        onClick={handlePrevious}
                        loading={saving}
                        style={{
                            height: 42,
                            borderRadius: 9,
                            fontWeight: 600,
                            fontSize: '13px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                        }}
                    >
                        Previous Item
                    </Button>

                    <Button
                        type="primary"
                        size="large"
                        onClick={handleNext}
                        loading={saving}
                        style={{
                            height: 44,
                            borderRadius: 10,
                            fontWeight: 700,
                            fontSize: '14px',
                            padding: '0 24px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            background: isLastItem
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            boxShadow: isLastItem
                                ? '0 2px 8px rgba(16, 185, 129, 0.3)'
                                : '0 2px 8px rgba(2, 132, 199, 0.28)',
                            border: 'none'
                        }}
                    >
                        <span>{isLastItem ? 'Finish ' : 'Next'}</span>
                        {isLastItem ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ShortExpEntryDesktopView;
