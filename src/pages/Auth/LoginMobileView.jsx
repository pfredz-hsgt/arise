import React from 'react';
import { Form, Input, Typography } from 'antd';
import {
    Popup,
    SafeArea,
    Button as MobileButton,
    ConfigProvider
} from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';
import {
    UserOutlined,
    MedicineBoxOutlined,
    MailOutlined,
    CloseOutlined,
    LockOutlined,
    SafetyCertificateOutlined
} from '@ant-design/icons';
import logo from '../../img/logo.svg';

const { Title, Text } = Typography;

const LoginMobileView = ({
    loading,
    resetModalVisible,
    setResetModalVisible,
    resetLoading,
    resetForm,
    onFinish,
    handleResetPassword
}) => {
    return (
        <ConfigProvider locale={enUS}>
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                background: '#f8fafc',
                position: 'relative'
            }}>
                <SafeArea position="top" />

                {/* Branded Header Hero Banner */}
                <div style={{
                    background: 'linear-gradient(145deg, #001529 0%, #002b54 55%, #00457c 100%)',
                    padding: '36px 20px 48px 20px',
                    textAlign: 'center',
                    borderBottomLeftRadius: 32,
                    borderBottomRightRadius: 32,
                    boxShadow: '0 8px 24px rgba(0,21,41,0.18)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Decorative subtle ambient circles */}
                    <div style={{
                        position: 'absolute',
                        top: -40,
                        right: -40,
                        width: 140,
                        height: 140,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(24,144,255,0.2) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: -30,
                        left: -30,
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(0,209,178,0.15) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />

                    {/* Logo & Branding */}
                    <img
                        src={logo}
                        alt="ARISE Logo"
                        style={{
                            maxWidth: '90px',
                            height: 'auto',
                            maxHeight: '85px',
                            marginBottom: 0,
                            filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))'
                        }}
                    />

                    <div style={{
                        fontSize: 34,
                        letterSpacing: '7px',
                        fontWeight: 400,
                        background: 'linear-gradient(to bottom, #e6fdffff 0%, #aee7ffff 50%, #5cc9ffff 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textTransform: 'uppercase',
                        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                        lineHeight: 1.1,
                        margin: '2px 0'
                    }}>
                        ARISE
                    </div>

                    <div style={{
                        display: 'inline-block',
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        padding: '4px 12px',
                        borderRadius: 14,
                        marginTop: 12,
                        border: '1px solid rgba(255,255,255,0.12)'
                    }}>
                        <span style={{
                            color: 'rgba(255,255,255,0.85)',
                            fontSize: 11,
                            letterSpacing: '0.8px',
                            textTransform: 'uppercase',
                            fontWeight: 600
                        }}>
                            Jabatan Farmasi • Hospital Segamat
                        </span>
                    </div>
                </div>

                {/* Mobile Floating Form Card */}
                <div style={{
                    margin: '-24px 16px 24px 16px',
                    background: '#ffffff',
                    borderRadius: 22,
                    padding: '24px 20px 20px 20px',
                    boxShadow: '0 10px 30px rgba(0,21,41,0.08), 0 1px 3px rgba(0,0,0,0.04)',
                    border: '1px solid #eef2f6',
                    position: 'relative',
                    zIndex: 2
                }}>
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                            Sign In
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            Use your credentials provided by administrator
                        </div>
                    </div>

                    <Form
                        name="login_mobile"
                        onFinish={onFinish}
                        layout="vertical"
                        requiredMark={false}
                    >
                        <Form.Item
                            name="email"
                            label={<span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Email Address</span>}
                            rules={[{ required: true, message: 'Please input your email!' }]}
                            style={{ marginBottom: 14 }}
                        >
                            <Input
                                prefix={<UserOutlined style={{ color: '#94a3b8', marginRight: 8, fontSize: 15 }} />}
                                placeholder="name@moh.gov.my"
                                inputMode="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                style={{
                                    borderRadius: 12,
                                    padding: '11px 14px',
                                    fontSize: 15,
                                    border: '1.5px solid #e2e8f0',
                                    background: '#f8fafc'
                                }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={<span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Password</span>}
                            rules={[{ required: true, message: 'Please input your password!' }]}
                            style={{ marginBottom: 20 }}
                        >
                            <Input.Password
                                prefix={<MedicineBoxOutlined style={{ color: '#94a3b8', marginRight: 8, fontSize: 15 }} />}
                                placeholder="Enter password"
                                autoComplete="current-password"
                                style={{
                                    borderRadius: 12,
                                    padding: '11px 14px',
                                    fontSize: 15,
                                    border: '1.5px solid #e2e8f0',
                                    background: '#f8fafc'
                                }}
                            />
                        </Form.Item>

                        <MobileButton
                            type="submit"
                            color="primary"
                            loading={loading}
                            block
                            shape="rounded"
                            style={{
                                height: 48,
                                fontWeight: 700,
                                fontSize: 16,
                                background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
                                boxShadow: '0 6px 18px rgba(22, 119, 255, 0.35)',
                                border: 'none'
                            }}
                        >
                            Sign In
                        </MobileButton>

                        <div style={{ textAlign: 'center', marginTop: 18 }}>
                            <span
                                onClick={() => setResetModalVisible(true)}
                                role="button"
                                tabIndex={0}
                                style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: '#2563eb',
                                    cursor: 'pointer',
                                    padding: '6px 10px',
                                    borderRadius: 8,
                                    WebkitTapHighlightColor: 'transparent'
                                }}
                            >
                                Forgot Password?
                            </span>
                        </div>
                    </Form>
                </div>

                {/* Footer Security Badge */}
                <div style={{
                    marginTop: 'auto',
                    padding: '16px 20px 24px 20px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6
                }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        color: '#94a3b8',
                        fontSize: 11,
                        fontWeight: 500
                    }}>
                        <SafetyCertificateOutlined style={{ color: '#16a34a', fontSize: 13 }} />
                        <span>Kementerian Kesihatan Malaysia</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#bec9d6ff' }}>
                        ARISE Hospital Segamat • v1.1.4
                    </div>
                </div>

                <SafeArea position="bottom" />

                {/* Mobile Reset Password Bottom Sheet Drawer */}
                <Popup
                    visible={resetModalVisible}
                    onMaskClick={() => !resetLoading && setResetModalVisible(false)}
                    position="bottom"
                    bodyStyle={{
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        maxHeight: '80vh',
                        background: '#ffffff',
                        overflow: 'hidden'
                    }}
                >
                    {/* Drag Handle & Header */}
                    <div style={{
                        padding: '12px 18px 12px 18px',
                        borderBottom: '1px solid #f1f5f9',
                        position: 'relative'
                    }}>
                        <div style={{
                            width: 38,
                            height: 4,
                            background: '#cbd5e1',
                            borderRadius: 2,
                            margin: '0 auto 12px auto'
                        }} />
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 17,
                                    background: '#eff6ff',
                                    color: '#2563eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 16
                                }}>
                                    <LockOutlined />
                                </div>
                                <div>
                                    <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'block' }}>
                                        Reset Password
                                    </span>
                                    <span style={{ fontSize: 11, color: '#64748b' }}>
                                        Account password recovery
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => !resetLoading && setResetModalVisible(false)}
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
                                <CloseOutlined style={{ fontSize: 13 }} />
                            </button>
                        </div>
                    </div>

                    {/* Reset Form Body */}
                    <div style={{ padding: '20px 18px 28px 18px' }}>
                        <div style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: 12,
                            padding: '12px 14px',
                            fontSize: 12,
                            color: '#1e40af',
                            lineHeight: 1.5,
                            marginBottom: 16
                        }}>
                            Enter your registered email address below. A temporary password will be dispatched to your inbox.
                        </div>

                        <Form
                            form={resetForm}
                            onFinish={handleResetPassword}
                            layout="vertical"
                            requiredMark={false}
                        >
                            <Form.Item
                                name="resetEmail"
                                label={<span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Email Address</span>}
                                rules={[
                                    { required: true, message: 'Please input your email!' },
                                    { type: 'email', message: 'Please enter a valid email!' }
                                ]}
                                style={{ marginBottom: 20 }}
                            >
                                <Input
                                    prefix={<MailOutlined style={{ color: '#94a3b8', marginRight: 8, fontSize: 15 }} />}
                                    placeholder="Enter your email address"
                                    inputMode="email"
                                    autoCapitalize="none"
                                    style={{
                                        borderRadius: 12,
                                        padding: '11px 14px',
                                        fontSize: 15,
                                        border: '1.5px solid #e2e8f0',
                                        background: '#f8fafc'
                                    }}
                                />
                            </Form.Item>

                            <MobileButton
                                type="submit"
                                color="primary"
                                loading={resetLoading}
                                block
                                shape="rounded"
                                style={{
                                    height: 48,
                                    fontWeight: 700,
                                    fontSize: 15,
                                    background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
                                    boxShadow: '0 4px 14px rgba(22, 119, 255, 0.3)',
                                    border: 'none'
                                }}
                            >
                                Send Reset Link
                            </MobileButton>
                        </Form>
                    </div>

                    <SafeArea position="bottom" />
                </Popup>
            </div>
        </ConfigProvider>
    );
};

export default LoginMobileView;
