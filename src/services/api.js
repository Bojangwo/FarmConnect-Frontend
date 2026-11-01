
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

  const response = await fetch(
    `${API_BASE_URL}/products/${productId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update product"
    );
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



export async function getMyOrders() {
  const token = sessionStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

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

