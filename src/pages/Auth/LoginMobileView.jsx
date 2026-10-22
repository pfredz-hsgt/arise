import React, { useState, useRef, useEffect } from 'react';
import { Form, Input, Typography } from 'antd';
import {
    Popup,
    SafeArea,
    Button as MobileButton,
    ConfigProvider
} from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ShieldCheck,
    CheckCircle2,
    X,
    KeyRound,
    User
} from 'lucide-react';

const { Title } = Typography;

// Safely resolve base URL for public assets
const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
const logoObj = `${baseUrl}logo-obj.png`;

/**
 * Lightweight, High-Performance Mobile Particle Canvas
 * - Capped at ~16 particles for ultra-low battery & CPU usage
 * - Pauses automatically when tab/screen is hidden
 * - No touch/mouse event listeners to ensure zero touch latency
 */
const MobileLightParticleCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let isRunning = true;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                isRunning = false;
                cancelAnimationFrame(animationFrameId);
            } else {
                isRunning = true;
                animationFrameId = requestAnimationFrame(render);
            }
        };

        window.addEventListener('resize', handleResize, { passive: true });
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Highly optimized particle count for mobile
        const particleCount = 18;
        const particles = [];
        const colors = ['#00e5ff', '#38bdf8', '#60a5fa', '#a855f7', '#fbbf24'];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.22,
                vy: (Math.random() - 0.5) * 0.22,
                radius: Math.random() * 1.4 + 1.2,
                color: colors[i % colors.length],
                alpha: Math.random() * 0.35 + 0.45
            });
        }

        const render = () => {
            if (!isRunning) return;
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                // Render particle node
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();

                // Connect nearby particles (smaller radius for fast mobile loop)
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < 9000) { // dist < ~95px without Math.sqrt overhead
                        const dist = Math.sqrt(distSq);
                        ctx.strokeStyle = p.color;
                        ctx.globalAlpha = (1 - dist / 95) * 0.22;
                        ctx.lineWidth = 0.6;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            isRunning = false;
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1
            }}
        />
    );
};

/**
 * Mobile Login View
 * Matching the sleek, executive desktop styling with mobile-optimized performance:
 * - Ultra-lightweight particle canvas (18 particles, auto-pause on sleep/blur)
 * - Hardware-accelerated ambient glowing gradients
 * - Touch-friendly form inputs with built-in password visibility toggle
 * - Elegant dark theme bottom sheet drawer for password recovery
 */
