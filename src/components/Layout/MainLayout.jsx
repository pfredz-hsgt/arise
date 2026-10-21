import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Collapse, Menu, Typography, Drawer, Button, Avatar, Dropdown, Modal, Form, Input, message, Tag } from 'antd';
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
    LockOutlined,
    AuditOutlined,
    RocketOutlined
} from '@ant-design/icons';
import { TabBar, SafeArea } from 'antd-mobile';
import { useAuth } from '../../contexts/AuthContext';
import { getUnitColor } from '../../lib/colorMappings';
import useIsMobile from '../../hooks/useIsMobile';
import logo from '../../img/logo.svg';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useIsMobile(768);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
            if (!isForcedChange || values.name || values.email || values.phis_username || values.phis_password) {
                await updateProfile({
                    name: values.name,
                    email: values.email,
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
            email: user?.email,
            phis_username: user?.phis_username,
            phis_password: user?.phis_password
        });
        setProfileModalVisible(true);
    };

    const currentUnit = profile?.main_unit || user?.main_unit;

    const userMenu = {
        items: [
            {
                key: 'profile',
                label: <Text strong>{profile?.name}</Text>
            },
            ...(currentUnit ? [{
                key: 'unit',
                label: <Tag color={getUnitColor(currentUnit)} style={{ margin: 0, fontWeight: 600 }}>{currentUnit}</Tag>
            }] : []),
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
        {
            key: '/shortexp-archive',
            icon: <HistoryOutlined />,
            label: 'Short Exp Archive',
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

    // TabBar items for persistent mobile navigation
    const mobileTabItems = [
        {
            key: '/home',
            title: 'Home',
            icon: <HomeOutlined style={{ fontSize: 19 }} />,
        },
        {
            key: '/routine-summary',
            title: 'Routine',
            icon: <AuditOutlined style={{ fontSize: 19 }} />,
        },
        {
            key: '/indent',
            title: 'Urgent',
            icon: <RocketOutlined style={{ fontSize: 19 }} />,
        },
        ...(isIssuer ? [{
            key: '/cart',
            title: 'Cart',
            icon: <ShoppingCartOutlined style={{ fontSize: 19 }} />,
        }] : []),
        {
            key: '/shortexp',
            title: 'Short Exp',
            icon: <WarningOutlined style={{ fontSize: 19 }} />,
        },
        {
            key: '/indent-list',
            title: 'Records',
            icon: <HistoryOutlined style={{ fontSize: 19 }} />,
        },
    ];

    const getActiveMobileTab = (pathname) => {
        if (pathname === '/home' || pathname === '/') return '/home';
        if (pathname.startsWith('/routine')) return '/routine-summary';
        if (pathname === '/indent') return '/indent';
        if (pathname.startsWith('/shortexp')) return '/shortexp';
        if (pathname === '/indent-list') return '/indent-list';
        if (pathname === '/cart') return '/cart';
        if (pathname === '/admin') return '/admin';
        return pathname;
    };

    const handleMobileTabChange = (key) => {
        if (location.pathname === key) return;
        navigate(key);
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Desktop Sidebar (hidden on mobile) */}
            {!isMobile && (
                <Sider
                    width={200}
                    style={{
                        overflow: 'auto',
                        height: '100vh',
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 100,
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
            )}

            {/* Mobile Drawer (hidden on mobile, replaced by bottom TabBar) */}
            {!isMobile && (
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
                </Drawer>
            )}

            <Layout className="main-content-layout">
                {/* Header (hidden on mobile) */}
                {!isMobile && (
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {currentUnit && (
                                <Tag color={getUnitColor(currentUnit)} style={{ margin: 0, fontWeight: 600, fontSize: '13px', padding: '2px 8px' }}>
                                    {currentUnit}
                                </Tag>
                            )}
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
                )}
                <Content className="site-content" style={{ margin: isMobile ? 0 : '24px 16px', overflow: 'initial', minWidth: 0 }}>
                    <div style={{ padding: isMobile ? 0 : 24, background: isMobile ? 'transparent' : '#fff', minHeight: isMobile ? 'auto' : 360, borderRadius: isMobile ? 0 : 8, minWidth: 0 }}>
                        <Outlet />
                    </div>
                </Content>
            </Layout>

            {/* Persistent Mobile Bottom Navigation Bar */}
            {isMobile && (
                <div
                    className="mobile-tabbar-container"
                    onContextMenu={(e) => e.preventDefault()}
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        background: '#ffffff',
                        borderTop: '1px solid #e2e8f0',
                        boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        WebkitTouchCallout: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                    }}
                >
                    <TabBar activeKey={getActiveMobileTab(location.pathname)} onChange={handleMobileTabChange}>
                        {mobileTabItems.map(item => (
                            <TabBar.Item
                                key={item.key}
                                icon={item.icon}
                                title={
                                    <span style={{
                                        userSelect: 'none',
                                        WebkitUserSelect: 'none',
                                        WebkitTouchCallout: 'none',
                                    }}>
                                        {item.title}
                                    </span>
                                }
                            />
                        ))}
                    </TabBar>
                    <SafeArea position="bottom" />
                </div>
            )}

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
                            You have logged in with a temporary password. Please set a new password.
                        </Typography.Text>
                    </div>
                )}
                <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                >
                    {!isForcedChange && (
                        <>
                            <Form.Item
                                name="name"
                                label="Name"
                                rules={[{ required: true, message: 'Please input your name' }]}
                            >
                                <Input placeholder="Enter your name" />
                            </Form.Item>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    { required: true, message: 'Please input your email' },
                                    { type: 'email', message: 'Please enter a valid email address' }
                                ]}
                            >
                                <Input placeholder="Enter your email" />
                            </Form.Item>
                        </>
                    )}
                    <Collapse ghost style={{ marginBottom: 0 }} defaultActiveKey={isForcedChange ? ['1'] : undefined}>
                        <Collapse.Panel header={isForcedChange ? "You must change your password" : "Change your password"} key="1">
                            <Form.Item
                                name="newPassword"
                                label={isForcedChange ? "New Password" : "New Password (leave blank to keep current)"}
                                rules={[
                                    { required: isForcedChange, message: 'Please input your new password!' },
                                    { min: 6, message: 'Password must be at least 6 characters!' }
                                ]}
                            >
                                <Input.Password autoComplete="off" placeholder="Enter new password" />
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
                                <Input.Password autoComplete="off" placeholder="Confirm new password" />
                            </Form.Item>
                        </Collapse.Panel>
                    </Collapse>
                    <Collapse ghost style={{ marginBottom: 12 }}>
                        <Collapse.Panel header="PHIS Credentials (Optional)" key="1">
                            <Form.Item name="phis_username" label="PHIS Username">
                                <Input autoComplete="off" />
                            </Form.Item>
                            <Form.Item name="phis_password" label="PHIS Password">
                                <Input.Password autoComplete="off" />
                            </Form.Item>
                        </Collapse.Panel>
                    </Collapse>                </Form>
            </Modal>

            <style>{`
        .mobile-tabbar-container,
        .mobile-tabbar-container * {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          -khtml-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-tap-highlight-color: transparent !important;
          touch-action: manipulation !important;
        }
        @media (min-width: 768px) {
          .mobile-tabbar-container {
            display: none !important;
          }
        }
        .main-content-layout {
          margin-left: 0;
          min-width: 0;
          transition: margin-left 0.2s ease;
        }
        @media (min-width: 992px) {
          .main-content-layout {
            margin-left: 200px !important;
          }
          .mobile-menu-button {
            display: none !important;
          }
          .mobile-drawer {
            display: none !important;
          }
        }
        @media (max-width: 991.98px) {
          .main-content-layout {
            margin-left: 0 !important;
          }
        }
        @media (max-width: 767.98px) {
          .desktop-sider {
            display: none !important;
          }
          .site-header {
            display: none !important;
          }
          .mobile-menu-button {
            display: none !important;
          }
          .mobile-drawer {
            display: none !important;
          }
          .site-content {
            margin: 0 !important;
            margin-top: 0 !important;
            padding-bottom: calc(65px + env(safe-area-inset-bottom, 0px)) !important;
            min-width: 0 !important;
          }
          .site-content > div {
            padding: 0 !important;
            border-radius: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            min-width: 0 !important;
          }
        }
        @media (min-width: 768px) and (max-width: 991.98px) {
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
            margin-top: 64px !important;
            min-width: 0 !important;
          }
          .site-content > div {
            min-width: 0 !important;
          }
        }
      `}</style>
        </Layout>
    );
};

export default MainLayout;
