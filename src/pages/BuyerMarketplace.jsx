
import { useEffect, useState } from "react";
import {
  getMarketplaceProducts,
  getCategories,
  getFarmerReviews,
} from "../services/api";
import { Link } from "react-router-dom";

function BuyerMarketplace() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [farmerRatings, setFarmerRatings] = useState({});

  useEffect(() => {
    let active = true;

    async function loadMarketplace() {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getMarketplaceProducts(),
          getCategories(),
        ]);

        if (!active) return;

        const productList = Array.isArray(productsData)
          ? productsData
          : productsData.products || [];

        setProducts(productList);

        setCategories(
          Array.isArray(categoriesData)
            ? categoriesData
            : categoriesData.categories || []
        );

        const farmerIds = [
          ...new Set(
            productList
              .map((product) => product.farmer?._id)
              .filter(Boolean)
          ),
        ];

        const results = await Promise.allSettled(
          farmerIds.map(getFarmerReviews)
        );

        if (!active) return;

        const ratings = {};

        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            ratings[farmerIds[index]] = {
              averageRating: result.value.averageRating,
              totalReviews: result.value.totalReviews,
            };
          }
        });

        setFarmerRatings(ratings);
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load marketplace.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMarketplace();

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = products
    .filter((product) => {
      const term = search.trim().toLowerCase();

      const matchesSearch =
        !term ||
        product.name?.toLowerCase().includes(term) ||
        product.farmer?.name?.toLowerCase().includes(term);

      const categoryId =
        typeof product.category === "object"
          ? product.category?._id
          : product.category;

      return (
        matchesSearch &&
        (!selectedCategory || categoryId === selectedCategory)
      );
    })
    .sort((a, b) => {
      if (sortBy === "price-low") {
        return Number(a.price) - Number(b.price);
      }

      if (sortBy === "price-high") {
        return Number(b.price) - Number(a.price);
      }

      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }

      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-GM", {
      maximumFractionDigits: 2,
    }).format(Number(price) || 0);

  const getProductImage = (product) => {
    const image = product.images?.[0];

    if (!image) return null;

    const imagePath =
      typeof image === "string"
        ? image
        : image.url || image.path;

    if (!imagePath) return null;

    if (/^https?:\/\//i.test(imagePath)) {
      return imagePath;
    }

    // Set this to your backend URL if your API uses
    // a different server or port.
    const backendUrl =
      import.meta.env.VITE_BACKEND_URL ||
      "http://localhost:5000";

    return `${backendUrl.replace(/\/$/, "")}/${imagePath.replace(
      /^\/+/,
      ""
    )}`;
  };

 
