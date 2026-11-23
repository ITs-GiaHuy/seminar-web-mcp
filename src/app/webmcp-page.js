/**
 * WebMCP Page Implementation
 * Exposes web page capabilities directly to in-browser agents via document.modelContext
 * Conforms to W3C Web Machine Learning Community Group WebMCP Specification.
 */

export function registerStoreWebMCPTools(document, store) {
  if (!document.modelContext) {
    throw new Error("document.modelContext is not available. Please install WebMCP polyfill first.");
  }

  // 1. Tool: searchProducts
  document.modelContext.registerTool({
    name: "searchProducts",
    description: "Search product catalog by keyword query and optional maximum price filter.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keyword (e.g. jacket, headphones)" },
        maxPrice: { type: "number", description: "Optional upper bound for product price in USD" }
      },
      required: ["query"]
    },
    annotations: {
      readOnlyHint: true
    },
    execute: async ({ query, maxPrice }) => {
      const results = store.searchProducts(query, maxPrice !== undefined ? maxPrice : Infinity);
      return { count: results.length, items: results };
    }
  });

  // 2. Tool: filterCatalog
  document.modelContext.registerTool({
    name: "filterCatalog",
    description: "Filter catalog by category and sort by specified criterion.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["all", "apparel", "electronics", "home", "footwear"],
          description: "Category to filter by"
        },
        sortBy: {
          type: "string",
          enum: ["default", "rating_desc", "price_asc"],
          description: "Sorting order"
        }
      },
      required: ["category"]
    },
    annotations: {
      readOnlyHint: true
    },
    execute: async ({ category, sortBy }) => {
      const results = store.filterCatalog(category, sortBy);
      return { count: results.length, items: results };
    }
  });

  // 3. Tool: addToCart
  document.modelContext.registerTool({
    name: "addToCart",
    description: "Add an item to the shopping cart by product ID and quantity.",
    inputSchema: {
      type: "object",
      properties: {
        productId: { type: "string", description: "Unique product identifier (e.g. PROD-101)" },
        quantity: { type: "integer", minimum: 1, description: "Number of units to add (default 1)" }
      },
      required: ["productId"]
    },
    annotations: {
      readOnlyHint: false,
      consequentialHint: false
    },
    execute: async ({ productId, quantity = 1 }) => {
      return store.addToCart(productId, quantity);
    }
  });

  // 4. Tool: applyCoupon
  document.modelContext.registerTool({
    name: "applyCoupon",
    description: "Apply a promotional discount code to the cart.",
    inputSchema: {
      type: "object",
      properties: {
        couponCode: { type: "string", description: "Coupon code (e.g. DISCOUNT20, SAVE10)" }
      },
      required: ["couponCode"]
    },
    annotations: {
      readOnlyHint: false
    },
    execute: async ({ couponCode }) => {
      return store.applyCoupon(couponCode);
    }
  });

  // 5. Tool: setShippingAddress
  document.modelContext.registerTool({
    name: "setShippingAddress",
    description: "Set customer contact information and shipping destination address.",
    inputSchema: {
      type: "object",
      properties: {
        fullName: { type: "string", description: "Recipient full legal name" },
        address: { type: "string", description: "Street address" },
        postalCode: { type: "string", description: "Postal or ZIP code" },
        email: { type: "string", description: "Notification email address" }
      },
      required: ["fullName", "address", "postalCode", "email"]
    },
    annotations: {
      readOnlyHint: false
    },
    execute: async (addressDetails) => {
      return store.setShippingAddress(addressDetails);
    }
  });

  // 6. Tool: submitCheckoutOrder
  document.modelContext.registerTool({
    name: "submitCheckoutOrder",
    description: "Calculates final order totals with shipping & taxes and submits the purchase.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    },
    annotations: {
      readOnlyHint: false,
      consequentialHint: true // Critical user confirmation hint
    },
    execute: async () => {
      return store.submitCheckoutOrder();
    }
  });
}
