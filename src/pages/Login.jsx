import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../services/api";


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
const navigate = useNavigate();

const location = useLocation();
const successMessage = location.state?.message;

  
const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const data = await loginUser(email, password);

    // Store authentication information for our initial setup.
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("user", JSON.stringify(data.user));

    // Temporary redirect until role dashboards are built.
    const dashboardRoutes = {
  farmer: "/farmer/dashboard",
  buyer: "/",
  admin: "/",
  deliveryAgent: "/",
};

navigate(dashboardRoutes[data.user.role] || "/", {
  replace: true,
});
  } catch (err) {
    setError(err.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-extrabold text-green-800">
            🌾 FarmConnect
          </Link>

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome Back
          </h1>

          <p className="mt-2 text-gray-500">
            Sign in to your marketplace account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            {successMessage && (
  <p
    role="status"
    className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
  >
    {successMessage}
  </p>
)}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {error && (
  <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
    {error}
  </p>
)}

          <button
  type="submit"
  disabled={loading}
  className="w-full rounded-lg bg-green-700 py-3 font-bold text-white transition hover:bg-green-800 disabled:opacity-60"
>
  {loading ? "Signing In..." : "Sign In"}
</button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-green-700 hover:underline"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