return (
  <div className="min-h-screen bg-[#FAF9F4] text-[#183B2B]">
    {/* Premium hero */}
    <section className="overflow-hidden bg-[#F0F2E8]">
      <div className="mx-auto grid max-w-7xl lg:min-h-[590px] lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-10 bg-[#8DAA71]" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#638151]">
              Welcome to FarmConnect
            </span>
          </div>

          <h1 className="max-w-xl font-serif text-5xl font-semibold leading-[1.12] tracking-tight sm:text-6xl xl:text-7xl">
            Nature's finest,
            <span className="block italic text-[#72945C]">
              delivered fresh.
            </span>
          </h1>

          <p className="mt-7 max-w-md text-base leading-8 text-[#657268]">
            Fresh harvests, trusted local farmers, and a simpler
            way to buy farm produce across The Gambia.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-5">
            <a
              href="#marketplace-products"
              className="rounded-full bg-[#194C35] px-8 py-4 text-sm font-bold text-white transition hover:bg-[#103725]"
            >
              Shop Fresh Produce ↗
            </a>
            <span className="text-sm font-medium text-[#6A786A]">
              Grown with care. Shared with you.
            </span>
          </div>

          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-[#D8DFD1] pt-6 text-sm text-[#4F6955]">
            <span>✓ Local farmers</span>
            <span>✓ Secure payments</span>
            <span>✓ Delivery tracking</span>
          </div>
        </div>

        <div className="relative min-h-[340px] lg:min-h-full">
          <img
            src="/images/hero-produce.jpg"
            alt="A colorful selection of freshly harvested vegetables"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute bottom-6 left-6 rounded-2xl bg-white/95 px-6 py-4 shadow-xl backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-[#72945C]">
              Farm to table
            </p>
            <p className="mt-1 font-serif text-xl font-semibold text-[#194C35]">
              Freshness starts here.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Marketplace */}
    <main
      id="marketplace-products"
      className="mx-auto max-w-7xl px-6 py-16 lg:py-20"
    >
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#77975F]">
            Handpicked for you
          </p>
          <h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">
            Our Fresh Market
          </h2>
          <p className="mt-3 text-[#718073]">
            Discover fresh produce from farmers across The Gambia.
          </p>
        </div>

        {!loading && !error && (
          <p className="rounded-full border border-[#DFE7D7] px-5 py-2 text-sm text-[#56735A]">
            {filteredProducts.length} products
          </p>
        )}
      </div>

      {/* Search and filters */}
      <div className="mb-10 grid gap-4 rounded-2xl border border-[#E5E9DE] bg-white p-5 shadow-sm md:grid-cols-[1fr_210px_190px]">
        <input
          type="search"
          placeholder="Search products or farmers..."
          aria-label="Search products or farmers"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[#E3E8DD] bg-[#FAFBF8] px-4 py-3.5 outline-none focus:border-[#72945C]"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by category"
          className="rounded-xl border border-[#E3E8DD] bg-[#FAFBF8] px-4 py-3.5 outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort products"
          className="rounded-xl border border-[#E3E8DD] bg-[#FAFBF8] px-4 py-3.5 outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="name">Name: A to Z</option>
        </select>
      </div>

      {error && (
        <p role="alert" className="mb-8 rounded-xl bg-red-50 p-5 text-red-700">
          {error}
        </p>
      )}

      {loading && (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse overflow-hidden rounded-2xl bg-white">
              <div className="h-64 bg-[#E4E9DE]" />
              <div className="space-y-4 p-6">
                <div className="h-5 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-1/2 rounded bg-gray-100" />
                <div className="h-10 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && filteredProducts.length === 0 && (
        <div className="rounded-3xl bg-white px-6 py-20 text-center">
          <h3 className="font-serif text-3xl">Nothing in the basket yet</h3>
          <p className="mt-3 text-gray-500">
            Try another search or explore all categories.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("");
            }}
            className="mt-6 rounded-full bg-[#194C35] px-7 py-3 text-white"
          >
            Clear Filters
          </button>
        </div>
      )}

      {!loading && !error && filteredProducts.length > 0 && (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const rating = farmerRatings[product.farmer?._id];
            const imageUrl = getProductImage(product);

            return (
              <article
                key={product._id}
                className="group flex flex-col overflow-hidden rounded-[22px] border border-[#E6EADF] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <Link
                  to={`/buyer/products/${product._id}`}
                  className="relative block h-64 overflow-hidden bg-[#E9EEE2]"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#8A9A82]">
                      Product image unavailable
                    </div>
                  )}

                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-[#245438] shadow-sm">
                    Fresh produce
                  </span>
                </Link>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-serif text-2xl font-semibold">
                    {product.name}
                  </h3>

                  <p className="mt-2 text-sm text-[#718073]">
                    Grown by{" "}
                    <span className="font-semibold text-[#386548]">
                      {product.farmer?.name || "Local farmer"}
                    </span>
                  </p>

                  <div className="mt-3 text-sm">
                    {rating?.totalReviews > 0 ? (
                      <p className="font-semibold text-[#C08A32]">
                        ★ {rating.averageRating}/5
                        <span className="ml-1 font-normal text-gray-500">
                          ({rating.totalReviews} reviews)
                        </span>
                      </p>
                    ) : (
                      <p className="text-gray-400">No reviews yet</p>
                    )}
                  </div>

                  <div className="mt-auto pt-6">
                    <div className="border-t border-[#EDF0E8] pt-5">
                      <p className="text-2xl font-bold text-[#1C603F]">
                        D{formatPrice(product.price)}
                        <span className="ml-1 text-sm font-normal text-gray-500">
                          / {product.unit}
                        </span>
                      </p>
                      <p className="mt-2 text-xs text-[#849087]">
                        Available:{" "}
                        {product.quantityAvailable ??
                          product.quantity ??
                          "Not specified"}{" "}
                        {product.unit}
                      </p>
                    </div>

                    <Link
                      to={`/buyer/products/${product._id}`}
                      className="mt-5 block rounded-full bg-[#194C35] px-5 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-[#103725]"
                    >
                      Explore Product ↗
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>

    {/* Farmer storytelling section */}
    <section className="bg-[#E8EEDF]">
      <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
        <div className="relative min-h-[360px] lg:min-h-[500px]">
          <img
            src="/images/farmer-story.jpg"
            alt="A farmer harvesting vegetables in a field"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-center px-8 py-16 sm:px-12 lg:px-16">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#77975F]">
            Behind every harvest
          </p>

          <h2 className="mt-5 max-w-lg font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            More than produce.
            <span className="block italic text-[#73935D]">
              It's a connection.
            </span>
          </h2>

          <p className="mt-7 max-w-lg leading-8 text-[#617365]">
            Every harvest begins with a farmer's dedication.
            FarmConnect brings farmers and buyers closer,
            creating opportunities for local agriculture
            to grow across The Gambia.
          </p>

          <a
            href="#marketplace-products"
            className="mt-8 w-fit border-b-2 border-[#194C35] pb-2 text-sm font-bold text-[#194C35]"
          >
            Discover Local Produce ↗
          </a>
        </div>
      </div>
    </section>

    <footer className="bg-[#143C2B] px-6 py-9 text-center text-sm text-white/70">
      <span className="font-serif text-xl font-semibold text-white">
        FarmConnect
      </span>
      <p className="mt-2">
        Connecting farmers and buyers across The Gambia.
      </p>
    </footer>
  </div>
);

}

export default BuyerMarketplace;
