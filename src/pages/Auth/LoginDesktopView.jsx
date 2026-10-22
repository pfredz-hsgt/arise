import React, { useState, useRef, useEffect } from 'react';
import { Form, Input, Typography, Modal, ConfigProvider, theme } from 'antd';
import { motion } from 'framer-motion';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ShieldCheck,
    CheckCircle2
} from 'lucide-react';

const { Title } = Typography;

// Safely resolve base URL for public assets
const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
const logoObj = `${baseUrl}logo-obj.png`;

/**
 * Prominent, Elegant Ambient Particle Constellation Canvas
 * Crisp, glowing particles with luminous constellation connections
 */
const ProminentParticleCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        // Prominent particle count and vibrant color palette
        const particleCount = Math.min(Math.floor((width * height) / 18000), 65);
        const particles = [];
        const colors = ['#00e5ff', '#38bdf8', '#60a5fa', '#a855f7', '#fbbf24'];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                radius: Math.random() * 1.8 + 1.4, // larger radius for prominence
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: Math.random() * 0.35 + 0.5, // clearly visible alpha (0.50 - 0.85)
                pulseSpeed: Math.random() * 0.02 + 0.015
            });
        }

        const mouse = { x: -9999, y: -9999, radius: 150 };

        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const handleMouseLeave = () => {
            mouse.x = -9999;
            mouse.y = -9999;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        let tick = 0;
        const render = () => {
            tick++;
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                // Mouse proximity brightening and connection
                const dxMouse = mouse.x - p.x;
                const dyMouse = mouse.y - p.y;
                const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
                let currentAlpha = p.alpha + Math.sin(tick * p.pulseSpeed) * 0.12;

                if (distMouse < mouse.radius) {
                    currentAlpha = Math.min(1.0, currentAlpha + 0.4);

                    // Luminous connection line from cursor to particle
                    ctx.save();
                    ctx.strokeStyle = '#38bdf8';
                    ctx.globalAlpha = (1 - distMouse / mouse.radius) * 0.45;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                    ctx.restore();
                }

                // Render glowing particle node
                ctx.save();
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.min(1.0, Math.max(0.2, currentAlpha));
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Connect with nearby particles with crisp constellation lines
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 145) {
                        const lineAlpha = (1 - dist / 145) * 0.28;
                        ctx.save();
                        ctx.strokeStyle = p.color;
                        ctx.globalAlpha = lineAlpha;
                        ctx.lineWidth = 0.75;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
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
                zIndex: 2
            }}
        />
    );
};

/**
 * Professional, Sleek Login Desktop View for Hospital Inventory System
 * Luminous gradient background with gentle glowing animation & prominent particles
 */
