import React, { useState } from 'react';
import {
    Button,
    Picker,
    Popup,
    SafeArea,
    ConfigProvider,
    SpinLoading
} from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';
import { Dropdown, Avatar, Form, Input, Collapse, message } from 'antd';
import {
    AuditOutlined,
    RocketOutlined,
    WarningOutlined,
    HistoryOutlined,
    RightOutlined,
    PlayCircleOutlined,
    DownOutlined,
    MedicineBoxOutlined,
    UserOutlined,
    LogoutOutlined,
    CloseOutlined,
    LockOutlined,
    KeyOutlined,
    SettingOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { getUnitColor } from '../../lib/colorMappings';

const HomeMobileView = ({
    unit,
    user,
    profile,
    raks,
    loadingRaks,
    selectedRak,
    setSelectedRak,
    draftSession,
    handleStartRoutine,
    navigate
}) => {
    const [rakPickerVisible, setRakPickerVisible] = useState(false);
    const { signOut, updateProfile, changePassword } = useAuth();

    const [editProfileVisible, setEditProfileVisible] = useState(false);
    const [profileForm] = Form.useForm();
    const [updatingProfile, setUpdatingProfile] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const openEditProfile = () => {
        profileForm.setFieldsValue({
            name: profile?.name || user?.name || '',
            email: profile?.email || user?.email || '',
            phis_username: profile?.phis_username || user?.phis_username || '',
            phis_password: profile?.phis_password || user?.phis_password || '',
            newPassword: '',
            confirmPassword: ''
        });
        setEditProfileVisible(true);
    };

    const handleUpdateProfile = async (values) => {
        setUpdatingProfile(true);
        try {
            if (values.newPassword) {
                await changePassword(values.newPassword);
            }
            if (values.name || values.email || values.phis_username !== undefined || values.phis_password !== undefined) {
                await updateProfile({
                    name: values.name,
                    email: values.email,
                    phis_username: values.phis_username,
                    phis_password: values.phis_password
                });
            }
            message.success('Profile updated successfully');
            setEditProfileVisible(false);
            profileForm.resetFields();
        } catch (error) {
            console.error('Error updating profile:', error);
            message.error(error.message || 'Failed to update profile');
        } finally {
            setUpdatingProfile(false);
        }
    };

    const userMenu = {
        items: [
            {
                key: 'profile',
                label: <span style={{ fontWeight: 600 }}>{profile?.name || user?.name}</span>
            },
            {
                key: 'role',
                label: <span style={{ color: '#64748b', fontSize: 12 }}>{profile?.role || user?.role}</span>
            },
            { type: 'divider' },
            profile?.role === 'Issuer' ? {
                key: 'adminMenu',
                icon: <SettingOutlined />,
                label: 'Admin Menu',
                onClick: () => navigate('/admin'),
            } : null,
            // 👈 This removes the 'null' if the condition is false
            {
                key: 'editProfile',
                icon: <UserOutlined />,
                label: 'Edit Profile',
                onClick: openEditProfile
            },
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Sign Out',
                onClick: handleSignOut
            }
        ].filter(Boolean)
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            paddingBottom: '80px', // Space for fixed bottom navigation bar
            background: '#f8fafc'
        }}>
            {/* Top Greeting & Department Banner */}
            <div style={{
                background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)',
                padding: '20px 16px',
                color: '#ffffff',
                borderBottomLeftRadius: 20,
                borderBottomRightRadius: 20,
                boxShadow: '0 4px 12px rgba(0,21,41,0.12)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                            Welcome back,
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginTop: 2 }}>
                            {profile?.name || 'Staff'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                            background: getUnitColor(unit),
                            color: '#ffffff',
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}>
                            {unit}
                        </span>
                        {user && (
                            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
                                <Avatar
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        cursor: 'pointer',
                                        border: '1.5px solid rgba(255,255,255,0.6)'
                                    }}
                                    icon={<UserOutlined />}
                                    size="small"
                                />
                            </Dropdown>
                        )}
                    </div>
                </div>

                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.3px' }}>
                    {unit === 'ED' ? 'Farmasi Kecemasan' :
                        unit === 'OPD' ? 'Farmasi Pesakit Luar' :
                            unit === 'IPD' ? 'Farmasi Pesakit Dalam' :
                                'Jabatan Farmasi'} • Hospital Segamat
                </div>
            </div>

            {/* Content Container */}
            <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Active Routine Draft Resume Banner (if in progress) */}
                {draftSession && (
                    <div style={{
                        background: 'linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)',
                        border: '1.5px solid #ffd591',
                        borderRadius: 14,
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 8px rgba(250,140,22,0.12)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                background: '#ffe7ba',
                                color: '#d46b08',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16
                            }}>
                                <PlayCircleOutlined />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#873800' }}>
                                    Active Draft: Rak {draftSession.rak}
                                </div>
                                <div style={{ fontSize: 11, color: '#ad4e00' }}>
                                    Tap to resume shelf audit
                                </div>
                            </div>
                        </div>

                        <Button
                            size="small"
                            shape="rounded"
                            onClick={() => navigate(`/routine-indent?rak=${encodeURIComponent(draftSession.rak)}`)}
                            style={{
                                borderColor: '#ffa940',
                                color: '#d46b08',
                                background: '#ffffff',
                                fontWeight: 700,
                                fontSize: 12
                            }}
                        >
                            Resume
                        </Button>
                    </div>
                )}

                {/* Section Title */}
                <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', paddingLeft: 2 }}>
                    Indent Modes & Tools
                </div>

                {/* 1. Routine Indent Card */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    padding: '16px',
                    border: '1.5px solid #dbeafe',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18
                        }}>
                            <AuditOutlined />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a8a' }}>
                                Routine Indent
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                                Walk drug shelves and count stock rack by rack
                            </div>
                        </div>
                    </div>

                    {loadingRaks ? (
                        <div style={{ padding: '16px 0', textAlign: 'center' }}>
                            <SpinLoading color="primary" />
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {/* Shelf Selector Trigger */}
                            <div
                                onClick={() => setRakPickerVisible(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '11px 14px',
                                    background: '#f8fafc',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 10,
                                    cursor: 'pointer'
                                }}
                            >
                                <span style={{ fontSize: 13, color: '#475569' }}>
                                    Selected Shelf: <strong style={{ color: '#0f172a', fontSize: 14 }}>Rak {selectedRak || 'Select'}</strong>
                                </span>
                                <DownOutlined style={{ fontSize: 12, color: '#1677ff' }} />
                            </div>

                            <Button
                                size="large"
                                shape="rounded"
                                color="primary"
                                onClick={() => handleStartRoutine(selectedRak)}
                                style={{
                                    fontWeight: 700,
                                    fontSize: 15,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                }}
                            >
                                Start Routine Indent <RightOutlined style={{ fontSize: 13 }} />
                            </Button>
                        </div>
                    )}
                </div>

                {/* 2. Urgent / Ad-Hoc Indent Card */}
                <div
                    onClick={() => navigate('/indent')}
                    style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        padding: '16px',
                        border: '1.5px solid #fed7aa',
                        boxShadow: '0 2px 8px rgba(234,88,12,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: '#fff7ed',
                            color: '#ea580c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18
                        }}>
                            <RocketOutlined />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#9a3412' }}>
                                Urgent / Ad-Hoc Indent
                            </div>
                            <div style={{ fontSize: 11, color: '#7c2d12' }}>
                                Search and order any specific catalog item
                            </div>
                        </div>
                    </div>
                    <RightOutlined style={{ color: '#ea580c', fontSize: 14 }} />
                </div>

                {/* 3. Short Expiry Management Card */}
                <div
                    onClick={() => navigate('/shortexp')}
                    style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        padding: '16px',
                        border: '1.5px solid #fecdd3',
                        boxShadow: '0 2px 8px rgba(225,29,72,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: '#fff1f2',
                            color: '#e11d48',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18
                        }}>
                            <WarningOutlined />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#9f1239' }}>
                                Short Expiry
                            </div>
                            <div style={{ fontSize: 11, color: '#881337' }}>
                                Review and record expiring batches on shelf
                            </div>
                        </div>
                    </div>
                    <RightOutlined style={{ color: '#e11d48', fontSize: 14 }} />
                </div>

                {/* 4. Indent Records Card */}
                <div
                    onClick={() => navigate('/indent-list')}
                    style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        padding: '16px',
                        border: '1.5px solid #e2e8f0',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: '#f1f5f9',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18
                        }}>
                            <HistoryOutlined />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>
                                Indent Records
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                                View previous routine and urgent orders
                            </div>
                        </div>
                    </div>
                    <RightOutlined style={{ color: '#64748b', fontSize: 14 }} />
                </div>
            </div>

            {/* Shelf (Rak) Picker */}
            <ConfigProvider locale={enUS}>
                <Picker
                    columns={[
                        raks.map(rak => ({ label: `Rak ${rak}`, value: rak }))
                    ]}
                    visible={rakPickerVisible}
                    onClose={() => setRakPickerVisible(false)}
                    value={selectedRak ? [selectedRak] : []}
                    onConfirm={v => {
                        setSelectedRak(v[0]);
                    }}
                    title="Select Rak"
                />
            </ConfigProvider>

            {/* Mobile Edit Profile Drawer / Bottom Sheet */}
            <Popup
                visible={editProfileVisible}
                onMaskClick={() => !updatingProfile && setEditProfileVisible(false)}
                position="bottom"
                bodyStyle={{
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    maxHeight: '90vh',
                    minHeight: '60vh',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#f8fafc',
                    overflow: 'hidden'
                }}
            >
                {/* Grab Bar & Header */}
                <div style={{
                    padding: '12px 16px 10px 16px',
                    background: '#ffffff',
                    borderBottom: '1px solid #f0f0f0',
                    position: 'relative'
                }}>
                    <div style={{
                        width: 40,
                        height: 4,
                        background: '#cbd5e1',
                        borderRadius: 2,
                        margin: '0 auto 10px auto'
                    }} />
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                background: '#eff6ff',
                                color: '#1677ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 16
                            }}>
                                <UserOutlined />
                            </div>
                            <div>
                                <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'block', lineHeight: 1.2 }}>
                                    Edit Profile
                                </span>
                                <span style={{ fontSize: 11, color: '#64748b' }}>
                                    Update your account details
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => !updatingProfile && setEditProfileVisible(false)}
                            style={{
                                background: '#f1f5f9',
                                border: 'none',
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#64748b'
                            }}
                        >
                            <CloseOutlined style={{ fontSize: 14 }} />
                        </button>
                    </div>
                </div>

                {/* Form Content Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px 16px 90px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14
                }}>
                    <Form
                        form={profileForm}
                        layout="vertical"
                        onFinish={handleUpdateProfile}
                        requiredMark={false}
                    >
                        {/* Basic Info Card */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: 14,
                            padding: '14px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            marginBottom: 14
                        }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>
                                Account Information
                            </div>

                            <Form.Item
                                name="name"
                                label={<span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Full Name</span>}
                                rules={[{ required: true, message: 'Please input your name' }]}
                                style={{ marginBottom: 12 }}
                            >
                                <Input
                                    placeholder="Enter your name"
                                    style={{ borderRadius: 8, padding: '8px 12px', fontSize: 14 }}
                                />
                            </Form.Item>

                            <Form.Item
                                name="email"
                                label={<span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Email Address</span>}
                                rules={[
                                    { required: true, message: 'Please input your email' },
                                    { type: 'email', message: 'Please enter a valid email address' }
                                ]}
                                style={{ marginBottom: 6 }}
                            >
                                <Input
                                    placeholder="Enter your email"
                                    style={{ borderRadius: 8, padding: '8px 12px', fontSize: 14 }}
                                />
                            </Form.Item>
                        </div>

                        {/* Password Section */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: 14,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            overflow: 'hidden',
                            marginBottom: 14
                        }}>
                            <Collapse ghost>
                                <Collapse.Panel
                                    header={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <LockOutlined style={{ color: '#d97706', fontSize: 14 }} />
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                                                    Change Password
                                                </div>
                                                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                                    Leave blank to keep current password
                                                </div>
                                            </div>
                                        </div>
                                    }
                                    key="password"
                                >
                                    <Form.Item
                                        name="newPassword"
                                        label={<span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>New Password</span>}
                                        rules={[
                                            { min: 6, message: 'Password must be at least 6 characters!' }
                                        ]}
                                        style={{ marginBottom: 12 }}
                                    >
                                        <Input.Password
                                            autoComplete="off"
                                            placeholder="Enter new password (min 6 chars)"
                                            style={{ borderRadius: 8, padding: '8px 12px', fontSize: 14 }}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="confirmPassword"
                                        label={<span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Confirm New Password</span>}
                                        dependencies={['newPassword']}
                                        rules={[
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('newPassword') === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Passwords do not match!'));
                                                },
                                            }),
                                        ]}
                                        style={{ marginBottom: 6 }}
                                    >
                                        <Input.Password
                                            autoComplete="off"
                                            placeholder="Confirm new password"
                                            style={{ borderRadius: 8, padding: '8px 12px', fontSize: 14 }}
                                        />
                                    </Form.Item>
                                </Collapse.Panel>
                            </Collapse>
                        </div>

                        {/* PHIS Credentials Section */}
                        <div style={{
                            background: '#ffffff',
                            borderRadius: 14,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            overflow: 'hidden'
                        }}>
                            <Collapse ghost>
                                <Collapse.Panel
                                    header={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <KeyOutlined style={{ color: '#2563eb', fontSize: 14 }} />
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                                                    PHIS Credentials
                                                </div>
                                                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                                    Used for automated indenting (optional)
                                                </div>
                                            </div>
                                        </div>
                                    }
                                    key="phis"
                                >
                                    <Form.Item
                                        name="phis_username"
                                        label={<span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>PHIS Username</span>}
                                        style={{ marginBottom: 12 }}
                                    >
                                        <Input
                                            autoComplete="off"
                                            placeholder="Enter PHIS username"
                                            style={{ borderRadius: 8, padding: '8px 12px', fontSize: 14 }}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="phis_password"
                                        label={<span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>PHIS Password</span>}
                                        style={{ marginBottom: 6 }}
                                    >
                                        <Input.Password
                                            autoComplete="off"
                                            placeholder="Enter PHIS password"
                                            style={{ borderRadius: 8, padding: '8px 12px', fontSize: 14 }}
                                        />
                                    </Form.Item>
                                </Collapse.Panel>
                            </Collapse>
                        </div>
                    </Form>
                </div>

                {/* Sticky Bottom Actions */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    background: '#ffffff',
                    borderTop: '1px solid #e2e8f0',
                    padding: '12px 16px',
                    boxShadow: '0 -4px 12px rgba(0,0,0,0.06)'
                }}>
                    <SafeArea position="bottom" />
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Button
                            size="large"
                            shape="rounded"
                            disabled={updatingProfile}
                            onClick={() => setEditProfileVisible(false)}
                            style={{
                                flex: '0 0 35%',
                                fontWeight: 600,
                                fontSize: 14,
                                borderColor: '#cbd5e1',
                                color: '#475569'
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="large"
                            shape="rounded"
                            color="primary"
                            loading={updatingProfile}
                            onClick={() => profileForm.submit()}
                            style={{
                                flex: 1,
                                fontWeight: 700,
                                fontSize: 15
                            }}
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Popup>
        </div>
    );
};

export default HomeMobileView;
