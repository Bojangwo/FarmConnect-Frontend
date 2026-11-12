import { useEffect, useMemo, useState } from "react";
import {
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deactivateCategory,
} from "../services/api";

const fieldClass = "w-full rounded-xl border border-[#DCE5D6] bg-white px-4 py-3 text-sm text-[#183B2B] outline-none transition focus:border-[#77975F] focus:ring-2 focus:ring-[#77975F]/15";

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadCategories() {
    const data = await getAllCategoriesAdmin();
    setCategories(Array.isArray(data) ? data : data.categories || []);
  }

  useEffect(() => {
    let active = true;
    getAllCategoriesAdmin()
      .then((data) => {
        if (active) setCategories(Array.isArray(data) ? data : data.categories || []);
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const activeCount = categories.filter((c) => c.status !== "inactive").length;
  const filteredCategories = useMemo(() => categories.filter((category) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || category.name?.toLowerCase().includes(term) || category.description?.toLowerCase().includes(term);
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? category.status !== "inactive" : category.status === "inactive");
    return matchesSearch && matchesStatus;
  }), [categories, search, statusFilter]);

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
  }

  function startEdit(category) {
    setEditingId(category._id);
    setName(category.name || "");
    setDescription(category.description || "");
    setError("");
    setSuccess("");
    document.getElementById("category-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) { setError("Please enter a category name."); return; }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = { name: name.trim(), description: description.trim() };
      if (editingId) {
        await updateCategory(editingId, payload);
      } else {
        await createCategory(payload);
      }
      await loadCategories();
      setSuccess(editingId ? "Category updated successfully." : "Category created successfully.");
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(category) {
    const isInactive = category.status === "inactive";
    const action = isInactive ? "reactivate" : "deactivate";
    if (!window.confirm(`Are you sure you want to ${action} "${category.name}"?`)) return;
    setBusyId(category._id);
    setError("");
    setSuccess("");
    try {
      if (isInactive) {
        await updateCategory(category._id, { status: "active" });
      } else {
        await deactivateCategory(category._id);
      }
      await loadCategories();
      setSuccess(`"${category.name}" ${isInactive ? "reactivated" : "deactivated"} successfully.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF9F4] px-4 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#77975F]">Platform management</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-[#183B2B]">Categories</h1>
        <p className="mt-2 text-sm text-[#718073]">Organize the produce available on FarmConnect.</p>

        {error && <div role="alert" className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {success && <div role="status" className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-800">{success}</div>}

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Total categories", categories.length, "All categories"],
            ["Active", activeCount, "Available for product listings"],
            ["Inactive", categories.length - activeCount, "Hidden from new listings"],
          ].map(([label, value, subtitle]) => (
            <div key={label} className="rounded-2xl border border-[#E1E8DC] bg-white p-6 shadow-sm">
              <p className="text-xs text-[#718073]">{label}</p>
              <p className="mt-3 font-serif text-4xl font-semibold text-[#194C35]">{value}</p>
              <p className="mt-2 text-xs text-[#8A968A]">{subtitle}</p>
            </div>
          ))}
        </section>

        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(290px,0.85fr)_minmax(0,1.5fr)]">
          <section id="category-form" className="scroll-mt-6 rounded-2xl border border-[#E1E8DC] bg-white p-6 shadow-sm sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#77975F]">Category details</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-[#183B2B]">{editingId ? "Edit category" : "Add new category"}</h2>
            <p className="mt-2 text-sm text-[#718073]">{editingId ? "Update the category information below." : "Create a category for farmers to use when listing produce."}</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="category-name" className="mb-2 block text-sm font-semibold text-[#183B2B]">Category name</label>
                <input id="category-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vegetables" required maxLength={100} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="category-description" className="mb-2 block text-sm font-semibold text-[#183B2B]">Description</label>
                <textarea id="category-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe this category..." rows={4} className={fieldClass} />
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={saving} className="rounded-full bg-[#194C35] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#123D2A] disabled:opacity-50">{saving ? "Saving..." : editingId ? "Save changes" : "Create category"}</button>
                {editingId && <button type="button" onClick={resetForm} disabled={saving} className="rounded-full border border-[#CBD8C4] px-6 py-3 text-sm font-semibold text-[#194C35] hover:bg-[#F2F6EE]">Cancel</button>}
              </div>
            </form>
          </section>

          <section className="min-w-0">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#183B2B]">Existing categories</h2>
                <p className="mt-1 text-sm text-[#718073]">Edit descriptions or control availability.</p>
              </div>
              <span className="rounded-full bg-[#E9F0E2] px-4 py-2 text-xs font-semibold text-[#194C35]">{filteredCategories.length} shown</span>
            </div>
            <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-[#E1E8DC] bg-white p-4 shadow-sm">
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories..." aria-label="Search categories" className={`${fieldClass} min-w-0 flex-1 basis-48`} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter category status" className={`${fieldClass} w-auto`}>
                <option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#E1E8DC] bg-white shadow-sm">
              {loading ? <p className="p-8 text-sm text-[#718073]">Loading categories...</p> : filteredCategories.length === 0 ? <p className="p-8 text-sm text-[#718073]">No matching categories found.</p> : (
                <div className="divide-y divide-[#EEF1EA]">
                  {filteredCategories.map((category) => {
                    const inactive = category.status === "inactive";
                    return (
                      <div key={category._id} className="flex flex-wrap items-center justify-between gap-4 p-5 transition hover:bg-[#FAFBF8]">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-[#183B2B]">{category.name}</h3>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${inactive ? "bg-[#F0F0EC] text-[#777E74]" : "bg-[#EAF3E6] text-[#32633C]"}`}>{inactive ? "Inactive" : "Active"}</span>
                          </div>
                          <p className="mt-2 text-sm text-[#718073]">{category.description || "No description provided"}</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button type="button" onClick={() => startEdit(category)} disabled={busyId === category._id} className="rounded-lg border border-[#CBD8C4] px-4 py-2 text-xs font-semibold text-[#194C35] hover:bg-[#F2F6EE] disabled:opacity-50">Edit</button>
                          <button type="button" onClick={() => changeStatus(category)} disabled={busyId === category._id} className={`rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50 ${inactive ? "bg-[#E9F0E2] text-[#194C35] hover:bg-[#DBE9D3]" : "bg-[#FCEBE8] text-[#A94437] hover:bg-[#F9DCD6]"}`}>{busyId === category._id ? "Updating..." : inactive ? "Reactivate" : "Deactivate"}</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default AdminCategories;
