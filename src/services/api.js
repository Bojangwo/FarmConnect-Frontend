const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  if (!data.token || !data.user) {
    throw new Error("Invalid login response from server");
  }

  return data;
}



export async function registerUser(userData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
}




export async function getMyProducts() {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/products/my-products`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch your products"
    );
  }

  return data;
}



export async function getCategories() {
  const response = await fetch(
    `${API_BASE_URL}/categories`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch categories"
    );
  }

  return data;
}



export async function createProduct(formData) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/products`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to create product"
    );
  }

  return data;
}


export async function updateProduct(productId, updates) {
  const token = sessionStorage.getItem("token");
  const isFormData = updates instanceof FormData;

  const response = await fetch(
    `${API_BASE_URL}/products/${productId}`,
    {
      method: "PUT",
      headers: {
        ...(isFormData
          ? {}
          : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${token}`,
      },
      body: isFormData
        ? updates
        : JSON.stringify(updates),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update product");
  }

  return data;
}


export async function deleteProduct(productId) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/products/${productId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to remove product"
    );
  }

  return data;
}



export async function getFarmerPurchaseRequests() {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/purchase-requests/farmer`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch purchase requests"
    );
  }

  return data;
}

export async function respondToPurchaseRequest(requestId, status) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/purchase-requests/${requestId}/respond`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to respond to purchase request"
    );
  }

  return data;
}




export async function getMyOrders(type = null) {
  const token = sessionStorage.getItem("token");

  const query = type
    ? `?type=${encodeURIComponent(type)}`
    : "";

  const response = await fetch(
    `${API_BASE_URL}/orders${query}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch orders"
    );
  }

  return data;
}


export async function updateOrderStatus(orderId, status) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/orders/${orderId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update order status"
    );
  }

  return data;
}



export async function getMarketplaceProducts() {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: "GET",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch marketplace products"
    );
  }

  return data;
}



export async function getProductById(productId) {
  const response = await fetch(
    `${API_BASE_URL}/products/${productId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch product details"
    );
  }

  return data;
}



export async function createPurchaseRequest(requestData) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/purchase-requests`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to send purchase request"
    );
  }

  return data;
}



export async function confirmOrderDelivery(orderId) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/orders/${orderId}/confirm-delivery`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to confirm delivery"
    );
  }

  return data;
}



export async function getMyDeliveries() {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/orders/my-deliveries`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch assigned deliveries"
    );
  }

  return data;
}

export async function updateDeliveryStatus(orderId, deliveryStatus) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/orders/${orderId}/delivery-status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ deliveryStatus }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update delivery status"
    );
  }

  return data;
}

export async function updateDeliveryLocation(
  orderId,
  latitude,
  longitude,
  accuracy
) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/orders/${orderId}/delivery-location`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        latitude,
        longitude,
        accuracy,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update delivery location"
    );
  }

  return data;
}


export async function getAllUsers() {
  const token = sessionStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch registered users"
    );
  }

  return data;
}



export async function updateUserStatus(userId, status) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/admin/users/${userId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update user status"
    );
  }

  return data;
}



export async function createCategory(categoryData) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(categoryData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to create category"
    );
  }

  return data;
}


export async function updateCategory(categoryId, categoryData) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/categories/${categoryId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(categoryData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update category"
    );
  }

  return data;
}



export async function deactivateCategory(categoryId) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/categories/${categoryId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to deactivate category"
    );
  }

  return data;
}



export async function getAllCategoriesAdmin() {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/admin/categories`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch admin categories"
    );
  }

  return data;
}



export async function getAllOrdersAdmin() {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/admin/orders`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch orders"
    );
  }

  return data;
}



export async function assignDeliveryAgentAdmin(
  orderId,
  deliveryAgentId
) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/orders/${orderId}/assign-delivery`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ deliveryAgentId }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to assign delivery agent"
    );
  }

  return data;
}


export async function initiatePayment(orderId) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/payments/${orderId}/initiate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to initiate payment"
    );
  }

  return data;
}

export async function verifyPayment(paymentId) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/payments/${paymentId}/verify`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to verify payment"
    );
  }

  return data;
}


// Get the latest delivery location for the logged-in buyer
export async function getBuyerDeliveryLocation(orderId) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/orders/${orderId}/delivery-location`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch delivery location"
    );
  }

  return data;
}


export async function createReview(orderId, rating, comment) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      orderId,
      rating,
      comment,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to submit review"
    );
  }

  return data;
}


export async function getFarmerReviews(farmerId) {
  const response = await fetch(
    `${API_BASE_URL}/reviews/farmer/${farmerId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch farmer reviews"
    );
  }

  return data;
}


// Append these exports to your existing src/services/api.js.
// They use the API_BASE_URL already declared at the top of that file.
async function adminFinanceRequest(path, options = {}) {
  const token = sessionStorage.getItem("token");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

export const getAdminFinances = () => adminFinanceRequest("/admin/finances");
export const getAdminPaymentSettings = () => adminFinanceRequest("/admin/payment-settings");
export const updateAdminPaymentSettings = (settings) => adminFinanceRequest("/admin/payment-settings", { method: "PATCH", body: JSON.stringify(settings) });
export const prepareAdminPayouts = (orderId) => adminFinanceRequest(`/admin/orders/${encodeURIComponent(orderId)}/prepare-payouts`, { method: "POST" });
export const recordAdminPayout = (payoutId, details) => adminFinanceRequest(`/admin/payouts/${encodeURIComponent(payoutId)}/mark-paid`, { method: "PATCH", body: JSON.stringify(details) });



export async function getMyEarnings() {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/earnings/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to load earnings"
    );
  }

  return data;
}

export async function getMyPayoutDetails() {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/payout-details/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to load payout details"
    );
  }

  return data;
}

export async function updateMyPayoutDetails(details) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    `${API_BASE_URL}/payout-details/me`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(details),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to save payout details"
    );
  }

  return data;
}
