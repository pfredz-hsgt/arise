import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Drawer, Button, Avatar, Dropdown, Modal, Form, Input, message } from 'antd';
import {
    SearchOutlined,
    ShoppingCartOutlined,
    FileTextOutlined,
    SettingOutlined,
    MenuOutlined,
    PushpinOutlined,
    WarningOutlined,
    HistoryOutlined,
    UserOutlined,
    LogoutOutlined,
    HomeOutlined,
    LockOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../img/logo.svg';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const { user, profile, isIssuer, signOut, changePassword, updateProfile } = useAuth();

    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [profileForm] = Form.useForm();
    const [updatingProfile, setUpdatingProfile] = useState(false);

    const isForcedChange = user?.requiresPasswordChange;

    React.useEffect(() => {
        if (isForcedChange) {
            setProfileModalVisible(true);
        }
    }, [isForcedChange]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const handleUpdateProfile = async (values) => {
        setUpdatingProfile(true);
        try {
            if (values.newPassword) {
                await changePassword(values.newPassword);
            }
            if (!isForcedChange || values.name || values.phis_username || values.phis_password) {
                await updateProfile({
                    name: values.name,
                    phis_username: values.phis_username,
                    phis_password: values.phis_password
                });
            }
            message.success('Profile updated successfully');
            setProfileModalVisible(false);
            profileForm.resetFields();
        } catch (error) {
            console.error('Error updating profile:', error);
            message.error(error.message || 'Failed to update profile');
        } finally {
            setUpdatingProfile(false);
        }
    };

    const openProfileModal = () => {
        profileForm.setFieldsValue({
            name: user?.name,
            phis_username: user?.phis_username,
            phis_password: user?.phis_password
        });
        setProfileModalVisible(true);
    };

    const userMenu = {
        items: [
            {
                key: 'profile',
                label: <Text strong>{profile?.name}</Text>
            },
            {
                key: 'role',
                label: <Text type="secondary">{profile?.role}</Text>
            },
            {
                type: 'divider'
            },
            {
                key: 'editProfile',
                icon: <UserOutlined />,
                label: 'Edit Profile',
                onClick: openProfileModal
            },
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Sign Out',
                onClick: handleSignOut
            }
        ]
    };

    // Base menu items available to all
    let menuItems = [
        {
            key: '/home',
            icon: <HomeOutlined />,
            label: 'Home',
        },
        {
            key: '/routine-summary',
            icon: <PushpinOutlined />,
            label: 'Routine Indent',
        },
        {
            key: '/indent',
            icon: <FileTextOutlined />,
            label: 'Urgent Indent',
        },
        {
            type: 'divider',
            style: {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                margin: '12px 16px'
            }
        },
        {
            key: '/indent-list',
            icon: <HistoryOutlined />,
            label: 'Records',
        },
        {
            key: '/shortexp',
            icon: <WarningOutlined />,
            label: 'Short Expiry',
        },

    ];

    // Inject Issuer-only menus before settings
    if (isIssuer) {
        menuItems.splice(4, 0,
            {
                key: '/cart',
                icon: <ShoppingCartOutlined />,
                label: 'Cart',
            },
            {
                key: '/admin',
                icon: <SettingOutlined />,
                label: 'Admin Panel',
            }
        );
    }

    const handleMenuClick = ({ key }) => {
        navigate(key);
        setMobileMenuOpen(false);
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Desktop Sidebar */}
            <Sider
                breakpoint="lg"
                collapsedWidth="0"
                onCollapse={setCollapsed}
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                }}
                className="desktop-sider"
            >
                <div style={{ padding: '24px 16px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <img src={logo} alt="ARISE Logo" style={{ maxWidth: '100%', height: 'auto', maxHeight: '64px', marginBottom: '0px' }} />
                    <Title level={4} style={{
                        color: 'white',
                        margin: 0,
                        letterSpacing: '6px',
                        fontWeight: 450,
                        background: 'linear-gradient(to right, #ffffffff 0%, #ffeefbff 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textTransform: 'uppercase',
                        fontSize: '26px',
                        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
                    }}>
                        ARISE
                    </Title>
                    <Typography.Text style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '10px',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginTop: '4px',
                        fontWeight: 400
                    }}>
                        Farmasi Pesakit Luar<br />Hospital Segamat
                    </Typography.Text>
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                />
            </Sider>

            {/* Mobile Drawer */}
            <Drawer
                placement="left"
                onClose={() => setMobileMenuOpen(false)}
                open={mobileMenuOpen}
                className="mobile-drawer"
                styles={{
                    body: { padding: 0, backgroundColor: '#001529' },
                    header: { display: 'none' }
                }}
                width={200}
            >
                <div style={{ padding: '24px 16px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <img src={logo} alt="ARISE Logo" style={{ maxWidth: '100%', height: 'auto', maxHeight: '64px', marginBottom: '0px' }} />
                    <Typography.Text style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '10px',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginTop: '4px',
                        fontWeight: 400
                    }}>
                        Farmasi Pesakit Luar<br />Hospital Segamat
                    </Typography.Text>
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                />
            </Drawer>

            <Layout style={{ marginLeft: collapsed ? 0 : 200 }}>
                <Header
                    className="site-header"
                    style={{
                        padding: '0 16px',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            type="text"
                            icon={<MenuOutlined />}
                            onClick={() => setMobileMenuOpen(true)}
                            className="mobile-menu-button"
                            style={{ fontSize: '18px', marginRight: 16 }}
                        />

                    </div>

                    <div>
                        {user && (
                            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
                                <Avatar
                                    style={{ backgroundColor: '#1890ff', cursor: 'pointer' }}
                                    icon={<UserOutlined />}
                                />
                            </Dropdown>
                        )}
                    </div>
                </Header>
                <Content className="site-content" style={{ margin: '24px 16px', overflow: 'initial' }}>
                    <div style={{ padding: 24, background: '#fff', minHeight: 360, borderRadius: 8 }}>
                        <Outlet />
                    </div>
                </Content>
            </Layout>

            {/* Edit Profile Modal */}
            <Modal
                title={isForcedChange ? "Action Required: Change Temporary Password" : "Edit Profile"}
                open={profileModalVisible}
                onCancel={() => {
                    if (isForcedChange) return;
                    setProfileModalVisible(false);
                    profileForm.resetFields();
                }}
                onOk={() => profileForm.submit()}
                confirmLoading={updatingProfile}
                okText={isForcedChange ? "Update Password" : "Save Changes"}
                closable={!isForcedChange}
                maskClosable={!isForcedChange}
                cancelButtonProps={{ style: { display: isForcedChange ? 'none' : 'inline-block' } }}
            >
                {isForcedChange && (
                    <div style={{ marginBottom: 16 }}>
                        <Typography.Text type="danger">
                            You have logged in with a temporary password. Please set a new password to continue using the system.
                        </Typography.Text>
                    </div>
                )}
                <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                >
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: !isForcedChange, message: 'Please input your name' }]}
                    >
                        <Input placeholder="Enter your name" />
                    </Form.Item>
                    
                    <Form.Item
                        name="phis_username"
                        label="PHIS Username"
                    >
                        <Input placeholder="Enter PHIS username" />
                    </Form.Item>

                    <Form.Item
                        name="phis_password"
                        label="PHIS Password"
                    >
                        <Input.Password placeholder="Enter PHIS password" />
                    </Form.Item>

                    <Form.Item
                        name="newPassword"
                        label={isForcedChange ? "New Password" : "New Password (leave blank to keep current)"}
                        rules={[
                            { required: isForcedChange, message: 'Please input your new password!' },
                            { min: 6, message: 'Password must be at least 6 characters!' }
                        ]}
                    >
                        <Input.Password placeholder="Enter new password" />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label="Confirm New Password"
                        dependencies={['newPassword']}
                        rules={[
                            { required: isForcedChange, message: 'Please confirm your new password!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('The two passwords that you entered do not match!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="Confirm new password" />
                    </Form.Item>
                </Form>
            </Modal>

            <style>{`
        @media (min-width: 992px) {
          .mobile-menu-button {
            display: none !important;
          }
          .mobile-drawer {
            display: none;
          }
        }
        @media (max-width: 991px) {
          .desktop-sider {
            display: none !important;
          }
          .site-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            width: 100%;
          }
          .site-content {
            margin-top: 88px !important; /* 64px header + 24px existing top margin */
          }
        }
      `}</style>
        </Layout>
    );
};

export default MainLayout;
