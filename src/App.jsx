
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FarmerDashboard from "./pages/FarmerDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import FarmerPurchaseRequests from "./pages/FarmerPurchaseRequests";
import FarmerOrders from "./pages/FarmerOrders";
import BuyerMarketplace from "./pages/BuyerMarketplace";
import BuyerProductDetails from "./pages/BuyerProductDetails";
import BuyerOrders from "./pages/BuyerOrders";
import DeliveryAgentDashboard from "./pages/DeliveryAgentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCategories from "./pages/AdminCategories";
import AdminOrders from "./pages/AdminOrders";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
  path="/buyer/marketplace"
  element={<BuyerMarketplace />}
/>
<Route
  path="/buyer/products/:id"
  element={<BuyerProductDetails />}
/>

<Route element={<ProtectedRoute allowedRoles={["buyer"]} />}>
  <Route
    path="/buyer/orders"
    element={<BuyerOrders />}
  />
</Route>

<Route element={<ProtectedRoute allowedRoles={["deliveryAgent"]} />}>
  <Route
    path="/delivery/dashboard"
    element={<DeliveryAgentDashboard />}
  />
</Route>


<Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
  <Route path="/admin/dashboard" element={<AdminDashboard />} />
  <Route path="/admin/categories" element={<AdminCategories />} />
  <Route path="/admin/orders" element={<AdminOrders />} />
</Route>


      <Route element={<ProtectedRoute allowedRoles={["farmer"]} />}>
        <Route
          path="/farmer/dashboard"
          element={<FarmerDashboard />}
        />
        <Route path="/farmer/add-product" element={<AddProduct />} />
        <Route
  path="/farmer/orders"
  element={<FarmerOrders />}
/>

    <Route path="/farmer/edit-product/:id" element={<EditProduct />} />
      <Route
  path="/farmer/purchase-requests"
  element={<FarmerPurchaseRequests />}
/>
      </Route>
  
    </Routes>
  );
}

export default App;
