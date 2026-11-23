/**
 * E-commerce Catalog and Store State Management
 * Serves as the ground truth backend for both DOM-actuation and WebMCP agents.
 */

export const INITIAL_PRODUCTS = [
  { id: "PROD-101", name: "Waterproof Winter Jacket", category: "apparel", price: 75.0, rating: 4.8, inStock: true },
  { id: "PROD-102", name: "Insulated Heavy Snow Jacket", category: "apparel", price: 120.0, rating: 4.6, inStock: true },
  { id: "PROD-103", name: "Lightweight Windbreaker Jacket", category: "apparel", price: 45.0, rating: 4.3, inStock: true },
  { id: "PROD-104", name: "Noise Cancelling Wireless Headphones", category: "electronics", price: 199.0, rating: 4.9, inStock: true },
  { id: "PROD-105", name: "Ergonomic Mechanical Keyboard", category: "electronics", price: 89.0, rating: 4.7, inStock: true },
  { id: "PROD-106", name: "USB-C Fast Charging Hub", category: "electronics", price: 35.0, rating: 4.4, inStock: true },
  { id: "PROD-107", name: "Stainless Steel Insulated Water Bottle", category: "home", price: 25.0, rating: 4.8, inStock: true },
  { id: "PROD-108", name: "Ceramic Minimalist Coffee Mug", category: "home", price: 18.0, rating: 4.2, inStock: true },
  { id: "PROD-109", name: "Running Trail Sneakers", category: "footwear", price: 85.0, rating: 4.7, inStock: true },
  { id: "PROD-110", name: "Leather Formal Loafers", category: "footwear", price: 110.0, rating: 4.5, inStock: false }
];

export const VALID_COUPONS = {
  "DISCOUNT20": 0.20,
  "SAVE10": 0.10,
  "STUDENT15": 0.15
};

export class StoreState {
  constructor() {
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    this.cart = []; // [{ productId, quantity, unitPrice }]
    this.appliedCoupon = null;
    this.shippingAddress = null;
    this.orderStatus = "browsing"; // browsing -> in_cart -> address_entered -> completed
    this.lastQuery = "";
    this.selectedCategory = "all";
    this.sortBy = "default";
  }

  searchProducts(query = "", maxPrice = Infinity) {
    this.lastQuery = query.toLowerCase();
    return this.products.filter(p => {
      const matchesQuery = p.name.toLowerCase().includes(this.lastQuery) || p.category.includes(this.lastQuery);
      const matchesPrice = p.price <= maxPrice;
      return matchesQuery && matchesPrice && p.inStock;
    });
  }

  filterCatalog(category = "all", sortBy = "default") {
    this.selectedCategory = category;
    this.sortBy = sortBy;

    let list = this.products.filter(p => category === "all" || p.category === category);
    if (sortBy === "rating_desc") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "price_asc") {
      list.sort((a, b) => a.price - b.price);
    }
    return list;
  }

  addToCart(productId, quantity = 1) {
    const prod = this.products.find(p => p.id === productId);
    if (!prod) throw new Error(`Product ${productId} not found`);
    if (!prod.inStock) throw new Error(`Product ${productId} is out of stock`);

    const existing = this.cart.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cart.push({
        productId,
        name: prod.name,
        quantity,
        unitPrice: prod.price
      });
    }
    this.orderStatus = "in_cart";
    return { success: true, cart: this.cart, totalItems: this.getCartTotalItems() };
  }

  applyCoupon(couponCode) {
    const discountRate = VALID_COUPONS[couponCode.trim().toUpperCase()];
    if (!discountRate) {
      return { success: false, error: "Invalid coupon code" };
    }
    this.appliedCoupon = { code: couponCode.toUpperCase(), discountRate };
    return { success: true, discountRate, message: `Applied ${discountRate * 100}% discount` };
  }

  setShippingAddress({ fullName, address, postalCode, email }) {
    if (!fullName || !address || !postalCode || !email) {
      return { success: false, error: "Missing required shipping address fields" };
    }
    this.shippingAddress = { fullName, address, postalCode, email };
    this.orderStatus = "address_entered";
    return { success: true, shippingAddress: this.shippingAddress };
  }

  calculateTotals() {
    const subtotal = this.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const discount = this.appliedCoupon ? subtotal * this.appliedCoupon.discountRate : 0;
    const shipping = subtotal > 100 ? 0 : 9.99;
    const tax = (subtotal - discount) * 0.08;
    const finalTotal = Math.max(0, subtotal - discount + shipping + tax);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      finalTotal: Number(finalTotal.toFixed(2))
    };
  }

  submitCheckoutOrder() {
    if (this.cart.length === 0) throw new Error("Cart is empty");
    if (!this.shippingAddress) throw new Error("Shipping address not provided");

    const totals = this.calculateTotals();
    const orderId = `ORD-${Date.now()}`;
    this.orderStatus = "completed";

    return {
      success: true,
      orderId,
      orderStatus: "completed",
      totals,
      shippingTo: this.shippingAddress.fullName
    };
  }

  getCartTotalItems() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  reset() {
    this.cart = [];
    this.appliedCoupon = null;
    this.shippingAddress = null;
    this.orderStatus = "browsing";
  }
}
