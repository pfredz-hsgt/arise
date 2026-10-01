import React, { useState } from 'react';
import { Tabs, Input, InputNumber, DatePicker, Typography } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

const ShortExpTabs = ({ batches, onChange, disabled }) => {
    const [activeKey, setActiveKey] = useState(batches.length > 0 ? batches[0].key : '1');

    const handleChange = (key, field, value) => {
        const newBatches = batches.map(b => 
            b.key === key ? { ...b, [field]: value } : b
        );
        onChange(newBatches);
    };

    const handleEdit = (targetKey, action) => {
        if (action === 'add') {
            const newKey = `batch_${Date.now()}`;
            const newBatches = [...batches, { key: newKey, id: null, batch_no: '', date: null, qty: null }];
            onChange(newBatches);
            setActiveKey(newKey);
        } else if (action === 'remove') {
            const newBatches = batches.filter(b => b.key !== targetKey);
            onChange(newBatches);
            if (activeKey === targetKey && newBatches.length > 0) {
                setActiveKey(newBatches[newBatches.length - 1].key);
            }
        }
    };

    return (
        <Tabs
            type="editable-card"
            onChange={setActiveKey}
            activeKey={activeKey}
            onEdit={handleEdit}
            items={batches.map((batch, index) => ({
                key: batch.key,
                label: `Batch ${index + 1}`,
                children: (
                    <div style={{ padding: '16px', background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Batch Number</Text>
                                <Input
                                    placeholder="Batch No"
                                    value={batch.batch_no}
                                    onChange={e => handleChange(batch.key, 'batch_no', e.target.value)}
                                    disabled={disabled}
                                />
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Quantity</Text>
                                <InputNumber
                                    placeholder="Qty"
                                    min={0}
                                    value={batch.qty}
                                    inputMode="numeric"
                                    onChange={v => handleChange(batch.key, 'qty', v)}
                                    style={{ width: '100%' }}
                                    disabled={disabled}
                                />
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>Expiry Date</Text>
                                <DatePicker
                                    placeholder="Expiry Date"
                                    style={{ width: '100%' }}
                                    value={batch.date}
                                    onChange={d => handleChange(batch.key, 'date', d)}
                                    format="DD/MM/YYYY"
                                    disabled={disabled}
                                />
                            </div>
                        </div>
                    </div>
                )
            }))}
        />
    );
};

export default ShortExpTabs;
