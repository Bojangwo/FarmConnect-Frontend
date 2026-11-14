import { useEffect, useState } from "react";
import {
  getMarketplaceProducts,
  getCategories,
  getFarmerReviews,
} from "../services/api";
import { Link } from "react-router-dom";


function ProductCard({ product, rating, imageUrl, formatPrice }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[#e2e8db] bg-white shadow-[0_12px_36px_rgba(7,39,24,0.13)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(7,39,24,0.19)]">
      <Link to={`/buyer/products/${product._id}`} className="relative block h-52 overflow-hidden bg-[#e9eee2] sm:h-56">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.style.display = "none"; }} />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[#849585]">Product image unavailable</div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#194c35] shadow-sm">Farm fresh</span>
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#77975f]">Local produce</p>
        <h3 className="mt-2 font-serif text-2xl font-semibold leading-tight text-[#183b2b]">{product.name}</h3>
        <p className="mt-2 text-sm text-[#6b796c]">By <span className="font-semibold text-[#356449]">{product.farmer?.name || "Local farmer"}</span></p>
        <div className="mt-3 text-xs">
          {rating?.totalReviews > 0 ? (
            <span className="font-semibold text-[#a77728]">★ {rating.averageRating}/5 <span className="font-normal text-[#7b857b]">({rating.totalReviews} reviews)</span></span>
          ) : <span className="text-[#8a948b]">No reviews yet</span>}
        </div>
        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-2 border-t border-[#e9eee5] pt-4">
            <p className="text-2xl font-bold text-[#194c35]">D{formatPrice(product.price)} <span className="text-sm font-normal text-[#7c897c]">/ {product.unit}</span></p>
          </div>
          <p className="mt-2 text-xs text-[#819083]">Available: {product.quantityAvailable ?? product.quantity ?? "Not specified"} {product.unit}</p>
          <Link to={`/buyer/products/${product._id}`} className="mt-4 block rounded-full bg-[#194c35] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#103725]">View product <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </article>
  );
}

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
  <div className="min-h-screen bg-[#faf9f4] text-[#183b2b]">
    {/* Full-width photo hero */}
    <section className="relative isolate min-h-[610px] overflow-hidden bg-[#103323] sm:min-h-[690px] lg:min-h-[740px]">
      <div className="absolute inset-0 bg-[url('/images/hero-produce.jpg')] bg-cover bg-center" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#092c1f]/95 via-[#0b3425]/80 to-[#09291e]/40" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#09291e]/80 via-transparent to-transparent" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-7xl flex-col px-6 pb-48 pt-20 sm:pb-52 sm:pt-24 lg:pt-28">
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-[#c6dcaa]">
          <span className="h-px w-9 bg-[#c6dcaa]" /> The FarmConnect marketplace
        </div>
        <h1 className="mt-7 max-w-3xl font-serif text-5xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Fresh from the farm.<span className="block italic text-[#c9dfb2]">Made for your table.</span>
        </h1>
        <p className="mt-7 max-w-lg text-base leading-8 text-white/85 sm:text-lg">
          Shop fresh produce directly from farmers across The Gambia. Discover local harvests, compare prices, and find what you need.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <a href="#marketplace-products" className="rounded-full bg-[#e4edda] px-7 py-3.5 text-sm font-bold text-[#194c35] transition hover:bg-white">Explore produce ↗</a>
          <span className="text-sm text-white/80">Local farmers · Fresh harvests</span>
        </div>
      </div>
    </section>

    {/* Product cards themselves overlap the hero, not the search panel. */}
    <main id="marketplace-products" className="relative z-10 mx-auto -mt-28 max-w-7xl px-5 pb-36 sm:-mt-36 sm:px-6 lg:-mt-40">
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse overflow-hidden rounded-[24px] bg-white shadow-xl">
              <div className="h-52 bg-[#e3eadf]" />
              <div className="space-y-4 p-6"><div className="h-6 w-3/4 rounded bg-[#e3eadf]" /><div className="h-4 w-1/2 rounded bg-[#edf1ea]" /><div className="h-12 rounded bg-[#edf1ea]" /></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-2xl bg-white p-7 text-red-700 shadow-lg">{error}</div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              rating={farmerRatings[product.farmer?._id]}
              imageUrl={getProductImage(product)}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
          <p className="font-serif text-2xl">{products.length ? "No matching produce" : "No products available yet"}</p>
          <p className="mt-2 text-sm text-[#6c796c]">{products.length ? "Try another search or category." : "Check back soon for fresh listings."}</p>
        </div>
      )}
      <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#77975f]">Explore the harvest</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">Our fresh market</h2>
          <p className="mt-2 text-sm text-[#6d7c70]">Find produce from local farmers, all in one place.</p>
        </div>
        {!loading && !error && <span className="rounded-full border border-[#dfe7d7] px-4 py-2 text-sm text-[#56735a]">{filteredProducts.length} products</span>}
      </div>
    </main>

    {/* Filters appear after the product grid in document order, but stay accessible
        at the bottom of the viewport while buyers scroll. */}
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dfe7d7] bg-[#faf9f4]/95 px-3 py-3 shadow-[0_-10px_35px_rgba(7,39,24,0.12)] backdrop-blur-md sm:px-6">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_190px_180px] sm:gap-3">
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or farmers..." aria-label="Search products or farmers" className="col-span-2 min-w-0 rounded-xl border border-[#dbe5d6] bg-white px-4 py-3 text-sm outline-none focus:border-[#77975f] sm:col-span-1" />
        <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} aria-label="Filter by category" className="min-w-0 rounded-xl border border-[#dbe5d6] bg-white px-3 py-3 text-sm outline-none focus:border-[#77975f]">
          <option value="">All categories</option>
          {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort products" className="min-w-0 rounded-xl border border-[#dbe5d6] bg-white px-3 py-3 text-sm outline-none focus:border-[#77975f]">
          <option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option>
        </select>
      </div>
    </div>

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
