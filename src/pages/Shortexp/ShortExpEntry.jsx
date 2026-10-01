import React, { useState, useEffect, useRef } from 'react';
import { Typography, Card, Button, InputNumber, Input, Row, Col, Spin, message, DatePicker, Select, Space, Modal, List, Tag, Tabs } from 'antd';
import { LeftOutlined, RightOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';
import ShortExpModal from '../../components/ShortExpModal';
import ShortExpTabs from '../../components/ShortExpTabs';

const { Title, Text } = Typography;
const { Option } = Select;

const ShortExpEntry = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Setup state
    const [raks, setRaks] = useState([]);
    const [loadingRaks, setLoadingRaks] = useState(true);
    const [selectedRak, setSelectedRak] = useState(null);
    const [isStarted, setIsStarted] = useState(false);

    // Iteration state
    const [items, setItems] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Current item data
    const [iteratorBatches, setIteratorBatches] = useState([]);

    // Search and Modal state
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Search effect
    useEffect(() => {
        const search = async () => {
            if (!debouncedSearchTerm) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const data = await api.get(`/inventory?search=${encodeURIComponent(debouncedSearchTerm)}`);
                setSearchResults(data || []);
            } catch (err) {
                console.error(err);
                message.error("Search failed");
            } finally {
                setIsSearching(false);
            }
        };
        search();
    }, [debouncedSearchTerm]);

    const openItemModal = async (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    useEffect(() => {
        const fetchRaks = async () => {
            setLoadingRaks(true);
            try {
                const uniqueRaks = await api.get('/inventory/raks');
                const raksList = Array.isArray(uniqueRaks) ? uniqueRaks.map(r => typeof r === 'object' ? r.row : r) : [];
                setRaks(raksList);
            } catch (err) {
                console.error("Error fetching raks", err);
                message.error("Failed to load Raks");
            } finally {
                setLoadingRaks(false);
            }
        };

        fetchRaks();
    }, []);

    const initSessionAndItems = async (rak) => {
        setLoading(true);
        try {
            // Fetch ALL inventory items for this rak
            const invItems = await api.get(`/inventory?row=${encodeURIComponent(rak)}`);

            if (!invItems || invItems.length === 0) {
                message.warning(`No items found in Rak ${rak}`);
                return false;
            }

            setItems(invItems);
            setCurrentIndex(0);
            await loadItemData(invItems[0].id);
            return true;
        } catch (error) {
            console.error(error);
            message.error("Failed to initialize items.");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async () => {
        if (!selectedRak) {
            message.warning("Please select a Rak first!");
            return;
        }
        const success = await initSessionAndItems(selectedRak);
        if (success) {
            setIsStarted(true);
        }
    };

    const loadItemData = async (itemId) => {
        const data = await api.get(`/shortexp/item/${itemId}`);

        if (data && data.length > 0) {
            setIteratorBatches(data.map(b => ({
                key: `batch_${b.id}`,
                id: b.id,
                batch_no: b.batch_no || '',
                date: b.exp_date ? dayjs(b.exp_date) : null,
                qty: b.qty || null,
                se_remarks: b.se_remarks || ''
            })));
        } else {
            setIteratorBatches([{ key: 'batch_new_1', id: null, batch_no: '', date: null, qty: null }]);
        }
    };

    const saveCurrentData = async () => {
        if (!items[currentIndex]) return true;

        setSaving(true);
        try {
            const currentItem = items[currentIndex];

            const payload = iteratorBatches.map(b => ({
                id: b.id,
                batch_no: b.batch_no,
                exp_date: b.date ? b.date.format('YYYY-MM-DD') : null,
                qty: b.qty,
                se_remarks: b.se_remarks
            }));
            
            await api.post(`/shortexp/item/${currentItem.id}/batches`, { batches: payload });

            return true;
        } catch (error) {
            console.error(error);
            message.error("Failed to save item data.");
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        const success = await saveCurrentData();
        if (success) {
            if (currentIndex < items.length - 1) {
                const nextIndex = currentIndex + 1;
                setCurrentIndex(nextIndex);
                await loadItemData(items[nextIndex].id);
            } else {
                // Done! Navigate back
                message.success("Completed Rak!");
                navigate('/shortexp');
            }
        }
    };

    const handlePrevious = async () => {
        const success = await saveCurrentData();
        if (success && currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setCurrentIndex(prevIndex);
            await loadItemData(items[prevIndex].id);
        }
    };

    if (!isStarted) {
        return (
            <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
                <Title level={3}>Record Short Expiry</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                    Select a Rak to iterate through all its items and record short expiry dates.
                </Text>

                <Card>
                    {loadingRaks ? <Spin /> : (
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            <Select
                                style={{ width: '100%' }}
                                size="large"
                                placeholder="Select a Rak"
                                value={selectedRak}
                                onChange={setSelectedRak}
                            >
                                {raks.map(r => (
                                    <Option key={r} value={r}>{r}</Option>
                                ))}
                            </Select>
                            <Button type="primary" size="large" block onClick={handleStart}>
                                Start Recording
                            </Button>
                        </Space>
                    )}
                </Card>

                <Card title="Search & Edit Specific Drug" style={{ marginTop: 24, textAlign: 'left' }}>
                    <Input.Search
                        placeholder="Search drug name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        loading={isSearching}
                        size="large"
                        allowClear
                    />
                    {searchResults.length > 0 && (
                        <List
                            size="small"
                            style={{ marginTop: 16, maxHeight: 300, overflow: 'auto' }}
                            bordered
                            dataSource={searchResults}
                            renderItem={(item) => (
                                <List.Item
                                    className="search-result-item"
                                    onClick={() => openItemModal(item)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <List.Item.Meta
                                        title={item.name}
                                        description={item.row ? `Rak: ${item.row}` : null}
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </Card>

                <ShortExpModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    selectedItem={selectedItem}
                />
            </div>
        );
    }

    if (loading) {
        return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" tip="Loading Items..." /></div>;
    }

    if (items.length === 0) return null;

    const currentItem = items[currentIndex];
    const progressPercent = Math.round(((currentIndex + 1) / items.length) * 100);

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Record Short Expiry for Rak: {selectedRak}</Title>
                    <Text type="secondary">Item {currentIndex + 1} of {items.length}</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Text strong style={{ color: '#1890ff', fontSize: '18px' }}>{progressPercent}%</Text>
                </div>
            </div>

            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 4, marginBottom: 24, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#1890ff', width: `${progressPercent}%`, transition: 'width 0.3s' }} />
            </div>

            <Card
                title={
                    <div>
                        <div style={{ fontSize: '20px', whiteSpace: 'normal', lineHeight: '1.4', paddingTop: '10px' }}>{currentItem.name}</div>
                        {currentItem.pku && (
                            <div style={{
                                display: 'inline-block',
                                background: '#ffe58f',
                                color: '#d46b08',
                                padding: '4px 12px',
                                borderRadius: 16,
                                fontWeight: 'bold',
                                border: '1px solid #ffd591',
                                marginTop: '10px',
                                fontSize: '14px',
                                marginBottom: '10px'
                            }}>
                                PKU: {currentItem.pku}
                            </div>
                        )}
                    </div>
                }
                bodyStyle={{ padding: 24 }}
            >
                <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>Short Expiry Details</Title>

                    <ShortExpTabs 
                        batches={iteratorBatches}
                        onChange={setIteratorBatches}
                        disabled={saving}
                    />
                </div>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, padding: '0 16px' }}>
                <Button
                    size="large"
                    icon={<LeftOutlined />}
                    disabled={currentIndex === 0}
                    onClick={handlePrevious}
                    loading={saving}
                >
                    Previous
                </Button>

                <Button
                    type="primary"
                    size="large"
                    onClick={handleNext}
                    loading={saving}
                >
                    {currentIndex === items.length - 1 ? 'Finish & Return' : 'Next Item'} {currentIndex === items.length - 1 ? <CheckCircleOutlined /> : <RightOutlined />}
                </Button>
            </div>
        </div>
    );
};

export default ShortExpEntry;
