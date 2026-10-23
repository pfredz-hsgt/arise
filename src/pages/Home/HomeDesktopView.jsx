import React from 'react';
import { Typography, Select, Spin, Row, Col, Tag, Form } from 'antd';
import { motion } from 'framer-motion';
import {
    ClipboardList,
    Zap,
    ShieldCheck,
    CheckCircle2,
    ArrowRight,
    RotateCcw,
    FileText,
    AlertTriangle,
    BarChart3
} from 'lucide-react';
import { getUnitColor } from '../../lib/colorMappings';
import logo from '../../img/logo.svg';

const { Title, Text } = Typography;
const { Option } = Select;

const HomeDesktopView = ({
    unit,
    profile,
    raks = [],
    loadingRaks = false,
    draftSession,
    handleStartRoutine,
    navigate
}) => {
    return (
        <div className="home-desktop-container">
            <style>{`
                .home-desktop-container {
                    max-width: 980px;
                    margin: 0 auto;
                    padding: 8px 0 32px 0;
                    font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
                }

                /* Hero Header Card */
                .home-hero-card {
                    background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #f5f3ff 100%);
                    border: 1px solid rgba(2, 132, 199, 0.15);
                    border-radius: 20px;
                    padding: 28px 32px;
                    margin-bottom: 24px;
                    box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: relative;
                    overflow: hidden;
                }

                .hero-ambient-glow {
                    position: absolute;
                    top: -50px;
                    right: -50px;
                    width: 220px;
                    height: 220px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%);
                    pointer-events: none;
                }

                /* Active Draft Banner (Amber / Warning Alert) */
                .draft-alert-banner {
                    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fef9c3 100%);
                    border: 1px solid #fde68a;
                    border-radius: 14px;
                    padding: 14px 20px;
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.1);
                }

                /* Primary Mode Cards */
                .mode-card {
                    background: #ffffff;
                    border-radius: 18px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    overflow: hidden;
                }
                .mode-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 16px 32px -8px rgba(0, 0, 0, 0.08);
                }

                .mode-card-routine {
                    border-top: 4px solid #0284c7;
                }
                .mode-card-routine:hover {
                    border-color: #0284c7;
                }

                .mode-card-urgent {
                    border-top: 4px solid #f59e0b;
                }
                .mode-card-urgent:hover {
                    border-color: #f59e0b;
                }

                .mode-card-body {
                    padding: 28px 24px 24px 24px;
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                }

                .mode-icon-box {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 18px;
                }
                .icon-box-routine {
                    background: #e0f2fe;
                    color: #0284c7;
                }
                .icon-box-urgent {
                    background: #fef3c7;
                    color: #d97706;
                }

                /* Buttons */
                .btn-routine {
                    height: 46px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
                    box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);
                    border: none;
                    color: #ffffff;
                    font-weight: 600;
                    font-size: 14.5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }
                .btn-routine:hover {
                    background: linear-gradient(135deg, #0369a1 0%, #075985 100%) !important;
                    color: #ffffff !important;
                    box-shadow: 0 6px 18px rgba(2, 132, 199, 0.4);
                    transform: translateY(-1px);
                }

                .btn-urgent {
                    height: 46px;
                    border-radius: 10px;
                    background: #ffffff;
                    border: 1.5px solid #d97706;
                    color: #b45309;
                    font-weight: 600;
                    font-size: 14.5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }
                .btn-urgent:hover {
                    background: #fffbeb !important;
                    border-color: #b45309 !important;
                    color: #92400e !important;
                    transform: translateY(-1px);
                }

                /* Quick Shortcuts Strip */
                .shortcut-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 14px 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .shortcut-card:hover {
                    border-color: #0ea5e9;
                    background: #f8fafc;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
                }
            `}</style>

            {/* 1. Hero Welcome Header Banner */}
            <motion.div
                className="home-hero-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <div className="hero-ambient-glow" />
                <div style={{ zIndex: 2 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Tag color={getUnitColor(unit)} style={{ fontWeight: 700, fontSize: '12px', padding: '2px 10px', borderRadius: '12px', margin: 0, textTransform: 'uppercase' }}>
                            {unit === 'ED' ? 'Farmasi Kecemasan' :
                                unit === 'OPD' ? 'Farmasi Pesakit Luar' :
                                    unit === 'IPD' ? 'Farmasi Pesakit Dalam' :
                                        'Jabatan Farmasi'}
                        </Tag>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>

                        </span>
                    </div>

                    <Title level={2} style={{ margin: '0 0 6px 0', fontSize: '26px', fontWeight: 700, color: '#0f172a' }}>
                        Welcome back, {profile?.name || 'Staff'}
                    </Title>

                    <Text style={{ fontSize: '13.5px', color: '#475569' }}>
                        Select an inventory indent workflow to begin.
                    </Text>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
                        {draftSession ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#b45309', fontWeight: 600 }}>
                                <AlertTriangle size={14} style={{ color: '#d97706' }} />
                                <span>You have uncompleted indent draft</span>
                            </div>
                        ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                                <CheckCircle2 size={14} style={{ color: '#16a34a' }} />
                                <span>All indent completed, no pending indent draft</span>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', zIndex: 2 }}>
                    <img
                        src={logo}
                        alt="ARISE"
                        style={{
                            width: 100,
                            height: 'auto',
                            filter: 'drop-shadow(0 6px 14px rgba(14, 165, 233, 0.25))'
                        }}
                    />
                </div>
            </motion.div>

            {/* 2. Active Draft Recovery Banner (if user has an in-progress draft) */}
            {draftSession && (
                <motion.div
                    className="draft-alert-banner"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                            <RotateCcw size={18} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: '#92400e', fontSize: '14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertTriangle size={15} style={{ color: '#d97706' }} />
                                <span>Routine Indent Draft In Progress</span>
                            </div>
                            <div style={{ fontSize: '12.5px', color: '#b45309', marginTop: 2 }}>
                                You have an uncompleted draft saved for <strong>Rak {draftSession.rak}</strong>.
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate(`/routine-indent?rak=${encodeURIComponent(draftSession.rak)}`)}
                        style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '9px 18px',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
                            transition: 'all 0.2s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #d97706 0%, #b45309 100%)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(217, 119, 6, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(217, 119, 6, 0.25)';
                        }}
                    >
                        <span>Resume Draft</span>
                        <ArrowRight size={14} />
                    </button>
                </motion.div>
            )}

            {/* 3. Primary Workflows (Routine vs Urgent) */}
            <Row gutter={[24, 24]}>
                {/* Routine Indent Card */}
                <Col xs={24} md={12}>
                    <div className="mode-card mode-card-routine">
                        <div className="mode-card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className="mode-icon-box icon-box-routine">
                                    <ClipboardList size={26} />
                                </div>
                                <Tag color="blue" style={{ fontWeight: 600, borderRadius: 12, padding: '2px 10px' }}>
                                    {raks.length} Shelves Available
                                </Tag>
                            </div>

                            <Title level={4} style={{ margin: '0 0 8px 0', fontSize: '19px', fontWeight: 700, color: '#0f172a' }}>
                                Routine Shelf Indent
                            </Title>

                            <Text style={{ color: '#64748b', fontSize: '13.5px', lineHeight: 1.6, marginBottom: 20 }}>
                                Standard cyclic replenishment round. Restock drugs systematically categorized under specific <strong>{unit}</strong> storage Raks.
                            </Text>

                            <div style={{ marginTop: 'auto' }}>
                                {loadingRaks ? (
                                    <div style={{ textAlign: 'center', padding: '20px 0' }}><Spin /></div>
                                ) : (
                                    <Form layout="vertical" onFinish={handleStartRoutine}>
                                        <Form.Item
                                            name="rak"
                                            label={<span style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>Select Target Rak</span>}
                                            rules={[{ required: true, message: 'Please select a Rak shelf' }]}
                                            style={{ marginBottom: 16 }}
                                        >
                                            <Select
                                                placeholder="Choose shelf (e.g., Rak 1A)"
                                                size="large"
                                                style={{ borderRadius: 10 }}
                                            >
                                                {raks.map(rak => (
                                                    <Option key={rak} value={rak}>
                                                        Rak {rak}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>

                                        <button type="submit" className="btn-routine" style={{ width: '100%', cursor: 'pointer' }}>
                                            <span>Start Routine Indent</span>
                                            <ArrowRight size={16} />
                                        </button>
                                    </Form>
                                )}
                            </div>
                        </div>
                    </div>
                </Col>

                {/* Urgent / Ad-Hoc Indent Card */}
                <Col xs={24} md={12}>
                    <div className="mode-card mode-card-urgent">
                        <div className="mode-card-body">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className="mode-icon-box icon-box-urgent">
                                    <Zap size={26} />
                                </div>
                                <Tag color="orange" style={{ fontWeight: 600, borderRadius: 12, padding: '2px 10px' }}>
                                    Urgent Only
                                </Tag>
                            </div>

                            <Title level={4} style={{ margin: '0 0 8px 0', fontSize: '19px', fontWeight: 700, color: '#0f172a' }}>
                                Urgent / Ad-Hoc Indent
                            </Title>

                            <Text style={{ color: '#64748b', fontSize: '13.5px', lineHeight: 1.6, marginBottom: 20 }}>
                                Immediate indent for critical out-of-stock items or specific drugs without full shelf indent routine.
                            </Text>

                            <div style={{ marginTop: 'auto', paddingTop: 46 }}>
                                <button
                                    type="button"
                                    className="btn-urgent"
                                    style={{ width: '100%', cursor: 'pointer' }}
                                    onClick={() => navigate('/indent')}
                                >
                                    <span>Open Urgent Indent</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* 4. Quick Access Telemetry Strip */}
            <div style={{ marginTop: 24 }}>
                <Text style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 12 }}>
                    Quick Access Shortcuts
                </Text>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                        <div className="shortcut-card" onClick={() => navigate('/routine-summary')}>
                            <BarChart3 size={20} style={{ color: '#0284c7' }} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>Routine Summary</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>View Ongoing Routine Indent Sessions</div>
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} sm={8}>
                        <div className="shortcut-card" onClick={() => navigate('/shortexp')}>
                            <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>Short Expiry</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>View Short-Expiry Items</div>
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} sm={8}>
                        <div className="shortcut-card" onClick={() => navigate('/indent-list')}>
                            <FileText size={20} style={{ color: '#64748b' }} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>Indent Records</div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>View Previous Indent Records</div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default HomeDesktopView;
