import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { cookies } from '../data/cookies';
import { useCart } from '../context/CartContext';
import { ShoppingCart, ChevronDown, Tag, Check, Minus, Plus } from 'lucide-react';
import { NavigationBar } from '../components/NavigationBar';
import { BATCH_LABELS, calculatePrice, getDiscountForQuantity } from '../utils/pricing';
// Quick batch options to show as buttons
const QUICK_BATCHES = [6, 12, 24, 48];
export function Products() {
    const { addToCart, getTotalCookies, getCartDiscount } = useCart();
    const [quantities, setQuantities] = useState({});
    const [addedMessage, setAddedMessage] = useState({});
    const [expandedNutrition, setExpandedNutrition] = useState({});
    const getQuantity = (cookieId) => quantities[cookieId] || 1;
    const setQuantity = (cookieId, qty) => {
        const newQty = Math.max(1, qty);
        setQuantities((prev) => ({ ...prev, [cookieId]: newQty }));
    };
    const handleAddToCart = (cookieId) => {
        const cookie = cookies.find((c) => c.id === cookieId);
        if (cookie) {
            const quantity = getQuantity(cookieId);
            addToCart(cookie, quantity);
            setAddedMessage((prev) => ({ ...prev, [cookieId]: true }));
            setQuantities((prev) => ({ ...prev, [cookieId]: 1 }));
            setTimeout(() => {
                setAddedMessage((prev) => ({ ...prev, [cookieId]: false }));
            }, 2000);
        }
    };
    const cartTotal = getTotalCookies();
    const cartDiscount = getCartDiscount();
    return (_jsxs("div", { className: "min-h-screen bg-cream", children: [_jsx(NavigationBar, {}), _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-12", children: [_jsxs("div", { className: "text-center mb-10", children: [_jsx("h1", { className: "text-4xl md:text-5xl font-bold text-midnight font-serif mb-3", children: "The Cookie Collection" }), _jsx("p", { className: "text-gray-600 max-w-xl mx-auto mb-6", children: "Handcrafted with premium ingredients, baked fresh for you" }), _jsxs("div", { className: "inline-flex items-center gap-3 bg-gradient-to-r from-midnight to-gray-800 text-cream px-6 py-3 rounded-full shadow-lg", children: [_jsx(Tag, { size: 18, className: "text-gold" }), _jsxs("span", { className: "text-sm", children: [_jsx("span", { className: "text-gold font-semibold", children: "Save up to 25%" }), " \u2014 Mix & match any flavors!"] })] }), _jsx("div", { className: "mt-4 flex flex-wrap justify-center gap-2 text-xs", children: [
                                    { qty: 6, off: '5%' },
                                    { qty: 12, off: '10%' },
                                    { qty: 24, off: '15%' },
                                    { qty: 36, off: '20%' },
                                    { qty: 48, off: '25%' },
                                ].map((tier) => (_jsxs("span", { className: `px-3 py-1.5 rounded-full transition-all ${cartTotal >= tier.qty
                                        ? 'bg-green-100 text-green-700 font-semibold'
                                        : 'bg-midnight/5 text-midnight'}`, children: [tier.qty, "+ = ", tier.off] }, tier.qty))) }), cartTotal > 0 && (_jsx("div", { className: "mt-4", children: cartDiscount.discount > 0 ? (_jsxs("span", { className: "inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium", children: [_jsx(Check, { size: 16 }), cartTotal, " cookies in cart \u2014 ", cartDiscount.label, " applied!"] })) : (_jsxs("span", { className: "text-gray-500 text-sm", children: [cartTotal, " cookie", cartTotal !== 1 ? 's' : '', " in cart \u2014 add ", 6 - cartTotal, " more for 5% off!"] })) }))] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: cookies.map((cookie) => {
                            const qty = getQuantity(cookie.id);
                            const pricing = calculatePrice(cookie.price, qty);
                            const discount = getDiscountForQuantity(qty);
                            return (_jsxs("div", { className: "bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-visible flex flex-col", children: [_jsxs("div", { className: "relative h-48 overflow-hidden rounded-t-2xl bg-gray-100", children: [_jsx("img", { src: cookie.imageUrl, alt: cookie.name, className: "w-full h-full object-cover" }), cookie.flavor.includes('Specialty') && (_jsx("span", { className: "absolute top-3 left-3 bg-midnight text-gold text-xs font-bold px-3 py-1 rounded-full", children: "SPECIALTY" }))] }), _jsxs("div", { className: "p-5 flex flex-col flex-grow", children: [_jsx("h2", { className: "text-lg font-bold text-midnight", children: cookie.name }), _jsx("p", { className: "text-sm text-gold font-medium mb-2", children: cookie.flavor.replace(' · Specialty', '') }), _jsx("p", { className: "text-gray-500 text-sm mb-4 flex-grow line-clamp-2", children: cookie.description }), _jsxs("div", { className: "flex items-baseline gap-2 mb-4", children: [_jsxs("span", { className: "text-2xl font-bold text-midnight", children: ["$", cookie.price.toFixed(2)] }), _jsx("span", { className: "text-sm text-gray-400", children: "each" })] }), _jsx("div", { className: "grid grid-cols-4 gap-1 mb-3", children: QUICK_BATCHES.map((batch) => {
                                                    const batchDiscount = getDiscountForQuantity(batch);
                                                    return (_jsxs("button", { onClick: () => setQuantity(cookie.id, batch), className: `py-2 rounded-lg text-xs font-medium transition-all ${qty === batch
                                                            ? 'bg-midnight text-gold'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`, children: [_jsx("div", { children: batch }), batchDiscount.discount > 0 && (_jsx("div", { className: `text-[10px] ${qty === batch ? 'text-gold/80' : 'text-green-600'}`, children: batchDiscount.label }))] }, batch));
                                                }) }), _jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("button", { onClick: () => setQuantity(cookie.id, qty - 1), className: "w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors", children: _jsx(Minus, { size: 16 }) }), _jsx("input", { type: "number", min: "1", value: qty, onChange: (e) => setQuantity(cookie.id, parseInt(e.target.value) || 1), className: "flex-1 h-10 text-center font-bold text-lg border border-gray-200 rounded-lg focus:outline-none focus:border-gold" }), _jsx("button", { onClick: () => setQuantity(cookie.id, qty + 1), className: "w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors", children: _jsx(Plus, { size: 16 }) })] }), _jsxs("div", { className: "flex items-center justify-between mb-4 py-2 px-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("span", { className: "text-xs text-gray-500 block", children: BATCH_LABELS[qty] || `${qty} cookies` }), discount.discount > 0 && (_jsx("span", { className: "text-xs text-green-600 font-medium", children: discount.label }))] }), _jsxs("div", { className: "text-right", children: [pricing.savings > 0 && (_jsxs("span", { className: "text-xs text-gray-400 line-through block", children: ["$", pricing.originalTotal.toFixed(2)] })), _jsxs("span", { className: "text-xl font-bold text-midnight", children: ["$", pricing.discountedTotal.toFixed(2)] })] })] }), _jsx("button", { onClick: () => handleAddToCart(cookie.id), className: `w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${addedMessage[cookie.id]
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-midnight text-gold hover:bg-midnight/90'}`, children: addedMessage[cookie.id] ? (_jsxs(_Fragment, { children: [_jsx(Check, { size: 18 }), "Added!"] })) : (_jsxs(_Fragment, { children: [_jsx(ShoppingCart, { size: 18 }), "Add to Cart"] })) }), _jsxs("button", { onClick: () => setExpandedNutrition((prev) => ({ ...prev, [cookie.id]: !prev[cookie.id] })), className: "w-full py-2 mt-2 text-xs text-gray-400 hover:text-midnight transition flex items-center justify-center gap-1", children: [_jsx("span", { children: "Nutrition" }), _jsx(ChevronDown, { size: 14, className: `transition-transform duration-300 ${expandedNutrition[cookie.id] ? 'rotate-180' : ''}` })] }), expandedNutrition[cookie.id] && (_jsxs("div", { className: "mt-2 pt-3 border-t border-gray-100 text-xs", children: [_jsxs("div", { className: "grid grid-cols-3 gap-2 text-gray-500", children: [_jsxs("div", { children: ["Cal: ", _jsx("span", { className: "text-midnight font-medium", children: cookie.nutritionalFacts.calories })] }), _jsxs("div", { children: ["Fat: ", _jsxs("span", { className: "text-midnight font-medium", children: [cookie.nutritionalFacts.fat, "g"] })] }), _jsxs("div", { children: ["Carbs: ", _jsxs("span", { className: "text-midnight font-medium", children: [cookie.nutritionalFacts.carbohydrates, "g"] })] }), _jsxs("div", { children: ["Sugar: ", _jsxs("span", { className: "text-midnight font-medium", children: [cookie.nutritionalFacts.sugars, "g"] })] }), _jsxs("div", { children: ["Protein: ", _jsxs("span", { className: "text-midnight font-medium", children: [cookie.nutritionalFacts.protein, "g"] })] }), _jsxs("div", { children: ["Sodium: ", _jsxs("span", { className: "text-midnight font-medium", children: [cookie.nutritionalFacts.sodium, "mg"] })] })] }), _jsx("p", { className: "mt-2 text-[10px] text-red-400", children: cookie.nutritionalFacts.allergens })] }))] })] }, cookie.id));
                        }) }), _jsx("div", { className: "mt-16 text-center", children: _jsxs("div", { className: "inline-block bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 px-8 py-6 rounded-2xl", children: [_jsx("p", { className: "text-midnight font-serif text-2xl mb-2", children: "Need a custom order?" }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: "Planning an event? We offer custom batches!" }), _jsx("a", { href: "mailto:hello@midnightdough.com", className: "inline-flex items-center gap-2 text-midnight font-semibold hover:text-gold transition-colors", children: "Contact us \u2192" })] }) })] })] }));
}
