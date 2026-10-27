import React, { useState, useEffect, useMemo } from 'react';
import {
    Typography,
    Tabs,
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    message,
    Popconfirm,
    Spin,
    Switch,
    Tag,
    Collapse,
    Dropdown,
    List,
    Row,
    Col,
    ColorPicker,
    Tooltip
} from 'antd';
import {
    ShieldCheck,
    Users,
    Database,
    History,
    Layers,
    Sliders,
    Plus,
    Download,
    Search,
    RefreshCw,
    KeyRound,
    Trash2,
    MoreVertical,
    CheckCircle2,
    XCircle,
    User,
    ExternalLink,
    Filter
} from 'lucide-react';
import { api } from '../../lib/api';
import { getUnitColor } from '../../lib/colorMappings';
import InventoryTable from './InventoryTable';

const { Option } = Select;

// Generates two-letter initials for user avatar chip
const getInitials = (name) => {
    if (!name) return 'US';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

const AdminMenuDesktopView = ({
    activeTab = '1',
    setActiveTab,
    exporting,
    handleExport
}) => {
    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Executive Admin Header */}
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
                        background: 'linear-gradient(135deg, #070d1e 0%, #1e1b4b 100%)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                        boxShadow: '0 4px 14px rgba(7, 13, 30, 0.25)'
                    }}>
                        <ShieldCheck size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <h1 style={{
                                margin: 0,
                                fontSize: '20px',
                                fontWeight: 800,
                                color: '#0f172a',
                                fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                                letterSpacing: '-0.3px'
                            }}>
                                System Administration Console
                            </h1>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: '#6366f1',
                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Issuer Access
                            </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', marginTop: 2 }}>
                            Hospital pharmacy master controls, user authentication, inventory catalogs, and audit logs.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Button
                        type="primary"
                        icon={<Download size={15} strokeWidth={2.2} />}
                        onClick={handleExport}
                        loading={exporting}
                        style={{
                            height: 40,
                            borderRadius: 9,
                            padding: '0 18px',
                            fontWeight: 600,
                            fontSize: '13px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                            border: 'none'
                        }}
                    >
                        Export Database (Excel)
                    </Button>
                </div>
            </div>

            {/* Styled Navigation Tabs */}
            <div style={{
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                padding: '8px 16px 20px',
                overflow: 'hidden'
            }}>
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    className="arise-admin-tabs"
                    items={[
                        {
                            key: '1',
                            label: (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 600, fontSize: '13px' }}>
                                    <Users size={16} /> User Management
                                </span>
                            ),
                            children: <UserManagement />
                        },
                        {
                            key: '2',
                            label: (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 600, fontSize: '13px' }}>
                                    <Database size={16} /> Inventory Catalog
                                </span>
                            ),
                            children: <InventoryTable />
                        },
                        {
                            key: '3',
                            label: (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 600, fontSize: '13px' }}>
                                    <History size={16} /> Security Audit Trail
                                </span>
                            ),
                            children: <AuditLogsViewer />
                        },
                        {
                            key: '4',
                            label: (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 600, fontSize: '13px' }}>
                                    <Layers size={16} /> Database ERD Schema
                                </span>
                            ),
                            children: <DBViewer />
                        },
                        {
                            key: '5',
                            label: (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 600, fontSize: '13px' }}>
                                    <Sliders size={16} /> Master System Values
                                </span>
                            ),
                            children: <SystemValuesTab />
                        }
                    ]}
                />
            </div>

            <style>{`
                .arise-admin-tabs .ant-tabs-nav {
                    margin-bottom: 20px !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                }
                .arise-admin-tabs .ant-tabs-tab {
                    padding: 12px 16px !important;
                    font-family: 'Plus Jakarta Sans', sans-serif !important;
                    color: #64748b !important;
                    transition: all 0.2s ease !important;
                }
                .arise-admin-tabs .ant-tabs-tab:hover {
                    color: #0284c7 !important;
                }
                .arise-admin-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #0284c7 !important;
                    font-weight: 700 !important;
                }
                .arise-admin-tabs .ant-tabs-ink-bar {
                    background: #0284c7 !important;
                    height: 3px !important;
                    border-radius: 3px !important;
                }
                .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    color: #475569 !important;
                    font-size: 11.5px !important;
                    font-weight: 700 !important;
                    letter-spacing: 0.5px !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    padding: 12px 14px !important;
                    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
                }
                .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 12px 14px !important;
                }
            `}</style>
        </div>
    );
};

