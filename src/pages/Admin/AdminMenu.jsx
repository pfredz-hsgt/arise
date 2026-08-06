import React, { useState, useEffect } from 'react';
import { Typography, Tabs, Table, Button, Modal, Form, Input, Select, message, Popconfirm, Card, Spin, Space, Switch, Tag, Collapse, Dropdown, List, Row, Col, ColorPicker } from 'antd';
import { UserOutlined, DatabaseOutlined, PlusOutlined, DeleteOutlined, EditOutlined, DownloadOutlined, ApartmentOutlined, MoreOutlined, HistoryOutlined, TagOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { api } from '../../lib/api';
import InventoryTable from './InventoryTable';

const { Title } = Typography;
const { Option } = Select;

const AdminMenuPage = () => {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        try {
            setExporting(true);
            message.loading({ content: 'Exporting data...', key: 'export' });

            // Fetch Inventory
            const inventoryData = await api.get('/inventory');

            // Fetch Indents with related item name
            const indentData = await api.get('/indents');

            // Create Workbook
            const wb = XLSX.utils.book_new();

            // Add Inventory Sheet
            if (inventoryData && inventoryData.length > 0) {
                const wsInventory = XLSX.utils.json_to_sheet(inventoryData);
                XLSX.utils.book_append_sheet(wb, wsInventory, "Inventory");
            }

            // Add Indents Sheet
            if (indentData && indentData.length > 0) {
                // Flatten the data for better Excel display
                const flatIndentData = indentData.map(item => ({
                    ...item,
                    drug_name: item.inventory_items?.name || 'Unknown',
                    inventory_items: undefined // Remove the nested object
                }));
                const wsIndents = XLSX.utils.json_to_sheet(flatIndentData);
                XLSX.utils.book_append_sheet(wb, wsIndents, "Indents");
            }

            // Write File
            XLSX.writeFile(wb, `ARISE_Data_${new Date().toISOString().split('T')[0]}.xlsx`);

            message.success({ content: 'Data exported successfully!', key: 'export' });
        } catch (error) {
            console.error('Export error:', error);
            message.error({ content: 'Failed to export data', key: 'export' });
        } finally {
            setExporting(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>Admin Panel</Title>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExport}
                    loading={exporting}
                >
                    Export
                </Button>
            </div>
            <Tabs defaultActiveKey="1">
                <Tabs.TabPane tab={<span><UserOutlined /> User Management</span>} key="1">
                    <UserManagement />
                </Tabs.TabPane>
                <Tabs.TabPane tab={<span><DatabaseOutlined /> Inventory Settings</span>} key="2">
                    <InventoryTable />
                </Tabs.TabPane>
                <Tabs.TabPane tab={<span><HistoryOutlined /> Audit Logs</span>} key="3">
                    <AuditLogsViewer />
                </Tabs.TabPane>
                <Tabs.TabPane tab={<span><ApartmentOutlined /> View DB Schema</span>} key="4">
                    <DBViewer />
                </Tabs.TabPane>
                <Tabs.TabPane tab={<span><TagOutlined /> System Values</span>} key="5">
                    <SystemValuesTab />
                </Tabs.TabPane>
            </Tabs>
        </div>
    );
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();
    const [editingUser, setEditingUser] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await api.get('/auth/users');
            setUsers(data || []);
        } catch (error) {
            console.error(error);
            message.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (values) => {
        setSubmitting(true);
        try {
            const registerRes = await api.post('/auth/register', {
                email: values.email,
                password: 'F@rmasi.1234',
                name: values.name,
                role: values.role,
                phis_username: values.phis_username,
                phis_password: values.phis_password
            });

            if (registerRes && registerRes.user && registerRes.user.id) {
                await api.post(`/auth/users/${registerRes.user.id}/reset-password`);
            }

            message.success("User created successfully");
            setIsModalVisible(false);
            form.resetFields();
            fetchUsers();

        } catch (error) {
            console.error(error);
            message.error(error.message || "Failed to create user");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateUser = async (values) => {
        setSubmitting(true);
        try {
            await api.put(`/auth/users/${editingUser.id}`, {
                name: values.name,
                email: values.email,
                role: values.role,
                phis_username: values.phis_username,
                phis_password: values.phis_password,
                is_active: values.is_active
            });

            message.success("User updated successfully");
            setIsEditModalVisible(false);
            setEditingUser(null);
            editForm.resetFields();
            fetchUsers();
        } catch (error) {
            console.error(error);
            message.error(error.message || "Failed to update user");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async (user) => {
        try {
            await api.delete(`/auth/users/${user.id}`);
            message.success("User removed");
            setIsEditModalVisible(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            message.error("Failed to delete user");
        }
    };

    const handleResetPassword = async (user) => {
        try {
            await api.post(`/auth/users/${user.id}/reset-password`);
            message.success("Password reset to F@rmasi.1234");
        } catch (error) {
            message.error("Failed to reset password");
        }
    };

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Role', dataIndex: 'role', key: 'role', render: text => <Tag color={text === 'Issuer' ? 'blue' : 'green'}>{text}</Tag> },
        { title: 'Status', dataIndex: 'is_active', key: 'is_active', render: (isActive) => <Tag color={isActive === false ? 'error' : 'success'}>{isActive === false ? 'Inactive' : 'Active'}</Tag> }
    ];

    if (loading) return <Spin />;

    return (
        <Card bodyStyle={{ padding: 0 }}>
            <div style={{ padding: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>New User</Button>
            </div>

            <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
                onRow={(record) => ({
                    onClick: () => {
                        setEditingUser(record);
                        editForm.setFieldsValue({
                            name: record.name,
                            email: record.email,
                            role: record.role,
                            phis_username: record.phis_username,
                            phis_password: record.phis_password,
                            is_active: record.is_active !== false
                        });
                        setIsEditModalVisible(true);
                    },
                    style: { cursor: 'pointer' }
                })}
            />

            <Modal
                title="Create New User"
                open={isModalVisible}
                onCancel={() => { setIsModalVisible(false); form.resetFields(); }}
                footer={null}
            >
                <Form layout="vertical" form={form} onFinish={handleCreateUser}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                        <Select>
                            <Option value="Indenter">Indenter</Option>
                            <Option value="Issuer">Issuer (Admin)</Option>
                        </Select>
                    </Form.Item>
                    <Collapse ghost style={{ marginBottom: 24 }}>
                        <Collapse.Panel header="PHIS Credentials (Optional)" key="1">
                            <Form.Item name="phis_username" label="PHIS Username">
                                <Input autoComplete="off" />
                            </Form.Item>
                            <Form.Item name="phis_password" label="PHIS Password">
                                <Input.Password autoComplete="off" />
                            </Form.Item>
                        </Collapse.Panel>
                    </Collapse>

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit" loading={submitting} block>Create User</Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Edit User"
                open={isEditModalVisible}
                onCancel={() => {
                    setIsEditModalVisible(false);
                    setEditingUser(null);
                    editForm.resetFields();
                }}
                footer={null}
            >
                <Form layout="vertical" form={editForm} onFinish={handleUpdateUser}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                        <Select>
                            <Option value="Indenter">Indenter</Option>
                            <Option value="Issuer">Issuer (Admin)</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="is_active" label="Active Status" valuePropName="checked">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>
                    <Collapse ghost style={{ marginBottom: 24 }}>
                        <Collapse.Panel header="PHIS Credentials (Optional)" key="1">
                            <Form.Item name="phis_username" label="PHIS Username">
                                <Input autoComplete="off" />
                            </Form.Item>
                            <Form.Item name="phis_password" label="PHIS Password">
                                <Input.Password autoComplete="off" />
                            </Form.Item>
                        </Collapse.Panel>
                    </Collapse>
                    <Form.Item style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Button type="primary" htmlType="submit" loading={submitting} block style={{ flex: 1 }}>
                                Update User
                            </Button>
                            <Dropdown
                                menu={{
                                    items: [
                                        {
                                            key: 'reset',
                                            label: (
                                                <Popconfirm
                                                    title="Reset password to default (F@rmasi.1234)?"
                                                    onConfirm={() => handleResetPassword(editingUser)}
                                                >
                                                    <span style={{ display: 'block', width: '100%' }}>Reset Password</span>
                                                </Popconfirm>
                                            ),
                                        },
                                        {
                                            key: 'delete',
                                            danger: true,
                                            icon: <DeleteOutlined />,
                                            label: (
                                                <Popconfirm
                                                    title="Delete user profile?"
                                                    onConfirm={() => handleDeleteUser(editingUser)}
                                                >
                                                    <span style={{ display: 'block', width: '100%' }}>Delete User</span>
                                                </Popconfirm>
                                            ),
                                        },
                                    ]
                                }}
                                trigger={['click']}
                                placement="bottomRight"
                            >
                                <Button icon={<MoreOutlined />} />
                            </Dropdown>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>

    );
};

const DBViewer = () => {
    return (
        <iframe width="100%" height="900px" src='https://dbdiagram.io/e/6a6ff064067336e1de471d20/6a6ff616c3a90dd98d0991c9'> </iframe>
    );
};

const AuditLogsViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await api.get('/audit');
            setLogs(data || []);
        } catch (error) {
            console.error(error);
            message.error("Failed to fetch audit logs");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Timestamp',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text) => new Date(text).toLocaleString()
        },
        {
            title: 'User',
            key: 'user',
            render: (_, record) => record.user_name || record.user_email || 'System / Unknown'
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: (text) => {
                let color = 'blue';
                if (text === 'LOGIN_SUCCESS') color = 'green';
                if (text === 'LOGIN_FAILED') color = 'red';
                if (text === 'INVENTORY_UPDATE') color = 'orange';
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: 'Details',
            dataIndex: 'details',
            key: 'details',
            render: (details) => {
                if (!details) return '-';
                if (details.message) return <span>{details.message}</span>;
                if (details.reason) return <span>{details.email ? `${details.email} - ` : ''}{details.reason}</span>;
                return <pre style={{ margin: 0, fontSize: '12px' }}>{JSON.stringify(details, null, 2)}</pre>;
            }
        }
    ];

    return (
        <Card bodyStyle={{ padding: 0 }}>
            <div style={{ padding: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Button icon={<HistoryOutlined />} onClick={fetchLogs} loading={loading}>Refresh</Button>
            </div>
            <Table
                columns={columns}
                dataSource={logs}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 15 }}
                scroll={{ x: 'max-content' }}
            />
        </Card>
    );
};

const LookupManager = ({ title, endpoint, data, onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const colorValue = Form.useWatch('color', form);

    const presetColors = ['blue', 'purple', 'cyan', 'green', 'magenta', 'pink', 'red', 'orange', 'yellow', 'volcano', 'geekblue', 'lime', 'gold'];

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            let finalColor = values.color;
            if (values.color === 'custom') {
                finalColor = typeof values.customColor === 'string' ? values.customColor : values.customColor?.toHexString();
            }

            if (editingItem) {
                await api.put(`${endpoint}/${encodeURIComponent(editingItem.name)}`, { name: values.name.trim(), color: finalColor });
                message.success(`${title} updated`);
            } else {
                await api.post(endpoint, { name: values.name.trim(), color: finalColor });
                message.success(`${title} added`);
            }
            setIsModalOpen(false);
            setEditingItem(null);
            form.resetFields();
            onRefresh();
        } catch (error) {
            message.error(error.response?.data?.error || `Failed to save ${title}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (name) => {
        try {
            await api.delete(`${endpoint}/${encodeURIComponent(name)}`);
            message.success(`${title} deleted`);
            onRefresh();
        } catch (error) {
            message.error('Failed to delete. It may be in use.');
        }
    };

    return (
        <Card title={title} extra={<Button type="primary" onClick={() => { setEditingItem(null); form.resetFields(); setIsModalOpen(true); }} icon={<PlusOutlined />}>Add</Button>}>
            <List
                bordered
                dataSource={data}
                renderItem={item => (
                    <List.Item
                        actions={[
                            <Popconfirm title="Delete this item?" onConfirm={(e) => { e.stopPropagation(); handleDelete(item.name); }}>
                                <Button danger type="text" icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                            </Popconfirm>
                        ]}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            setEditingItem(item);
                            const isPreset = presetColors.includes(item.color);
                            form.setFieldsValue({
                                name: item.name,
                                color: (!item.color || isPreset) ? item.color : 'custom',
                                customColor: (!item.color || isPreset) ? undefined : item.color
                            });
                            setIsModalOpen(true);
                        }}
                    >
                        <Tag color={item.color}>{item.name}</Tag>
                    </List.Item>
                )}
            />
            <Modal
                title={editingItem ? `Edit ${title}` : `Add ${title}`}
                open={isModalOpen}
                onCancel={() => { setIsModalOpen(false); setEditingItem(null); form.resetFields(); }}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter a name' }]}>
                        <Input placeholder="Enter name" />
                    </Form.Item>
                    <Form.Item name="color" label="Color (Optional)" extra="Leave blank for a random color">
                        <Select placeholder="Select a color" allowClear>
                            {presetColors.map(c => (
                                <Select.Option key={c} value={c}>
                                    <Tag color={c}>{c}</Tag>
                                </Select.Option>
                            ))}
                            <Select.Option value="custom">Custom...</Select.Option>
                        </Select>
                    </Form.Item>
                    {colorValue === 'custom' && (
                        <Form.Item name="customColor" label="Custom Color" rules={[{ required: true, message: 'Please select a custom color' }]}>
                            <ColorPicker disabledAlpha />
                        </Form.Item>
                    )}
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit" loading={submitting} block>Submit</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

const SystemValuesTab = () => {
    const [sources, setSources] = useState([]);
    const [types, setTypes] = useState([]);
    const [purchaseTypes, setPurchaseTypes] = useState([]);
    const [stdKts, setStdKts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchValues();
    }, []);

    const fetchValues = async () => {
        setLoading(true);
        try {
            const [sourcesData, typesData, pTypesData, stdKtsData] = await Promise.all([
                api.get('/lookups/sources'),
                api.get('/lookups/types'),
                api.get('/lookups/purchasetypes'),
                api.get('/lookups/stdkts')
            ]);
            setSources(sourcesData || []);
            setTypes(typesData || []);
            setPurchaseTypes(pTypesData || []);
            setStdKts(stdKtsData || []);
        } catch (error) {
            console.error('Error fetching system values:', error);
            message.error('Failed to fetch system values');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

    return (
        <Row gutter={[24, 24]} style={{ padding: '0 16px' }}>
            <Col span={12}>
                <LookupManager title="Indent Sources" endpoint="/lookups/sources" data={sources} onRefresh={fetchValues} />
            </Col>
            <Col span={12}>
                <LookupManager title="Item Types" endpoint="/lookups/types" data={types} onRefresh={fetchValues} />
            </Col>
            <Col span={12}>
                <LookupManager title="Purchase Types" endpoint="/lookups/purchasetypes" data={purchaseTypes} onRefresh={fetchValues} />
            </Col>
            <Col span={12}>
                <LookupManager title="STD/KT" endpoint="/lookups/stdkts" data={stdKts} onRefresh={fetchValues} />
            </Col>
        </Row>
    );
};

export default AdminMenuPage;
