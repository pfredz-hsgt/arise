import React, { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Drawer, Button, Dropdown, Modal, Form, Input, message, Tag, Tooltip } from 'antd';
import {
    LayoutDashboard,
    ClipboardList,
    Zap,
    ShoppingCart,
    History,
    AlertTriangle,
    Archive,
    ShieldCheck,
    User,
    LogOut,
    ChevronDown,
    Calendar,
    Menu as MenuIcon,
    KeyRound,
    Lock,
    Home
} from 'lucide-react';
import { TabBar, SafeArea } from 'antd-mobile';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import { getUnitColor } from '../../lib/colorMappings';
import useIsMobile from '../../hooks/useIsMobile';
import logo from '../../img/logo.svg';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const SIDER_WIDTH = 224;

// Resolves human-friendly category and title for header breadcrumb
const getPageMeta = (pathname) => {
    if (pathname === '/home' || pathname === '/') {
        return { category: 'Dashboard', title: 'System Overview' };
    }
    if (pathname.startsWith('/routine-summary') || pathname.startsWith('/routine-indent')) {
        return { category: 'Workflows', title: 'Routine Shelf Indent' };
    }
    if (pathname === '/indent') {
        return { category: 'Workflows', title: 'Urgent / Ad-Hoc Indent' };
    }
    if (pathname === '/cart') {
        return { category: 'Supply Chain', title: 'Indent Cart & Dispatch' };
    }
    if (pathname === '/indent-list') {
        return { category: 'Records', title: 'Indent History & Audit' };
    }
    if (pathname === '/shortexp') {
        return { category: 'Surveillance', title: 'Short Expiry Surveillance' };
    }
    if (pathname === '/shortexp-entry') {
        return { category: 'Surveillance', title: 'Short Expiry Entry' };
    }
    if (pathname === '/shortexp-archive') {
        return { category: 'Surveillance', title: 'Short Expiry Archive' };
    }
    if (pathname === '/admin') {
        return { category: 'Administration', title: 'System Admin Panel' };
    }
    return { category: 'ARISE', title: 'Inventory Engine' };
};

