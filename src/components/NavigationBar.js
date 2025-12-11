import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
export function NavigationBar() {
    const navigate = useNavigate();
    const { items } = useCart();
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return (_jsx("nav", { className: "bg-midnight text-cream sticky top-0 z-50 shadow-lg", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 py-4 flex justify-between items-center", children: [_jsxs("button", { onClick: () => navigate('/'), className: "flex items-center gap-2 font-bold text-2xl text-gold hover:text-yellow-300 transition", children: [_jsx("span", { className: "text-3xl", children: "\uD83C\uDF6A" }), _jsx("span", { className: "font-serif", children: "Midnight Dough" })] }), _jsxs("div", { className: "flex items-center gap-8", children: [_jsx("button", { onClick: () => navigate('/'), className: "hover:text-gold transition font-semibold", children: "Home" }), _jsx("button", { onClick: () => navigate('/products'), className: "hover:text-gold transition font-semibold", children: "Products" }), _jsxs("button", { onClick: () => navigate('/checkout'), className: "relative flex items-center gap-2 bg-gold text-midnight px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition", children: [_jsx(ShoppingCart, { size: 20 }), _jsx("span", { children: "Cart" }), itemCount > 0 && (_jsx("span", { className: "absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center", children: itemCount }))] })] })] }) }));
}
