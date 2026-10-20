import React from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import useCartPage from './useCartPage';
import CartDesktopView from './CartDesktopView';
import CartMobileView from './CartMobileView';

const CartPage = () => {
    const isMobile = useIsMobile(768);
    const cartState = useCartPage();

    return isMobile ? (
        <CartMobileView {...cartState} />
    ) : (
        <CartDesktopView {...cartState} />
    );
};

export default CartPage;