// Generates two-letter initials for user avatar
const getInitials = (name) => {
    if (!name) return 'US';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Shared Brand Header component for desktop Sider & tablet Drawer
const BrandHeader = () => (
    <div style={{
        padding: '24px 18px 18px',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at top, rgba(2, 132, 199, 0.15) 0%, rgba(7, 13, 30, 0) 70%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        position: 'relative'
    }}>
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 58,
            height: 58,
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
            marginBottom: 10
        }}>
            <img
                src={logo}
                alt="ARISE Logo"
                style={{
                    width: 40,
                    height: 40,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 10px rgba(2, 132, 199, 0.35))'
                }}
            />
        </div>
        <div style={{
            color: '#ffffff',
            letterSpacing: '5px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #ffffff 0%, #bae6fd 60%, #e0e7ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textTransform: 'uppercase',
            fontSize: '22px',
            lineHeight: 1.2,
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
        }}>
            ARISE
        </div>
        <div style={{
            color: 'rgba(255, 255, 255, 0.45)',
            fontSize: '9.5px',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            marginTop: 4,
            fontWeight: 600,
            lineHeight: 1.4,
            fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
            Jabatan Farmasi<br />Hospital Segamat
        </div>
    </div>
);

// Sidebar Footer status widget
const SidebarFooter = () => (
    <div style={{
        padding: '12px 14px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        background: 'rgba(5, 9, 20, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 'auto'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
                flexShrink: 0
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'rgba(255, 255, 255, 0.85)',
                    letterSpacing: '0.3px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}>
                    ARISE v1.1.4
                </span>
                <span style={{
                    fontSize: '9.5px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    Online
                </span>
            </div>
        </div>

    </div>
);

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
    const pageMeta = useMemo(() => getPageMeta(location.pathname), [location.pathname]);
    const isHomePage = location.pathname === '/home' || location.pathname === '/';
    const todayFormatted = useMemo(() => dayjs().format('ddd, D MMM YYYY'), []);

    const userMenu = {
        items: [
            {
                key: 'header',
                label: (
                    <div style={{ padding: '6px 4px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{
                                width: 38,
                                height: 38,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '13px',
                                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                                flexShrink: 0
                            }}>
                                {getInitials(profile?.name || user?.name || 'AD')}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{
                                    fontWeight: 700,
                                    fontSize: '13.5px',
                                    color: '#0f172a',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: 160
                                }}>
                                    {profile?.name || user?.name || 'Staff User'}
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    color: '#64748b',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: 160
                                }}>
                                    {user?.email || profile?.role || 'User'}
                                </div>
                            </div>
                        </div>
                        {currentUnit && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                <Tag
                                    color={getUnitColor(currentUnit)}
                                    style={{
                                        margin: 0,
                                        fontWeight: 700,
                                        fontSize: '11px',
                                        borderRadius: 4,
                                        padding: '1px 8px',
                                        border: 'none'
                                    }}
                                >
                                    {currentUnit}
                                </Tag>
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>·</span>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                                    {profile?.role || (isIssuer ? 'Issuer' : 'Indenter')}
                                </span>
                            </div>
                        )}
                    </div>
                )
            },
            { type: 'divider' },
            {
                key: 'editProfile',
                icon: <User size={15} color="#0284c7" />,
                label: <span style={{ fontWeight: 500, fontSize: '13px' }}>Edit Profile & Password</span>,
                onClick: openProfileModal
            },
            { type: 'divider' },
            {
                key: 'logout',
                icon: <LogOut size={15} color="#ef4444" />,
                label: <span style={{ fontWeight: 600, fontSize: '13px', color: '#ef4444' }}>Sign Out</span>,
                onClick: handleSignOut
            }
        ]
    };

    // Base menu items available to all
    const menuItems = useMemo(() => {
        const items = [
            {
                key: '/home',
                icon: <LayoutDashboard size={17} strokeWidth={2.2} />,
                label: 'Home Overview',
            },
            {
                type: 'divider',
                style: {
                    borderColor: 'rgba(255, 255, 255, 0.07)',
                    margin: '8px 10px'
                }
            },
            {
                key: '/routine-summary',
                icon: <ClipboardList size={17} strokeWidth={2.2} />,
                label: 'Routine Indent',
            },
            {
                key: '/indent',
                icon: <Zap size={17} strokeWidth={2.2} />,
                label: 'Urgent Indent',
            },
        ];

        if (isIssuer) {
            items.push(
                {
                    key: '/cart',
                    icon: <ShoppingCart size={17} strokeWidth={2.2} />,
                    label: 'Indent Cart',
                },
                {
                    key: '/admin',
                    icon: <ShieldCheck size={17} strokeWidth={2.2} />,
                    label: 'Admin Panel',
                }
            );
        }

        items.push(
            {
                type: 'divider',
                style: {
                    borderColor: 'rgba(255, 255, 255, 0.07)',
                    margin: '8px 10px'
                }
            },
            {
                key: '/indent-list',
                icon: <History size={17} strokeWidth={2.2} />,
                label: 'Indent Records',
            },
            {
                key: '/shortexp',
                icon: <AlertTriangle size={17} strokeWidth={2.2} />,
                label: 'Short Expiry',
            },
            {
                key: '/shortexp-archive',
                icon: <Archive size={17} strokeWidth={2.2} />,
                label: 'Short Exp Archive',
            }
        );

        return items;
    }, [isIssuer]);

    const handleMenuClick = ({ key }) => {
        navigate(key);
        setMobileMenuOpen(false);
    };

    // TabBar items for persistent mobile navigation
    const mobileTabItems = useMemo(() => [
        {
            key: '/home',
            title: 'Home',
            icon: <Home size={19} strokeWidth={2.2} />,
        },
        {
            key: '/routine-summary',
            title: 'Routine',
            icon: <ClipboardList size={19} strokeWidth={2.2} />,
        },
        {
            key: '/indent',
            title: 'Urgent',
            icon: <Zap size={19} strokeWidth={2.2} />,
        },
        ...(isIssuer ? [{
            key: '/cart',
            title: 'Cart',
            icon: <ShoppingCart size={19} strokeWidth={2.2} />,
        }] : []),
        {
            key: '/shortexp',
            title: 'Short Exp',
            icon: <AlertTriangle size={19} strokeWidth={2.2} />,
        },
        {
            key: '/indent-list',
            title: 'Records',
            icon: <History size={19} strokeWidth={2.2} />,
        },
    ], [isIssuer]);

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
        <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
            {/* Desktop Sidebar (hidden on mobile) */}
            {!isMobile && (
                <Sider
                    width={SIDER_WIDTH}
                    style={{
                        height: '100vh',
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                    className="desktop-sider arise-sidebar-sider"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
                        <BrandHeader />
                        <div style={{ flex: 1, padding: '8px 0' }}>
                            <Menu
                                theme="dark"
                                mode="inline"
                                selectedKeys={[location.pathname]}
                                items={menuItems}
                                onClick={handleMenuClick}
                                className="arise-sidebar-menu"
                            />
                        </div>
                        <SidebarFooter />
                    </div>
                </Sider>
            )}

            {/* Mobile Drawer (used on tablet viewports 768px-991px) */}
            {!isMobile && (
                <Drawer
                    placement="left"
                    onClose={() => setMobileMenuOpen(false)}
                    open={mobileMenuOpen}
                    className="mobile-drawer arise-drawer-container"
                    styles={{
                        body: { padding: 0, backgroundColor: '#070d1e' },
                        header: { display: 'none' }
                    }}
                    width={260}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <BrandHeader />
                        <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
                            <Menu
                                theme="dark"
                                mode="inline"
                                selectedKeys={[location.pathname]}
                                items={menuItems}
                                onClick={handleMenuClick}
                                className="arise-sidebar-menu"
                            />
                        </div>
                        <SidebarFooter />
                    </div>
                </Drawer>
            )}

            <Layout className="main-content-layout" style={{ background: '#f8fafc' }}>
                {/* Header (hidden on mobile) */}
                {!isMobile && (
                    <Header
                        className="site-header"
                        style={{
                            height: 68,
                            lineHeight: 'normal',
                            padding: '0 24px',
                            background: 'rgba(255, 255, 255, 0.88)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid #e2e8f0',
                            position: 'sticky',
                            top: 0,
                            zIndex: 90,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {/* Left: Mobile hamburger (tablet only) + Breadcrumb Context */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, height: '100%' }}>
                            <Button
                                type="text"
                                icon={<MenuIcon size={20} />}
                                onClick={() => setMobileMenuOpen(true)}
                                className="mobile-menu-button"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    color: '#334155'
                                }}
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: '11px',
                                    color: '#64748b',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.6px',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    lineHeight: 1.2,
                                    marginBottom: 2
                                }}>
                                    <span>ARISE</span>
                                    <span style={{ color: '#cbd5e1' }}>/</span>
                                    <span style={{ color: '#0284c7' }}>{pageMeta.category}</span>
                                </div>
                                <div style={{
                                    fontSize: '15px',
                                    fontWeight: 700,
                                    color: '#0f172a',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    letterSpacing: '-0.2px',
                                    lineHeight: 1.2,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {pageMeta.title}
                                </div>
                            </div>
                        </div>

                        {/* Right: Date Badge + Unit Tag + User Profile Pill */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                                className="header-date-pill"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '5px 11px',
                                    borderRadius: 20,
                                    background: '#f1f5f9',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#475569',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                                }}
                            >
                                <Calendar size={13} color="#0284c7" />
                                <span>{todayFormatted}</span>
                            </div>

                            {currentUnit && (
                                <Tag
                                    color={getUnitColor(currentUnit)}
                                    style={{
                                        margin: 0,
                                        fontWeight: 700,
                                        fontSize: '12px',
                                        padding: '4px 10px',
                                        borderRadius: 6,
                                        border: 'none',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                                    }}
                                >
                                    {currentUnit}
                                </Tag>
                            )}

                            {user && (
                                <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
                                    <div
                                        className="arise-user-trigger"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 9,
                                            padding: '4px 10px 4px 6px',
                                            borderRadius: 24,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            border: '1px solid #e2e8f0',
                                            background: '#ffffff',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                        }}
                                    >
                                        <div style={{
                                            width: 30,
                                            height: 30,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontWeight: 700,
                                            fontSize: '12px',
                                            flexShrink: 0,
                                            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                                        }}>
                                            {getInitials(profile?.name || user?.name || 'AD')}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
                                            <span style={{
                                                fontSize: '12.5px',
                                                fontWeight: 700,
                                                color: '#1e293b',
                                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                maxWidth: 110,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {profile?.name || user?.name || 'Admin'}
                                            </span>
                                            <span style={{
                                                fontSize: '10.5px',
                                                color: '#64748b',
                                                fontWeight: 500
                                            }}>
                                                {profile?.role || (isIssuer ? 'Issuer' : 'Indenter')}
                                            </span>
                                        </div>
                                        <ChevronDown size={14} color="#64748b" style={{ marginLeft: 2 }} />
                                    </div>
                                </Dropdown>
                            )}
                        </div>
                    </Header>
                )}

                {/* Main Content Area */}
                <Content
                    className="site-content"
                    style={{
                        margin: 0,
                        padding: isMobile ? 0 : (isHomePage ? '16px 24px 36px' : '20px 24px 36px'),
                        minWidth: 0,
                        background: '#f8fafc'
                    }}
                >
                    {isHomePage || isMobile ? (
                        <Outlet />
                    ) : (
                        <div style={{
                            background: '#ffffff',
                            borderRadius: 14,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                            padding: 24,
                            minHeight: 400
                        }}>
                            <Outlet />
                        </div>
                    )}
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
                        background: 'rgba(255, 255, 255, 0.94)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderTop: '1px solid #e2e8f0',
                        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.05)',
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
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        fontSize: '11px',
                                        fontWeight: 600,
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
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 6 }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: isForcedChange ? '#fef2f2' : '#f0f9ff',
                            border: `1px solid ${isForcedChange ? '#fecaca' : '#bae6fd'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isForcedChange ? '#dc2626' : '#0284c7'
                        }}>
                            {isForcedChange ? <KeyRound size={18} /> : <User size={18} />}
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                {isForcedChange ? "Action Required: Update Password" : "Staff Profile & Credentials"}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>
                                {isForcedChange ? "Please set a secure new password to continue." : "Manage your user details and optional PHIS credentials."}
                            </div>
                        </div>
                    </div>
                }
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
                width={480}
            >
                <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                    style={{ marginTop: 12 }}
                >
                    {!isForcedChange && (
                        <>
                            <Form.Item
                                name="name"
                                label={<span style={{ fontWeight: 600, fontSize: '13px' }}>Full Name</span>}
                                rules={[{ required: true, message: 'Please input your name' }]}
                            >
                                <Input placeholder="Enter your full name" size="large" style={{ borderRadius: 8 }} />
                            </Form.Item>
                            <Form.Item
                                name="email"
                                label={<span style={{ fontWeight: 600, fontSize: '13px' }}>Email Address</span>}
                                rules={[
                                    { required: true, message: 'Please input your email' },
                                    { type: 'email', message: 'Please enter a valid email address' }
                                ]}
                            >
                                <Input placeholder="Enter your email" size="large" style={{ borderRadius: 8 }} />
                            </Form.Item>
                        </>
                    )}

                    <div style={{
                        marginTop: 16,
                        marginBottom: 16,
                        padding: '14px 16px',
                        background: '#f8fafc',
                        borderRadius: 10,
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>
                            <Lock size={15} color="#0284c7" />
                            <span>{isForcedChange ? "Set New Password (Required)" : "Change Password (Optional)"}</span>
                        </div>
                        <Form.Item
                            name="newPassword"
                            label={<span style={{ fontWeight: 500, fontSize: '12.5px' }}>{isForcedChange ? "New Password" : "New Password (leave blank to keep current)"}</span>}
                            rules={[
                                { required: isForcedChange, message: 'Please input your new password!' },
                                { min: 6, message: 'Password must be at least 6 characters!' }
                            ]}
                            style={{ marginBottom: 12 }}
                        >
                            <Input.Password autoComplete="off" placeholder="Enter new password" size="large" style={{ borderRadius: 8 }} />
                        </Form.Item>
                        <Form.Item
                            name="confirmPassword"
                            label={<span style={{ fontWeight: 500, fontSize: '12.5px' }}>Confirm New Password</span>}
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
                            style={{ marginBottom: 0 }}
                        >
                            <Input.Password autoComplete="off" placeholder="Confirm new password" size="large" style={{ borderRadius: 8 }} />
                        </Form.Item>
                    </div>

                    <div style={{
                        padding: '14px 16px',
                        background: '#f8fafc',
                        borderRadius: 10,
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>
                            <KeyRound size={15} color="#6366f1" />
                            <span>PHIS Credentials (Optional)</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 12 }}>
                            Optional credentials used for seamless automated inventory sync with hospital PHIS.
                        </div>
                        <Form.Item name="phis_username" label={<span style={{ fontWeight: 500, fontSize: '12.5px' }}>PHIS Username</span>} style={{ marginBottom: 12 }}>
                            <Input autoComplete="off" placeholder="PHIS login id" size="large" style={{ borderRadius: 8 }} />
                        </Form.Item>
                        <Form.Item name="phis_password" label={<span style={{ fontWeight: 500, fontSize: '12.5px' }}>PHIS Password</span>} style={{ marginBottom: 0 }}>
                            <Input.Password autoComplete="off" placeholder="PHIS password" size="large" style={{ borderRadius: 8 }} />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>

            <style>{`
        /* Executive Sidebar Styling */
        .arise-sidebar-sider {
          background: linear-gradient(180deg, #070d1e 0%, #050914 100%) !important;
          border-right: 1px solid rgba(255, 255, 255, 0.07) !important;
          box-shadow: 2px 0 20px rgba(0, 0, 0, 0.28) !important;
        }
        .arise-sidebar-menu.ant-menu-dark {
          background: transparent !important;
          padding: 8px 10px !important;
        }
        .arise-sidebar-menu .ant-menu-item {
          border-radius: 9px !important;
          margin: 3px 0 !important;
          width: 100% !important;
          font-weight: 500 !important;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
          font-size: 13px !important;
          height: 40px !important;
          line-height: 40px !important;
          color: rgba(255, 255, 255, 0.72) !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          display: flex !important;
          align-items: center !important;
          padding-left: 14px !important;
        }
        .arise-sidebar-menu .ant-menu-item:hover {
          background: rgba(255, 255, 255, 0.06) !important;
          color: #ffffff !important;
        }
        .arise-sidebar-menu .ant-menu-item-selected {
          background: linear-gradient(90deg, rgba(2, 132, 199, 0.22) 0%, rgba(99, 102, 241, 0.14) 100%) !important;
          color: #38bdf8 !important;
          font-weight: 600 !important;
          box-shadow: inset 3px 0 0 #0284c7, 0 2px 10px rgba(2, 132, 199, 0.15) !important;
        }
        .arise-sidebar-menu .ant-menu-item-selected svg {
          color: #38bdf8 !important;
          filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.45));
        }
        .arise-user-trigger:hover {
          border-color: #cbd5e1 !important;
          background: #f8fafc !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06) !important;
        }
        .site-header {
          line-height: normal !important;
        }

        /* Mobile TabBar optimization */
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

        /* Responsive Layout Breakpoints */
        .main-content-layout {
          margin-left: 0;
          min-width: 0;
          transition: margin-left 0.2s ease;
        }
        @media (min-width: 992px) {
          .main-content-layout {
            margin-left: ${SIDER_WIDTH}px !important;
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
          .header-date-pill {
            display: none !important;
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
            padding: 0 !important;
            padding-bottom: calc(65px + env(safe-area-inset-bottom, 0px)) !important;
            min-width: 0 !important;
            background: transparent !important;
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
            margin-top: 68px !important;
            min-width: 0 !important;
          }
        }
      `}</style>
        </Layout>
    );
};

export default MainLayout;
