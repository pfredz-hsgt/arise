import React from 'react';
import { Modal, Typography, Space, Tag, Spin } from 'antd';
import ShortExpTabs from './ShortExpTabs';
import { getSourceColor, getUnitColor } from '../lib/colorMappings';

const { Title, Text } = Typography;

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
            title="Edit Short Expiry"
            open={isOpen}
            onCancel={onClose}
            onOk={handleSave}
            confirmLoading={saving}
            width={500}
            destroyOnClose
        >
            {selectedItem && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Title level={4} style={{ marginBottom: 4 }}>
                        {selectedItem.name}
                    </Title>

                    <Space size="large" style={{ marginBottom: 12 }}>
                        {selectedItem.pku && (
                            <Text type="secondary" style={{ fontSize: '13px' }}>
                                PKU: <Text strong>{selectedItem.pku}</Text>
                            </Text>
                        )}
                    </Space> <br />

                    <Space wrap style={{ marginBottom: 8, justifyContent: 'center' }}>
                        {selectedItem.main_unit && <Tag color={getUnitColor(selectedItem.main_unit)} style={{ fontWeight: 600 }}>{selectedItem.main_unit}</Tag>}
                        {selectedItem.row && <Tag color="blue">Rak: {selectedItem.row}</Tag>}
                        {selectedItem.puchase_type && <Tag color="orange">{selectedItem.puchase_type}</Tag>}
                        {selectedItem.indent_source && <Tag color={getSourceColor(selectedItem.indent_source) || "green"}>{selectedItem.indent_source}</Tag>}
                        {selectedItem.std_kt && <Tag color="purple">{selectedItem.std_kt}</Tag>}
                    </Space>
                </div>
            )}

            <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, marginTop: 16 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
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
