/**
 * DOM Page View & Actuation Controller
 * Provides the baseline representation that traditional in-browser agents
 * must scrape, parse, and interact with via synthetic clicks and keystrokes.
 * 
 * Supports dynamic DOM layout shifts (banners, class updates) to model real-world web fragility.
 */

export class DOMPageView {
  constructor(store, options = {}) {
    this.store = store;
    this.layoutVariant = options.variant || "standard"; // standard | obfuscated | banner | redesigned
    this.searchInputValue = "";
    this.maxPriceInputValue = "";
    this.categorySelectValue = "all";
    this.sortBySelectValue = "default";
    this.couponInputValue = "";
    this.fullNameInputValue = "";
    this.addressInputValue = "";
    this.postalCodeInputValue = "";
    this.emailInputValue = "";
    this.lastActionStatus = "Page loaded";
    this.bannerActive = this.layoutVariant === "banner";
  }

  /**
   * Generates standard DOM HTML representation of the active storefront.
   * Varies based on layoutVariant to model real-world web shifts.
   */
  renderHTML() {
    const products = this.store.products;
    const cart = this.store.cart;
    const totals = this.store.calculateTotals();

    const bannerHtml = this.bannerActive ? `
      <div id="promo-modal-banner" class="modal-overlay" style="display:block;">
        <div class="modal-content">
          <h3>Black Friday Sale! Get up to 30% off</h3>
          <p>Join our newsletter today.</p>
          <button type="button" id="btn-close-modal" class="btn-dismiss">Close [X]</button>
        </div>
      </div>
    ` : '';

    const btnClass = this.layoutVariant === "obfuscated" 
      ? "btn-sc-x99f8" 
      : "btn btn-primary btn-add-cart";

    const productCards = products.map(p => `
      <div class="product-card" id="card-${p.id}" data-category="${p.category}" data-price="${p.price}">
        <h3 class="product-title">${p.name}</h3>
        <p class="product-category">Category: <span>${p.category}</span></p>
        <p class="product-price">Price: $${p.price.toFixed(2)}</p>
        <p class="product-rating">Rating: ${p.rating} / 5.0</p>
        <p class="product-stock status-${p.inStock ? 'in' : 'out'}">${p.inStock ? 'In Stock' : 'Out of Stock'}</p>
        <div class="${this.layoutVariant === 'redesigned' ? 'action-bar-wrapper' : 'btn-wrapper'}">
          <button class="${btnClass}" id="btn-add-${p.id}" data-id="${p.id}" ${!p.inStock ? 'disabled' : ''}>
            Add to Cart
          </button>
        </div>
      </div>
    `).join('\n');

    const cartItems = cart.map(item => `
      <li class="cart-item" id="cart-item-${item.productId}">
        <span class="item-name">${item.name}</span>
        <span class="item-qty">Qty: ${item.quantity}</span>
        <span class="item-price">$${(item.unitPrice * item.quantity).toFixed(2)}</span>
      </li>
    `).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TechStore Online Shop</title>
</head>
<body>
  ${bannerHtml}
  <header id="site-header">
    <h1>TechStore Online Catalog</h1>
    <div id="cart-badge">Cart Items: <span id="cart-count">${this.store.getCartTotalItems()}</span></div>
  </header>

  <main id="main-content">
    <!-- Filter and Search Controls -->
    <section id="catalog-controls" class="control-panel">
      <form id="search-form" onsubmit="return false;">
        <label for="search-input">Search Catalog:</label>
        <input type="text" id="search-input" name="q" placeholder="Keywords..." value="${this.searchInputValue}">
        
        <label for="max-price-input">Max Price ($):</label>
        <input type="number" id="max-price-input" name="maxPrice" placeholder="Max $" value="${this.maxPriceInputValue}">
        
        <button type="button" id="btn-search" class="btn btn-secondary">Apply Search</button>
      </form>

      <form id="filter-sort-form" onsubmit="return false;">
        <label for="category-select">Category:</label>
        <select id="category-select" name="category">
          <option value="all" ${this.categorySelectValue === 'all' ? 'selected' : ''}>All Categories</option>
          <option value="apparel" ${this.categorySelectValue === 'apparel' ? 'selected' : ''}>Apparel</option>
          <option value="electronics" ${this.categorySelectValue === 'electronics' ? 'selected' : ''}>Electronics</option>
          <option value="home" ${this.categorySelectValue === 'home' ? 'selected' : ''}>Home</option>
          <option value="footwear" ${this.categorySelectValue === 'footwear' ? 'selected' : ''}>Footwear</option>
        </select>

        <label for="sort-select">Sort By:</label>
        <select id="sort-select" name="sortBy">
          <option value="default" ${this.sortBySelectValue === 'default' ? 'selected' : ''}>Default</option>
          <option value="rating_desc" ${this.sortBySelectValue === 'rating_desc' ? 'selected' : ''}>Highest Rating</option>
          <option value="price_asc" ${this.sortBySelectValue === 'price_asc' ? 'selected' : ''}>Lowest Price</option>
        </select>

        <button type="button" id="btn-apply-filters" class="btn btn-secondary">Filter & Sort</button>
      </form>
    </section>

    <!-- Product Grid -->
    <section id="product-grid" class="grid-container">
      ${productCards}
    </section>

    <!-- Shopping Cart & Order Summary -->
    <section id="cart-section" class="cart-container">
      <h2>Shopping Cart</h2>
      <ul id="cart-list">
        ${cartItems || '<li class="empty-msg">Your cart is currently empty.</li>'}
      </ul>

      <div id="coupon-box">
        <label for="coupon-code-input">Promo Code:</label>
        <input type="text" id="coupon-code-input" placeholder="e.g. DISCOUNT20" value="${this.couponInputValue}">
        <button type="button" id="btn-apply-coupon" class="btn btn-info">Apply Promo</button>
        ${this.store.appliedCoupon ? `<span class="coupon-success">Discount: ${this.store.appliedCoupon.code} (-${this.store.appliedCoupon.discountRate * 100}%)</span>` : ''}
      </div>

      <div id="order-summary-box">
        <p>Subtotal: <span id="summary-subtotal">$${totals.subtotal.toFixed(2)}</span></p>
        <p>Discount: <span id="summary-discount">-$${totals.discount.toFixed(2)}</span></p>
        <p>Estimated Tax: <span id="summary-tax">$${totals.tax.toFixed(2)}</span></p>
        <p>Shipping: <span id="summary-shipping">$${totals.shipping.toFixed(2)}</span></p>
        <h3>Final Total: <span id="summary-total">$${totals.finalTotal.toFixed(2)}</span></h3>
      </div>
    </section>

    <!-- Checkout Form -->
    <section id="checkout-section" class="checkout-container">
      <h2>Shipping & Checkout</h2>
      <form id="shipping-form" onsubmit="return false;">
        <div class="form-group">
          <label for="input-fullname">Full Name:</label>
          <input type="text" id="input-fullname" value="${this.fullNameInputValue}" required>
        </div>
        <div class="form-group">
          <label for="input-address">Street Address:</label>
          <input type="text" id="input-address" value="${this.addressInputValue}" required>
        </div>
        <div class="form-group">
          <label for="input-postal">Postal Code:</label>
          <input type="text" id="input-postal" value="${this.postalCodeInputValue}" required>
        </div>
        <div class="form-group">
          <label for="input-email">Email:</label>
          <input type="email" id="input-email" value="${this.emailInputValue}" required>
        </div>
        <button type="button" id="btn-save-address" class="btn btn-primary">Save Shipping Details</button>
      </form>

      <div class="checkout-action-area">
        <button type="button" id="btn-submit-order" class="btn btn-success btn-large">Confirm & Place Order</button>
        <div id="order-message" class="status-msg">${this.lastActionStatus}</div>
      </div>
    </section>
  </main>
</body>
</html>`;
  }

  /**
   * Executes synthetic actuation on DOM elements.
   */
  executeAction({ action, selector, value }) {
    // If modal banner is active and blocking, click to close it
    if (this.bannerActive && selector === "#btn-close-modal") {
      this.bannerActive = false;
      this.lastActionStatus = "Promo modal dismissed";
      return { success: true, status: this.lastActionStatus };
    }

    if (this.bannerActive && selector !== "#btn-close-modal") {
      return { success: false, error: "Element click intercepted by modal banner overlay" };
    }

    switch (action) {
      case "type":
        if (selector === "#search-input") this.searchInputValue = value;
        else if (selector === "#max-price-input") this.maxPriceInputValue = value;
        else if (selector === "#coupon-code-input") this.couponInputValue = value;
        else if (selector === "#input-fullname") this.fullNameInputValue = value;
        else if (selector === "#input-address") this.addressInputValue = value;
        else if (selector === "#input-postal") this.postalCodeInputValue = value;
        else if (selector === "#input-email") this.emailInputValue = value;
        else return { success: false, error: `Unknown input selector: ${selector}` };
        return { success: true, updated: selector, value };

      case "select":
        if (selector === "#category-select") this.categorySelectValue = value;
        else if (selector === "#sort-select") this.sortBySelectValue = value;
        else return { success: false, error: `Unknown select selector: ${selector}` };
        return { success: true, updated: selector, value };

      case "click":
        if (selector === "#btn-search") {
          const maxP = parseFloat(this.maxPriceInputValue) || Infinity;
          const res = this.store.searchProducts(this.searchInputValue, maxP);
          this.lastActionStatus = `Searched "${this.searchInputValue}", found ${res.length} items`;
          return { success: true, status: this.lastActionStatus };
        }
        if (selector === "#btn-apply-filters") {
          const res = this.store.filterCatalog(this.categorySelectValue, this.sortBySelectValue);
          this.lastActionStatus = `Filtered category: ${this.categorySelectValue}, sorted by ${this.sortBySelectValue}`;
          return { success: true, status: this.lastActionStatus };
        }
        if (selector.startsWith("#btn-add-")) {
          const prodId = selector.replace("#btn-add-", "");
          try {
            this.store.addToCart(prodId, 1);
            this.lastActionStatus = `Added ${prodId} to cart`;
            return { success: true, status: this.lastActionStatus };
          } catch (err) {
            return { success: false, error: err.message };
          }
        }
        if (selector === "#btn-apply-coupon") {
          const res = this.store.applyCoupon(this.couponInputValue);
          this.lastActionStatus = res.success ? `Coupon applied: ${this.couponInputValue}` : `Failed: ${res.error}`;
          return res;
        }
        if (selector === "#btn-save-address") {
          const res = this.store.setShippingAddress({
            fullName: this.fullNameInputValue,
            address: this.addressInputValue,
            postalCode: this.postalCodeInputValue,
            email: this.emailInputValue
          });
          this.lastActionStatus = res.success ? "Shipping address saved" : `Failed: ${res.error}`;
          return res;
        }
        if (selector === "#btn-submit-order") {
          try {
            const res = this.store.submitCheckoutOrder();
            this.lastActionStatus = `Order confirmed: ${res.orderId}`;
            return res;
          } catch (err) {
            return { success: false, error: err.message };
          }
        }
        return { success: false, error: `Clickable element not found: ${selector}` };

      default:
        return { success: false, error: `Unsupported action type: ${action}` };
    }
  }
}