// =========================================================================
// SUB-TAB 1: USER MANAGEMENT
// =========================================================================
const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editForm] = Form.useForm();
    const [editingUser, setEditingUser] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchUnits();
    }, []);

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

            message.success('User account created with initial password F@rmasi.1234');
            setIsModalVisible(false);
            form.resetFields();
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

            message.success('User details updated successfully');
            setIsEditModalVisible(false);
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
            message.success('User profile removed');
            setIsEditModalVisible(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            message.error('Failed to delete user');
        }
    };

    const handleResetPassword = async (user) => {
        try {
            await api.post(`/auth/users/${user.id}/reset-password`);
            message.success('Password successfully reset to default: F@rmasi.1234');
        } catch (error) {
            message.error('Failed to reset password');
        }
    };

    // Client-side user filtering
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchName = u.name?.toLowerCase().includes(q);
                const matchEmail = u.email?.toLowerCase().includes(q);
                if (!matchName && !matchEmail) return false;
            }
            if (selectedUnitFilter !== 'ALL' && u.main_unit !== selectedUnitFilter) {
                return false;
            }
            return true;
        });
    }, [users, searchQuery, selectedUnitFilter]);

    // User metrics
    const metrics = useMemo(() => {
        const total = users.length;
        const active = users.filter(u => u.is_active !== false).length;
        const issuers = users.filter(u => u.role === 'Issuer').length;
        const indenters = users.filter(u => u.role === 'Indenter').length;
        return { total, active, issuers, indenters };
    }, [users]);

    const columns = [
        {
            title: 'STAFF MEMBER',
            key: 'user',
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: record.role === 'Issuer'
                            ? 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)'
                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '13px',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                        flexShrink: 0
                    }}>
                        {getInitials(record.name)}
                    </div>
                    <div>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#0f172a',
                            fontFamily: "'Plus Jakarta Sans', sans-serif"
                        }}>
                            {record.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: 1 }}>
                            {record.email}
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: 'ASSIGNED UNIT',
            dataIndex: 'main_unit',
            key: 'main_unit',
            width: 160,
            render: (unitName) => {
                const unitObj = units.find(u => u.name === unitName);
                return (
                    <Tag
                        color={unitObj?.color || getUnitColor(unitName)}
                        style={{
                            fontWeight: 700,
                            fontSize: '11.5px',
                            padding: '3px 10px',
                            borderRadius: 6,
                            border: 'none',
                            textTransform: 'uppercase'
                        }}
                    >
                        {unitName || 'OPD'}
                    </Tag>
                );
            }
        },
        {
            title: 'SYSTEM ROLE',
            dataIndex: 'role',
            key: 'role',
            width: 150,
            render: text => (
                <span style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 6,
                    background: text === 'Issuer' ? '#eff6ff' : '#f0fdf4',
                    color: text === 'Issuer' ? '#1d4ed8' : '#15803d',
                    border: `1px solid ${text === 'Issuer' ? '#bfdbfe' : '#bbf7d0'}`
                }}>
                    {text === 'Issuer' ? 'Issuer (Admin)' : 'Indenter'}
                </span>
            )
        },
        {
            title: 'STATUS',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 130,
            render: (isActive) => {
                const active = isActive !== false;
                return (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '11.5px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: active ? '#ecfdf5' : '#f8fafc',
                        color: active ? '#059669' : '#94a3b8',
                        border: `1px solid ${active ? '#a7f3d0' : '#e2e8f0'}`
                    }}>
                        <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: active ? '#10b981' : '#cbd5e1'
                        }} />
                        {active ? 'Active' : 'Inactive'}
                    </span>
                );
            }
        },
        {
            title: '',
            key: 'action',
            width: 80,
            align: 'right',
            render: (_, record) => (
                <Button
                    size="small"
                    type="text"
                    style={{ fontSize: '12px', fontWeight: 600, color: '#0284c7' }}
                >
                    Edit
                </Button>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top KPI row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12
            }}>
                <div style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Total Accounts</span>
                    <strong style={{ fontSize: '18px', color: '#0f172a' }}>{metrics.total}</strong>
                </div>

                <div style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>Active Staff</span>
                    <strong style={{ fontSize: '18px', color: '#059669' }}>{metrics.active}</strong>
                </div>

                <div style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0284c7' }}>Issuers (Admins)</span>
                    <strong style={{ fontSize: '18px', color: '#0284c7' }}>{metrics.issuers}</strong>
                </div>

                <div style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Indenters</span>
                    <strong style={{ fontSize: '18px', color: '#0f172a' }}>{metrics.indenters}</strong>
                </div>
            </div>

            {/* Action & Filter Toolbar */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 280 }}>
                    <Input
                        placeholder="Search staff by name or email..."
                        prefix={<Search size={15} color="#94a3b8" style={{ marginRight: 6 }} />}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        allowClear
                        style={{ maxWidth: 340, height: 38, borderRadius: 8, borderColor: '#cbd5e1' }}
                    />

                    <Select
                        value={selectedUnitFilter}
                        onChange={setSelectedUnitFilter}
                        style={{ width: 150, height: 38 }}
                    >
                        <Option value="ALL">All Units</Option>
                        {units.map(u => (
                            <Option key={u.name} value={u.name}>{u.name}</Option>
                        ))}
                    </Select>
                </div>

                <Button
                    type="primary"
                    icon={<Plus size={15} strokeWidth={2.4} />}
                    onClick={() => setIsModalVisible(true)}
                    style={{
                        height: 38,
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: '13px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        border: 'none',
                        boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
                    }}
                >
                    New Staff User
                </Button>
            </div>

            {/* Users Table */}
            <Table
                loading={loading}
                columns={columns}
                dataSource={filteredUsers}
                rowKey="id"
                pagination={{ pageSize: 10, style: { padding: '12px 14px', margin: 0 } }}
                scroll={{ x: 'max-content' }}
                onRow={(record) => ({
                    onClick: () => {
                        setEditingUser(record);
                        editForm.setFieldsValue({
                            name: record.name,
                            email: record.email,
                            role: record.role,
                            main_unit: record.main_unit || 'OPD',
                            phis_username: record.phis_username,
                            phis_password: record.phis_password,
                            is_active: record.is_active !== false
                        });
                        setIsEditModalVisible(true);
                    },
                    style: { cursor: 'pointer' },
                    className: 'arise-admin-user-row'
                })}
            />

            {/* Create User Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 6 }}>
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
                            <User size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                Register New Staff Member
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                Account will be assigned temporary password: F@rmasi.1234
                            </div>
                        </div>
                    </div>
                }
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={520}
                destroyOnClose
            >
                <Form
                    layout="vertical"
                    form={form}
                    onFinish={handleCreateUser}
                    initialValues={{ role: 'Indenter', main_unit: 'OPD' }}
                    style={{ marginTop: 16 }}
                >
                    <Form.Item name="name" label={<span style={{ fontWeight: 600 }}>Full Name</span>} rules={[{ required: true, message: 'Please enter staff name' }]}>
                        <Input placeholder="e.g. Nurul Huda Binti Ahmad" size="large" style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Form.Item name="email" label={<span style={{ fontWeight: 600 }}>Work Email</span>} rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
                        <Input placeholder="e.g. staff@moh.gov.my" size="large" style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="role" label={<span style={{ fontWeight: 600 }}>System Role</span>} rules={[{ required: true }]}>
                                <Select size="large" style={{ borderRadius: 8 }}>
                                    <Option value="Indenter">Indenter</Option>
                                    <Option value="Issuer">Issuer (Admin)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="main_unit" label={<span style={{ fontWeight: 600 }}>Assigned Unit</span>} rules={[{ required: true, message: 'Please select unit' }]}>
                                <Select placeholder="Select unit" size="large">
                                    {units.map(u => (
                                        <Option key={u.name} value={u.name}>
                                            <Tag color={u.color}>{u.name}</Tag>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Collapse ghost style={{ marginBottom: 20 }}>
                        <Collapse.Panel header={<span style={{ fontWeight: 600, color: '#64748b', fontSize: '12.5px' }}>Optional: Hospital PHIS Credentials</span>} key="1">
                            <Form.Item name="phis_username" label="PHIS Username" style={{ marginBottom: 12 }}>
                                <Input autoComplete="off" placeholder="PHIS Login ID" />
                            </Form.Item>
                            <Form.Item name="phis_password" label="PHIS Password" style={{ marginBottom: 0 }}>
                                <Input.Password autoComplete="off" placeholder="PHIS Password" />
                            </Form.Item>
                        </Collapse.Panel>
                    </Collapse>

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            block
                            size="large"
                            style={{
                                borderRadius: 9,
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                border: 'none'
                            }}
                        >
                            Create User Account
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Edit User Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 6 }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0284c7'
                        }}>
                            <User size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                Edit Staff Member
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                Modify account permissions, unit allocation, or reset credentials.
                            </div>
                        </div>
                    </div>
                }
                open={isEditModalVisible}
                onCancel={() => {
                    setIsEditModalVisible(false);
                    setEditingUser(null);
                    editForm.resetFields();
                }}
                footer={null}
                width={540}
                destroyOnClose
            >
                <Form layout="vertical" form={editForm} onFinish={handleUpdateUser} style={{ marginTop: 16 }}>
                    <Form.Item name="name" label={<span style={{ fontWeight: 600 }}>Full Name</span>} rules={[{ required: true }]}>
                        <Input size="large" style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Form.Item name="email" label={<span style={{ fontWeight: 600 }}>Work Email</span>} rules={[{ required: true, type: 'email' }]}>
                        <Input size="large" style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="role" label={<span style={{ fontWeight: 600 }}>Role</span>} rules={[{ required: true }]}>
                                <Select size="large">
                                    <Option value="Indenter">Indenter</Option>
                                    <Option value="Issuer">Issuer (Admin)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="main_unit" label={<span style={{ fontWeight: 600 }}>Main Unit</span>} rules={[{ required: true }]}>
                                <Select placeholder="Select unit" size="large">
                                    {units.map(u => (
                                        <Option key={u.name} value={u.name}>
                                            <Tag color={u.color}>{u.name}</Tag>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="is_active" label={<span style={{ fontWeight: 600 }}>Account Status</span>} valuePropName="checked">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>

                    <Collapse ghost style={{ marginBottom: 20 }}>
                        <Collapse.Panel header={<span style={{ fontWeight: 600, color: '#64748b', fontSize: '12.5px' }}>Optional: Hospital PHIS Credentials</span>} key="1">
                            <Form.Item name="phis_username" label="PHIS Username" style={{ marginBottom: 12 }}>
                                <Input autoComplete="off" placeholder="PHIS Login ID" />
                            </Form.Item>
                            <Form.Item name="phis_password" label="PHIS Password" style={{ marginBottom: 0 }}>
                                <Input.Password autoComplete="off" placeholder="PHIS Password" />
                            </Form.Item>
                        </Collapse.Panel>
                    </Collapse>

                    <Form.Item style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting}
                                size="large"
                                style={{
                                    flex: 1,
                                    borderRadius: 9,
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                    border: 'none'
                                }}
                            >
                                Save Changes
                            </Button>

                            <Dropdown
                                menu={{
                                    items: [
                                        {
                                            key: 'reset',
                                            icon: <KeyRound size={14} color="#0284c7" />,
                                            label: (
                                                <Popconfirm
                                                    title="Reset password to default (F@rmasi.1234)?"
                                                    onConfirm={() => handleResetPassword(editingUser)}
                                                >
                                                    <span style={{ fontWeight: 500 }}>Reset Password to Default</span>
                                                </Popconfirm>
                                            ),
                                        },
                                        {
                                            type: 'divider'
                                        },
                                        {
                                            key: 'delete',
                                            danger: true,
                                            icon: <Trash2 size={14} color="#ef4444" />,
                                            label: (
                                                <Popconfirm
                                                    title="Permanently delete user profile?"
                                                    description="This action cannot be undone."
                                                    onConfirm={() => handleDeleteUser(editingUser)}
                                                    okButtonProps={{ danger: true }}
                                                >
                                                    <span style={{ fontWeight: 600 }}>Delete User Profile</span>
                                                </Popconfirm>
                                            ),
                                        },
                                    ]
                                }}
                                trigger={['click']}
                                placement="bottomRight"
                            >
                                <Button size="large" icon={<MoreVertical size={16} />} style={{ borderRadius: 8 }} />
                            </Dropdown>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>

            <style>{`
                .arise-admin-user-row:hover td {
                    background-color: #f8fafc !important;
                }
            `}</style>
        </div>
    );
};

// =========================================================================
// SUB-TAB 3: AUDIT LOGS VIEWER
// =========================================================================
const AuditLogsViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

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
            message.error('Failed to fetch audit logs');
        } finally {
            setLoading(false);
        }
    };

    const userFilters = Array.from(
        new Set(logs.map(record => record.user_name || record.user_email || 'System / Unknown'))
    ).map(u => ({ text: u, value: u }));

    const actionFilters = Array.from(new Set(logs.map(record => record.action)))
        .filter(Boolean)
        .map(a => ({ text: a, value: a }));

    const columns = [
        {
            title: 'TIMESTAMP',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 170,
            render: (text) => {
                const date = new Date(text);
                const dd = String(date.getDate()).padStart(2, '0');
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const yyyy = date.getFullYear();
                const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#475569' }}>
                        {dd}/{mm}/{yyyy} {time}
                    </span>
                );
            }
        },
        {
            title: 'USER',
            key: 'user',
            width: 200,
            filters: userFilters,
            onFilter: (value, record) => {
                const userName = record.user_name || record.user_email || 'System / Unknown';
                return userName === value;
            },
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#475569'
                    }}>
                        {getInitials(record.user_name || record.user_email)}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>
                        {record.user_name || record.user_email || 'System'}
                    </span>
                </div>
            )
        },
        {
            title: 'ACTION',
            dataIndex: 'action',
            key: 'action',
            width: 170,
            filters: actionFilters,
            onFilter: (value, record) => record.action === value,
            render: (text) => {
                let bg = '#eff6ff';
                let col = '#1d4ed8';
                let border = '#bfdbfe';

                if (text === 'LOGIN_SUCCESS') {
                    bg = '#f0fdf4'; col = '#15803d'; border = '#bbf7d0';
                } else if (text === 'LOGIN_FAILED') {
                    bg = '#fef2f2'; col = '#dc2626'; border = '#fecaca';
                } else if (text === 'INVENTORY_UPDATE') {
                    bg = '#fff7ed'; col = '#c2410c'; border = '#fed7aa';
                }

                return (
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 5,
                        background: bg,
                        color: col,
                        border: `1px solid ${border}`,
                        fontFamily: "'JetBrains Mono', monospace"
                    }}>
                        {text}
                    </span>
                );
            }
        },
        {
            title: 'DETAILS',
            dataIndex: 'details',
            key: 'details',
            render: (details) => {
                if (!details) return <span style={{ color: '#cbd5e1' }}>—</span>;
                if (details.message) return <span style={{ fontSize: '12.5px', color: '#334155' }}>{details.message}</span>;
                if (details.reason) {
                    return (
                        <span style={{ fontSize: '12.5px', color: '#dc2626', fontWeight: 500 }}>
                            {details.email ? `${details.email} — ` : ''}{details.reason}
                        </span>
                    );
                }
                return (
                    <pre style={{ margin: 0, fontSize: '11px', color: '#475569', background: '#f8fafc', padding: '4px 8px', borderRadius: 4 }}>
                        {JSON.stringify(details, null, 1)}
                    </pre>
                );
            }
        }
    ];

    const filteredLogs = logs.filter(log => {
        if (!searchText) return true;
        let detailsStr = '';
        if (log.details) {
            if (log.details.message) detailsStr = log.details.message;
            else if (log.details.reason) {
                detailsStr = `${log.details.email ? `${log.details.email} - ` : ''}${log.details.reason}`;
            } else detailsStr = JSON.stringify(log.details);
        }
        return detailsStr.toLowerCase().includes(searchText.toLowerCase());
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap'
            }}>
                <Input
                    placeholder="Search audit trail details..."
                    prefix={<Search size={15} color="#94a3b8" style={{ marginRight: 6 }} />}
                    allowClear
                    onChange={e => setSearchText(e.target.value)}
                    style={{ maxWidth: 360, height: 38, borderRadius: 8, borderColor: '#cbd5e1' }}
                />

                <Button
                    icon={<RefreshCw size={14} />}
                    onClick={fetchLogs}
                    loading={loading}
                    style={{ height: 38, borderRadius: 8, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                    Refresh Logs
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={filteredLogs}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 15, style: { padding: '12px 14px', margin: 0 } }}
                scroll={{ x: 'max-content' }}
            />
        </div>
    );
};

// =========================================================================
// SUB-TAB 4: DB SCHEMA VIEWER
// =========================================================================
const DBViewer = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Interactive schema diagram generated via dbdiagram.io:
                </span>
                <a
                    href="https://dbdiagram.io/e/6a6ff064067336e1de471d20/6a6ff616c3a90dd98d0991c9"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: '#0284c7',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                    }}
                >
                    <span>Open in Fullscreen</span>
                    <ExternalLink size={13} />
                </a>
            </div>

            <div style={{
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
            }}>
                <iframe
                    title="DB Schema Viewer"
                    width="100%"
                    height="850px"
                    style={{ border: 'none', display: 'block' }}
                    src="https://dbdiagram.io/e/6a6ff064067336e1de471d20/6a6ff616c3a90dd98d0991c9"
                />
            </div>
        </div>
    );
};

// =========================================================================
// SUB-TAB 5: SYSTEM VALUES (LOOKUP MANAGER)
// =========================================================================
const LookupManager = ({ title, endpoint, data = [], onRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const colorValue = Form.useWatch('color', form);

    const presetColors = [
        'blue', 'purple', 'cyan', 'green', 'magenta',
        'pink', 'red', 'orange', 'yellow', 'volcano',
        'geekblue', 'lime', 'gold'
    ];

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            let finalColor = values.color;
            if (values.color === 'custom') {
                finalColor = typeof values.customColor === 'string'
                    ? values.customColor
                    : values.customColor?.toHexString();
            }

            if (editingItem) {
                await api.put(`${endpoint}/${encodeURIComponent(editingItem.name)}`, {
                    name: values.name.trim(),
                    color: finalColor
                });
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
            message.error('Failed to delete. Value is currently referenced by inventory items.');
        }
    };

    return (
        <div style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc'
            }}>
                <div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                        {title}
                    </span>
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        marginLeft: 8,
                        color: '#64748b',
                        background: '#e2e8f0',
                        padding: '1px 6px',
                        borderRadius: 4
                    }}>
                        {data.length}
                    </span>
                </div>

                <Button
                    size="small"
                    type="primary"
                    onClick={() => {
                        setEditingItem(null);
                        form.resetFields();
                        setIsModalOpen(true);
                    }}
                    icon={<Plus size={13} />}
                    style={{
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                    }}
                >
                    Add
                </Button>
            </div>

            <div style={{ padding: 12, maxHeight: 280, overflowY: 'auto' }}>
                <List
                    size="small"
                    dataSource={data}
                    locale={{ emptyText: <span style={{ color: '#94a3b8', fontSize: '12px' }}>No entries found</span> }}
                    renderItem={item => (
                        <div
                            key={item.name}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                borderRadius: 6,
                                transition: 'background 0.15s ease',
                                cursor: 'pointer'
                            }}
                            className="arise-lookup-row"
                            onClick={() => {
                                setEditingItem(item);
                                const isPreset = presetColors.includes(item.color);
                                form.setFieldsValue({
                                    name: item.name,
                                    color: !item.color || isPreset ? item.color : 'custom',
                                    customColor: !item.color || isPreset ? undefined : item.color
                                });
                                setIsModalOpen(true);
                            }}
                        >
                            <Tag color={item.color} style={{ fontWeight: 600, fontSize: '12px', padding: '2px 8px', borderRadius: 4 }}>
                                {item.name}
                            </Tag>

                            <Popconfirm
                                title="Delete this value?"
                                description="Items referencing this value might lose their classification."
                                onConfirm={e => {
                                    e.stopPropagation();
                                    handleDelete(item.name);
                                }}
                            >
                                <Button
                                    danger
                                    type="text"
                                    size="small"
                                    icon={<Trash2 size={13} />}
                                    onClick={e => e.stopPropagation()}
                                    style={{ borderRadius: 4 }}
                                />
                            </Popconfirm>
                        </div>
                    )}
                />
            </div>

            {/* Add / Edit Modal */}
            <Modal
                title={editingItem ? `Edit ${title}` : `Add New ${title}`}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                    form.resetFields();
                }}
                footer={null}
                width={420}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 14 }}>
                    <Form.Item
                        name="name"
                        label={<span style={{ fontWeight: 600 }}>Value Name</span>}
                        rules={[{ required: true, message: 'Please enter a name' }]}
                    >
                        <Input placeholder="Enter value label" size="large" style={{ borderRadius: 8 }} />
                    </Form.Item>

                    <Form.Item
                        name="color"
                        label={<span style={{ fontWeight: 600 }}>Badge Color</span>}
                        extra="Leave blank to assign automatic theme color"
                    >
                        <Select placeholder="Select a preset color" allowClear size="large">
                            {presetColors.map(c => (
                                <Select.Option key={c} value={c}>
                                    <Tag color={c}>{c}</Tag>
                                </Select.Option>
                            ))}
                            <Select.Option value="custom">Custom Hex Color...</Select.Option>
                        </Select>
                    </Form.Item>

                    {colorValue === 'custom' && (
                        <Form.Item
                            name="customColor"
                            label={<span style={{ fontWeight: 600 }}>Custom Hex Color</span>}
                            rules={[{ required: true, message: 'Please select a custom color' }]}
                        >
                            <ColorPicker disabledAlpha />
                        </Form.Item>
                    )}

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            block
                            size="large"
                            style={{
                                borderRadius: 8,
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                border: 'none'
                            }}
                        >
                            Save Value
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <style>{`
                .arise-lookup-row:hover {
                    background: #f8fafc;
                }
            `}</style>
        </div>
    );
};

