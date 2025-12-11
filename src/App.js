import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { Hero } from './pages/Hero';
import { Products } from './pages/Products';
import { Checkout } from './pages/Checkout';
function App() {
    return (_jsx(CartProvider, { children: _jsx(Router, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Hero, {}) }), _jsx(Route, { path: "/products", element: _jsx(Products, {}) }), _jsx(Route, { path: "/checkout", element: _jsx(Checkout, {}) })] }) }) }));
}
export default App;
