import { Link } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Boxes,
  Network,
  Search,
  CreditCard,
  Truck,
  Cpu,
  Wrench,
  Stethoscope,
  Building2,
  Package,
  Zap,
  ClipboardList,
  CheckCircle2,
  Factory,
  Sparkles,
} from "lucide-react";
import { paths } from "@/routes/paths";
import { BannerZone } from "@/components/banners/BannerRenderer";
import { Seo, SITE_URL, siteUrl } from "@/components/seo/Seo";

const STATS = [
  { value: "500+", label: "Verified suppliers" },
  { value: "25k+", label: "Products cataloged" },
  { value: "99.9%", label: "Platform uptime" },
  { value: "24/7", label: "Shopping support" },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified Suppliers",
    description: "Every supplier is vetted for quality, compliance, and reliability before they can sell on HTAShop.",
  },
  {
    icon: Network,
    title: "Multi-vendor Marketplace",
    description: "Shop from verified suppliers across thousands of products with transparent pricing.",
  },
  {
    icon: Boxes,
    title: "Real-time Inventory",
    description: "Live stock levels and availability across warehouses, so buyers always know what ships today.",
  },
  {
    icon: Search,
    title: "AI-Powered Search",
    description: "Find the right product faster with smart search, filters, and specification-based discovery.",
  },
  {
    icon: CreditCard,
    title: "Flexible Payments",
    description: "Support for purchase orders, credit terms, and secure enterprise payment workflows.",
  },
  {
    icon: Truck,
    title: "End-to-end Logistics",
    description: "Track orders from placement to delivery with clear statuses and proactive updates.",
  },
];

const CATEGORIES = [
  { icon: Cpu, name: "IT & Electronics", items: "Laptops, networking, components" },
  { icon: Wrench, name: "MRO & Industrial", items: "Tools, maintenance, safety" },
  { icon: Stethoscope, name: "Medical & Lab", items: "Equipment, consumables, PPE" },
  { icon: Building2, name: "Building & Construction", items: "Materials, hardware, supplies" },
  { icon: Package, name: "Packaging & Supplies", items: "Cartons, films, office essentials" },
  { icon: Zap, name: "Electrical & Power", items: "Cables, panels, switchgear" },
];

const STEPS = [
  { icon: Search, title: "Discover", description: "Browse products and compare specifications from vetted suppliers." },
  { icon: ClipboardList, title: "Request Quote", description: "Add to cart or request a quote for B2B pricing and terms." },
  { icon: CheckCircle2, title: "Approve & Order", description: "Review, approve, and place your order securely." },
  { icon: Truck, title: "Track & Receive", description: "Follow fulfillment and receive your goods on schedule." },
];

const BRANDS = ["Apple", "Dell", "HP", "Lenovo", "Samsung", "LG", "Bosch", "Siemens", "Schneider Electric", "ABB", "Honeywell", "3M"];

const FEATURED = [
  { icon: Cpu, name: "Enterprise NVMe SSD", category: "IT & Electronics", price: "From $129" },
  { icon: Wrench, name: "Industrial Power Drill", category: "MRO & Industrial", price: "From $89" },
  { icon: Stethoscope, name: "Digital Thermometer Kit", category: "Medical & Lab", price: "From $45" },
];

export default function HomePage() {
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HTAShop",
    url: SITE_URL,
    logo: "https://cdn.htashop.com/brand/logo.png",
    description:
      "HTAShop is an e-commerce platform connecting buyers with verified suppliers — online shopping with secure payments and fast delivery.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "sales@htashop.com",
      contactType: "customer support",
      availableLanguage: ["English", "Urdu"],
    },
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "HTAShop",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl("/products")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div id="top">
      <Seo
        title="Online Shopping in Pakistan — Electronics, IT, MRO & Industrial Supplies"
        description="HTAShop is Pakistan's trusted e-commerce platform for electronics, IT, MRO, and industrial supplies. Shop from verified suppliers with secure payments, fast delivery, and 24/7 support."
        keywords={[
          "online shopping Pakistan",
          "electronics store",
          "IT products",
          "industrial supplies",
          "MRO supplies",
          "HTAShop",
          "buy online Pakistan",
          "B2B e-commerce",
        ]}
        canonical="/"
        type="website"
        jsonLd={[organizationLd, websiteLd]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-b from-blue-50 via-white to-white dark:border-gray-800 dark:from-gray-900 dark:via-gray-950 dark:to-gray-950">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_top_right,#3b82f6_0,transparent_45%)] dark:opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              E-commerce Platform · Verified Suppliers
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl dark:text-white">
              Online shopping,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">simplified.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              HTAShop connects buyers with trusted suppliers through a modern e-commerce
              platform — secure payments, fast delivery, and end-to-end order management.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to={paths.register} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700">
                Browse the catalog <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">
                Why HTAShop
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic banner zone (hero, promo, sponsored, etc.) */}
      <div className="mx-auto max-w-[1920px] px-4 py-8 sm:px-6 lg:px-8">
        <BannerZone placement="home" />
      </div>

      {/* Stats */}
      <section className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{stat.value}</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section id="products" className="scroll-mt-24 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Featured products</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">A glimpse of the catalog trusted by enterprise buyers.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED.map((item) => (
              <div key={item.name} className="group rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <item.icon className="h-6 w-6" />
                </div>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-400">{item.category}</p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.price}</span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                    Request quote <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="scroll-mt-24 bg-gray-50 py-16 sm:py-20 dark:bg-gray-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Shop by category</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">Organized for every enterprise purchasing need.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-blue-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <cat.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{cat.items}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-24 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Why shoppers choose HTAShop</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">Built for a smooth, secure online shopping experience.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24 bg-gray-50 py-16 sm:py-20 dark:bg-gray-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">How it works</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">From discovery to delivery in four simple steps.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="absolute -top-3 left-6 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  {index + 1}
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section id="brands" className="scroll-mt-24 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Brands you can trust</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300">Products from the world's leading manufacturers and OEMs.</p>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {BRANDS.map((brand) => (
              <span key={brand} className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Contact */}
      <section id="contact" className="scroll-mt-24 border-t border-gray-200 bg-blue-600 dark:border-gray-800 dark:bg-blue-700">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to start shopping?</h2>
            <p className="mt-4 text-lg text-blue-100">
              Join thousands of buyers and suppliers using HTAShop to shop and sell with confidence.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to={paths.register} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50">
                <Factory className="h-4 w-4" />
                Become a supplier
              </Link>
              <a href="mailto:sales@htashop.com" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/40 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                sales@htashop.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
