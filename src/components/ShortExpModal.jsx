import React, { useState, useEffect } from 'react';
import { Modal, Typography, Space, Tag, Spin, message } from 'antd';
import { api } from '../lib/api';
import dayjs from 'dayjs';
import ShortExpTabs from './ShortExpTabs';
import { getSourceColor } from '../lib/colorMappings';

const { Title, Text } = Typography;

const ShortExpModal = ({ isOpen, onClose, selectedItem }) => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && selectedItem) {
            fetchBatches();
        }
    }, [isOpen, selectedItem]);

    const fetchBatches = async () => {
        setLoading(true);
        try {
            const data = await api.get(`/shortexp/item/${selectedItem.id}`);
            if (data && data.length > 0) {
                setBatches(data.map(b => ({
                    key: `batch_${b.id}`,
                    id: b.id,
                    batch_no: b.batch_no || '',
                    date: b.exp_date ? dayjs(b.exp_date) : null,
                    qty: b.qty || null,
                    se_remarks: b.se_remarks || ''
                })));
            } else {
                setBatches([{ key: 'batch_new_1', id: null, batch_no: '', date: null, qty: null }]);
            }
        } catch (err) {
            console.error(err);
            message.error('Failed to load short expiry records');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = batches.map(b => ({
                id: b.id,
                batch_no: b.batch_no,
                exp_date: b.date ? b.date.format('YYYY-MM-DD') : null,
                qty: b.qty,
                se_remarks: b.se_remarks
            }));
            
            await api.post(`/shortexp/item/${selectedItem.id}/batches`, { batches: payload });
            message.success('Short expiry details saved');
            onClose();
        } catch (err) {
            console.error(err);
            message.error('Failed to save batches');
        } finally {
            setSaving(false);
        }
    };

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

export default ShortExpModal;
