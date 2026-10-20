import React from 'react';
import { Typography, Card, Button, Form, Select, Spin, Row, Col, BorderBeam, Tag } from 'antd';
import { RocketOutlined, AuditOutlined } from '@ant-design/icons';
import { getUnitColor } from '../../lib/colorMappings';

const { Title, Text } = Typography;
const { Option } = Select;

const HomeDesktopView = ({
    unit,
    profile,
    raks,
    loadingRaks,
    handleStartRoutine,
    navigate
}) => {
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
        </div>
    );
};

export default HomeDesktopView;
