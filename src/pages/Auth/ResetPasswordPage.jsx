import React from 'react';
import { Layout, Card, Typography } from 'antd';

const { Title, Text } = Typography;

const ResetPasswordPage = () => {
    return (
        <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
            <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 12 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={3} style={{ margin: 0, color: '#1890ff' }}>Reset Password</Title>
                    <br />
                    <Text type="danger">Password reset is currently disabled in the new system. Please contact your administrator.</Text>
                </div>
            </Card>
        </Layout>
    );
};

export default ResetPasswordPage;
