// Batch sizes available for purchase
export const BATCH_SIZES = [1, 6, 12, 24, 36, 48];
// Batch labels for display
export const BATCH_LABELS = {
    1: 'Single',
    6: 'Half Dozen',
    12: 'Dozen',
    24: '2 Dozen',
    36: '3 Dozen',
    48: '4 Dozen',
};
// Discount percentages by quantity threshold
// The discount applies when quantity >= threshold
export const VOLUME_DISCOUNTS = [
    { threshold: 48, discount: 0.25, label: '25% off' },
    { threshold: 36, discount: 0.20, label: '20% off' },
    { threshold: 24, discount: 0.15, label: '15% off' },
    { threshold: 12, discount: 0.10, label: '10% off' },
    { threshold: 6, discount: 0.05, label: '5% off' },
    { threshold: 1, discount: 0, label: '' },
];
/**
 * Get the discount percentage for a given quantity
 */
export function getDiscountForQuantity(quantity) {
    for (const tier of VOLUME_DISCOUNTS) {
        if (quantity >= tier.threshold) {
            return { discount: tier.discount, label: tier.label };
        }
    }
    return { discount: 0, label: '' };
}
/**
 * Calculate the price for a given quantity of cookies
 */
export function calculatePrice(basePrice, quantity) {
    const originalTotal = basePrice * quantity;
    const { discount } = getDiscountForQuantity(quantity);
    const discountedTotal = originalTotal * (1 - discount);
    const savings = originalTotal - discountedTotal;
    const pricePerCookie = discountedTotal / quantity;
    return {
        originalTotal,
        discountedTotal,
        savings,
        discountPercent: discount * 100,
        pricePerCookie,
    };
}
/**
 * Get batch pricing preview for a cookie
 */
export function getBatchPricing(basePrice) {
    return BATCH_SIZES.filter(size => size > 1).map(size => {
        const pricing = calculatePrice(basePrice, size);
        const { label } = getDiscountForQuantity(size);
        return {
            size,
            label: BATCH_LABELS[size],
            total: pricing.discountedTotal,
            perCookie: pricing.pricePerCookie,
            savings: pricing.savings,
            discountLabel: label,
        };
    });
}
