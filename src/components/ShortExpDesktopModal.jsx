import React from 'react';
import { Modal, Tag, Spin } from 'antd';
import { Layers, AlertTriangle } from 'lucide-react';
import ShortExpTabs from './ShortExpTabs';
import { getSourceColor, getUnitColor } from '../lib/colorMappings';

const ShortExpDesktopModal = ({
    isOpen,
    onClose,
    selectedItem,
    batches,
    setBatches,
    loading,
    saving,
    handleSave
}) => {
    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 6 }}>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ea580c'
                    }}>
                        <AlertTriangle size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                        <div style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#0f172a',
                            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
                        }}>
                            Edit Short Expiry Batches
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>
                            Manage batch numbers, quantities, and expiration dates.
                        </div>
                    </div>
                </div>
            }
            open={isOpen}
            onCancel={onClose}
            onOk={handleSave}
            confirmLoading={saving}
            okText="Save Batches"
            cancelText="Cancel"
            okButtonProps={{
                style: {
                    borderRadius: 8,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    border: 'none',
                    height: 36,
                    padding: '0 18px'
                }
            }}
            cancelButtonProps={{
                style: { borderRadius: 8, height: 36 }
            }}
            width={580}
            destroyOnClose
        >
            {selectedItem && (
                <div style={{
                    padding: '14px 16px',
                    background: '#f8fafc',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    marginTop: 12,
                    marginBottom: 16
                }}>
                    <div style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#0f172a',
                        lineHeight: 1.35,
                        marginBottom: 8,
                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                    }}>
                        {selectedItem.name}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                        {selectedItem.pku && (
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 5,
                                background: '#fdf2f8',
                                color: '#db2777',
                                border: '1px solid #fbcfe8'
                            }}>
                                {selectedItem.pku}
                            </span>
                        )}
                        {(selectedItem.row || selectedItem.rak) && (
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 5,
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe'
                            }}>
                                Rak: {selectedItem.row || selectedItem.rak}
                            </span>
                        )}
                        {selectedItem.puchase_type && (
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 5,
                                background: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #e2e8f0'
                            }}>
                                {selectedItem.puchase_type}
                            </span>
                        )}
                        {selectedItem.std_kt && (
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 5,
                                background: '#f0fdf4',
                                color: '#16a34a',
                                border: '1px solid #bbf7d0'
                            }}>
                                {selectedItem.std_kt}
                            </span>
                        )}
                        {selectedItem.main_unit && (
                            <Tag color={getUnitColor(selectedItem.main_unit)} style={{ margin: 0, borderRadius: 4, fontWeight: 600 }}>
                                {selectedItem.main_unit}
                            </Tag>
                        )}
                        {selectedItem.indent_source && (
                            <Tag color={getSourceColor(selectedItem.indent_source)} style={{ margin: 0, borderRadius: 4 }}>
                                {selectedItem.indent_source}
                            </Tag>
                        )}
                    </div>
                </div>
            )}

            <div style={{
                background: '#ffffff',
                padding: 16,
                borderRadius: 10,
                border: '1px solid #e2e8f0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <Layers size={15} color="#0284c7" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                        Batch Details
                    </span>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                        <Spin />
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: 8 }}>Loading batch history...</div>
                    </div>
                ) : (
                    <ShortExpTabs 
                        batches={batches}
                        onChange={setBatches}
                        disabled={saving}
                    />
                )}
            </div>
        </Modal>
    );
};

export default ShortExpDesktopModal;
