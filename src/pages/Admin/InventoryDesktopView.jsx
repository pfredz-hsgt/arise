import React, { useEffect } from 'react';
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
} from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const InventoryDesktopView = ({
    loading,
    modalVisible,
    setModalVisible,
    editingDrug,
    searchQuery,
    setSearchQuery,
    mainUnits,
    indentSources,
    itemTypes,
    purchaseTypes,
    stdKts,
    form,
    handleAdd,
    handleEdit,
    handleDelete,
    handleSubmit,
    filteredDrugs,
}) => {
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
            width: 200,
        },
        {
            title: 'Main Unit',
            dataIndex: 'main_unit',
            key: 'main_unit',
            filters: mainUnits.map(u => ({ text: u.name, value: u.name })),
            onFilter: (value, record) => record.main_unit === value,
            render: (unit) => {
                const uObj = mainUnits.find(u => u.name === unit);
                return <Tag color={uObj?.color || 'blue'}>{unit || 'OPD'}</Tag>;
            },
            width: 100,
        },
        {
            title: 'Item Code',
            dataIndex: 'item_code',
            key: 'item_code',
            width: 100,
        },
        {
            title: 'PKU',
            dataIndex: 'pku',
            key: 'pku',
            width: 100,
        },
        {
            title: 'SKU Conversion',
            dataIndex: 'convert_sku',
            key: 'convert_sku',
            width: 100,
        },
        {
            title: 'Purchase Type',
            dataIndex: 'puchase_type',
            key: 'puchase_type',
            filters: purchaseTypes.map(p => ({ text: p.name, value: p.name })),
            onFilter: (value, record) => record.puchase_type === value,
            width: 110,
        },
        {
            title: 'STD/KT',
            dataIndex: 'std_kt',
            key: 'std_kt',
            filters: stdKts.map(s => ({ text: s.name, value: s.name })),
            onFilter: (value, record) => record.std_kt === value,
            width: 80,
        },
        {
            title: 'Row',
            dataIndex: 'row',
            key: 'row',
            filters: [
                { text: 'A', value: 'A' },
                { text: 'B', value: 'B' },
                { text: 'C', value: 'C' },
                { text: 'D', value: 'D' },
                { text: 'E', value: 'E' },
                { text: 'F', value: 'F' },
                { text: 'G', value: 'G' },
                { text: 'H', value: 'H' },
                { text: 'I', value: 'I' },
                { text: 'J', value: 'J' },
            ],
            onFilter: (value, record) => record.row === value,
            width: 70,
        },
        {
            title: 'Tingkat',
            dataIndex: 'tingkat',
            key: 'tingkat',
            sorter: (a, b) => (a.tingkat || 0) - (b.tingkat || 0),
            width: 80,
            align: 'center',
            render: (val) => val ?? '-'
        },
        {
            title: 'Petak',
            dataIndex: 'petak',
            key: 'petak',
            width: 80,
            align: 'center',
            render: (val) => val || '-'
        },
        {
            title: 'Max Qty',
            dataIndex: 'max_qty',
            key: 'max_qty',
            width: 80,
        },
        {
            title: 'Balance',
            dataIndex: 'balance',
            key: 'balance',
            width: 80,
        },
        {
            title: 'Source',
            dataIndex: 'indent_source',
            key: 'indent_source',
            filters: indentSources.map(s => ({ text: s.name, value: s.name })),
            onFilter: (value, record) => record.indent_source === value,
            width: 120,
        },
        {
            title: 'Remarks',
            dataIndex: 'remarks',
            key: 'remarks',
            ellipsis: true,
            width: 200,
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            filters: itemTypes.map(t => ({ text: t.name, value: t.name })),
            onFilter: (value, record) => record.type === value,
            width: 120,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 80,
            align: 'center',
            render: (_, record) => (
                <Popconfirm
                    title="Delete this drug?"
                    onConfirm={(e) => {
                        e.stopPropagation();
                        handleDelete(record.id);
                    }}
                    okText="Yes"
                    cancelText="No"
                    onCancel={(e) => e.stopPropagation()}
                >
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                    />
                </Popconfirm>
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
        <div>
            <div style={{ marginBottom: 16, display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Input
                    placeholder="Search by name, item code, PKU, row, or remarks..."
                    prefix={<SearchOutlined />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: '1 1 300px', maxWidth: '500px' }}
                    allowClear
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                >
                    New Drug
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={filteredDrugs}
                showSorterTooltip={false}
                rowKey="id"
                loading={loading}
                scroll={{ x: 1400 }}
                onRow={(record) => ({
                    onClick: () => handleEdit(record),
                    style: { cursor: 'pointer' },
                })}
                pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`,
                }}
            />

            <Modal
                title={editingDrug ? 'Edit Drug' : 'Add New Drug'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={() => form.submit()}
                width={650}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="name"
                        label="Drug Name"
                        rules={[{ required: true, message: 'Please enter drug name' }]}
                    >
                        <Input placeholder="e.g., Paracetamol 500mg" />
                    </Form.Item>

                    <Space style={{ width: '100%' }} size="large">
                        <Form.Item
                            name="main_unit"
                            label="Main Unit"
                            rules={[{ required: true, message: 'Please select main unit' }]}
                        >
                            <Select placeholder="Select unit" style={{ width: 130 }}>
                                {mainUnits.map(u => (
                                    <Select.Option key={u.name} value={u.name}>
                                        <Tag color={u.color}>{u.name}</Tag>
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="item_code"
                            label="Item Code"
                        >
                            <Input placeholder="e.g., ITEM001" style={{ width: 130 }} />
                        </Form.Item>

                        <Form.Item
                            name="pku"
                            label="PKU"
                        >
                            <Input placeholder="e.g., PKU001" style={{ width: 130 }} />
                        </Form.Item>

                        <Form.Item
                            name="convert_sku"
                            label="Convert SKU"
                            initialValue={1}
                        >
                            <InputNumber placeholder="1" style={{ width: 90 }} min={1} inputMode="numeric" />
                        </Form.Item>
                    </Space>

                    <Space style={{ width: '100%' }} size="large">
                        <Form.Item
                            name="puchase_type"
                            label="Purchase Type"
                        >
                            <Select placeholder="Select type" style={{ width: 150 }}>
                                {purchaseTypes.map(p => (
                                    <Select.Option key={p.name} value={p.name}>{p.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="std_kt"
                            label="STD/KT"
                        >
                            <Select placeholder="Select" style={{ width: 150 }}>
                                {stdKts.map(s => (
                                    <Select.Option key={s.name} value={s.name}>{s.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Space>

                    <Space style={{ width: '100%' }} size="large">
                        <Form.Item
                            name="row"
                            label="Row"
                        >
                            <Input placeholder="e.g., A" style={{ width: 80 }} />
                        </Form.Item>

                        <Form.Item
                            name="tingkat"
                            label="Tingkat"
                        >
                            <InputNumber placeholder="1" style={{ width: 80 }} min={0} inputMode="numeric" />
                        </Form.Item>

                        <Form.Item
                            name="petak"
                            label="Petak"
                        >
                            <Input placeholder="e.g., 2" style={{ width: 80 }} />
                        </Form.Item>

                        <Form.Item name="max_qty" label="Max Quantity">
                            <InputNumber placeholder="Max Qty" style={{ width: 110 }} min={0} inputMode="numeric" />
                        </Form.Item>

                        <Form.Item name="balance" label="Balance">
                            <InputNumber placeholder="Balance" style={{ width: 110 }} min={0} inputMode="numeric" />
                        </Form.Item>
                    </Space>

                    <Space style={{ width: '100%' }} size="large">
                        <Form.Item name="indent_source" label="Indent Source" style={{ flex: 1 }}>
                            <Select placeholder="Select source">
                                {indentSources.map(s => (
                                    <Select.Option key={s.name} value={s.name}>{s.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="type" label="Item Type" style={{ flex: 1 }}>
                            <Select placeholder="Select type">
                                {itemTypes.map(t => (
                                    <Select.Option key={t.name} value={t.name}>{t.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Space>

                    <Form.Item name="remarks" label="Remarks">
                        <TextArea
                            rows={3}
                            placeholder="Any special notes or instructions..."
                        />
                    </Form.Item>

                    <Form.Item name="image_url" label="Image URL">
                        <Input placeholder="https://..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default InventoryDesktopView;