const LoginMobileView = ({
    loading,
    resetModalVisible,
    setResetModalVisible,
    resetLoading,
    resetForm,
    onFinish,
    handleResetPassword
}) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <ConfigProvider locale={enUS}>
            <div className="mobile-login-root">
                {/* Scoped CSS Styles with Mobile Performance Tuning */}
                <style>{`
                    .mobile-login-root {
                        min-height: 100vh;
                        min-height: 100dvh;
                        display: flex;
                        flex-direction: column;
                        background-color: #0b1329;
                        background-image: 
                            radial-gradient(ellipse 95% 55% at 50% 0%, rgba(14, 165, 233, 0.25) 0%, transparent 65%),
                            radial-gradient(ellipse 75% 50% at 85% 95%, rgba(124, 58, 237, 0.18) 0%, transparent 65%),
                            radial-gradient(circle at 50% 50%, #0d1b3e 0%, #081024 100%);
                        position: relative;
                        overflow-x: hidden;
                        overflow-y: auto;
                        font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                        color: #f8fafc;
                        -webkit-tap-highlight-color: transparent;
                    }

                    /* Lightweight ambient aurora glow (hardware accelerated) */
                    .mobile-aurora-glow {
                        position: absolute;
                        top: 2%;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 320px;
                        height: 320px;
                        border-radius: 50%;
                        background: radial-gradient(circle, rgba(2, 132, 199, 0.35) 0%, rgba(14, 165, 233, 0.1) 60%, transparent 75%);
                        filter: blur(60px);
                        pointer-events: none;
                        z-index: 1;
                    }

                    /* Hero Branding Section */
                    .mobile-hero-section {
                        text-align: center;
                        padding: 38px 20px 20px 20px;
                        position: relative;
                        z-index: 2;
                    }

                    .mobile-logo-img {
                        width: 120px;
                        height: auto;
                        max-height: 125px;
                        object-fit: contain;
                        filter: drop-shadow(0 6px 18px rgba(14, 165, 233, 0.35));
                    }

                    .mobile-brand-title {
                        font-family: 'Plus Jakarta Sans', 'Inter', sans-serif !important;
                        font-size: 32px !important;
                        font-weight: 400 !important;
                        letter-spacing: 4px !important;
                        margin: 2px 0 2px 0 !important;
                        color: #ffffff !important;
                        line-height: 1.15 !important;
                    }

                    .mobile-brand-subtitle {
                        display: block;
                        font-size: 11px;
                        font-weight: 300;
                        color: #cbd5e1;
                        letter-spacing: 0.2px;
                        margin-top: 2px;
                    }

                    .mobile-brand-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 5px;
                        margin-top: 10px;
                        padding: 4px 12px;
                        border-radius: 20px;
                        background: rgba(14, 165, 233, 0.15);
                        border: 1px solid rgba(56, 189, 248, 0.3);
                        font-size: 11px;
                        font-weight: 600;
                        color: #38bdf8;
                        letter-spacing: 0.2px;
                    }

                    /* Sleek Mobile Card Container */
                    .mobile-auth-card {
                        margin: 8px 16px 20px 16px;
                        background: rgba(15, 23, 42, 0.85);
                        border: 1px solid rgba(255, 255, 255, 0.12);
                        border-radius: 20px;
                        padding: 24px 20px 22px 20px;
                        box-shadow: 
                            0 16px 36px -10px rgba(0, 0, 0, 0.5),
                            0 0 25px rgba(14, 165, 233, 0.08);
                        backdrop-filter: blur(16px);
                        -webkit-backdrop-filter: blur(16px);
                        position: relative;
                        z-index: 2;
                    }

                    .mobile-field-label {
                        display: block;
                        font-size: 12.5px;
                        font-weight: 600;
                        color: #e2e8f0;
                        margin-bottom: 6px;
                    }

                    .mobile-input-box {
                        background: rgba(30, 41, 59, 0.72);
                        border: 1px solid rgba(148, 163, 184, 0.24);
                        border-radius: 10px;
                        padding: 2px 12px;
                        transition: border-color 0.2s ease, box-shadow 0.2s ease;
                    }
                    .mobile-input-box:focus-within {
                        border-color: #38bdf8;
                        background: rgba(30, 41, 59, 0.95);
                        box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
                    }

                    /* Input Affix Overrides */
                    .mobile-input-box .ant-input-affix-wrapper,
                    .mobile-input-box .ant-input {
                        background: transparent !important;
                        border: none !important;
                        box-shadow: none !important;
                        color: #ffffff !important;
                        font-size: 15px !important;
                        padding: 9px 0 !important;
                        font-family: inherit !important;
                    }
                    .mobile-input-box input {
                        color: #ffffff !important;
                        font-size: 15px !important;
                    }
                    .mobile-input-box input::placeholder {
                        color: #6e7a8bff !important;
                        font-size: 13.5px !important;
                    }

                    /* Primary Mobile Button */
                    .mobile-submit-btn {
                        width: 100%;
                        height: 48px;
                        border-radius: 10px;
                        background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
                        border: none;
                        color: #ffffff;
                        font-size: 15px;
                        font-weight: 600;
                        letter-spacing: 0.3px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        box-shadow: 0 4px 16px rgba(2, 132, 199, 0.4);
                        transition: opacity 0.2s ease, transform 0.1s ease;
                        margin-top: 10px;
                    }
                    .mobile-submit-btn:active:not(:disabled) {
                        transform: scale(0.985);
                    }
                    .mobile-submit-btn:disabled {
                        opacity: 0.65;
                        cursor: not-allowed;
                    }

                    /* Forgot link */
                    .mobile-forgot-link {
                        background: none;
                        border: none;
                        color: #94a3b8;
                        font-size: 13px;
                        font-weight: 500;
                        cursor: pointer;
                        padding: 8px 12px;
                        border-radius: 6px;
                        transition: color 0.2s ease;
                        display: inline-block;
                    }
                    .mobile-forgot-link:active {
                        color: #38bdf8;
                    }

                    /* Footer */
                    .mobile-footer {
                        margin-top: auto;
                        padding: 12px 20px 18px 20px;
                        text-align: center;
                        color: #64748b;
                        font-size: 11px;
                        line-height: 1.6;
                        z-index: 2;
                        position: relative;
                    }

                    /* Dark Theme Mobile Bottom Sheet Drawer */
                    .dark-mobile-popup .adm-popup-body {
                        background: #0f172a !important;
                        border-top-left-radius: 20px !important;
                        border-top-right-radius: 20px !important;
                        border-top: 1px solid rgba(148, 163, 184, 0.25) !important;
                        box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.7) !important;
                        color: #f8fafc !important;
                    }
                `}</style>

                <SafeArea position="top" />

                {/* Ambient Glow */}
                <div className="mobile-aurora-glow" />

                {/* Lightweight Particle Canvas */}
                <MobileLightParticleCanvas />

                {/* Hero Header */}
                <div className="mobile-hero-section">
                    <img
                        src={logoObj}
                        alt="ARISE Logo"
                        className="mobile-logo-img"
                    />

                    <Title level={1} className="mobile-brand-title">
                        ARISE
                    </Title>

                    <span className="mobile-brand-subtitle">
                        Agile · Restock · Inventory · Surveillance · Engine
                    </span>

                    <div className="mobile-brand-badge">
                        <ShieldCheck size={12} />
                        <span>Hospital Segamat</span>
                    </div>
                </div>

                {/* Mobile Form Card */}
                <div className="mobile-auth-card">
                    <Form
                        name="login_mobile"
                        onFinish={onFinish}
                        layout="vertical"
                        requiredMark={false}
                    >
                        {/* Email Input */}
                        <div style={{ marginBottom: 16 }}>
                            <label className="mobile-field-label">Email Address</label>
                            <Form.Item
                                name="email"
                                rules={[
                                    { required: true, message: 'Please enter your email address' },
                                    { type: 'email', message: 'Please enter a valid email address' }
                                ]}
                                style={{ marginBottom: 0 }}
                            >
                                <div className="mobile-input-box">
                                    <Input
                                        prefix={<User size={16} style={{ color: '#94a3b8', marginRight: 10 }} />}
                                        placeholder="name@moh.gov.my"
                                        inputMode="email"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                    />
                                </div>
                            </Form.Item>
                        </div>

                        {/* Password Input */}
                        <div style={{ marginBottom: 20 }}>
                            <label className="mobile-field-label">Password</label>
                            <Form.Item
                                name="password"
                                rules={[{ required: true, message: 'Please enter your password' }]}
                                style={{ marginBottom: 0 }}
                            >
                                <div className="mobile-input-box">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        prefix={<Lock size={16} style={{ color: '#94a3b8', marginRight: 10 }} />}
                                        suffix={
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: '#94a3b8',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: 0
                                                }}
                                                title={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        }
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                    />
                                </div>
                            </Form.Item>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="mobile-submit-btn"
                            disabled={loading}
                        >
                            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                            {!loading && <ArrowRight size={16} />}
                        </button>

                        {/* Forgot Password */}
                        <div style={{ textAlign: 'center', marginTop: 14 }}>
                            <button
                                type="button"
                                onClick={() => setResetModalVisible(true)}
                                className="mobile-forgot-link"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </Form>
                </div>

                {/* Footer Section matching Desktop */}
                <div className="mobile-footer">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                        <CheckCircle2 size={12} style={{ color: '#22c55e' }} />
                        <span style={{ fontWeight: 500, color: '#94a3b8' }}>All Systems Operational</span>
                    </div>
                    <div>© 2026 • Jabatan Farmasi Hospital Segamat • ARISE v1.1.4</div>
                </div>

                <SafeArea position="bottom" />

                {/* Mobile Reset Password Bottom Sheet Drawer (Dark Mode) */}
                <Popup
                    visible={resetModalVisible}
                    onMaskClick={() => !resetLoading && setResetModalVisible(false)}
                    position="bottom"
                    className="dark-mobile-popup"
                    bodyStyle={{
                        background: '#0f172a',
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        maxHeight: '82vh',
                        overflow: 'hidden'
                    }}
                >
                    {/* Drawer Header with Handle */}
                    <div style={{
                        padding: '12px 18px 12px 18px',
                        borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
                        position: 'relative'
                    }}>
                        <div style={{
                            width: 36,
                            height: 4,
                            background: 'rgba(148, 163, 184, 0.3)',
                            borderRadius: 2,
                            margin: '0 auto 12px auto'
                        }} />
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    background: 'rgba(14, 165, 233, 0.15)',
                                    color: '#38bdf8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <KeyRound size={16} />
                                </div>
                                <div>
                                    <span style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', display: 'block' }}>
                                        Reset Password
                                    </span>
                                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                        Account password recovery
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => !resetLoading && setResetModalVisible(false)}
                                style={{
                                    background: 'rgba(30, 41, 59, 0.6)',
                                    border: 'none',
                                    width: 30,
                                    height: 30,
                                    borderRadius: 15,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#94a3b8'
                                }}
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Reset Form Body */}
                    <div style={{ padding: '20px 18px 28px 18px' }}>
                        <div style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            border: '1px solid rgba(148, 163, 184, 0.15)',
                            borderRadius: 10,
                            padding: '12px 14px',
                            fontSize: 12.5,
                            color: '#94a3b8',
                            lineHeight: 1.5,
                            marginBottom: 18
                        }}>
                            Enter your registered email address below. A link to reset your password will be dispatched to your inbox.
                        </div>

                        <Form
                            form={resetForm}
                            onFinish={handleResetPassword}
                            layout="vertical"
                            requiredMark={false}
                        >
                            <div style={{ marginBottom: 18 }}>
                                <label className="mobile-field-label">Email Address</label>
                                <Form.Item
                                    name="resetEmail"
                                    rules={[
                                        { required: true, message: 'Please input your email!' },
                                        { type: 'email', message: 'Please enter a valid email!' }
                                    ]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <div className="mobile-input-box">
                                        <Input
                                            prefix={<Mail size={16} style={{ color: '#94a3b8', marginRight: 8 }} />}
                                            placeholder="name@moh.gov.my"
                                            inputMode="email"
                                            autoCapitalize="none"
                                        />
                                    </div>
                                </Form.Item>
                            </div>

                            <button
                                type="submit"
                                className="mobile-submit-btn"
                                disabled={resetLoading}
                                style={{ height: 46 }}
                            >
                                <span>{resetLoading ? 'Sending...' : 'Send Reset Link'}</span>
                            </button>
                        </Form>
                    </div>

                    <SafeArea position="bottom" />
                </Popup>
            </div>
        </ConfigProvider>
    );
};

export default LoginMobileView;