const SystemValuesTab = () => {
    const [units, setUnits] = useState([]);
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

    if (loading) return <Spin style={{ display: 'block', margin: '40px auto' }} />;

    return (
        <Row gutter={[20, 20]}>
            <Col xs={24} md={12} lg={8}>
                <LookupManager
                    title="Main Units"
                    endpoint="/lookups/units"
                    data={units}
                    onRefresh={fetchValues}
                />
            </Col>
            <Col xs={24} md={12} lg={8}>
                <LookupManager
                    title="Indent Sources"
                    endpoint="/lookups/sources"
                    data={sources}
                    onRefresh={fetchValues}
                />
            </Col>
            <Col xs={24} md={12} lg={8}>
                <LookupManager
                    title="Item Types"
                    endpoint="/lookups/types"
                    data={types}
                    onRefresh={fetchValues}
                />
            </Col>
            <Col xs={24} md={12} lg={8}>
                <LookupManager
                    title="Purchase Types"
                    endpoint="/lookups/purchasetypes"
                    data={purchaseTypes}
                    onRefresh={fetchValues}
                />
            </Col>
            <Col xs={24} md={12} lg={8}>
                <LookupManager
                    title="STD / KT"
                    endpoint="/lookups/stdkts"
                    data={stdKts}
                    onRefresh={fetchValues}
                />
            </Col>
        </Row>
    );
};

export default AdminMenuDesktopView;
