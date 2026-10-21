import React from 'react';
import {
    Typography,
    Card,
    Button,
    Input,
    Spin,
    Select,
    Space,
    List,
    Tag
} from 'antd';
import { LeftOutlined, RightOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getUnitColor } from '../../lib/colorMappings';
import ShortExpModal from '../../components/ShortExpModal';
import ShortExpTabs from '../../components/ShortExpTabs';

const { Title, Text } = Typography;
const { Option } = Select;

const ShortExpEntryDesktopView = ({
    unit,
    raks,
    loadingRaks,
    selectedRak,
    setSelectedRak,
    isStarted,
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
    handlePrevious
}) => {
    if (!isStarted) {
        return (
            <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
                <Title level={3}>
                    Start Expiry Check
                    <Tag
                        color={getUnitColor(unit)}
                        style={{ marginLeft: 8, verticalAlign: 'middle', fontWeight: 600 }}
                    >
                        {unit}
                    </Tag>
                </Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                    Select a shelf from {unit} to check each medication expiry date sequentially.
                </Text>

                <Card>
                    {loadingRaks ? (
                        <Spin />
                    ) : (
                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            <Select
                                style={{ width: '100%' }}
                                size="large"
                                placeholder="Select a Rak"
                                value={selectedRak}
                                onChange={setSelectedRak}
                            >
                                {raks.map(r => (
                                    <Option key={r} value={r}>
                                        {r}
                                    </Option>
                                ))}
                            </Select>
                            <Button type="primary" size="large" block onClick={handleStart}>
                                Start Expiry Check
                            </Button>
                        </Space>
                    )}
                </Card>

                <Card
                    title="Search & Edit Specific Drug"
                    style={{ marginTop: 24, textAlign: 'left' }}
                >
                    <Input.Search
                        placeholder="Search drug name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
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
                            renderItem={item => (
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
        return (
            <div style={{ textAlign: 'center', padding: 50 }}>
                <Spin size="large" tip="Loading Items..." />
            </div>
        );
    }

    if (items.length === 0) return null;

    const currentItem = items[currentIndex];
    const progressPercent = Math.round(((currentIndex + 1) / items.length) * 100);

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16
                }}
            >
                <div>
                    <Title level={4} style={{ margin: 0 }}>
                        Start Expiry Check for Shelf: {selectedRak}
                    </Title>
                    <Text type="secondary">
                        Item {currentIndex + 1} of {items.length}
                    </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Text strong style={{ color: '#1890ff', fontSize: '18px' }}>
                        {progressPercent}%
                    </Text>
                </div>
            </div>

            <div
                style={{
                    height: 6,
                    background: '#f0f0f0',
                    borderRadius: 4,
                    marginBottom: 24,
                    overflow: 'hidden'
                }}
            >
                <div
                    style={{
                        height: '100%',
                        background: '#1890ff',
                        width: `${progressPercent}%`,
                        transition: 'width 0.3s'
                    }}
                />
            </div>

            <Card
                title={
                    <div>
                        <div
                            style={{
                                fontSize: '20px',
                                whiteSpace: 'normal',
                                lineHeight: '1.4',
                                paddingTop: '10px'
                            }}
                        >
                            {currentItem.name}
                        </div>
                        {currentItem.pku && (
                            <div
                                style={{
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
                                }}
                            >
                                {currentItem.pku}
                            </div>
                        )}
                    </div>
                }
                bodyStyle={{ padding: 24 }}
            >
                <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>
                        Short Expiry Details
                    </Title>

                    <ShortExpTabs
                        batches={iteratorBatches}
                        onChange={setIteratorBatches}
                        disabled={saving}
                    />
                </div>
            </Card>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 24,
                    padding: '0 16px'
                }}
            >
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
                    {currentIndex === items.length - 1 ? 'Finish & Return' : 'Next Item'}{' '}
                    {currentIndex === items.length - 1 ? (
                        <CheckCircleOutlined />
                    ) : (
                        <RightOutlined />
                    )}
                </Button>
            </div>
        </div>
    );
};

export default ShortExpEntryDesktopView;
