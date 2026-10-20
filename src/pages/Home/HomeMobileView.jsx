import React, { useState } from 'react';
import {
    Button,
    Picker,
    SafeArea,
    TabBar,
    ConfigProvider,
    SpinLoading
} from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';
import {
    AuditOutlined,
    RocketOutlined,
    WarningOutlined,
    HistoryOutlined,
    HomeOutlined,
    RightOutlined,
    PlayCircleOutlined,
    DownOutlined,
    MedicineBoxOutlined
} from '@ant-design/icons';
import { getUnitColor } from '../../lib/colorMappings';

const HomeMobileView = ({
    unit,
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

    const onTabChange = (key) => {
        if (key === '/home') return;
        navigate(key);
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
                </div>

                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.3px' }}>
                    Farmasi Pesakit Luar • Hospital Segamat
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

            {/* Fixed Bottom Navigation Bar */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                boxShadow: '0 -2px 10px rgba(0,0,0,0.06)'
            }}>
                <SafeArea position="bottom" />
                <TabBar activeKey="/home" onChange={onTabChange}>
                    <TabBar.Item
                        key="/home"
                        icon={<HomeOutlined style={{ fontSize: 19 }} />}
                        title="Home"
                    />
                    <TabBar.Item
                        key="/routine-summary"
                        icon={<AuditOutlined style={{ fontSize: 19 }} />}
                        title="Routine"
                    />
                    <TabBar.Item
                        key="/indent"
                        icon={<RocketOutlined style={{ fontSize: 19 }} />}
                        title="Urgent"
                    />
                    <TabBar.Item
                        key="/shortexp"
                        icon={<WarningOutlined style={{ fontSize: 19 }} />}
                        title="Short Exp"
                    />
                    <TabBar.Item
                        key="/indent-list"
                        icon={<HistoryOutlined style={{ fontSize: 19 }} />}
                        title="Records"
                    />
                </TabBar>
            </div>
        </div>
    );
};

export default HomeMobileView;
