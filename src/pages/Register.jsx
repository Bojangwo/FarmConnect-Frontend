import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "buyer",
    city: "",
    region: "",
    longitude: "",
    latitude: "",
  });
  
  const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  
const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  const longitude = Number(form.longitude);
  const latitude = Number(form.latitude);

  if (
    form.longitude.trim() === "" ||
    form.latitude.trim() === "" ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    setError("Please enter valid longitude and latitude values.");
    return;
  }

  setLoading(true);

  try {
    const userData = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      password: form.password,
      role: form.role,
      location: {
        city: form.city.trim(),
        region: form.region.trim(),
        coordinates: [longitude, latitude],
      },
    };

    await registerUser(userData);

    navigate("/login", {
      state: {
        message: "Account created successfully! Please sign in.",
      },
    });
  } catch (err) {
    setError(err.message || "Registration failed. Please try again.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-green-50 px-4 py-12">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-extrabold text-green-800">
            🌾 FarmConnect
          </Link>

          <h1 className="mt-6 text-3xl font-bold">Create Account</h1>
          <p className="mt-2 text-gray-500">
            Join our agricultural marketplace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            ["name", "Full Name", "text"],
            ["email", "Email Address", "email"],
            ["phone", "Phone Number", "tel"],
            ["password", "Password", "password"],
            ["city", "City / Town", "text"],
            ["region", "Region", "text"],
          ].map(([name, label, type]) => (
            <div key={name}>
              <label
                htmlFor={name}
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                {label}
              </label>
              <input
                id={name}
                name={name}
                type={type}
                value={form[name]}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>
          ))}

          <div>
            <label
              htmlFor="role"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Register As
            </label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
            >
              <option value="buyer">Buyer</option>
              <option value="farmer">Farmer</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ["longitude", "Longitude"],
              ["latitude", "Latitude"],
            ].map(([name, label]) => (
              <div key={name}>
                <label
                  htmlFor={name}
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type="number"
                  step="any"
                  value={form[name]}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                />
              </div>
            ))}
          </div>

          {error && (
  <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
    {error}
  </p>
)}

         <button
  type="submit"
  disabled={loading}
  className="w-full rounded-lg bg-green-700 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-60"
>
  {loading ? "Creating Account..." : "Create Account"}
</button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-green-700 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
