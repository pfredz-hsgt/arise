import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, message } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Headless hook containing login authentication, 
 * password reset request state, and navigation logic.
 */
export const useLoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [resetModalVisible, setResetModalVisible] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [form] = Form.useForm();
    const [resetForm] = Form.useForm();
    const navigate = useNavigate();
    const { login, resetPassword } = useAuth();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await login(values.email, values.password);
            navigate('/');
        } catch (error) {
            message.error(error.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (values) => {
        setResetLoading(true);
        try {
            await resetPassword(values.resetEmail);
            message.success('A temporary password has been sent to your email.');
            setResetModalVisible(false);
            resetForm.resetFields();
        } catch (error) {
            message.error(error.message || 'Failed to send recovery email');
        } finally {
            setResetLoading(false);
        }
    };

    return {
        form,
        loading,
        resetForm,
        resetModalVisible,
        setResetModalVisible,
        resetLoading,
        onFinish,
        handleResetPassword,
        navigate
    };
};

export default useLoginPage;
