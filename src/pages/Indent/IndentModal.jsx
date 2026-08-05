import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Radio,
    Space,
    Typography,
    Tag,
    Button,
    message,
    Descriptions,
    Checkbox,
    DatePicker,
    Row,
    Col,
    Drawer,
} from 'antd';
import { EditOutlined, FormOutlined } from '@ant-design/icons';
import { api } from '../../lib/api';
import { getSourceColor, getPuchaseTypeColor, getStdKtColor } from '../../lib/colorMappings';
import dayjs from 'dayjs';
import CustomDateInput from '../../components/CustomDateInput';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const IndentModal = ({ drug, visible, onClose, onSuccess, onDrugUpdate, width = 500 }) => {
    const { user } = useAuth();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState(null);
    const [maxQty, setMaxQty] = useState(null);

    const quantityInputRef = useRef(null);


    // Initialize state when drug changes
    useEffect(() => {
        if (drug) {
            setBalance(drug.balance);
            setMaxQty(drug.max_qty);


            // Auto-calculate indent quantity: max_qty - balance
            const calculatedQty = calculateIndentQty(drug.max_qty, drug.balance);
            form.setFieldsValue({ quantity: calculatedQty });
        }
    }, [drug, form]);

    // Auto-focus quantity input when modal opens
    useEffect(() => {
        if (visible) {
            // Delay to ensure modal animation completes
            setTimeout(() => {
                if (quantityInputRef.current) {
                    quantityInputRef.current.focus();
                    quantityInputRef.current.select();
                }
            }, 400);
        }
    }, [visible]);





    const handleBalanceChange = (value) => {
        setBalance(value);

        // Recalculate indent quantity when balance changes
        const calculatedQty = calculateIndentQty(maxQty, value);
        form.setFieldsValue({ quantity: calculatedQty });
    };



    // Helper function to calculate indent quantity
    const calculateIndentQty = (maxQty, currentBalance) => {
        const max = parseInt(maxQty) || 0;
        const bal = parseInt(currentBalance) || 0;
        const result = max - bal;
        return result > 0 ? result.toString() : '0';
    };





    const handleClose = () => {
        onClose(false);
    };

    const handleQuantityChange = (value) => {
        if (value === 0) {
            message.warning('Quantity must be at least 1');
        }
    };

    const handleSubmit = async (values) => {
        try {
            setLoading(true);

            // Validate quantity is not 0
            if (!values.quantity || values.quantity === 0) {
                message.error('Quantity must be at least 1');
                setLoading(false);
                return;
            }

            await api.post('/indents', {
                item_id: drug.id,
                requested_qty: values.quantity,
                status: 'Pending',
                snapshot_max_qty: maxQty,
                snapshot_balance: balance,
                indent_remarks: values.remarks || null,
            });
            form.resetFields();
            onSuccess();
        } catch (error) {
            console.error('Error adding to cart:', error);
            if (!error.message?.includes('item details')) {
                message.error('Failed to add item to cart');
            }
        } finally {
            setLoading(false);
        }
    };



    // Handle Enter key shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.defaultPrevented) return;

            if (visible && e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                form.submit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visible, form]);

    if (!drug) return null;

    return (
        <>
            <Drawer
                open={visible}
                onClose={handleClose}
                mask={false}
                zIndex={1000}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
                        <span>Add to Indent</span>
                    </div>
                }
                footer={null}
                width={width}
                placement="right"
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Drug Info */}
                    <div style={{ textAlign: 'center' }}>
                        <Title level={4} style={{ marginBottom: 4 }}>
                            {drug.name}
                        </Title>

                        {/* Item Code and PKU */}
                        <Space size="large" style={{ marginBottom: 12 }}>
                            {drug.item_code && (
                                <Text type="secondary" style={{ fontSize: '13px' }}>
                                    <Text strong copyable>{drug.item_code}</Text>
                                </Text>
                            )}
                            {drug.pku && (
                                <Text type="secondary" style={{ fontSize: '13px' }}>
                                    PKU: <Text strong>{drug.pku}</Text>
                                </Text>
                            )}
                        </Space> <br />

                        {/* Tags */}
                        <Space wrap style={{ marginBottom: 8, justifyContent: 'center' }}>
                            {drug.puchase_type && <Tag color={getPuchaseTypeColor(drug.puchase_type)}>{drug.puchase_type}</Tag>}
                            {drug.std_kt && <Tag color={getStdKtColor(drug.std_kt)}>{drug.std_kt}</Tag>}
                            {drug.row && <Tag>Row: {drug.row}</Tag>}
                        </Space>

                        {/* Remarks */}
                        {drug.remarks && (
                            <div style={{ marginTop: 8, padding: '8px 16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                <Text style={{ fontSize: '13px', fontStyle: 'italic' }} editable={{ tooltip: 'Edit Remarks', triggerType: 'text' }}>
                                    {drug.remarks}
                                </Text>
                            </div>
                        )}
                    </div>

                    {/* Editable Stock Info */}
                    <div style={{
                        backgroundColor: '#fafafa',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #f0f0f0'
                    }}>


                        {/* Stock Information */}
                        <Row gutter={[16, 16]}>
                            <Col xs={12}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                                        Max Qty
                                    </Text>
                                    <InputNumber
                                        value={maxQty}
                                        readOnly
                                        placeholder="Max Qty"
                                        style={{ width: '100%' }}
                                        min={0}
                                        size="large"
                                        inputMode="numeric"
                                    />
                                </div>
                            </Col>
                            <Col xs={12}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                                        Balance
                                    </Text>
                                    <InputNumber
                                        value={balance}
                                        onChange={handleBalanceChange}
                                        placeholder="Balance"
                                        style={{ width: '100%' }}
                                        min={0}
                                        size="large"
                                        inputMode="numeric"
                                    />
                                </div>
                            </Col>
                        </Row>
                        {/* Indent Source (Read Only) */}
                        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                            <Col xs={24}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                                        Indent From
                                    </Text>
                                    <Input
                                        value={drug.indent_source || 'N/A'}
                                        readOnly
                                        size="large"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </Col>
                        </Row>
                        {/* Short Expiry 
                        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                            <Col xs={24}>
                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                                    Short Expiry
                                </Text>
                                <Space style={{ width: '100%' }}>
                                    <Checkbox
                                        checked={isShortExp}
                                        onChange={handleShortExpChange}
                                    >
                                        Mark as short expiry
                                    </Checkbox>
                                    {isShortExp && (
                                        <CustomDateInput
                                            value={shortExp}
                                            onChange={handleShortExpDateChange}
                                            placeholder="DDMMYY"
                                        />
                                    )}
                                </Space>
                            </Col>
                        </Row>*/}
                    </div>

                    {/* Form */}
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        initialValues={{
                            quantity: '',
                            remarks: '',
                        }}
                    >
                        <Form.Item
                            name="quantity"
                            label="Indent Quantity"
                            rules={[
                                { required: true, message: 'Please enter indent quantity' },
                                {
                                    validator: (_, value) => {
                                        if (value && value < 1) {
                                            return Promise.reject(new Error('Quantity must be at least 1'));
                                        }
                                        return Promise.resolve();
                                    }
                                },
                            ]}
                        >
                            <InputNumber
                                ref={quantityInputRef}
                                autoFocus
                                style={{ width: '100%' }}
                                placeholder="Enter quantity"
                                min={0}
                                size="large"
                                inputMode="numeric"
                                onChange={handleQuantityChange}
                            />
                        </Form.Item>

                        <Form.Item
                            name="remarks"
                            label="Remarks"
                        >
                            <Input.TextArea placeholder="Enter remarks (optional)" rows={2} />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0 }}>
                            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>

                                <Button onClick={handleClose}>Cancel</Button>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    Add to Cart
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Space>
            </Drawer>

        </>
    );
};

export default IndentModal;
