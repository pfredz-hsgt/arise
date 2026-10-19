import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Form, Select, Spin, message, Row, Col, Modal, BorderBeam, Tag } from 'antd';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RocketOutlined, AuditOutlined } from '@ant-design/icons';
import { getUnitColor } from '../../lib/colorMappings';

const { Title, Text } = Typography;
const { Option } = Select;

const HomePage = () => {
    const { profile, user } = useAuth();
    const navigate = useNavigate();
    const [raks, setRaks] = useState([]);
    const [loadingRaks, setLoadingRaks] = useState(true);
    const unit = profile?.main_unit || user?.main_unit || 'OPD';

    useEffect(() => {
        const fetchRaks = async () => {
            try {
                setLoadingRaks(true);
                const data = await api.get(`/inventory/raks?main_unit=${encodeURIComponent(unit)}`);
                setRaks(data.map(item => item.row));
            } catch (error) {
                console.error("Error fetching raks", error);
                message.error("Failed to load Raks");
            } finally {
                setLoadingRaks(false);
            }
        };

        fetchRaks();
    }, [unit]);

    const handleStartRoutine = async (values) => {
        if (!values.rak) {
            message.warning("Select a RAK first!");
            return;
        }

        try {
            const draftSession = await api.get('/indent_sessions/draft?session_type=Routine');

            if (draftSession) {
                Modal.confirm({
                    title: 'Existing Draft Found',
                    content: 'Do you want to start a new routine indent? The previous draft will be discarded.',
                    onOk: async () => {
                        try {
                            await api.delete('/indent_sessions/drafts/cleanup?session_type=Routine');
                            navigate(`/routine-indent?rak=${encodeURIComponent(values.rak)}`);
                        } catch (err) {
                            console.error(err);
                            message.error('Failed to discard previous draft');
                        }
                    }
                });
                return; // Stop here, navigation handled in onOk
            }
        } catch (err) {
            console.error(err);
        }

        navigate(`/routine-indent?rak=${encodeURIComponent(values.rak)}`);
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ marginBottom: 32, textAlign: 'center' }}>
                <Title level={2}>Welcome, {profile?.name}</Title>
                <Text type="secondary">Select an indenting mode to begin</Text>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                    <BorderBeam
                        color={[
                            { color: '#7c3aed', percent: 0 },
                            { color: '#06b6d4', percent: 57 },
                            { color: '#67e8f9', percent: 100 },
                        ]}
                    >
                        <Card
                            hoverable
                            title={
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span><AuditOutlined style={{ color: '#1890ff', marginRight: 8 }} /> Routine Indent</span>
                                    <Tag color={getUnitColor(unit)} style={{ fontWeight: 600 }}>{unit}</Tag>
                                </div>
                            }
                            style={{ height: '100%' }}
                            styles={{ body: { display: 'flex', flexDirection: 'column', height: 'calc(100% - 58px)' } }}
                        >
                            <Text style={{ display: 'block', marginBottom: 24 }}>
                                Indent for drugs listed under specific Raks.
                                The generated list will be applicable for {unit} items only.
                            </Text>

                            <div style={{ marginTop: 'auto' }}>
                                {loadingRaks ? (
                                    <Spin />
                                ) : (
                                    <Form layout="vertical" onFinish={handleStartRoutine}>
                                        <Form.Item
                                            name="rak"
                                            label="Select Rak"
                                            rules={[{ required: true, message: 'Please select a Rak' }]}
                                        >
                                            <Select placeholder="Rak Number">
                                                {raks.map(rak => (
                                                    <Option key={rak} value={rak}>{rak}</Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                        <Button type="primary" htmlType="submit" block>
                                            Start Routine Indent
                                        </Button>
                                    </Form>
                                )}
                            </div>
                        </Card>
                    </BorderBeam>
                </Col>

                <Col xs={24} md={12}>
                    <BorderBeam
                        color={[
                            { color: '#fa541c', percent: 0 },
                            { color: '#ff7875', percent: 46 },
                            { color: '#ffd666', percent: 100 },
                        ]}
                    >
                        <Card
                            hoverable
                            title={<><RocketOutlined style={{ color: '#faad14', marginRight: 8 }} /> Urgent / Ad-Hoc Indent</>}
                            style={{ height: '100%' }}
                            styles={{ body: { display: 'flex', flexDirection: 'column', height: 'calc(100% - 58px)' } }}
                        >
                            <Text style={{ display: 'block', marginBottom: 24 }}>
                                Directly indent any specific item from the inventory without going through the standard routine.
                            </Text>
                            <div style={{ marginTop: 'auto' }}>
                                <Button type="default" block onClick={() => navigate('/indent')}>
                                    Go to Urgent Indent
                                </Button>
                            </div>
                        </Card>
                    </BorderBeam>
                </Col>
            </Row>
        </div >
    );
};

export default HomePage;
