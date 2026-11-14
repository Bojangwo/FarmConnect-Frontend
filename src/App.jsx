import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FarmerDashboard from "./pages/FarmerDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
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
import AdminFinances from "./pages/AdminFinances";
import MyEarnings from "./pages/MyEarnings";
import AdminReports from "./pages/AdminReports";
import RoleReports from './pages/RoleReports';


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<AppLayout />}>
        {/* Guests can still browse the marketplace and product details. */}
        <Route path="/buyer/marketplace" element={<BuyerMarketplace />} />
        <Route path="/buyer/products/:id" element={<BuyerProductDetails />} />

        <Route element={<ProtectedRoute allowedRoles={["buyer", "farmer"]} />}>
          <Route path="/buyer/orders" element={<BuyerOrders />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["farmer"]} />}>
          <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
          <Route path="/farmer/add-product" element={<AddProduct />} />
          <Route path="/farmer/edit-product/:id" element={<EditProduct />} />
          <Route path="/farmer/purchase-requests" element={<FarmerPurchaseRequests />} />
          <Route path="/farmer/orders" element={<FarmerOrders />} />
          <Route path="/farmer/earnings" element={<MyEarnings />} />
          <Route path='/farmer/reports' element={<RoleReports role='farmer' />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          <Route
  path="/admin/finances"
  element={<AdminFinances />}
/>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["deliveryAgent"]} />}>
          <Route path="/delivery/dashboard" element={<DeliveryAgentDashboard />} />
          <Route path="/delivery/earnings" element={<MyEarnings />} />
        </Route>
         <Route path='/delivery/reports' element={<RoleReports role='delivery' />} />

      </Route>
      
    </Routes>
  );
}
