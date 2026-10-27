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
    Tooltip,
    Alert,
} from 'antd';
import { EditOutlined, FormOutlined } from '@ant-design/icons';
import { api } from '../../lib/api';
import { getSourceColor, getPuchaseTypeColor, getStdKtColor, getUnitColor } from '../../lib/colorMappings';
import dayjs from 'dayjs';
import CustomDateInput from '../../components/CustomDateInput';
import { useAuth } from '../../contexts/AuthContext';
import useIsMobile from '../../hooks/useIsMobile';
import IndentMobilePopup from './IndentMobilePopup';

const { Title, Text } = Typography;
const { TextArea } = Input;

const IndentModal = ({ drug, visible, onClose, onSuccess, onDrugUpdate, width = 500 }) => {
    const isMobile = useIsMobile(768);
    const { user, isIssuer } = useAuth();
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
        if (isIssuer) {
            message.warning('Issuers have view-only access. Only Indenters can create indents.');
            return;
        }

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
                status: 'Draft', // will be changed to Pending after user press submit button, then will appear in Issuer Cart to be approved
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

            if (visible && e.key === 'Enter' && !isIssuer) {
                e.preventDefault();
                e.stopPropagation();
                form.submit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visible, form, isIssuer]);

    if (!drug) return null;

    if (isMobile) {
        return (
            <IndentMobilePopup
                drug={drug}
                visible={visible}
                onClose={onClose}
                onSuccess={onSuccess}
            />
        );
    }

    return (
        <>
            <Drawer
                open={visible}
                onClose={handleClose}
                mask={false}
                zIndex={1000}
                styles={{
                    content: {
                        boxShadow: '-8px 0 28px rgba(0, 0, 0, 0.16)',
                        borderLeft: '1px solid #e2e8f0',
                    }
                }}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
                        <span>{isIssuer ? 'View Drug Details (Issuer)' : 'Add to Indent'}</span>
                        {isIssuer && <Tag color="orange" style={{ fontWeight: 600 }}>View Only</Tag>}
                    </div>
                }
                footer={null}
                width={width}
                placement="right"
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {isIssuer && (
                        <Alert
                            type="info"
                            showIcon
                            message="View-Only Mode"
                            description="Strictly for role Indenter only. Issuers can view drug details and quotas, but cannot create indents."
                            style={{ borderRadius: 8 }}
                        />
                    )}

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
                            {drug.main_unit && <Tag color={getUnitColor(drug.main_unit)} style={{ fontWeight: 600 }}>{drug.main_unit}</Tag>}
                            {drug.puchase_type && <Tag color={getPuchaseTypeColor(drug.puchase_type)}>{drug.puchase_type}</Tag>}
                            {drug.std_kt && <Tag color={getStdKtColor(drug.std_kt)}>{drug.std_kt}</Tag>}
                            {drug.row && <Tag>Row: {drug.row}</Tag>}
                            {drug.tingkat !== undefined && drug.tingkat !== null && <Tag>Tingkat: {drug.tingkat}</Tag>}
                            {drug.petak && <Tag>Petak: {drug.petak}</Tag>}
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
                                        disabled={isIssuer}
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
                                { required: !isIssuer, message: 'Please enter indent quantity' },
                                {
                                    validator: (_, value) => {
                                        if (!isIssuer && value && value < 1) {
                                            return Promise.reject(new Error('Quantity must be at least 1'));
                                        }
                                        return Promise.resolve();
                                    }
                                },
                            ]}
                        >
                            <InputNumber
                                ref={quantityInputRef}
                                autoFocus={!isIssuer}
                                style={{ width: '100%' }}
                                placeholder={isIssuer ? "N/A (Issuer view only)" : "Enter quantity"}
                                min={0}
                                size="large"
                                inputMode="numeric"
                                onChange={handleQuantityChange}
                                disabled={isIssuer}
                            />
                        </Form.Item>

                        <Form.Item
                            name="remarks"
                            label="Remarks"
                        >
                            <Input.TextArea
                                placeholder={isIssuer ? "Remarks disabled for Issuer" : "Enter remarks (optional)"}
                                rows={2}
                                disabled={isIssuer}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0 }}>
                            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                                <Button onClick={handleClose}>
                                    {isIssuer ? 'Close' : 'Cancel'}
                                </Button>
                                {isIssuer ? (
                                    <Tooltip title="Strictly for role Indenter only. Issuers are able to view only but not create any indent.">
                                        <span>
                                            <Button type="primary" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                                                Add to Cart
                                            </Button>
                                        </span>
                                    </Tooltip>
                                ) : (
                                    <Button type="primary" htmlType="submit" loading={loading}>
                                        Add to Cart
                                    </Button>
                                )}
                            </Space>
                        </Form.Item>
                    </Form>
                </Space>
            </Drawer>

        </>
    );
};

export default IndentModal;
