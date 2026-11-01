
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

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
      </Route>
      <Route path="/farmer/edit-product/:id" element={<EditProduct />} />
      <Route
  path="/farmer/purchase-requests"
  element={<FarmerPurchaseRequests />}
/>
    </Routes>
  );
}

export default App;
