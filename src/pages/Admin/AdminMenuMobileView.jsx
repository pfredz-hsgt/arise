import React, { useState, useEffect, useMemo } from 'react';
import {
    NavBar,
    CapsuleTabs,
    Button,
    SearchBar,
    Popup,
    Dialog,
    SafeArea,
    SpinLoading,
    ConfigProvider
} from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';
import {
    LeftOutlined,
    DownloadOutlined,
    UserOutlined,
    DatabaseOutlined,
    HistoryOutlined,
    ApartmentOutlined,
    TagOutlined,
    PlusOutlined,
    DeleteOutlined,
    EditOutlined,
    MoreOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    RightOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import {
    Modal,
    Form,
    Input,
    Select,
    Switch,
    Tag,
    Collapse,
    Row,
    Col,
    ColorPicker,
    message,
    Popconfirm,
    Dropdown
} from 'antd';
import { api } from '../../lib/api';
import InventoryTable from './InventoryTable';

const { Option } = Select;

// Mobile User Management Component
const MobileUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();

    const fetchUnits = async () => {
        try {
            const data = await api.get('/lookups/units');
            setUnits(data || []);
        } catch (error) {
            console.error('Failed to fetch units:', error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await api.get('/auth/users');
            setUsers(data || []);
        } catch (error) {
            console.error(error);
            message.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchUnits();
    }, []);

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        const q = searchQuery.toLowerCase();
        return users.filter(
            u =>
                u.name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.main_unit?.toLowerCase().includes(q)
        );
    }, [users, searchQuery]);

    const handleCreateUser = async (values) => {
        setSubmitting(true);
        try {
            const registerRes = await api.post('/auth/register', {
                email: values.email,
                password: 'F@rmasi.1234',
                name: values.name,
                role: values.role,
                main_unit: values.main_unit || 'OPD',
                phis_username: values.phis_username,
                phis_password: values.phis_password
            });

            if (registerRes && registerRes.user && registerRes.user.id) {
                await api.post(`/auth/users/${registerRes.user.id}/reset-password`);
            }

            message.success('User created successfully');
            setIsCreateModalOpen(false);
            createForm.resetFields();
            fetchUsers();
        } catch (error) {
            console.error(error);
            message.error(error.message || 'Failed to create user');
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
                main_unit: values.main_unit || 'OPD',
                phis_username: values.phis_username,
                phis_password: values.phis_password,
                is_active: values.is_active
            });

            message.success('User updated successfully');
            setIsEditModalOpen(false);
            setEditingUser(null);
            editForm.resetFields();
            fetchUsers();
        } catch (error) {
            console.error(error);
            message.error(error.message || 'Failed to update user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async (user) => {
        try {
            await api.delete(`/auth/users/${user.id}`);
            message.success('User removed');
            setIsEditModalOpen(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            message.error('Failed to delete user');
        }
    };

    const handleResetPassword = async (user) => {
        try {
            await api.post(`/auth/users/${user.id}/reset-password`);
            message.success('Password reset to F@rmasi.1234');
        } catch (error) {
            message.error('Failed to reset password');
        }
    };

    const openEdit = (user) => {
        setEditingUser(user);
        editForm.setFieldsValue({
            name: user.name,
            email: user.email,
            role: user.role,
            main_unit: user.main_unit || 'OPD',
            phis_username: user.phis_username,
            phis_password: user.phis_password,
            is_active: user.is_active !== false
        });
        setIsEditModalOpen(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Top Bar: Search and New User */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    <SearchBar
                        placeholder="Search name, email, unit..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onClear={() => setSearchQuery('')}
                        style={{
                            '--background': '#ffffff',
                            '--height': '36px',
                            '--border-radius': '18px',
                            fontSize: 13
                        }}
                    />
                </div>
                <Button
                    size="small"
                    shape="rounded"
                    color="primary"
                    onClick={() => {
                        createForm.resetFields();
                        setIsCreateModalOpen(true);
                    }}
                    style={{
                        fontWeight: 600,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 12px'
                    }}
                >
                    <PlusOutlined /> New User
                </Button>
            </div>

            {/* Users List */}
            {loading ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <SpinLoading color="primary" />
                    <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>Loading users...</div>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div
                    style={{
                        padding: '36px 16px',
                        textAlign: 'center',
                        background: '#ffffff',
                        borderRadius: 12,
                        border: '1px dashed #cbd5e1',
                        color: '#64748b'
                    }}
                >
                    No users matching criteria
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filteredUsers.map(u => {
                        const unitObj = units.find(unit => unit.name === u.main_unit);
                        const isActive = u.is_active !== false;

                        return (
                            <div
                                key={u.id}
                                onClick={() => openEdit(u)}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: 12,
                                    border: '1px solid #e2e8f0',
                                    padding: '12px 14px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                                }}
                            >
                                <div style={{ flex: 1, paddingRight: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                                            {u.name}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                padding: '1px 6px',
                                                borderRadius: 10,
                                                background: u.role === 'Issuer' ? '#dbeafe' : '#f0fdf4',
                                                color: u.role === 'Issuer' ? '#1d4ed8' : '#15803d'
                                            }}
                                        >
                                            {u.role}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                                        {u.email}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                padding: '2px 6px',
                                                borderRadius: 6,
                                                background: '#f1f5f9',
                                                color: unitObj?.color || '#334155'
                                            }}
                                        >
                                            Unit: {u.main_unit || 'OPD'}
                                        </span>

                                        <span
                                            style={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                padding: '2px 6px',
                                                borderRadius: 6,
                                                background: isActive ? '#dcfce7' : '#fee2e2',
                                                color: isActive ? '#15803d' : '#dc2626'
                                            }}
                                        >
                                            {isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <RightOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create User Modal */}
            <Modal
                title="Create New User"
                open={isCreateModalOpen}
                onCancel={() => {
                    setIsCreateModalOpen(false);
                    createForm.resetFields();
                }}
                footer={null}
                width="92%"
                style={{ maxWidth: 440 }}
            >
                <Form
                    layout="vertical"
                    form={createForm}
                    onFinish={handleCreateUser}
                    initialValues={{ role: 'Indenter', main_unit: 'OPD' }}
                >
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                                <Select>
                                    <Option value="Indenter">Indenter</Option>
                                    <Option value="Issuer">Issuer (Admin)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="main_unit"
                                label="Main Unit"
                                rules={[{ required: true, message: 'Select unit' }]}
                            >
                                <Select placeholder="Select unit">
                                    {units.map(u => (
                                        <Option key={u.name} value={u.name}>
                                            <Tag color={u.color}>{u.name}</Tag>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Collapse ghost style={{ marginBottom: 16 }}>
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
                        <Button
                            color="primary"
                            type="submit"
                            loading={submitting}
                            block
                            shape="rounded"
                        >
                            Create User
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Edit User Modal */}
            <Modal
                title="Edit User"
                open={isEditModalOpen}
                onCancel={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                    editForm.resetFields();
                }}
                footer={null}
                width="92%"
                style={{ maxWidth: 440 }}
            >
                <Form layout="vertical" form={editForm} onFinish={handleUpdateUser}>
                    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                                <Select>
                                    <Option value="Indenter">Indenter</Option>
                                    <Option value="Issuer">Issuer (Admin)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="main_unit"
                                label="Main Unit"
                                rules={[{ required: true, message: 'Select unit' }]}
                            >
                                <Select placeholder="Select unit">
                                    {units.map(u => (
                                        <Option key={u.name} value={u.name}>
                                            <Tag color={u.color}>{u.name}</Tag>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="is_active" label="Active Status" valuePropName="checked">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>

                    <Collapse ghost style={{ marginBottom: 16 }}>
                        <Collapse.Panel header="PHIS Credentials (Optional)" key="1">
                            <Form.Item name="phis_username" label="PHIS Username">
                                <Input autoComplete="off" />
                            </Form.Item>
                            <Form.Item name="phis_password" label="PHIS Password">
                                <Input.Password autoComplete="off" />
                            </Form.Item>
                        </Collapse.Panel>
                    </Collapse>

                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <Button
                            color="primary"
                            type="submit"
                            loading={submitting}
                            shape="rounded"
                            style={{ flex: 1 }}
                        >
                            Update User
                        </Button>
                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: 'reset',
                                        label: (
                                            <Popconfirm
                                                title="Reset password to F@rmasi.1234?"
                                                onConfirm={() => handleResetPassword(editingUser)}
                                            >
                                                <span style={{ display: 'block', width: '100%' }}>
                                                    Reset Password
                                                </span>
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
                                                <span style={{ display: 'block', width: '100%' }}>
                                                    Delete User
                                                </span>
                                            </Popconfirm>
                                        ),
                                    },
                                ]
                            }}
                            trigger={['click']}
                            placement="bottomRight"
                        >
                            <Button shape="rounded">
                                <MoreOutlined />
                            </Button>
                        </Dropdown>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

// Mobile Audit Logs Component
const MobileAuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await api.get('/audit');
            setLogs(data || []);
        } catch (error) {
            console.error(error);
            message.error('Failed to fetch audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = useMemo(() => {
        if (!searchText) return logs;
        const q = searchText.toLowerCase();
        return logs.filter(log => {
            const userStr = (log.user_name || log.user_email || '').toLowerCase();
            const actionStr = (log.action || '').toLowerCase();
            let detailsStr = '';
            if (log.details) {
                if (log.details.message) detailsStr = log.details.message;
                else if (log.details.reason) detailsStr = log.details.reason;
                else detailsStr = JSON.stringify(log.details);
            }
            return (
                userStr.includes(q) ||
                actionStr.includes(q) ||
                detailsStr.toLowerCase().includes(q)
            );
        });
    }, [logs, searchText]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Search and Refresh */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    <SearchBar
                        placeholder="Search logs by user, action, detail..."
                        value={searchText}
                        onChange={setSearchText}
                        onClear={() => setSearchText('')}
                        style={{
                            '--background': '#ffffff',
                            '--height': '36px',
                            '--border-radius': '18px',
                            fontSize: 13
                        }}
                    />
                </div>
                <Button
                    size="small"
                    shape="rounded"
                    onClick={fetchLogs}
                    loading={loading}
                    style={{ fontSize: 12, padding: '6px 10px' }}
                >
                    <ReloadOutlined />
                </Button>
            </div>

            {loading ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                    <SpinLoading color="primary" />
                    <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>Loading logs...</div>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div
                    style={{
                        padding: '36px 16px',
                        textAlign: 'center',
                        background: '#ffffff',
                        borderRadius: 12,
                        border: '1px dashed #cbd5e1',
                        color: '#64748b'
                    }}
                >
                    No audit logs found
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filteredLogs.slice(0, 50).map((log, index) => {
                        const date = new Date(log.created_at);
                        const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                        let actionBg = '#e0f2fe';
                        let actionColor = '#0369a1';
                        if (log.action === 'LOGIN_SUCCESS') {
                            actionBg = '#dcfce7';
                            actionColor = '#15803d';
                        } else if (log.action === 'LOGIN_FAILED') {
                            actionBg = '#fee2e2';
                            actionColor = '#dc2626';
                        } else if (log.action === 'INVENTORY_UPDATE') {
                            actionBg = '#fef3c7';
                            actionColor = '#b45309';
                        }

                        let detailText = '-';
                        if (log.details) {
                            if (log.details.message) detailText = log.details.message;
                            else if (log.details.reason) {
                                detailText = `${log.details.email ? `${log.details.email} - ` : ''}${log.details.reason}`;
                            } else detailText = JSON.stringify(log.details);
                        }

                        return (
                            <div
                                key={log.id || index}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: 12,
                                    border: '1px solid #e2e8f0',
                                    padding: '10px 12px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <span
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            padding: '1px 6px',
                                            borderRadius: 6,
                                            background: actionBg,
                                            color: actionColor
                                        }}
                                    >
                                        {log.action}
                                    </span>
                                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                        {dateStr}
                                    </span>
                                </div>

                                <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 3 }}>
                                    {log.user_name || log.user_email || 'System / Unknown'}
                                </div>

                                <div style={{ fontSize: 11, color: '#64748b', wordBreak: 'break-word', background: '#f8fafc', padding: '6px 8px', borderRadius: 6 }}>
                                    {detailText}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// Mobile System Values Tab
const MobileSystemValues = () => {
    const [activeSection, setActiveSection] = useState('units');
    const [units, setUnits] = useState([]);
    const [sources, setSources] = useState([]);
    const [types, setTypes] = useState([]);
    const [purchaseTypes, setPurchaseTypes] = useState([]);
    const [stdKts, setStdKts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form] = Form.useForm();
    const colorValue = Form.useWatch('color', form);
    const [submitting, setSubmitting] = useState(false);

    const presetColors = [
        'blue', 'purple', 'cyan', 'green', 'magenta', 'pink',
        'red', 'orange', 'yellow', 'volcano', 'geekblue', 'lime', 'gold'
    ];

    const fetchValues = async () => {
        setLoading(true);
        try {
            const [unitsData, sourcesData, typesData, pTypesData, stdKtsData] = await Promise.all([
                api.get('/lookups/units'),
                api.get('/lookups/sources'),
                api.get('/lookups/types'),
                api.get('/lookups/purchasetypes'),
                api.get('/lookups/stdkts')
            ]);
            setUnits(unitsData || []);
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

    useEffect(() => {
        fetchValues();
    }, []);

    const sectionConfig = {
        units: { title: 'Main Units', endpoint: '/lookups/units', data: units },
        sources: { title: 'Indent Sources', endpoint: '/lookups/sources', data: sources },
        types: { title: 'Item Types', endpoint: '/lookups/types', data: types },
        purchasetypes: { title: 'Purchase Types', endpoint: '/lookups/purchasetypes', data: purchaseTypes },
        stdkts: { title: 'STD / KT', endpoint: '/lookups/stdkts', data: stdKts }
    };

    const currentSection = sectionConfig[activeSection] || sectionConfig.units;

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            let finalColor = values.color;
            if (values.color === 'custom') {
                finalColor =
                    typeof values.customColor === 'string'
                        ? values.customColor
                        : values.customColor?.toHexString();
            }

            if (editingItem) {
                await api.put(`${currentSection.endpoint}/${encodeURIComponent(editingItem.name)}`, {
                    name: values.name.trim(),
                    color: finalColor
                });
                message.success(`${currentSection.title} updated`);
            } else {
                await api.post(currentSection.endpoint, {
                    name: values.name.trim(),
                    color: finalColor
                });
                message.success(`${currentSection.title} added`);
            }

            setIsAddModalOpen(false);
            setEditingItem(null);
            form.resetFields();
            fetchValues();
        } catch (error) {
            message.error(error.response?.data?.error || `Failed to save ${currentSection.title}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (name) => {
        try {
            await api.delete(`${currentSection.endpoint}/${encodeURIComponent(name)}`);
            message.success(`${currentSection.title} deleted`);
            fetchValues();
        } catch (error) {
            message.error('Failed to delete. It may be in use.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Horizontal Sub-sections */}
            <div
                style={{
                    display: 'flex',
                    gap: 6,
                    overflowX: 'auto',
                    paddingBottom: 4,
                    whiteSpace: 'nowrap'
                }}
            >
                {Object.entries(sectionConfig).map(([key, val]) => (
                    <div
                        key={key}
                        onClick={() => setActiveSection(key)}
                        style={{
                            padding: '5px 12px',
                            borderRadius: 16,
                            fontSize: 12,
                            fontWeight: 600,
                            background: activeSection === key ? '#1e293b' : '#ffffff',
                            color: activeSection === key ? '#ffffff' : '#64748b',
                            border: activeSection === key ? '1px solid #1e293b' : '1px solid #e2e8f0',
                            cursor: 'pointer',
                            flexShrink: 0
                        }}
                    >
                        {val.title} ({val.data?.length || 0})
                    </div>
                ))}
            </div>

            {/* List and Add Button */}
            <div
                style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    padding: 12,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        {currentSection.title}
                    </div>
                    <Button
                        size="mini"
                        shape="rounded"
                        color="primary"
                        onClick={() => {
                            setEditingItem(null);
                            form.resetFields();
                            setIsAddModalOpen(true);
                        }}
                        style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px' }}
                    >
                        <PlusOutlined /> Add
                    </Button>
                </div>

                {loading ? (
                    <div style={{ padding: '24px 0', textAlign: 'center' }}>
                        <SpinLoading color="primary" />
                    </div>
                ) : currentSection.data?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 12 }}>
                        No items configured yet
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {currentSection.data.map(item => (
                            <div
                                key={item.name}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 10px',
                                    background: '#f8fafc',
                                    borderRadius: 8,
                                    border: '1px solid #f1f5f9'
                                }}
                            >
                                <div
                                    onClick={() => {
                                        setEditingItem(item);
                                        const isPreset = presetColors.includes(item.color);
                                        form.setFieldsValue({
                                            name: item.name,
                                            color: !item.color || isPreset ? item.color : 'custom',
                                            customColor: !item.color || isPreset ? undefined : item.color
                                        });
                                        setIsAddModalOpen(true);
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}
                                >
                                    <span
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            background: item.color || '#94a3b8'
                                        }}
                                    />
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                                        {item.name}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Popconfirm
                                        title="Delete this item?"
                                        onConfirm={() => handleDelete(item.name)}
                                    >
                                        <DeleteOutlined style={{ color: '#ef4444', fontSize: 14, cursor: 'pointer' }} />
                                    </Popconfirm>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add / Edit Value Modal */}
            <Modal
                title={editingItem ? `Edit ${currentSection.title}` : `Add ${currentSection.title}`}
                open={isAddModalOpen}
                onCancel={() => {
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                    form.resetFields();
                }}
                footer={null}
                width="92%"
                style={{ maxWidth: 400 }}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true, message: 'Please enter a name' }]}
                    >
                        <Input placeholder="Enter name" />
                    </Form.Item>
                    <Form.Item name="color" label="Color (Optional)" extra="Leave blank for random color">
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
                        <Form.Item
                            name="customColor"
                            label="Custom Color"
                            rules={[{ required: true, message: 'Please select a custom color' }]}
                        >
                            <ColorPicker disabledAlpha />
                        </Form.Item>
                    )}
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button color="primary" type="submit" loading={submitting} block shape="rounded">
                            Submit
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

const AdminMenuMobileView = ({
    activeTab,
    setActiveTab,
    exporting,
    handleExport,
    navigate
}) => {
    // Map between desktop keys ('1','2','3','4','5') and mobile tab keys
    const currentTabKey = activeTab || '1';

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
                {/* Sticky Header */}
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
                        onBack={() => navigate('/home')}
                        right={
                            <Button
                                size="mini"
                                shape="rounded"
                                color="primary"
                                onClick={handleExport}
                                loading={exporting}
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '4px 10px'
                                }}
                            >
                                <DownloadOutlined /> Export
                            </Button>
                        }
                    >
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                            Admin Panel
                        </span>
                    </NavBar>

                    {/* Capsule Tabs for Touch Navigation */}
                    <div style={{ padding: '8px 12px', background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                        <CapsuleTabs activeKey={currentTabKey} onChange={setActiveTab}>
                            <CapsuleTabs.Tab title="Users" key="1" />
                            <CapsuleTabs.Tab title="Inventory" key="2" />
                            <CapsuleTabs.Tab title="Audit" key="3" />
                            <CapsuleTabs.Tab title="Schema" key="4" />
                            <CapsuleTabs.Tab title="Values" key="5" />
                        </CapsuleTabs>
                    </div>
                </div>

                {/* Main Content Area */}
                <div style={{ padding: '12px', flex: 1 }}>
                    {currentTabKey === '1' && <MobileUserManagement />}
                    {currentTabKey === '2' && <InventoryTable />}
                    {currentTabKey === '3' && <MobileAuditLogs />}
                    {currentTabKey === '4' && (
                        <div
                            style={{
                                background: '#ffffff',
                                borderRadius: 12,
                                border: '1px solid #e2e8f0',
                                overflow: 'hidden',
                                height: '70vh'
                            }}
                        >
                            <iframe
                                title="DB Schema Viewer"
                                width="100%"
                                height="100%"
                                style={{ border: 'none' }}
                                src="https://dbdiagram.io/e/6a6ff064067336e1de471d20/6a6ff616c3a90dd98d0991c9"
                            />
                        </div>
                    )}
                    {currentTabKey === '5' && <MobileSystemValues />}
                </div>
            </div>
        </ConfigProvider>
    );
};

export default AdminMenuMobileView;
