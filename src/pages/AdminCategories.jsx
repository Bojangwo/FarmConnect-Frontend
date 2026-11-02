
import { useEffect, useState } from "react";
import {
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deactivateCategory,
} from "../services/api";

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCategories() {
    try {
      const data = await getAllCategoriesAdmin();
      setCategories(
        Array.isArray(data) ? data : data.categories || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  
async function handleEdit(category) {
  const newName = window.prompt(
    "Enter the new category name:",
    category.name
  );

  if (newName === null) return;

  if (!newName.trim()) {
    setError("Category name cannot be empty.");
    return;
  }

  const newDescription = window.prompt(
    "Enter the new description:",
    category.description || ""
  );

  if (newDescription === null) return;

  try {
    setError("");
    setSuccess("");

    await updateCategory(category._id, {
      name: newName.trim(),
      description: newDescription.trim(),
    });

    await loadCategories();

    setSuccess("Category updated successfully!");
  } catch (err) {
    setError(err.message);
  }
}



async function handleDeactivate(category) {
  const confirmed = window.confirm(
    `Are you sure you want to deactivate "${category.name}"?`
  );

  if (!confirmed) return;

  try {
    setError("");
    setSuccess("");

    await deactivateCategory(category._id);

    await loadCategories();

    setSuccess(
      `"${category.name}" has been deactivated successfully!`
    );
  } catch (err) {
    setError(err.message);
  }
}



async function handleReactivate(category) {
  const confirmed = window.confirm(
    `Are you sure you want to reactivate "${category.name}"?`
  );

  if (!confirmed) return;

  try {
    setError("");
    setSuccess("");

    await updateCategory(category._id, {
      status: "active",
    });

    await loadCategories();

    setSuccess(
      `"${category.name}" has been reactivated successfully!`
    );
  } catch (err) {
    setError(err.message);
  }
}



  async function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter a category name.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await createCategory({
        name: name.trim(),
        description: description.trim(),
      });

      setSuccess("Category created successfully!");
      setName("");
      setDescription("");

      await loadCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-bold text-green-800">
          Category Management 🌱
        </h1>

        <p className="mb-8 text-gray-600">
          Create and manage product categories on FarmConnect.
        </p>

        {error && (
          <div className="mb-5 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg bg-green-100 p-4 text-green-800">
            {success}
          </div>
        )}

        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-green-800">
            Add New Category
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Category Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vegetables"
                required
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this category..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-green-600"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create Category"}
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-bold text-green-800">
              Existing Categories
            </h2>
          </div>

          {loading ? (
            <p className="p-6 text-gray-600">
              Loading categories...
            </p>
          ) : categories.length === 0 ? (
            <p className="p-6 text-gray-500">
              No categories found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-green-100 text-green-900">
                  <tr>
                    <th className="p-4">Category Name</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map((category) => (
                    <tr
                      key={category._id}
                      className="border-t hover:bg-green-50"
                    >
                      <td className="p-4 font-medium">
                        {category.name}
                      </td>
                      <td className="p-4 text-gray-600">
                        {category.description || "No description"}
                      </td>
                      <td className="p-4">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
                          {category.status === "inactive"
  ? "Inactive"
  : "Active"}
                        </span>
                      </td>
                      

<td className="p-4">
  <div className="flex gap-2">
    <button
      type="button"
      onClick={() => handleEdit(category)}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      Edit
    </button>

    {category.status === "active" && (
      <button
        type="button"
        onClick={() => handleDeactivate(category)}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        Deactivate
      </button>
    )}

    
{category.status === "inactive" && (
  <button
    onClick={() => handleReactivate(category)}
    className="rounded bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
  >
    Reactivate
  </button>
)}

  </div>
</td>


                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminCategories;
