import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("🌱 Seeding MyPerkFinder…");

  // --- Merchants ---
  const merchantData = [
    { name: "Best Buy", homepageUrl: "https://bestbuy.com", network: "cj" as const, commissionRate: 2.5 },
    { name: "Amazon", homepageUrl: "https://amazon.com", network: "rakuten" as const, commissionRate: 3.0 },
    { name: "Walmart", homepageUrl: "https://walmart.com", network: "impact" as const, commissionRate: 1.5 },
    { name: "Target", homepageUrl: "https://target.com", network: "impact" as const, commissionRate: 2.0 },
    { name: "Nike", homepageUrl: "https://nike.com", network: "awin" as const, commissionRate: 6.0 },
    { name: "Dell", homepageUrl: "https://dell.com", network: "cj" as const, commissionRate: 2.0 },
    { name: "eBay", homepageUrl: "https://ebay.com", network: "ebay" as const, commissionRate: 2.0 },
  ];
  const merchants = await Promise.all(
    merchantData.map((m) =>
      prisma.merchant.upsert({
        where: { slug: slugify(m.name) },
        update: { homepageUrl: m.homepageUrl },
        create: {
          name: m.name,
          slug: slugify(m.name),
          network: m.network,
          commissionRate: m.commissionRate,
          homepageUrl: m.homepageUrl,
          isActive: true,
        },
      })
    )
  );
  const byName = Object.fromEntries(merchants.map((m) => [m.name, m]));

  // --- Categories ---
  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {
      mappingKeywords: [
        "laptop",
        "phone",
        "smartphone",
        "tablet",
        "tv",
        "monitor",
        "electronics",
        "computer",
        "camera",
        "charger",
      ],
    },
    create: {
      name: "Electronics",
      slug: "electronics",
      seoTitle: "Electronics Deals — Laptops, Phones, Audio & TVs",
      seoDescription: "The best verified electronics deals, updated hourly.",
      mappingKeywords: [
        "laptop",
        "phone",
        "smartphone",
        "tablet",
        "tv",
        "monitor",
        "electronics",
        "computer",
        "camera",
        "charger",
      ],
    },
  });
  const audio = await prisma.category.upsert({
    where: { slug: "audio" },
    update: {
      mappingKeywords: ["headphones", "earbuds", "speaker", "soundbar", "audio", "headset", "airpods"],
    },
    create: {
      name: "Audio",
      slug: "audio",
      parentId: electronics.id,
      mappingKeywords: ["headphones", "earbuds", "speaker", "soundbar", "audio", "headset", "airpods"],
    },
  });
  const home = await prisma.category.upsert({
    where: { slug: "home-kitchen" },
    update: {
      mappingKeywords: ["kitchen", "appliance", "cookware", "air fryer", "instant pot", "home", "furniture"],
    },
    create: {
      name: "Home & Kitchen",
      slug: "home-kitchen",
      mappingKeywords: ["kitchen", "appliance", "cookware", "air fryer", "instant pot", "home", "furniture"],
    },
  });
  const fashion = await prisma.category.upsert({
    where: { slug: "fashion" },
    update: {
      mappingKeywords: ["shoes", "apparel", "clothing", "fashion", "sneakers", "footwear", "running"],
    },
    create: {
      name: "Fashion",
      slug: "fashion",
      mappingKeywords: ["shoes", "apparel", "clothing", "fashion", "sneakers", "footwear", "running"],
    },
  });
  await prisma.category.upsert({
    where: { slug: "beauty" },
    update: { mappingKeywords: ["beauty", "skincare", "makeup", "cosmetic", "perfume"] },
    create: {
      name: "Beauty",
      slug: "beauty",
      mappingKeywords: ["beauty", "skincare", "makeup", "cosmetic", "perfume"],
    },
  });
  await prisma.category.upsert({
    where: { slug: "sports-outdoors" },
    update: { mappingKeywords: ["sports", "outdoor", "fitness", "gym", "hiking", "camping"] },
    create: {
      name: "Sports & Outdoors",
      slug: "sports-outdoors",
      mappingKeywords: ["sports", "outdoor", "fitness", "gym", "hiking", "camping"],
    },
  });

  const days = (n: number) => new Date(Date.now() + n * 864e5);

  // --- Deals ---
  const deals: Array<{
    title: string;
    merchant: string;
    category: string;
    brand: string;
    regular: number;
    sale: number;
    coupon?: string;
    expiry: Date;
    verified: Date;
    conf: number;
    status: "active" | "needs_review" | "expired";
  }> = [
    { title: "Apple AirPods Pro (2nd Gen) USB-C", merchant: "Best Buy", category: "Audio", brand: "Apple", regular: 249, sale: 189, coupon: "PERK10", expiry: days(2), verified: new Date(), conf: 0.96, status: "active" },
    { title: "Sony WH-1000XM5 Headphones", merchant: "Amazon", category: "Audio", brand: "Sony", regular: 399, sale: 328, expiry: days(5), verified: new Date(), conf: 0.61, status: "needs_review" },
    { title: 'LG 27" 4K UHD Monitor', merchant: "Walmart", category: "Electronics", brand: "LG", regular: 399, sale: 246, coupon: "LG38", expiry: days(0), verified: new Date(), conf: 0.82, status: "active" },
    { title: "Ninja Air Fryer Max XL", merchant: "Target", category: "Home & Kitchen", brand: "Ninja", regular: 169, sale: 119, expiry: days(3), verified: new Date(), conf: 0.91, status: "active" },
    { title: "Dell XPS 13 Laptop", merchant: "Dell", category: "Electronics", brand: "Dell", regular: 1199, sale: 899, expiry: days(-1), verified: days(-1), conf: 0.79, status: "expired" },
    { title: "Instant Pot Duo 6Qt", merchant: "Amazon", category: "Home & Kitchen", brand: "Instant Pot", regular: 119, sale: 59, coupon: "POT50", expiry: days(1), verified: new Date(), conf: 0.84, status: "active" },
    { title: 'Samsung 65" QLED TV', merchant: "Best Buy", category: "Electronics", brand: "Samsung", regular: 1099, sale: 799, expiry: days(1), verified: new Date(), conf: 0.9, status: "active" },
    { title: "Nike Pegasus 41 Running Shoes", merchant: "Nike", category: "Fashion", brand: "Nike", regular: 130, sale: 97, coupon: "NIKE25", expiry: days(4), verified: new Date(), conf: 0.64, status: "needs_review" },
  ];

  const catId: Record<string, string> = {
    Audio: audio.id,
    Electronics: electronics.id,
    "Home & Kitchen": home.id,
    Fashion: fashion.id,
  };

  for (const d of deals) {
    const discount = Math.round(((d.regular - d.sale) / d.regular) * 100);
    await prisma.deal.upsert({
      where: { slug: slugify(`${d.title} ${d.merchant} ${d.sale}`) },
      update: {},
      create: {
        title: d.title,
        slug: slugify(`${d.title} ${d.merchant} ${d.sale}`),
        brand: d.brand,
        regularPrice: new Prisma.Decimal(d.regular),
        salePrice: new Prisma.Decimal(d.sale),
        discountPercent: discount,
        couponCode: d.coupon ?? null,
        currency: "USD",
        imageUrl: null,
        affiliateUrl: `https://track.example.com/${slugify(d.title)}`,
        productUrl: `https://${slugify(d.merchant)}.com/p/${slugify(d.title)}`,
        expiryDate: d.expiry,
        lastVerifiedAt: d.verified,
        sourceName: byName[d.merchant]?.network ?? null,
        status: d.status,
        confidenceScore: d.conf,
        validationFlags: d.status === "needs_review" ? ["low_confidence_score"] : [],
        merchantId: byName[d.merchant]?.id,
        categoryId: catId[d.category],
        clicksCount: Math.floor(Math.random() * 60000),
        savesCount: Math.floor(Math.random() * 8000),
      },
    });
  }

  // --- Coupons ---
  const coupons = [
    { merchant: "Nike", title: "Extra 25% off sale styles", code: "NIKE25", expiry: days(7) },
    { merchant: "Best Buy", title: "$50 off orders $500+", code: "BB50OFF", expiry: days(10) },
    { merchant: "Target", title: "15% off home & kitchen", code: "HOME15", expiry: days(0) },
    { merchant: "Amazon", title: "Free shipping — no minimum", code: null, expiry: days(18) },
  ];
  for (const c of coupons) {
    await prisma.coupon.create({
      data: {
        title: c.title,
        code: c.code,
        expiryDate: c.expiry,
        isActive: true,
        revealCount: Math.floor(Math.random() * 5000),
        merchantId: byName[c.merchant]?.id,
      },
    });
  }

  // --- Subscribers ---
  const subs = [
    { email: "alex@example.com", status: "confirmed" as const, dailyDigest: true, alerts: true, prefs: ["Electronics", "Audio"] },
    { email: "jordan@example.com", status: "confirmed" as const, dailyDigest: false, alerts: true, prefs: ["Fashion"] },
    { email: "sam@example.com", status: "unconfirmed" as const, dailyDigest: true, alerts: false, prefs: ["Home & Kitchen"] },
  ];
  for (const s of subs) {
    await prisma.subscriber.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        status: s.status,
        dailyDigest: s.dailyDigest,
        alerts: s.alerts,
        categoryPreferences: s.prefs,
      },
    });
  }

  // --- Import job sample ---
  await prisma.importJob.create({
    data: {
      source: "cj",
      status: "completed",
      startedAt: new Date(Date.now() - 3 * 60000),
      finishedAt: new Date(),
      offersFound: 6200,
      created: 410,
      updated: 1820,
      rejected: 120,
      needsReview: 37,
    },
  });

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
