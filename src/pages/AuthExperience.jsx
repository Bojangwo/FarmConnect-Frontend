import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../services/api";

const inputClass = "w-full rounded-xl border border-[#DCE6D8] bg-[#FCFDF9] px-4 py-3 text-sm text-[#183B2B] outline-none transition focus:border-[#6C9269] focus:ring-2 focus:ring-[#6C9269]/15";
const labelClass = "mb-1.5 block text-xs font-semibold text-[#274934]";
const initialForm = { name: "", email: "", phone: "", password: "", role: "buyer", city: "", region: "", longitude: "", latitude: "" };

export default function AuthExperience({ initialMode = "login" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.pathname === "/register" ? "register" : "login";
  const [login, setLogin] = useState({ email: "", password: "" });
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState({ login: "", register: "" });
  const [loading, setLoading] = useState({ login: false, register: false });
  const [notice, setNotice] = useState(location.state?.message || "");
  const registerScrollRef = useRef(null);

  useEffect(() => {
    if (location.state?.message) setNotice(location.state.message);
  }, [location.state]);

  function switchMode(next) {
    if (next === mode) return;
    setError((old) => ({ ...old, [next]: "" }));
    navigate(next === "login" ? "/login" : "/register", { replace: false });
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError((old) => ({ ...old, login: "" }));
    setLoading((old) => ({ ...old, login: true }));
    try {
      const data = await loginUser(login.email.trim(), login.password);
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));
      const destinations = {
        farmer: "/farmer/dashboard",
        buyer: "/buyer/marketplace",
        admin: "/admin/dashboard",
        deliveryAgent: "/delivery/dashboard",
      };
      navigate(destinations[data.user.role] || "/", { replace: true });
    } catch (err) {
      setError((old) => ({ ...old, login: err.message || "Unable to sign in." }));
    } finally {
      setLoading((old) => ({ ...old, login: false }));
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError((old) => ({ ...old, register: "" }));
    const longitude = Number(form.longitude);
    const latitude = Number(form.latitude);
    if (!form.longitude.trim() || !form.latitude.trim() || !Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      setError((old) => ({ ...old, register: "Please enter valid longitude and latitude values." }));
      return;
    }
    setLoading((old) => ({ ...old, register: true }));
    try {
      await registerUser({
        name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim(),
        password: form.password, role: form.role,
        location: { city: form.city.trim(), region: form.region.trim(), coordinates: [longitude, latitude] },
      });
      setNotice("Account created successfully! Please sign in.");
      setForm(initialForm);
      navigate("/login", { state: { message: "Account created successfully! Please sign in." } });
    } catch (err) {
      setError((old) => ({ ...old, register: err.message || "Registration failed. Please try again." }));
    } finally {
      setLoading((old) => ({ ...old, register: false }));
    }
  }

  const loginPanel = (
    <div className="flex h-full flex-col">
      <div className="mb-7">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#78966A]">Welcome back</span>
        <h2 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-[#183B2B]">Good to see you.</h2>
        <p className="mt-2 text-sm leading-6 text-[#6F806F]">Sign in to continue growing with FarmConnect.</p>
      </div>
      {notice && <p role="status" className="mb-5 rounded-xl bg-[#EDF6E9] px-4 py-3 text-sm text-[#285E39]">{notice}</p>}
      <form onSubmit={handleLogin} className="space-y-5">
        <div><label htmlFor="login-email" className={labelClass}>Email address</label><input id="login-email" type="email" autoComplete="email" required className={inputClass} placeholder="you@example.com" value={login.email} onChange={(e) => setLogin((old) => ({ ...old, email: e.target.value }))} /></div>
        <div><label htmlFor="login-password" className={labelClass}>Password</label><input id="login-password" type="password" autoComplete="current-password" required className={inputClass} placeholder="Enter your password" value={login.password} onChange={(e) => setLogin((old) => ({ ...old, password: e.target.value }))} /></div>
        {error.login && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error.login}</p>}
        <button type="submit" disabled={loading.login} className="w-full rounded-xl bg-[#194C35] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123B29] disabled:opacity-60">{loading.login ? "Signing in..." : "Sign in to FarmConnect"}</button>
      </form>
      <p className="mt-7 text-center text-sm text-[#718073]">New to FarmConnect? <button type="button" onClick={() => switchMode("register")} className="font-semibold text-[#194C35] underline-offset-4 hover:underline">Create an account</button></p>
    </div>
  );

  const registerFields = [
    { name: "name", label: "Full name", type: "text", autoComplete: "name", placeholder: "Your full name" },
    { name: "email", label: "Email address", type: "email", autoComplete: "email", placeholder: "you@example.com" },
    { name: "phone", label: "Phone number", type: "tel", autoComplete: "tel", placeholder: "Your phone number" },
    { name: "password", label: "Password", type: "password", autoComplete: "new-password", placeholder: "Create a password" },
    { name: "city", label: "City / town", type: "text", placeholder: "e.g. Brikama" },
    { name: "region", label: "Region", type: "text", placeholder: "e.g. West Coast Region" },
  ];

  const registerPanel = (
    <div className="flex h-full flex-col">
      <div className="mb-5 shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#78966A]">Join the community</span>
        <h2 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-[#183B2B]">Grow with us.</h2>
        <p className="mt-2 text-sm leading-6 text-[#6F806F]">Create your account and connect with Gambian agriculture.</p>
      </div>
      <div ref={registerScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2 [scrollbar-width:thin]">
        <form id="farmconnect-register-form" onSubmit={handleRegister} className="space-y-4 pb-3">
          {registerFields.map((field) => <div key={field.name}><label htmlFor={`register-${field.name}`} className={labelClass}>{field.label}</label><input id={`register-${field.name}`} name={field.name} type={field.type} autoComplete={field.autoComplete} placeholder={field.placeholder} required className={inputClass} value={form[field.name]} onChange={(e) => setForm((old) => ({ ...old, [e.target.name]: e.target.value }))} /></div>)}
          <div><label htmlFor="register-role" className={labelClass}>I want to join as</label><select id="register-role" name="role" value={form.role} onChange={(e) => setForm((old) => ({ ...old, role: e.target.value }))} className={inputClass}><option value="buyer">Buyer</option><option value="farmer">Farmer</option></select></div>
          <div className="grid grid-cols-2 gap-3">
            {[["longitude", "Longitude"], ["latitude", "Latitude"]].map(([name, label]) => <div key={name}><label htmlFor={`register-${name}`} className={labelClass}>{label}</label><input id={`register-${name}`} name={name} type="number" step="any" required className={inputClass} value={form[name]} onChange={(e) => setForm((old) => ({ ...old, [e.target.name]: e.target.value }))} /></div>)}
          </div>
          <button type="button" onClick={() => {
            if (!navigator.geolocation) { setError((old) => ({ ...old, register: "Your browser does not support location detection." })); return; }
            navigator.geolocation.getCurrentPosition((position) => {
              setForm((old) => ({ ...old, longitude: String(position.coords.longitude), latitude: String(position.coords.latitude) }));
              setError((old) => ({ ...old, register: "" }));
            }, () => setError((old) => ({ ...old, register: "Location unavailable. You can enter your coordinates manually." })), { enableHighAccuracy: true, timeout: 10000 });
          }} className="text-xs font-semibold text-[#477341] underline-offset-4 hover:underline">Use my current location</button>
          <p className="text-xs leading-5 text-[#7A897B]">Your location helps farmers and buyers connect locally. Location access is optional; you can enter coordinates manually.</p>
          {error.register && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error.register}</p>}
          <button type="submit" disabled={loading.register} className="w-full rounded-xl bg-[#194C35] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#123B29] disabled:opacity-60">{loading.register ? "Creating account..." : "Create my account"}</button>
        </form>
      </div>
      <p className="mt-4 shrink-0 text-center text-sm text-[#718073]">Already have an account? <button type="button" onClick={() => switchMode("login")} className="font-semibold text-[#194C35] underline-offset-4 hover:underline">Sign in</button></p>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8F8F2] text-[#183B2B]">
      <header className="relative z-30 border-b border-[#E5EBDD] bg-[#FDFDF9]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-[#194C35]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#194C35] text-lg text-[#E6EED6]">✦</span><span>FarmConnect</span></Link>
          <div className="flex items-center gap-2 text-sm"><Link to="/" className="hidden px-3 py-2 text-[#647766] hover:text-[#194C35] sm:block">Back to home</Link><button onClick={() => switchMode("login")} className={`rounded-full px-4 py-2 font-semibold transition ${mode === "login" ? "bg-[#194C35] text-white" : "text-[#194C35] hover:bg-[#E8EFE2]"}`}>Sign in</button><button onClick={() => switchMode("register")} className={`rounded-full px-4 py-2 font-semibold transition ${mode === "register" ? "bg-[#194C35] text-white" : "text-[#194C35] hover:bg-[#E8EFE2]"}`}>Join us</button></div>
        </div>
      </header>

      <main>
        {/* The photograph sits BEHIND the overlapping authentication cards. */}
        <section className="relative isolate min-h-[940px] overflow-hidden bg-[#143D2B] px-4 pb-20 pt-12 text-white sm:px-8 lg:pt-16">
          <img
            src="/images/hero-produce.jpg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#0D2F22]/80 via-[#0D2F22]/60 to-[#0D2F22]/85" />

          <div className="relative mx-auto max-w-6xl text-center">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#D6E7B8]">
              A marketplace rooted in community
            </span>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              Your place to grow.
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/85 sm:text-base">
              Buy fresh produce. Grow your farm business. Connect across The Gambia.
            </p>
          </div>

          {/* Desktop: both cards share a center anchor and physically slide
              across one another. The active card grows and comes forward. */}
          <div className="relative mx-auto mt-12 hidden h-[720px] max-w-[1120px] md:block">
            {[["login", loginPanel], ["register", registerPanel]].map(([panel, content]) => {
              const active = mode === panel;
              const isLogin = panel === "login";
              const sideOffset = isLogin ? "-37%" : "37%";

              return (
                <div
                  key={panel}
                  className={`absolute left-1/2 top-0 h-[680px] w-[min(650px,70%)] rounded-[30px] border border-[#E3EBDD] bg-white text-[#183B2B] transition-[transform,opacity,box-shadow] duration-700 ease-in-out motion-reduce:transition-none ${
                    active
                      ? "z-20 opacity-100 shadow-[0_35px_95px_rgba(0,0,0,0.35)]"
                      : "z-10 opacity-90 shadow-[0_18px_55px_rgba(0,0,0,0.25)]"
                  }`}
                  style={{
                    transform: active
                      ? "translateX(-50%) scale(1)"
                      : `translateX(-50%) translateX(${sideOffset}) scale(0.83)`,
                    transformOrigin: "center center",
                  }}
                >
                  {!active && (
                    <button
                      type="button"
                      aria-label={`Bring ${isLogin ? "sign in" : "registration"} to the front`}
                      onClick={() => switchMode(panel)}
                      className="absolute inset-0 z-30 cursor-pointer rounded-[30px] bg-[#F5F8F1]/20 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#D6E7B8]"
                    />
                  )}
                  <div
                    className={`h-full overflow-hidden rounded-[30px] bg-white p-9 lg:p-12 ${
                      !active ? "pointer-events-none select-none" : ""
                    }`}
                    aria-hidden={!active}
                  >
                    {content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile: full-size accessible forms, without overlapping inputs. */}
          <div className="mx-auto mt-9 max-w-xl rounded-[28px] border border-[#DDE6D7] bg-white p-6 text-[#183B2B] shadow-[0_24px_65px_rgba(0,0,0,0.3)] sm:p-8 md:hidden">
            <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#EEF3E9] p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`rounded-lg px-3 py-3 text-sm font-semibold ${mode === "login" ? "bg-white text-[#194C35] shadow-sm" : "text-[#6B806F]"}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode("register")}
                className={`rounded-lg px-3 py-3 text-sm font-semibold ${mode === "register" ? "bg-white text-[#194C35] shadow-sm" : "text-[#6B806F]"}`}
              >
                Create account
              </button>
            </div>
            <div className={mode === "register" ? "flex h-[640px] flex-col" : "min-h-[430px]"}>
              {mode === "login" ? loginPanel : registerPanel}
            </div>
          </div>

          <p className="relative mx-auto mt-3 max-w-lg text-center text-xs text-white/75">
            Fresh opportunities, grown locally.
          </p>
        </section>
      </main>
      <footer className="bg-[#143D2B] px-6 py-6 text-center text-xs text-white/65">© {new Date().getFullYear()} FarmConnect · Rooted in The Gambia</footer>
    </div>
  );
}