const LoginDesktopView = ({
    loading,
    resetModalVisible,
    setResetModalVisible,
    resetLoading,
    resetForm,
    onFinish,
    handleResetPassword,
    form
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const handleFormSubmit = async (values) => {
        try {
            await onFinish(values);
        } catch {
            // Error managed by useLoginPage
        }
    };

    return (
        <div className="login-container">
            {/* Scoped CSS Styles with Animated Gradient & Glowing Auroras */}
            <style>{`
                .login-container {
                    position: relative;
                    min-height: 100vh;
                    width: 100%;
                    overflow: hidden;
                    background-color: #0b1329;
                    background-image: 
                        radial-gradient(ellipse 90% 65% at 50% -10%, rgba(14, 165, 233, 0.28) 0%, transparent 70%),
                        radial-gradient(ellipse 70% 60% at 85% 90%, rgba(124, 58, 237, 0.22) 0%, transparent 65%),
                        radial-gradient(ellipse 65% 55% at 15% 85%, rgba(13, 148, 136, 0.18) 0%, transparent 60%),
                        radial-gradient(circle at 50% 50%, #0d1b3e 0%, #081024 100%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    color: #f8fafc;
                    padding: 24px 16px;
                }

                /* Animated Glowing Background Aurora Blobs */
                .aurora-layer {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 1;
                    overflow: hidden;
                }
                .aurora-blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(90px);
                    opacity: 0.65;
                }
                .aurora-1 {
                    top: -10%;
                    left: 20%;
                    width: 550px;
                    height: 550px;
                    background: radial-gradient(circle, rgba(2, 132, 199, 0.45) 0%, rgba(14, 165, 233, 0.15) 60%, transparent 75%);
                    animation: floatGlow1 12s ease-in-out infinite alternate;
                }
                .aurora-2 {
                    bottom: -15%;
                    right: 15%;
                    width: 600px;
                    height: 600px;
                    background: radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, rgba(99, 102, 241, 0.12) 60%, transparent 75%);
                    animation: floatGlow2 14s ease-in-out infinite alternate;
                }
                .aurora-3 {
                    bottom: 10%;
                    left: -10%;
                    width: 480px;
                    height: 480px;
                    background: radial-gradient(circle, rgba(20, 184, 166, 0.3) 0%, rgba(56, 189, 248, 0.1) 60%, transparent 75%);
                    animation: floatGlow3 11s ease-in-out infinite alternate;
                }

                @keyframes floatGlow1 {
                    0% { transform: translate(0, 0) scale(1); opacity: 0.55; }
                    50% { transform: translate(40px, 30px) scale(1.12); opacity: 0.75; }
                    100% { transform: translate(-30px, 50px) scale(0.95); opacity: 0.6; }
                }
                @keyframes floatGlow2 {
                    0% { transform: translate(0, 0) scale(1); opacity: 0.45; }
                    50% { transform: translate(-50px, -40px) scale(1.15); opacity: 0.68; }
                    100% { transform: translate(30px, -30px) scale(0.92); opacity: 0.5; }
                }
                @keyframes floatGlow3 {
                    0% { transform: translate(0, 0) scale(1); opacity: 0.4; }
                    50% { transform: translate(35px, -35px) scale(1.18); opacity: 0.62; }
                    100% { transform: translate(-25px, 20px) scale(0.96); opacity: 0.45; }
                }

                /* Sleek Enterprise Glass Card */
                .auth-card {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 420px;
                    background: rgba(15, 23, 42, 0.78);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 22px;
                    padding: 40px 36px 36px 36px;
                    box-shadow: 
                        0 25px 50px -12px rgba(0, 0, 0, 0.55),
                        0 0 35px rgba(14, 165, 233, 0.12),
                        inset 0 1px 0 rgba(255, 255, 255, 0.12);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                }

                /* Logo & Title */
                .logo-wrapper {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo-img {
                    width: 160px;
                    height: auto;
                    object-fit: contain;
                    margin-bottom: 0px;
                    filter: drop-shadow(0 8px 20px rgba(14, 165, 233, 0.35));
                }
                .brand-title {
                    font-family: 'Plus Jakarta Sans', 'Inter', sans-serif !important;
                    font-size: 36px !important;
                    font-weight: 400 !important;
                    letter-spacing: 4px !important;
                    margin: 0 0 4px 0 !important;
                    color: #ffffff !important;
                }
                .brand-subtitle {
                    display: block;
                    font-size: 12px;
                    font-weight: 300;
                    color: #cbd5e1;
                    letter-spacing: 0.2px;
                    margin-top: 2px;
                }
                .brand-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 10px;
                    padding: 4px 12px;
                    border-radius: 20px;
                    background: rgba(14, 165, 233, 0.15);
                    border: 1px solid rgba(56, 189, 248, 0.3);
                    font-size: 11.5px;
                    font-weight: 600;
                    color: #38bdf8;
                    letter-spacing: 0.2px;
                }

                /* Form Field Styles */
                .field-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #e2e8f0;
                    margin-bottom: 7px;
                }

                .clean-input-box {
                    background: rgba(30, 41, 59, 0.72);
                    border: 1px solid rgba(148, 163, 184, 0.24);
                    border-radius: 10px;
                    padding: 3px 12px;
                    transition: all 0.2s ease;
                }
                .clean-input-box:focus-within {
                    border-color: #38bdf8;
                    background: rgba(30, 41, 59, 0.95);
                    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
                }

                /* Ant Design input overrides */
                .clean-input-box .ant-input-affix-wrapper,
                .clean-input-box .ant-input {
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    color: #ffffff !important;
                    font-size: 14.5px !important;
                    padding: 8px 0 !important;
                    font-family: inherit !important;
                }
                .clean-input-box input {
                    color: #ffffff !important;
                }
                .clean-input-box input::placeholder {
                    color: #94a3b8 !important;
                    font-size: 13.5px !important;
                }

                /* Professional Submit Button */
                .submit-btn {
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
                    transition: all 0.2s ease;
                    margin-top: 10px;
                }
                .submit-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
                    box-shadow: 0 6px 22px rgba(2, 132, 199, 0.5);
                    transform: translateY(-1px);
                }
                .submit-btn:active:not(:disabled) {
                    transform: translateY(0);
                }
                .submit-btn:disabled {
                    opacity: 0.65;
                    cursor: not-allowed;
                }

                /* Forgot password link */
                .forgot-link {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    padding: 6px 8px;
                    border-radius: 6px;
                    transition: color 0.2s ease;
                }
                .forgot-link:hover {
                    color: #38bdf8;
                }

                /* Bottom footer info */
                .auth-footer {
                    margin-top: 24px;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    gap: 6px;
                    z-index: 10;
                }
            `}</style>

            {/* Glowing Aurora Background Blobs */}
            <div className="aurora-layer">
                <div className="aurora-blob aurora-1" />
                <div className="aurora-blob aurora-2" />
                <div className="aurora-blob aurora-3" />
            </div>

            {/* Prominent Particle Constellation Canvas */}
            <ProminentParticleCanvas />

            {/* Sleek Enterprise Card */}
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
            >
                {/* Brand Header */}
                <div className="logo-wrapper">
                    <img src={logoObj} alt="ARISE" className="logo-img" />
                    <Title level={1} className="brand-title">
                        ARISE
                    </Title>
                    <span className="brand-subtitle">
                        Agile · Restock · Inventory · Surveillance · Engine
                    </span>
                    <div className="brand-badge">
                        <ShieldCheck size={13} />
                        <span>Hospital Segamat</span>
                    </div>
                </div>

                {/* Form */}
                <Form
                    form={form}
                    name="login_desktop"
                    onFinish={handleFormSubmit}
                    layout="vertical"
                    size="large"
                    requiredMark={false}
                >
                    {/* Email Input */}
                    <div style={{ marginBottom: 18 }}>
                        <label className="field-label">Email Address</label>
                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Please enter your email address' },
                                { type: 'email', message: 'Please enter a valid email address' }
                            ]}
                            style={{ marginBottom: 0 }}
                        >
                            <div className="clean-input-box">
                                <Input
                                    prefix={<Mail size={16} style={{ color: '#94a3b8', marginRight: 10 }} />}
                                    placeholder="name@moh.gov.my"
                                    autoComplete="email"
                                />
                            </div>
                        </Form.Item>
                    </div>

                    {/* Password Input */}
                    <div style={{ marginBottom: 22 }}>
                        <label className="field-label">Password</label>
                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Please enter your password' }]}
                            style={{ marginBottom: 0 }}
                        >
                            <div className="clean-input-box">
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
                        className="submit-btn"
                        disabled={loading}
                    >
                        <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                        {!loading && <ArrowRight size={16} />}
                    </button>

                    {/* Forgot Password */}
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <button
                            type="button"
                            onClick={() => setResetModalVisible(true)}
                            className="forgot-link"
                        >
                            Forgot Password?
                        </button>
                    </div>
                </Form>
            </motion.div>

            {/* Footer */}
            <div className="auth-footer" style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <CheckCircle2 size={13} style={{ color: '#22c55e' }} />
                    <span style={{ fontWeight: 500 }}>All Systems Operational</span>
                </div>
                <div>© 2026 • Jabatan Farmasi Hospital Segamat • ARISE v1.1.4</div>
            </div>

            {/* Professional Reset Password Modal */}
            <ConfigProvider
                theme={{
                    algorithm: theme.darkAlgorithm,
                    token: {
                        colorBgElevated: '#0f172a',
                        colorBgContainer: '#1e293b',
                        colorText: '#f8fafc',
                        colorTextHeading: '#ffffff',
                        colorTextPlaceholder: '#64748b',
                        colorPrimary: '#0284c7',
                        colorBorder: 'rgba(148, 163, 184, 0.25)',
                        borderRadius: 10
                    },
                    components: {
                        Modal: {
                            // 2. Override the container box shadow to act as a border glow
                            // You can adjust the spread (8px) and color rgba to fit your style
                            boxShadow: '0 0 20px 2px rgba(124, 58, 237, 0.22)',
                        },
                    },
                }}
            >
                <Modal
                    title={
                        <div style={{ color: '#ffffff', fontSize: 17, fontWeight: 600 }}>
                            Reset Password
                        </div>
                    }
                    open={resetModalVisible}
                    onCancel={() => {
                        setResetModalVisible(false);
                        if (resetForm && resetForm.resetFields) {
                            resetForm.resetFields();
                        }
                    }}
                    footer={null}
                    destroyOnClose
                    centered
                    styles={{
                        mask: {
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            backgroundColor: 'rgba(10, 15, 29, 0.75)'
                        },
                        content: {
                            backgroundColor: '#0f172a',
                            border: '1px solid rgba(148, 163, 184, 0.18)',
                            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6)',
                            borderRadius: '16px',
                            padding: '28px'
                        },
                        header: {
                            backgroundColor: 'transparent',
                            borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                            paddingBottom: '12px',
                            marginBottom: '16px'
                        }
                    }}
                >
                    <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5, marginBottom: 18 }}>
                        Enter your registered email address and we will dispatch a link to reset your password.
                    </p>

                    <Form
                        form={resetForm}
                        onFinish={handleResetPassword}
                        layout="vertical"
                    >
                        <div style={{ marginBottom: 18 }}>
                            <label className="field-label">Email Address</label>
                            <Form.Item
                                name="resetEmail"
                                rules={[
                                    { required: true, message: 'Please input your email!' },
                                    { type: 'email', message: 'Please enter a valid email!' }
                                ]}
                                style={{ marginBottom: 0 }}
                            >
                                <div className="clean-input-box">
                                    <Input
                                        prefix={<Mail size={16} style={{ color: '#94a3b8', marginRight: 8 }} />}
                                        placeholder="name@moh.gov.my"
                                    />
                                </div>
                            </Form.Item>
                        </div>

                        <Form.Item style={{ marginBottom: 0 }}>
                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={resetLoading}
                                style={{ height: 44, fontSize: 14.5 }}
                            >
                                <span>{resetLoading ? 'Sending...' : 'Send Reset Link'}</span>
                            </button>
                        </Form.Item>
                    </Form>
                </Modal>
            </ConfigProvider>
        </div>
    );
};

export default LoginDesktopView;
