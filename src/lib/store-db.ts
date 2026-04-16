import fs from "node:fs";
import path from "node:path";
import { createHash, randomInt } from "node:crypto";
import Database from "better-sqlite3";
import { seedProducts } from "@/data/products";
import {
  CartItem,
  InventoryLog,
  ProductColorImageGroup,
  ProductCardData,
  ProductCategory,
  ProductTag,
  ProductWithVariants,
} from "@/types/product";
import { Order, OrderStatus } from "@/types/order";

type DbProductRow = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  collection_name: string | null;
  product_type: string | null;
  color_images_json: string | null;
  default_variant_key: string | null;
  category: string;
  description: string;
  compare_at_price: number | null;
  cost_price: number;
  shipping_rate_aud: number;
  images_json: string;
  main_image: string | null;
  builder_image: string | null;
  barcode: string | null;
  active: number;
  featured: number;
  best_seller: number;
  new_arrival: number;
  outfit_slot: string;
  tags_json: string;
  created_at: string;
  updated_at: string;
};

type DbVariantRow = {
  id: string;
  product_id: string;
  size: string;
  color: string;
  price: number;
  stock: number;
  sku: string;
  stock_holder: string | null;
  stock_location: string | null;
  low_stock_threshold: number | null;
  stock_notes: string | null;
  updated_at: string;
};

type DbUserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role: "customer" | "admin";
  marketing_opt_in: number;
  phone: string | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
};

type DbAdminInviteRow = {
  id: string;
  email: string;
  token_hash: string;
  invited_by_user_id: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

const dbDir = path.join(process.cwd(), "data");
const dbPath = path.join(dbDir, "store.db");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(dbPath);

function nowISO() {
  return new Date().toISOString();
}

function hasColumn(table: string, column: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return columns.some((col) => col.name === column);
}

function addColumnIfMissing(table: string, columnDef: string, columnName: string) {
  if (!hasColumn(table, columnName)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
  }
}

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      product_type TEXT,
      color_images_json TEXT,
      default_variant_key TEXT,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      compare_at_price REAL,
      cost_price REAL NOT NULL,
      shipping_rate_aud REAL NOT NULL DEFAULT 12,
      images_json TEXT NOT NULL,
      outfit_slot TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      size TEXT NOT NULL,
      color TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id TEXT PRIMARY KEY,
      low_stock_threshold INTEGER NOT NULL DEFAULT 3,
      shipping_flat_rate REAL NOT NULL DEFAULT 10
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      stripe_session_id TEXT UNIQUE NOT NULL,
      user_id TEXT,
      customer_email TEXT,
      customer_name TEXT,
      shipping_first_name TEXT,
      shipping_last_name TEXT,
      shipping_address_line_1 TEXT,
      shipping_address_line_2 TEXT,
      shipping_city TEXT,
      shipping_state_region TEXT,
      shipping_postcode TEXT,
      shipping_country TEXT,
      shipping_phone TEXT,
      discount_code TEXT,
      discount_amount_aud REAL NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL,
      fulfillment_status TEXT NOT NULL,
      tracking_code TEXT,
      shipping_email_sent_at TEXT,
      delivered_email_sent_at TEXT,
      carrier TEXT,
      shipping_notes TEXT,
      internal_notes TEXT,
      subtotal_aud REAL NOT NULL,
      shipping_aud REAL NOT NULL,
      revenue_aud REAL NOT NULL,
      cost_total_aud REAL NOT NULL,
      profit_aud REAL NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS checkout_drafts (
      stripe_session_id TEXT PRIMARY KEY,
      items_json TEXT NOT NULL,
      user_id TEXT,
      customer_email TEXT,
      selected_address_id TEXT,
      shipping_snapshot_json TEXT,
      discount_code TEXT,
      discount_amount_aud REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      variant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      size TEXT NOT NULL,
      color TEXT NOT NULL,
      image TEXT NOT NULL,
      unit_price REAL NOT NULL,
      unit_cost REAL NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventory_logs (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      variant_id TEXT NOT NULL,
      change_amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      holder TEXT,
      location TEXT,
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      marketing_opt_in INTEGER NOT NULL DEFAULT 0,
      phone TEXT,
      last_active_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      address_line_1 TEXT NOT NULL,
      address_line_2 TEXT,
      city TEXT NOT NULL,
      state_region TEXT NOT NULL,
      postcode TEXT NOT NULL,
      country TEXT NOT NULL,
      phone TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      user_agent TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS discount_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      starts_at TEXT,
      expiry_at TEXT,
      usage_limit INTEGER,
      minimum_order_aud REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS discount_code_usage (
      id TEXT PRIMARY KEY,
      discount_code_id TEXT NOT NULL,
      user_id TEXT,
      order_id TEXT,
      stripe_session_id TEXT,
      used_at TEXT NOT NULL,
      FOREIGN KEY (discount_code_id) REFERENCES discount_codes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unfinished',
      internal_note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      order_item_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      title TEXT,
      body TEXT NOT NULL,
      display_name TEXT,
      images_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'approved',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(order_item_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pending_email_verifications (
      email TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      marketing_opt_in INTEGER NOT NULL DEFAULT 0,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      resend_available_at TEXT NOT NULL,
      resend_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_invites (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      invited_by_user_id TEXT,
      expires_at TEXT NOT NULL,
      accepted_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  addColumnIfMissing("products", "brand TEXT", "brand");
  addColumnIfMissing("products", "collection_name TEXT", "collection_name");
  addColumnIfMissing("products", "product_type TEXT", "product_type");
  addColumnIfMissing("products", "color_images_json TEXT", "color_images_json");
  addColumnIfMissing("products", "default_variant_key TEXT", "default_variant_key");
  addColumnIfMissing("products", "main_image TEXT", "main_image");
  addColumnIfMissing("products", "builder_image TEXT", "builder_image");
  addColumnIfMissing("products", "barcode TEXT", "barcode");
  addColumnIfMissing("products", "shipping_rate_aud REAL NOT NULL DEFAULT 12", "shipping_rate_aud");
  addColumnIfMissing("products", "active INTEGER NOT NULL DEFAULT 1", "active");
  addColumnIfMissing("products", "featured INTEGER NOT NULL DEFAULT 0", "featured");
  addColumnIfMissing("products", "best_seller INTEGER NOT NULL DEFAULT 0", "best_seller");
  addColumnIfMissing("products", "new_arrival INTEGER NOT NULL DEFAULT 0", "new_arrival");

  addColumnIfMissing("variants", "stock_holder TEXT", "stock_holder");
  addColumnIfMissing("variants", "stock_location TEXT", "stock_location");
  addColumnIfMissing("variants", "low_stock_threshold INTEGER", "low_stock_threshold");
  addColumnIfMissing("variants", "stock_notes TEXT", "stock_notes");
  addColumnIfMissing("variants", "updated_at TEXT", "updated_at");

  addColumnIfMissing("orders", "carrier TEXT", "carrier");
  addColumnIfMissing("orders", "shipping_notes TEXT", "shipping_notes");
  addColumnIfMissing("orders", "internal_notes TEXT", "internal_notes");
  addColumnIfMissing("orders", "user_id TEXT", "user_id");
  addColumnIfMissing("orders", "shipping_first_name TEXT", "shipping_first_name");
  addColumnIfMissing("orders", "shipping_last_name TEXT", "shipping_last_name");
  addColumnIfMissing("orders", "shipping_address_line_1 TEXT", "shipping_address_line_1");
  addColumnIfMissing("orders", "shipping_address_line_2 TEXT", "shipping_address_line_2");
  addColumnIfMissing("orders", "shipping_city TEXT", "shipping_city");
  addColumnIfMissing("orders", "shipping_state_region TEXT", "shipping_state_region");
  addColumnIfMissing("orders", "shipping_postcode TEXT", "shipping_postcode");
  addColumnIfMissing("orders", "shipping_country TEXT", "shipping_country");
  addColumnIfMissing("orders", "shipping_phone TEXT", "shipping_phone");
  addColumnIfMissing("orders", "discount_code TEXT", "discount_code");
  addColumnIfMissing("orders", "discount_amount_aud REAL NOT NULL DEFAULT 0", "discount_amount_aud");
  addColumnIfMissing("orders", "shipping_email_sent_at TEXT", "shipping_email_sent_at");
  addColumnIfMissing("orders", "delivered_email_sent_at TEXT", "delivered_email_sent_at");
  addColumnIfMissing("checkout_drafts", "user_id TEXT", "user_id");
  addColumnIfMissing("checkout_drafts", "customer_email TEXT", "customer_email");
  addColumnIfMissing("checkout_drafts", "selected_address_id TEXT", "selected_address_id");
  addColumnIfMissing("checkout_drafts", "shipping_snapshot_json TEXT", "shipping_snapshot_json");
  addColumnIfMissing("checkout_drafts", "discount_code TEXT", "discount_code");
  addColumnIfMissing("checkout_drafts", "discount_amount_aud REAL NOT NULL DEFAULT 0", "discount_amount_aud");
  addColumnIfMissing("discount_codes", "starts_at TEXT", "starts_at");
  addColumnIfMissing("users", "phone TEXT", "phone");
  addColumnIfMissing("users", "last_active_at TEXT", "last_active_at");

  db.prepare(
    `INSERT OR IGNORE INTO store_settings (id, low_stock_threshold, shipping_flat_rate) VALUES ('default', 3, 10)`
  ).run();
  db.prepare("UPDATE products SET brand='StreetVault' WHERE brand IS NULL OR brand='Qadir Productions'").run();
  db.exec(`CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants(product_id);
    CREATE INDEX IF NOT EXISTS idx_variants_product_size_stock ON variants(product_id, size, stock);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON orders(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_orders_customer_email_created_at ON orders(customer_email, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_last_seen ON auth_sessions(user_id, last_seen_at);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_last_seen ON auth_sessions(expires_at, last_seen_at);
    CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id_default ON user_addresses(user_id, is_default);
    CREATE INDEX IF NOT EXISTS idx_discount_usage_code_id ON discount_code_usage(discount_code_id);
    CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id_status_created ON product_reviews(product_id, status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id_created ON product_reviews(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_product_reviews_status_created ON product_reviews(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_pending_email_expires ON pending_email_verifications(expires_at);
    CREATE INDEX IF NOT EXISTS idx_admin_invites_email_expires ON admin_invites(email, expires_at DESC);
  `);
  const seeded = db
    .prepare("SELECT value FROM app_meta WHERE key='seeded_products_v1'")
    .get() as { value: string } | undefined;
  if (!seeded) {
    const hasProducts = db
      .prepare("SELECT COUNT(*) as count FROM products")
      .get() as { count: number };
    if (hasProducts.count === 0) {
      seedInitialData();
    }
    db.prepare("INSERT OR REPLACE INTO app_meta (key,value) VALUES ('seeded_products_v1','true')").run();
  }
}

function seedInitialData() {
  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, slug, name, brand, collection_name, category, description, compare_at_price, cost_price, shipping_rate_aud,
      images_json, main_image, builder_image, barcode, active, featured, best_seller, new_arrival,
      outfit_slot, tags_json, created_at, updated_at
    ) VALUES (
      @id, @slug, @name, @brand, @collectionName, @category, @description, @compareAtPrice, @costPrice, @shippingRateAUD,
      @imagesJson, @mainImage, @builderImage, @barcode, @active, @featured, @bestSeller, @newArrival,
      @outfitSlot, @tagsJson, @createdAt, @updatedAt
    )
  `);
  const insertVariant = db.prepare(`
    INSERT INTO variants (
      id, product_id, size, color, price, stock, sku,
      stock_holder, stock_location, low_stock_threshold, stock_notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    for (const seedProduct of seedProducts) {
      const productId = crypto.randomUUID();
      const createdAt = nowISO();
      const featured = seedProduct.tags.includes("featured") ? 1 : 0;
      const bestSeller = seedProduct.tags.includes("best_seller") ? 1 : 0;
      const newArrival = seedProduct.tags.includes("new_arrival") ? 1 : 0;
      insertProduct.run({
        id: productId,
        slug: seedProduct.slug,
        name: seedProduct.name,
        brand: "StreetVault",
        collectionName: "Core Drop",
        category: seedProduct.category,
        description: seedProduct.description,
        compareAtPrice: seedProduct.compareAtPrice,
        costPrice: seedProduct.costPrice,
        shippingRateAUD: 12,
        imagesJson: JSON.stringify(seedProduct.images),
        mainImage: seedProduct.images[0] ?? null,
        builderImage: null,
        barcode: null,
        active: 1,
        featured,
        bestSeller,
        newArrival,
        outfitSlot: seedProduct.outfitSlot,
        tagsJson: JSON.stringify(seedProduct.tags),
        createdAt,
        updatedAt: createdAt,
      });

      for (const variant of seedProduct.variants) {
        insertVariant.run(
          crypto.randomUUID(),
          productId,
          variant.size,
          variant.color,
          variant.price,
          variant.stock,
          variant.sku,
          "Ayaan",
          "Main Rack",
          3,
          "Seed inventory",
          createdAt
        );
      }
    }
  })();
}

init();

function mapProduct(row: DbProductRow): Omit<ProductWithVariants, "variants"> {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    collection: row.collection_name,
    productType: row.product_type,
    colorImageGroups: row.color_images_json
      ? (JSON.parse(row.color_images_json) as ProductColorImageGroup[])
      : [],
    defaultVariantKey: row.default_variant_key,
    category: row.category as ProductCategory,
    description: row.description,
    compareAtPrice: row.compare_at_price,
    costPrice: row.cost_price,
    shippingRateAUD: row.shipping_rate_aud,
    images: JSON.parse(row.images_json) as string[],
    mainImage: row.main_image ?? undefined,
    builderImage: row.builder_image ?? undefined,
    active: Boolean(row.active),
    featured: Boolean(row.featured),
    bestSeller: Boolean(row.best_seller),
    newArrival: Boolean(row.new_arrival),
    barcode: row.barcode,
    outfitSlot: row.outfit_slot as ProductWithVariants["outfitSlot"],
    tags: JSON.parse(row.tags_json) as ProductTag[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVariant(row: DbVariantRow) {
  return {
    id: row.id,
    productId: row.product_id,
    size: row.size,
    color: row.color,
    price: row.price,
    stock: row.stock,
    sku: row.sku,
    stockHolder: row.stock_holder,
    stockLocation: row.stock_location,
    lowStockThreshold: row.low_stock_threshold,
    stockNotes: row.stock_notes,
    updatedAt: row.updated_at,
  };
}

export function listProductsWithVariants(): ProductWithVariants[] {
  const products = db
    .prepare("SELECT * FROM products ORDER BY created_at DESC")
    .all() as DbProductRow[];
  const variants = db.prepare("SELECT * FROM variants").all() as DbVariantRow[];
  return products.map((product) => ({
    ...mapProduct(product),
    variants: variants.filter((v) => v.product_id === product.id).map(mapVariant),
  }));
}

export function listProductsForCards(): ProductCardData[] {
  const rows = db
    .prepare(
      `SELECT p.id,p.slug,p.name,p.category,p.compare_at_price,p.tags_json,p.images_json,p.main_image,p.builder_image,
              p.brand,
              MIN(v.price) as base_price, MIN(v.stock) as lowest_stock, SUM(v.stock) as total_stock
       FROM products p JOIN variants v ON p.id=v.product_id
       WHERE p.active=1
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    )
    .all() as Array<{
    id: string;
    slug: string;
    name: string;
    brand: string | null;
    category: string;
    compare_at_price: number | null;
    tags_json: string;
    images_json: string;
    main_image: string | null;
    builder_image: string | null;
    base_price: number;
    lowest_stock: number;
    total_stock: number;
  }>;

  const sizesByProductId = new Map<string, string[]>();
  const sizeRows = db
    .prepare("SELECT product_id, size FROM variants WHERE stock > 0 ORDER BY size ASC")
    .all() as Array<{ product_id: string; size: string }>;
  for (const row of sizeRows) {
    const existing = sizesByProductId.get(row.product_id);
    if (existing) {
      if (!existing.includes(row.size)) existing.push(row.size);
    } else {
      sizesByProductId.set(row.product_id, [row.size]);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    image: row.main_image ?? (JSON.parse(row.images_json) as string[])[0],
    builderImage: row.builder_image,
    category: row.category as ProductCategory,
    basePrice: row.base_price,
    compareAtPrice: row.compare_at_price,
    lowestStock: row.lowest_stock,
    totalStock: row.total_stock,
    availableSizes: sizesByProductId.get(row.id) ?? [],
    tags: JSON.parse(row.tags_json) as ProductTag[],
  }));
}

export function listProductsForCardsFiltered(input: {
  query?: string;
  category?: string;
  size?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "name_asc";
}) {
  const conditions: string[] = ["p.active = 1"];
  const params: string[] = [];

  const normalizedQuery = input.query?.trim().toLowerCase();
  if (normalizedQuery) {
    conditions.push("LOWER(p.name) LIKE ?");
    params.push(`%${normalizedQuery}%`);
  }

  const normalizedCategory = input.category?.trim().toLowerCase();
  if (normalizedCategory && normalizedCategory !== "all") {
    conditions.push("LOWER(p.category) = ?");
    params.push(normalizedCategory);
  }

  const normalizedSize = input.size?.trim().toLowerCase();
  if (normalizedSize && normalizedSize !== "all") {
    conditions.push(
      "EXISTS (SELECT 1 FROM variants vs WHERE vs.product_id = p.id AND LOWER(vs.size) = ? AND vs.stock > 0)"
    );
    params.push(normalizedSize);
  }

  const sortSql =
    input.sort === "price_asc"
      ? "base_price ASC"
      : input.sort === "price_desc"
        ? "base_price DESC"
        : input.sort === "name_asc"
          ? "p.name ASC"
          : "p.created_at DESC";

  const rows = db
    .prepare(
      `SELECT p.id,p.slug,p.name,p.category,p.compare_at_price,p.tags_json,p.images_json,p.main_image,p.builder_image,
              p.brand,
              MIN(v.price) as base_price, MIN(v.stock) as lowest_stock, SUM(v.stock) as total_stock
       FROM products p
       JOIN variants v ON p.id=v.product_id
       WHERE ${conditions.join(" AND ")}
       GROUP BY p.id
       ORDER BY ${sortSql}`
    )
    .all(...params) as Array<{
    id: string;
    slug: string;
    name: string;
    brand: string | null;
    category: string;
    compare_at_price: number | null;
    tags_json: string;
    images_json: string;
    main_image: string | null;
    builder_image: string | null;
    base_price: number;
    lowest_stock: number;
    total_stock: number;
  }>;

  if (rows.length === 0) return [];
  const productIds = rows.map((row) => row.id);
  const placeholders = productIds.map(() => "?").join(",");
  const sizeRows = db
    .prepare(
      `SELECT product_id, size
       FROM variants
       WHERE stock > 0 AND product_id IN (${placeholders})
       ORDER BY size ASC`
    )
    .all(...productIds) as Array<{ product_id: string; size: string }>;
  const sizesByProductId = new Map<string, string[]>();
  for (const row of sizeRows) {
    const existing = sizesByProductId.get(row.product_id);
    if (existing) {
      if (!existing.includes(row.size)) existing.push(row.size);
    } else {
      sizesByProductId.set(row.product_id, [row.size]);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    image: row.main_image ?? (JSON.parse(row.images_json) as string[])[0],
    builderImage: row.builder_image,
    category: row.category as ProductCategory,
    basePrice: row.base_price,
    compareAtPrice: row.compare_at_price,
    lowestStock: row.lowest_stock,
    totalStock: row.total_stock,
    availableSizes: sizesByProductId.get(row.id) ?? [],
    tags: JSON.parse(row.tags_json) as ProductTag[],
  }));
}

export function getProductBySlug(slug: string) {
  const product = db.prepare("SELECT * FROM products WHERE slug = ?").get(slug) as
    | DbProductRow
    | undefined;
  if (!product) return null;
  const variants = db
    .prepare("SELECT * FROM variants WHERE product_id = ?")
    .all(product.id) as DbVariantRow[];
  return { ...mapProduct(product), variants: variants.map(mapVariant) };
}

export function getProductById(productId: string) {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(productId) as
    | DbProductRow
    | undefined;
  if (!product) return null;
  const variants = db
    .prepare("SELECT * FROM variants WHERE product_id = ?")
    .all(product.id) as DbVariantRow[];
  return { ...mapProduct(product), variants: variants.map(mapVariant) };
}

export function getVariantById(variantId: string) {
  const variant = db.prepare("SELECT * FROM variants WHERE id = ?").get(variantId) as
    | DbVariantRow
    | undefined;
  return variant ? mapVariant(variant) : null;
}

export function getStoreSettings() {
  return db
    .prepare(
      "SELECT low_stock_threshold as lowStockThreshold, shipping_flat_rate as shippingFlatRate FROM store_settings WHERE id='default'"
    )
    .get() as { lowStockThreshold: number; shippingFlatRate: number };
}

export function updateStoreSettings(input: { lowStockThreshold: number; shippingFlatRate: number }) {
  db.prepare(
    "UPDATE store_settings SET low_stock_threshold=?, shipping_flat_rate=? WHERE id='default'"
  ).run(input.lowStockThreshold, input.shippingFlatRate);
  return getStoreSettings();
}

function insertInventoryLog(params: {
  productId: string;
  variantId: string;
  change: number;
  reason: string;
  holder?: string | null;
  location?: string | null;
  note?: string | null;
}) {
  db.prepare(
    `INSERT INTO inventory_logs (id,product_id,variant_id,change_amount,reason,holder,location,note,created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(
    crypto.randomUUID(),
    params.productId,
    params.variantId,
    params.change,
    params.reason,
    params.holder ?? null,
    params.location ?? null,
    params.note ?? null,
    nowISO()
  );
}

type ProductInput = {
  id?: string;
  slug: string;
  name: string;
  brand?: string | null;
  collection?: string | null;
  productType?: string | null;
  colorImageGroups?: ProductColorImageGroup[];
  defaultVariantKey?: string | null;
  category: string;
  description: string;
  compareAtPrice: number | null;
  costPrice: number;
  shippingRateAUD: number;
  images: string[];
  mainImage?: string | null;
  builderImage?: string | null;
  barcode?: string | null;
  active?: boolean;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  outfitSlot: string;
  tags: string[];
  variants: Array<{
    id?: string;
    size: string;
    color: string;
    price: number;
    stock: number;
    sku: string;
    stockHolder?: string | null;
    stockLocation?: string | null;
    lowStockThreshold?: number | null;
    stockNotes?: string | null;
  }>;
};

function normalizeVariantsForStorage(
  slug: string,
  variants: ProductInput["variants"]
): ProductInput["variants"] {
  const byCombination = new Map<string, ProductInput["variants"][number]>();
  for (const rawVariant of variants) {
    const color = rawVariant.color.trim();
    const size = rawVariant.size.trim();
    if (!color || !size) continue;
    const combinationKey = `${color.toLowerCase()}::${size.toLowerCase()}`;
    byCombination.set(combinationKey, {
      ...rawVariant,
      color,
      size,
      sku:
        rawVariant.sku?.trim() ||
        `${slug || "product"}-${color.toLowerCase().replace(/\s+/g, "-")}-${size.toLowerCase().replace(/\s+/g, "-")}`,
      stock: Math.max(0, Number(rawVariant.stock || 0)),
      stockHolder: rawVariant.stockHolder?.trim() || null,
      stockLocation: rawVariant.stockLocation?.trim() || null,
      stockNotes: rawVariant.stockNotes?.trim() || null,
    });
  }
  return Array.from(byCombination.values());
}

function getVariantKey(color: string, size: string) {
  return `${color.trim().toLowerCase()}::${size.trim().toLowerCase()}`;
}

function resolveDefaultVariantKey(
  preferredKey: string | null | undefined,
  variants: ProductInput["variants"]
) {
  const normalizedPreferred = preferredKey?.trim().toLowerCase() ?? "";
  const keys = new Set(variants.map((variant) => getVariantKey(variant.color, variant.size)));
  if (normalizedPreferred && keys.has(normalizedPreferred)) {
    return normalizedPreferred;
  }
  const firstInStock = variants.find((variant) => variant.stock > 0);
  if (firstInStock) return getVariantKey(firstInStock.color, firstInStock.size);
  const firstAny = variants[0];
  return firstAny ? getVariantKey(firstAny.color, firstAny.size) : null;
}

export function createProduct(input: ProductInput) {
  const id = crypto.randomUUID();
  const createdAt = nowISO();
  const normalizedVariants = normalizeVariantsForStorage(input.slug, input.variants);
  const defaultVariantKey = resolveDefaultVariantKey(input.defaultVariantKey, normalizedVariants);
  db.transaction(() => {
    db.prepare(
      `INSERT INTO products (
        id,slug,name,brand,collection_name,product_type,color_images_json,default_variant_key,category,description,compare_at_price,cost_price,shipping_rate_aud,
        images_json,main_image,builder_image,barcode,active,featured,best_seller,new_arrival,
        outfit_slot,tags_json,created_at,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      id,
      input.slug,
      input.name,
      input.brand ?? null,
      input.collection ?? null,
      input.productType ?? null,
      JSON.stringify(input.colorImageGroups ?? []),
      defaultVariantKey,
      input.category,
      input.description,
      input.compareAtPrice,
      input.costPrice,
      input.shippingRateAUD,
      JSON.stringify(input.images),
      input.mainImage ?? input.images[0] ?? null,
      input.builderImage ?? null,
      input.barcode ?? null,
      input.active === false ? 0 : 1,
      input.featured ? 1 : 0,
      input.bestSeller ? 1 : 0,
      input.newArrival ? 1 : 0,
      input.outfitSlot,
      JSON.stringify(input.tags),
      createdAt,
      createdAt
    );
    for (const v of normalizedVariants) {
      const variantId = crypto.randomUUID();
      db.prepare(
        `INSERT INTO variants (
          id,product_id,size,color,price,stock,sku,stock_holder,stock_location,low_stock_threshold,stock_notes,updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
      ).run(
        variantId,
        id,
        v.size,
        v.color,
        v.price,
        v.stock,
        v.sku,
        v.stockHolder ?? null,
        v.stockLocation ?? null,
        v.lowStockThreshold ?? null,
        v.stockNotes ?? null,
        createdAt
      );
      insertInventoryLog({
        productId: id,
        variantId,
        change: v.stock,
        reason: "initial_stock",
        holder: v.stockHolder,
        location: v.stockLocation,
        note: v.stockNotes ?? "Initial product creation",
      });
    }
  })();
}

export function updateProduct(input: ProductInput & { id: string }) {
  const now = nowISO();
  const normalizedVariants = normalizeVariantsForStorage(input.slug, input.variants);
  const defaultVariantKey = resolveDefaultVariantKey(input.defaultVariantKey, normalizedVariants);
  db.transaction(() => {
    db.prepare(
      `UPDATE products SET
        slug=?,name=?,brand=?,collection_name=?,product_type=?,color_images_json=?,default_variant_key=?,category=?,description=?,compare_at_price=?,cost_price=?,shipping_rate_aud=?,
        images_json=?,main_image=?,builder_image=?,barcode=?,active=?,featured=?,best_seller=?,new_arrival=?,
        outfit_slot=?,tags_json=?,updated_at=?
       WHERE id=?`
    ).run(
      input.slug,
      input.name,
      input.brand ?? null,
      input.collection ?? null,
      input.productType ?? null,
      JSON.stringify(input.colorImageGroups ?? []),
      defaultVariantKey,
      input.category,
      input.description,
      input.compareAtPrice,
      input.costPrice,
      input.shippingRateAUD,
      JSON.stringify(input.images),
      input.mainImage ?? input.images[0] ?? null,
      input.builderImage ?? null,
      input.barcode ?? null,
      input.active === false ? 0 : 1,
      input.featured ? 1 : 0,
      input.bestSeller ? 1 : 0,
      input.newArrival ? 1 : 0,
      input.outfitSlot,
      JSON.stringify(input.tags),
      now,
      input.id
    );

    const prev = db
      .prepare("SELECT id, stock, product_id FROM variants WHERE product_id = ?")
      .all(input.id) as Array<{ id: string; stock: number; product_id: string }>;
    db.prepare("DELETE FROM variants WHERE product_id = ?").run(input.id);
    for (const v of normalizedVariants) {
      const variantId = v.id ?? crypto.randomUUID();
      db.prepare(
        `INSERT INTO variants (
          id,product_id,size,color,price,stock,sku,stock_holder,stock_location,low_stock_threshold,stock_notes,updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
      ).run(
        variantId,
        input.id,
        v.size,
        v.color,
        v.price,
        v.stock,
        v.sku,
        v.stockHolder ?? null,
        v.stockLocation ?? null,
        v.lowStockThreshold ?? null,
        v.stockNotes ?? null,
        now
      );

      const oldStock = prev.find((item) => item.id === variantId)?.stock ?? 0;
      const delta = v.stock - oldStock;
      if (delta !== 0) {
        insertInventoryLog({
          productId: input.id,
          variantId,
          change: delta,
          reason: "manual_adjustment",
          holder: v.stockHolder ?? null,
          location: v.stockLocation ?? null,
          note: "Variant stock updated in admin.",
        });
      }
    }
  })();
}

export function deleteProduct(productId: string) {
  db.transaction(() => {
    db.prepare("DELETE FROM variants WHERE product_id = ?").run(productId);
    db.prepare("DELETE FROM products WHERE id = ?").run(productId);
  })();
}

export function listInventoryLogs(limit = 50): InventoryLog[] {
  const rows = db
    .prepare(
      `SELECT il.*, p.name as product_name, v.size as size, v.color as color
       FROM inventory_logs il
       LEFT JOIN products p ON p.id = il.product_id
       LEFT JOIN variants v ON v.id = il.variant_id
       ORDER BY il.created_at DESC
       LIMIT ?`
    )
    .all(limit) as Array<{
    id: string;
    product_id: string;
    variant_id: string;
    change_amount: number;
    reason: string;
    holder: string | null;
    location: string | null;
    note: string | null;
    created_at: string;
    product_name: string;
    size: string | null;
    color: string | null;
  }>;
  return rows.map((r) => ({
    id: r.id,
    productId: r.product_id,
    variantId: r.variant_id,
    productName: r.product_name,
    variantLabel: `${r.size ?? "N/A"}/${r.color ?? "N/A"}`,
    change: r.change_amount,
    reason: r.reason,
    holder: r.holder,
    location: r.location,
    note: r.note,
    createdAt: r.created_at,
  }));
}

export function validateCartStock(items: CartItem[]) {
  for (const item of items) {
    const variant = getVariantById(item.variantId);
    if (!variant) return { ok: false as const, message: `${item.name} variant no longer exists.` };
    if (variant.stock < item.quantity) {
      return {
        ok: false as const,
        message: `Only ${variant.stock} left for ${item.name} (${item.size}).`,
      };
    }
  }
  return { ok: true as const };
}

export function computeShippingForItems(items: CartItem[]) {
  if (items.length === 0) return 0;
  const uniqueProductIds = Array.from(new Set(items.map((item) => item.productId)));
  const placeholders = uniqueProductIds.map(() => "?").join(",");
  const shippingRows = db
    .prepare(`SELECT id, shipping_rate_aud FROM products WHERE id IN (${placeholders})`)
    .all(...uniqueProductIds) as Array<{ id: string; shipping_rate_aud: number }>;
  const shippingByProductId = new Map(shippingRows.map((row) => [row.id, row.shipping_rate_aud]));
  return items.reduce((sum, item) => {
    const shippingRate = shippingByProductId.get(item.productId) ?? item.shippingRateAUD ?? 0;
    return sum + shippingRate * item.quantity;
  }, 0);
}

export function upsertCheckoutDraft(
  stripeSessionId: string,
  input: {
    items: CartItem[];
    userId: string;
    customerEmail: string;
    selectedAddressId: string;
    shippingSnapshot: {
      firstName: string;
      lastName: string;
      addressLine1: string;
      addressLine2?: string | null;
      city: string;
      stateRegion: string;
      postcode: string;
      country: string;
      phone?: string | null;
    };
    discountCode?: string | null;
    discountAmountAUD?: number;
  }
) {
  const now = nowISO();
  db.prepare(
    `INSERT INTO checkout_drafts (
      stripe_session_id,items_json,user_id,customer_email,selected_address_id,shipping_snapshot_json,
      discount_code,discount_amount_aud,created_at,updated_at
    )
     VALUES (?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(stripe_session_id) DO UPDATE SET
       items_json=excluded.items_json,
       user_id=excluded.user_id,
       customer_email=excluded.customer_email,
       selected_address_id=excluded.selected_address_id,
       shipping_snapshot_json=excluded.shipping_snapshot_json,
       discount_code=excluded.discount_code,
       discount_amount_aud=excluded.discount_amount_aud,
       updated_at=excluded.updated_at`
  ).run(
    stripeSessionId,
    JSON.stringify(input.items),
    input.userId,
    input.customerEmail,
    input.selectedAddressId,
    JSON.stringify(input.shippingSnapshot),
    input.discountCode ?? null,
    input.discountAmountAUD ?? 0,
    now,
    now
  );
}

function mapOrderRowsToOrders(
  rows: Array<{
    id: string;
    stripe_session_id: string;
    user_id: string | null;
    customer_email: string | null;
    customer_name: string | null;
    shipping_first_name: string | null;
    shipping_last_name: string | null;
    shipping_address_line_1: string | null;
    shipping_address_line_2: string | null;
    shipping_city: string | null;
    shipping_state_region: string | null;
    shipping_postcode: string | null;
    shipping_country: string | null;
    shipping_phone: string | null;
    discount_code: string | null;
    discount_amount_aud: number;
    payment_status: "unpaid" | "paid" | "failed";
    fulfillment_status: "pending" | "shipped" | "delivered";
    tracking_code: string | null;
    shipping_email_sent_at: string | null;
    delivered_email_sent_at: string | null;
    subtotal_aud: number;
    shipping_aud: number;
    revenue_aud: number;
    cost_total_aud: number;
    profit_aud: number;
    status: OrderStatus;
    created_at: string;
    updated_at: string;
  }>
) {
  if (rows.length === 0) return [] as Order[];

  const orderIds = rows.map((row) => row.id);
  const orderIdPlaceholders = orderIds.map(() => "?").join(",");
  const itemRows = db
    .prepare(
      `SELECT oi.id as order_item_id, oi.order_id, oi.product_id, oi.variant_id, oi.size, oi.color, oi.name, oi.image, oi.unit_price, oi.quantity,
              p.shipping_rate_aud
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id IN (${orderIdPlaceholders})`
    )
    .all(...orderIds) as Array<{
    order_item_id: string;
    order_id: string;
    product_id: string;
    variant_id: string;
    size: string;
    color: string;
    name: string;
    image: string;
    unit_price: number;
    quantity: number;
    shipping_rate_aud: number | null;
  }>;

  const itemsByOrderId = new Map<string, CartItem[]>();
  for (const itemRow of itemRows) {
    const existing = itemsByOrderId.get(itemRow.order_id) ?? [];
    existing.push({
      orderItemId: itemRow.order_item_id,
      shippingRateAUD: itemRow.shipping_rate_aud ?? 0,
      productId: itemRow.product_id,
      variantId: itemRow.variant_id,
      size: itemRow.size,
      color: itemRow.color,
      name: itemRow.name,
      image: itemRow.image,
      unitPrice: itemRow.unit_price,
      quantity: itemRow.quantity,
    });
    itemsByOrderId.set(itemRow.order_id, existing);
  }

  return rows.map((row) => ({
    id: row.id,
    stripeSessionId: row.stripe_session_id,
    userId: row.user_id,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    shippingAddress:
      row.shipping_first_name && row.shipping_last_name && row.shipping_address_line_1
        ? {
            firstName: row.shipping_first_name,
            lastName: row.shipping_last_name,
            addressLine1: row.shipping_address_line_1,
            addressLine2: row.shipping_address_line_2,
            city: row.shipping_city ?? "",
            stateRegion: row.shipping_state_region ?? "",
            postcode: row.shipping_postcode ?? "",
            country: row.shipping_country ?? "",
            phone: row.shipping_phone,
          }
        : null,
    discountCode: row.discount_code,
    discountAmountAUD: row.discount_amount_aud,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    trackingCode: row.tracking_code,
    shippingEmailSentAt: row.shipping_email_sent_at,
    deliveredEmailSentAt: row.delivered_email_sent_at,
    subtotalAUD: row.subtotal_aud,
    shippingAUD: row.shipping_aud,
    revenueAUD: row.revenue_aud,
    costTotalAUD: row.cost_total_aud,
    profitAUD: row.profit_aud,
    status: row.status,
    items: itemsByOrderId.get(row.id) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

function queryOrders(whereSql?: string, params: Array<string> = []) {
  const sql = whereSql
    ? `SELECT * FROM orders WHERE ${whereSql} ORDER BY created_at DESC`
    : "SELECT * FROM orders ORDER BY created_at DESC";
  const rows = db.prepare(sql).all(...params) as Array<{
    id: string;
    stripe_session_id: string;
    user_id: string | null;
    customer_email: string | null;
    customer_name: string | null;
    shipping_first_name: string | null;
    shipping_last_name: string | null;
    shipping_address_line_1: string | null;
    shipping_address_line_2: string | null;
    shipping_city: string | null;
    shipping_state_region: string | null;
    shipping_postcode: string | null;
    shipping_country: string | null;
    shipping_phone: string | null;
    discount_code: string | null;
    discount_amount_aud: number;
    payment_status: "unpaid" | "paid" | "failed";
    fulfillment_status: "pending" | "shipped" | "delivered";
    tracking_code: string | null;
    shipping_email_sent_at: string | null;
    delivered_email_sent_at: string | null;
    subtotal_aud: number;
    shipping_aud: number;
    revenue_aud: number;
    cost_total_aud: number;
    profit_aud: number;
    status: OrderStatus;
    created_at: string;
    updated_at: string;
  }>;
  return mapOrderRowsToOrders(rows);
}

export function listOrders(): Order[] {
  return queryOrders();
}

export function listOrdersByCustomerEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return [];
  return queryOrders("LOWER(customer_email) = ?", [normalized]);
}

export function listOrdersByUserId(userId: string) {
  return queryOrders("user_id = ?", [userId]);
}

export function getOrderById(orderId: string) {
  const result = queryOrders("id = ?", [orderId]);
  return result[0] ?? null;
}

export function createPaidOrderFromStripeSession(
  stripeSessionId: string,
  input: { paid: boolean; customerEmail: string | null; customerName: string | null }
) {
  if (!input.paid) return { created: false as const, reason: "not_paid" as const };
  const order = db
    .prepare("SELECT id FROM orders WHERE stripe_session_id=?")
    .get(stripeSessionId) as { id: string } | undefined;
  if (order) return { created: false as const, reason: "already_exists" as const };

  const draft = db
    .prepare(
      `SELECT items_json,user_id,customer_email,shipping_snapshot_json,discount_code,discount_amount_aud
       FROM checkout_drafts WHERE stripe_session_id=?`
    )
    .get(stripeSessionId) as
    | {
        items_json: string;
        user_id: string | null;
        customer_email: string | null;
        shipping_snapshot_json: string | null;
        discount_code: string | null;
        discount_amount_aud: number;
      }
    | undefined;
  if (!draft) return { created: false as const, reason: "missing_draft" as const };

  const items = JSON.parse(draft.items_json) as CartItem[];
  const stockValidation = validateCartStock(items);
  if (!stockValidation.ok) {
    return { created: false as const, reason: "insufficient_stock" as const };
  }

  const subtotalBeforeDiscount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountAmount = Math.max(0, Math.min(draft.discount_amount_aud ?? 0, subtotalBeforeDiscount));
  const subtotal = subtotalBeforeDiscount - discountAmount;
  const shipping = computeShippingForItems(items);
  const revenue = subtotal + shipping;
  const uniqueProductIds = Array.from(new Set(items.map((item) => item.productId)));
  const productPlaceholders = uniqueProductIds.map(() => "?").join(",");
  const productCostRows = uniqueProductIds.length
    ? (db
        .prepare(`SELECT id, cost_price FROM products WHERE id IN (${productPlaceholders})`)
        .all(...uniqueProductIds) as Array<{ id: string; cost_price: number }>)
    : [];
  const productCostById = new Map(productCostRows.map((row) => [row.id, row.cost_price]));
  const costTotal = items.reduce(
    (sum, item) => sum + (productCostById.get(item.productId) ?? 0) * item.quantity,
    0
  );
  const profit = revenue - costTotal;
  const now = nowISO();
  const orderId = crypto.randomUUID();
  const shippingSnapshot = draft.shipping_snapshot_json
    ? (JSON.parse(draft.shipping_snapshot_json) as {
        firstName: string;
        lastName: string;
        addressLine1: string;
        addressLine2?: string | null;
        city: string;
        stateRegion: string;
        postcode: string;
        country: string;
        phone?: string | null;
      })
    : null;
  db.transaction(() => {
    db.prepare(
      `INSERT INTO orders (
        id,stripe_session_id,user_id,customer_email,customer_name,
        shipping_first_name,shipping_last_name,shipping_address_line_1,shipping_address_line_2,shipping_city,shipping_state_region,shipping_postcode,shipping_country,shipping_phone,
        discount_code,discount_amount_aud,
        payment_status,fulfillment_status,tracking_code,carrier,
        shipping_notes,internal_notes,subtotal_aud,shipping_aud,revenue_aud,cost_total_aud,profit_aud,status,created_at,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      orderId,
      stripeSessionId,
      draft.user_id ?? null,
      draft.customer_email ?? input.customerEmail,
      input.customerName,
      shippingSnapshot?.firstName ?? null,
      shippingSnapshot?.lastName ?? null,
      shippingSnapshot?.addressLine1 ?? null,
      shippingSnapshot?.addressLine2 ?? null,
      shippingSnapshot?.city ?? null,
      shippingSnapshot?.stateRegion ?? null,
      shippingSnapshot?.postcode ?? null,
      shippingSnapshot?.country ?? null,
      shippingSnapshot?.phone ?? null,
      draft.discount_code ?? null,
      discountAmount,
      "paid",
      "pending",
      null,
      null,
      null,
      null,
      subtotal,
      shipping,
      revenue,
      costTotal,
      profit,
      "pending_fulfillment",
      now,
      now
    );

    for (const item of items) {
      db.prepare(
        `INSERT INTO order_items (id,order_id,product_id,variant_id,name,size,color,image,unit_price,unit_cost,quantity)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`
      ).run(
        crypto.randomUUID(),
        orderId,
        item.productId,
        item.variantId,
        item.name,
        item.size,
        item.color,
        item.image,
        item.unitPrice,
        productCostById.get(item.productId) ?? 0,
        item.quantity
      );

      const before = getVariantById(item.variantId);
      db.prepare("UPDATE variants SET stock=MAX(stock-?,0), updated_at=? WHERE id=?").run(
        item.quantity,
        nowISO(),
        item.variantId
      );
      const after = getVariantById(item.variantId);
      insertInventoryLog({
        productId: item.productId,
        variantId: item.variantId,
        change: -(before?.stock ?? 0) + (after?.stock ?? 0),
        reason: `order_sale:${orderId}`,
        holder: after?.stockHolder ?? null,
        location: after?.stockLocation ?? null,
        note: `Deducted ${item.quantity} from paid order.`,
      });
    }

    if (draft.discount_code) {
      const discountCodeRow = db
        .prepare("SELECT id FROM discount_codes WHERE LOWER(code)=LOWER(?)")
        .get(draft.discount_code) as { id: string } | undefined;
      if (discountCodeRow) {
        db.prepare(
          "INSERT INTO discount_code_usage (id,discount_code_id,user_id,order_id,stripe_session_id,used_at) VALUES (?,?,?,?,?,?)"
        ).run(
          crypto.randomUUID(),
          discountCodeRow.id,
          draft.user_id ?? null,
          orderId,
          stripeSessionId,
          nowISO()
        );
      }
    }

    db.prepare("DELETE FROM checkout_drafts WHERE stripe_session_id=?").run(stripeSessionId);
  })();
  return { created: true as const, reason: "created" as const, orderId };
}

export function updateOrderStatus(
  orderId: string,
  input: {
    status: OrderStatus;
    fulfillmentStatus: "pending" | "shipped" | "delivered";
    trackingCode: string | null;
    carrier?: string | null;
    shippingNotes?: string | null;
    internalNotes?: string | null;
  }
) {
  db.prepare(
    `UPDATE orders
     SET status=?, fulfillment_status=?, tracking_code=?, carrier=COALESCE(?,carrier),
         shipping_notes=COALESCE(?,shipping_notes), internal_notes=COALESCE(?,internal_notes), updated_at=?
     WHERE id=?`
  ).run(
    input.status,
    input.fulfillmentStatus,
    input.trackingCode,
    input.carrier ?? null,
    input.shippingNotes ?? null,
    input.internalNotes ?? null,
    nowISO(),
    orderId
  );
}

export function markOrderShippingEmailSent(orderId: string) {
  db.prepare("UPDATE orders SET shipping_email_sent_at=?, updated_at=? WHERE id=?").run(
    nowISO(),
    nowISO(),
    orderId
  );
}

export function markOrderDeliveredEmailSent(orderId: string) {
  db.prepare("UPDATE orders SET delivered_email_sent_at=?, updated_at=? WHERE id=?").run(
    nowISO(),
    nowISO(),
    orderId
  );
}

export function getDashboardAnalytics() {
  const orders = listOrders();
  const paidOrders = orders.filter((o) => o.paymentStatus === "paid");
  const pending = orders.filter((o) => o.fulfillmentStatus === "pending");
  const shipped = orders.filter((o) => o.fulfillmentStatus === "shipped");
  const delivered = orders.filter((o) => o.fulfillmentStatus === "delivered");
  const cancelled = orders.filter((o) => ["cancelled", "refunded"].includes(o.status));
  const revenue = paidOrders.reduce((sum, o) => sum + o.revenueAUD, 0);
  const profit = paidOrders.reduce((sum, o) => sum + o.profitAUD, 0);
  const products = listProductsWithVariants();
  const lowStockThreshold = getStoreSettings().lowStockThreshold;
  const lowStockProducts = products.filter((p) =>
    p.variants.some((v) => v.stock <= (v.lowStockThreshold ?? lowStockThreshold))
  );
  const outOfStockCount = products.reduce(
    (sum, product) => sum + product.variants.filter((v) => v.stock <= 0).length,
    0
  );
  const totalSignedUpUsers = (
    db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number }
  ).count;
  const activeUsersNow = (
    db
      .prepare(
        `SELECT COUNT(DISTINCT user_id) as count
         FROM auth_sessions
         WHERE expires_at >= ? AND last_seen_at >= ?`
      )
      .get(
        nowISO(),
        new Date(Date.now() - 15 * 60 * 1000).toISOString()
      ) as { count: number }
  ).count;
  const visitorsLast30Days = (
    db
      .prepare(
        `SELECT COUNT(DISTINCT id) as count
         FROM auth_sessions
         WHERE last_seen_at >= ?`
      )
      .get(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) as { count: number }
  ).count;
  const topCustomers = db
    .prepare(
      `SELECT customer_email as email,
              COUNT(*) as orders,
              SUM(revenue_aud) as spend
       FROM orders
       WHERE payment_status='paid' AND customer_email IS NOT NULL
       GROUP BY customer_email
       ORDER BY spend DESC, orders DESC
       LIMIT 5`
    )
    .all() as Array<{ email: string; orders: number; spend: number }>;
  const recentCustomerPurchases = db
    .prepare(
      `SELECT id, customer_email, revenue_aud, status, created_at
       FROM orders
       WHERE payment_status='paid'
       ORDER BY created_at DESC
       LIMIT 8`
    )
    .all() as Array<{
    id: string;
    customer_email: string | null;
    revenue_aud: number;
    status: string;
    created_at: string;
  }>;
  const customerPaidOrders = paidOrders.filter((order) => Boolean(order.customerEmail)).length;
  return {
    totalRevenueAUD: revenue,
    totalProfitAUD: profit,
    totalOrders: orders.length,
    pendingOrders: pending.length,
    paidOrders: paidOrders.length,
    shippedOrders: shipped.length,
    deliveredOrders: delivered.length,
    cancelledOrders: cancelled.length,
    lowStockProducts: lowStockProducts.length,
    outOfStockCount,
    totalSignedUpUsers,
    activeUsersNow,
    visitorsLast30Days,
    customerPaidOrders,
    topCustomers,
    recentCustomerPurchases: recentCustomerPurchases.map((row) => ({
      orderId: row.id,
      customerEmail: row.customer_email,
      revenueAUD: row.revenue_aud,
      status: row.status,
      createdAt: row.created_at,
    })),
    recentOrders: orders.slice(0, 8),
    bestSellingProducts: listProductsForCards().filter((p) => p.tags.includes("best_seller")).slice(0, 5),
    recentInventoryChanges: listInventoryLogs(12),
  };
}

function mapUser(row: DbUserRow) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    marketingOptIn: Boolean(row.marketing_opt_in),
    phone: row.phone,
    lastActiveAt: row.last_active_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  marketingOptIn: boolean;
  role?: "customer" | "admin";
}) {
  const now = nowISO();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO users (
      id,first_name,last_name,email,password_hash,role,marketing_opt_in,phone,last_active_at,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    input.firstName.trim(),
    input.lastName.trim(),
    input.email.trim().toLowerCase(),
    input.passwordHash,
    input.role ?? "customer",
    input.marketingOptIn ? 1 : 0,
    null,
    now,
    now,
    now
  );
  return getUserById(id);
}

export function getUserByEmail(email: string) {
  const row = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as DbUserRow | undefined;
  return row ? mapUser(row) : null;
}

export function getUserById(userId: string) {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as DbUserRow | undefined;
  return row ? mapUser(row) : null;
}

export function updateUserLastActive(userId: string) {
  const now = nowISO();
  db.prepare("UPDATE users SET last_active_at=?, updated_at=? WHERE id=?").run(now, now, userId);
}

export function listUsers(search?: string) {
  if (search?.trim()) {
    const q = `%${search.trim().toLowerCase()}%`;
    const rows = db
      .prepare(
        `SELECT * FROM users
         WHERE LOWER(email) LIKE ? OR LOWER(first_name || ' ' || last_name) LIKE ?
         ORDER BY created_at DESC`
      )
      .all(q, q) as DbUserRow[];
    return rows.map(mapUser);
  }
  const rows = db.prepare("SELECT * FROM users ORDER BY created_at DESC").all() as DbUserRow[];
  return rows.map(mapUser);
}

export function listUsersWithStats(search?: string) {
  const users = listUsers(search);
  if (users.length === 0) return [];

  const userIds = users.map((user) => user.id);
  const placeholders = userIds.map(() => "?").join(",");
  const orderAggRows = db
    .prepare(
      `SELECT user_id, COUNT(*) as order_count, COALESCE(SUM(revenue_aud), 0) as total_spend_aud
       FROM orders
       WHERE user_id IN (${placeholders})
       GROUP BY user_id`
    )
    .all(...userIds) as Array<{ user_id: string; order_count: number; total_spend_aud: number }>;
  const addressRows = db
    .prepare(
      `SELECT id, user_id, first_name, last_name, address_line_1, address_line_2, city, state_region, postcode, country, phone, is_default, created_at, updated_at
       FROM user_addresses
       WHERE user_id IN (${placeholders})
       ORDER BY is_default DESC, created_at DESC`
    )
    .all(...userIds) as Array<{
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state_region: string;
    postcode: string;
    country: string;
    phone: string | null;
    is_default: number;
    created_at: string;
    updated_at: string;
  }>;

  const orderAggByUserId = new Map(
    orderAggRows.map((row) => [
      row.user_id,
      { orderCount: row.order_count, totalSpendAUD: row.total_spend_aud },
    ])
  );
  const addressesByUserId = new Map<string, ReturnType<typeof listUserAddresses>>();
  for (const row of addressRows) {
    const existing = addressesByUserId.get(row.user_id) ?? [];
    existing.push({
      id: row.id,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      addressLine1: row.address_line_1,
      addressLine2: row.address_line_2,
      city: row.city,
      stateRegion: row.state_region,
      postcode: row.postcode,
      country: row.country,
      phone: row.phone,
      isDefault: Boolean(row.is_default),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
    addressesByUserId.set(row.user_id, existing);
  }

  return users.map((user) => {
    const stats = orderAggByUserId.get(user.id);
    return {
      ...user,
      addresses: addressesByUserId.get(user.id) ?? [],
      orderCount: stats?.orderCount ?? 0,
      totalSpendAUD: stats?.totalSpendAUD ?? 0,
    };
  });
}

export function countAdminUsers() {
  const row = db
    .prepare("SELECT COUNT(*) as count FROM users WHERE role='admin'")
    .get() as { count: number };
  return row.count;
}

export function promoteUserToAdminByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;
  const now = nowISO();
  db.prepare("UPDATE users SET role='admin', updated_at=? WHERE LOWER(email)=?").run(now, normalizedEmail);
  return getUserByEmail(normalizedEmail);
}

export function setUserRole(userId: string, role: "customer" | "admin") {
  const now = nowISO();
  db.prepare("UPDATE users SET role=?, updated_at=? WHERE id=?").run(role, now, userId);
  return getUserById(userId);
}

export function listAdminUsers() {
  const rows = db
    .prepare("SELECT * FROM users WHERE role='admin' ORDER BY created_at DESC")
    .all() as DbUserRow[];
  return rows.map(mapUser);
}

export function getActiveAdminInviteByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;
  const row = db
    .prepare(
      `SELECT id,email,token_hash,invited_by_user_id,expires_at,accepted_at,created_at
       FROM admin_invites
       WHERE email=? AND accepted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(normalizedEmail) as DbAdminInviteRow | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return {
    id: row.id,
    email: row.email,
    expiresAt: row.expires_at,
    invitedByUserId: row.invited_by_user_id,
    createdAt: row.created_at,
  };
}

export function createAdminInvite(input: {
  email: string;
  tokenHash: string;
  expiresAt: string;
  invitedByUserId?: string | null;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const now = nowISO();
  db.prepare(
    `INSERT INTO admin_invites (id,email,token_hash,invited_by_user_id,expires_at,accepted_at,created_at)
     VALUES (?,?,?,?,?,?,?)`
  ).run(
    crypto.randomUUID(),
    normalizedEmail,
    input.tokenHash,
    input.invitedByUserId ?? null,
    input.expiresAt,
    null,
    now
  );
  return getActiveAdminInviteByEmail(normalizedEmail);
}

export function listPendingAdminInvites() {
  const rows = db
    .prepare(
      `SELECT id,email,token_hash,invited_by_user_id,expires_at,accepted_at,created_at
       FROM admin_invites
       WHERE accepted_at IS NULL
       ORDER BY created_at DESC`
    )
    .all() as DbAdminInviteRow[];
  const now = Date.now();
  return rows
    .filter((row) => new Date(row.expires_at).getTime() >= now)
    .map((row) => ({
      id: row.id,
      email: row.email,
      expiresAt: row.expires_at,
      invitedByUserId: row.invited_by_user_id,
      createdAt: row.created_at,
    }));
}

export function deletePendingAdminInvitesByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return;
  db.prepare("DELETE FROM admin_invites WHERE email=? AND accepted_at IS NULL").run(normalizedEmail);
}

export function setUserPasswordHash(userId: string, passwordHash: string) {
  db.prepare("UPDATE users SET password_hash=?, updated_at=? WHERE id=?").run(passwordHash, nowISO(), userId);
}

export function updateUserProfile(
  userId: string,
  input: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    marketingOptIn: boolean;
  }
) {
  db.prepare(
    "UPDATE users SET first_name=?, last_name=?, phone=?, marketing_opt_in=?, updated_at=? WHERE id=?"
  ).run(
    input.firstName.trim(),
    input.lastName.trim(),
    input.phone?.trim() || null,
    input.marketingOptIn ? 1 : 0,
    nowISO(),
    userId
  );
  return getUserById(userId);
}

export function createSession(input: {
  sessionId: string;
  userId: string;
  expiresAt: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  const now = nowISO();
  db.prepare(
    `INSERT INTO auth_sessions (id,user_id,expires_at,last_seen_at,user_agent,ip_address,created_at)
     VALUES (?,?,?,?,?,?,?)`
  ).run(
    input.sessionId,
    input.userId,
    input.expiresAt,
    now,
    input.userAgent ?? null,
    input.ipAddress ?? null,
    now
  );
}

export function getSession(sessionId: string) {
  const row = db
    .prepare(
      `SELECT s.id,s.user_id,s.expires_at,s.last_seen_at,s.user_agent,s.ip_address,
              u.id as u_id,u.first_name,u.last_name,u.email,u.password_hash,u.role,u.marketing_opt_in,
              u.phone,u.last_active_at,u.created_at as u_created_at,u.updated_at as u_updated_at
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`
    )
    .get(sessionId) as
    | {
        id: string;
        user_id: string;
        expires_at: string;
        last_seen_at: string;
        user_agent: string | null;
        ip_address: string | null;
        u_id: string;
        first_name: string;
        last_name: string;
        email: string;
        password_hash: string;
        role: "customer" | "admin";
        marketing_opt_in: number;
        phone: string | null;
        last_active_at: string | null;
        u_created_at: string;
        u_updated_at: string;
      }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    expiresAt: row.expires_at,
    lastSeenAt: row.last_seen_at,
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    user: {
      id: row.u_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      marketingOptIn: Boolean(row.marketing_opt_in),
      phone: row.phone,
      lastActiveAt: row.last_active_at,
      createdAt: row.u_created_at,
      updatedAt: row.u_updated_at,
    },
  };
}

export function touchSession(sessionId: string) {
  db.prepare("UPDATE auth_sessions SET last_seen_at=? WHERE id=?").run(nowISO(), sessionId);
}

export function deleteSession(sessionId: string) {
  db.prepare("DELETE FROM auth_sessions WHERE id=?").run(sessionId);
}

export function deleteUserSessions(userId: string) {
  db.prepare("DELETE FROM auth_sessions WHERE user_id=?").run(userId);
}

export function createPasswordResetToken(input: {
  userId: string;
  tokenHash: string;
  expiresAt: string;
}) {
  db.prepare("DELETE FROM password_reset_tokens WHERE user_id=? AND used_at IS NULL").run(input.userId);
  db.prepare(
    `INSERT INTO password_reset_tokens (id,user_id,token_hash,expires_at,used_at,created_at)
     VALUES (?,?,?,?,?,?)`
  ).run(crypto.randomUUID(), input.userId, input.tokenHash, input.expiresAt, null, nowISO());
}

export function consumePasswordResetToken(tokenHash: string) {
  const now = nowISO();
  const row = db
    .prepare(
      "SELECT id,user_id,expires_at,used_at FROM password_reset_tokens WHERE token_hash=? ORDER BY created_at DESC LIMIT 1"
    )
    .get(tokenHash) as
    | { id: string; user_id: string; expires_at: string; used_at: string | null }
    | undefined;
  if (!row) return null;
  if (row.used_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  db.prepare("UPDATE password_reset_tokens SET used_at=? WHERE id=?").run(now, row.id);
  return { userId: row.user_id };
}

export function getAdminInviteByTokenHash(tokenHash: string) {
  const row = db
    .prepare(
      `SELECT id,email,token_hash,invited_by_user_id,expires_at,accepted_at,created_at
       FROM admin_invites
       WHERE token_hash=?
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(tokenHash) as DbAdminInviteRow | undefined;
  if (!row) return null;
  const isExpired = new Date(row.expires_at).getTime() < Date.now();
  return {
    id: row.id,
    email: row.email,
    expiresAt: row.expires_at,
    invitedByUserId: row.invited_by_user_id,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
    isExpired,
  };
}

export function markAdminInviteAccepted(inviteId: string) {
  db.prepare("UPDATE admin_invites SET accepted_at=? WHERE id=? AND accepted_at IS NULL").run(
    nowISO(),
    inviteId
  );
}

export function listUserAddresses(userId: string) {
  const rows = db
    .prepare("SELECT * FROM user_addresses WHERE user_id=? ORDER BY is_default DESC, created_at DESC")
    .all(userId) as Array<{
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state_region: string;
    postcode: string;
    country: string;
    phone: string | null;
    is_default: number;
    created_at: string;
    updated_at: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    city: row.city,
    stateRegion: row.state_region,
    postcode: row.postcode,
    country: row.country,
    phone: row.phone,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function createUserAddress(
  userId: string,
  input: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateRegion: string;
    postcode: string;
    country: string;
    phone?: string;
    isDefault?: boolean;
  }
) {
  const id = crypto.randomUUID();
  const now = nowISO();
  db.transaction(() => {
    if (input.isDefault) {
      db.prepare("UPDATE user_addresses SET is_default=0 WHERE user_id=?").run(userId);
    }
    db.prepare(
      `INSERT INTO user_addresses (
        id,user_id,first_name,last_name,address_line_1,address_line_2,city,state_region,postcode,country,phone,is_default,created_at,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      id,
      userId,
      input.firstName.trim(),
      input.lastName.trim(),
      input.addressLine1.trim(),
      input.addressLine2?.trim() || null,
      input.city.trim(),
      input.stateRegion.trim(),
      input.postcode.trim(),
      input.country.trim(),
      input.phone?.trim() || null,
      input.isDefault ? 1 : 0,
      now,
      now
    );
  })();
  return listUserAddresses(userId);
}

export function getUserAddressById(userId: string, addressId: string) {
  const row = db
    .prepare("SELECT * FROM user_addresses WHERE user_id=? AND id=?")
    .get(userId, addressId) as
    | {
        id: string;
        user_id: string;
        first_name: string;
        last_name: string;
        address_line_1: string;
        address_line_2: string | null;
        city: string;
        state_region: string;
        postcode: string;
        country: string;
        phone: string | null;
        is_default: number;
      }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    city: row.city,
    stateRegion: row.state_region,
    postcode: row.postcode,
    country: row.country,
    phone: row.phone,
    isDefault: Boolean(row.is_default),
  };
}

export function updateUserAddress(
  userId: string,
  addressId: string,
  input: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateRegion: string;
    postcode: string;
    country: string;
    phone?: string;
    isDefault?: boolean;
  }
) {
  db.transaction(() => {
    if (input.isDefault) {
      db.prepare("UPDATE user_addresses SET is_default=0 WHERE user_id=?").run(userId);
    }
    db.prepare(
      `UPDATE user_addresses
       SET first_name=?,last_name=?,address_line_1=?,address_line_2=?,city=?,state_region=?,postcode=?,country=?,phone=?,is_default=?,updated_at=?
       WHERE user_id=? AND id=?`
    ).run(
      input.firstName.trim(),
      input.lastName.trim(),
      input.addressLine1.trim(),
      input.addressLine2?.trim() || null,
      input.city.trim(),
      input.stateRegion.trim(),
      input.postcode.trim(),
      input.country.trim(),
      input.phone?.trim() || null,
      input.isDefault ? 1 : 0,
      nowISO(),
      userId,
      addressId
    );
  })();
  return listUserAddresses(userId);
}

export function listDiscountCodes() {
  return db
    .prepare("SELECT * FROM discount_codes ORDER BY created_at DESC")
    .all() as Array<{
    id: string;
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    active: number;
    starts_at: string | null;
    expiry_at: string | null;
    usage_limit: number | null;
    minimum_order_aud: number | null;
    created_at: string;
    updated_at: string;
  }>;
}

export function createDiscountCode(input: {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  active: boolean;
  startsAt?: string | null;
  expiryAt?: string | null;
  usageLimit?: number | null;
  minimumOrderAUD?: number | null;
}) {
  const now = nowISO();
  db.prepare(
    `INSERT INTO discount_codes (
      id,code,discount_type,discount_value,active,starts_at,expiry_at,usage_limit,minimum_order_aud,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    crypto.randomUUID(),
    input.code.trim().toUpperCase(),
    input.discountType,
    input.discountValue,
    input.active ? 1 : 0,
    input.startsAt ?? null,
    input.expiryAt ?? null,
    input.usageLimit ?? null,
    input.minimumOrderAUD ?? null,
    now,
    now
  );
}

export function updateDiscountCode(
  id: string,
  input: {
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    active: boolean;
    startsAt?: string | null;
    expiryAt?: string | null;
    usageLimit?: number | null;
    minimumOrderAUD?: number | null;
  }
) {
  db.prepare(
    `UPDATE discount_codes
     SET code=?,discount_type=?,discount_value=?,active=?,starts_at=?,expiry_at=?,usage_limit=?,minimum_order_aud=?,updated_at=?
     WHERE id=?`
  ).run(
    input.code.trim().toUpperCase(),
    input.discountType,
    input.discountValue,
    input.active ? 1 : 0,
    input.startsAt ?? null,
    input.expiryAt ?? null,
    input.usageLimit ?? null,
    input.minimumOrderAUD ?? null,
    nowISO(),
    id
  );
}

export function deleteDiscountCode(id: string) {
  db.prepare("DELETE FROM discount_codes WHERE id=?").run(id);
}

export function validateDiscountCode(params: {
  code: string;
  userId?: string | null;
  subtotalAUD: number;
}) {
  const row = db
    .prepare("SELECT * FROM discount_codes WHERE LOWER(code)=LOWER(?)")
    .get(params.code.trim()) as
    | {
        id: string;
        code: string;
        discount_type: "percentage" | "fixed";
        discount_value: number;
        active: number;
        starts_at: string | null;
        expiry_at: string | null;
        usage_limit: number | null;
        minimum_order_aud: number | null;
      }
    | undefined;
  if (!row || !row.active) return { ok: false as const, message: "Invalid or inactive code." };
  if (row.starts_at && new Date(row.starts_at).getTime() > Date.now()) {
    return { ok: false as const, message: "Discount code is not active yet." };
  }
  if (row.expiry_at && new Date(row.expiry_at).getTime() < Date.now()) {
    return { ok: false as const, message: "Discount code has expired." };
  }
  if (row.minimum_order_aud && params.subtotalAUD < row.minimum_order_aud) {
    return {
      ok: false as const,
      message: `Minimum order is ${row.minimum_order_aud.toFixed(2)} AUD for this code.`,
    };
  }
  if (row.usage_limit !== null) {
    const usage = db
      .prepare("SELECT COUNT(*) as count FROM discount_code_usage WHERE discount_code_id=?")
      .get(row.id) as { count: number };
    if (usage.count >= row.usage_limit) {
      return { ok: false as const, message: "Discount usage limit reached." };
    }
  }
  const discountRaw =
    row.discount_type === "percentage"
      ? (params.subtotalAUD * row.discount_value) / 100
      : row.discount_value;
  const discountAmount = Math.max(0, Math.min(params.subtotalAUD, discountRaw));
  return {
    ok: true as const,
    codeId: row.id,
    code: row.code,
    discountAmountAUD: Number(discountAmount.toFixed(2)),
  };
}

export function createContactMessage(input: {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
}) {
  const now = nowISO();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO contact_messages (id,name,email,phone,subject,message,status,internal_note,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    input.name.trim(),
    input.email.trim().toLowerCase(),
    input.phone?.trim() || null,
    input.subject?.trim() || null,
    input.message.trim(),
    "unfinished",
    null,
    now,
    now
  );
  return id;
}

export function listContactMessages(status?: "unfinished" | "finished") {
  const rows = status
    ? (db
        .prepare("SELECT * FROM contact_messages WHERE status=? ORDER BY created_at DESC")
        .all(status) as Array<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        subject: string | null;
        message: string;
        status: "unfinished" | "finished";
        internal_note: string | null;
        created_at: string;
        updated_at: string;
      }>)
    : (db
        .prepare("SELECT * FROM contact_messages ORDER BY created_at DESC")
        .all() as Array<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        subject: string | null;
        message: string;
        status: "unfinished" | "finished";
        internal_note: string | null;
        created_at: string;
        updated_at: string;
      }>);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status,
    internalNote: row.internal_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function updateContactMessage(
  id: string,
  input: { status?: "unfinished" | "finished"; internalNote?: string | null }
) {
  db.prepare(
    `UPDATE contact_messages
     SET status=COALESCE(?,status), internal_note=COALESCE(?,internal_note), updated_at=?
     WHERE id=?`
  ).run(input.status ?? null, input.internalNote ?? null, nowISO(), id);
}

export type ReviewStatus = "pending" | "approved" | "hidden";

export type ProductReview = {
  id: string;
  userId: string;
  orderId: string;
  orderItemId: string;
  productId: string;
  productName: string;
  rating: number;
  body: string;
  displayName: string | null;
  images: string[];
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
};

export function listApprovedReviews(limit = 50): ProductReview[] {
  const rows = db
    .prepare(
      `SELECT r.*, p.name as product_name
       FROM product_reviews r
       JOIN products p ON p.id = r.product_id
       WHERE r.status='approved'
       ORDER BY r.created_at DESC
       LIMIT ?`
    )
    .all(limit) as Array<{
    id: string;
    user_id: string;
    order_id: string;
    order_item_id: string;
    product_id: string;
    product_name: string;
    rating: number;
    body: string;
    display_name: string | null;
    images_json: string;
    status: ReviewStatus;
    created_at: string;
    updated_at: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    orderId: row.order_id,
    orderItemId: row.order_item_id,
    productId: row.product_id,
    productName: row.product_name,
    rating: row.rating,
    body: row.body,
    displayName: row.display_name,
    images: JSON.parse(row.images_json) as string[],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function listApprovedReviewsByProductId(productId: string, limit = 30): ProductReview[] {
  const rows = db
    .prepare(
      `SELECT r.*, p.name as product_name
       FROM product_reviews r
       JOIN products p ON p.id = r.product_id
       WHERE r.product_id=? AND r.status='approved'
       ORDER BY r.created_at DESC
       LIMIT ?`
    )
    .all(productId, limit) as Array<{
    id: string;
    user_id: string;
    order_id: string;
    order_item_id: string;
    product_id: string;
    product_name: string;
    rating: number;
    body: string;
    display_name: string | null;
    images_json: string;
    status: ReviewStatus;
    created_at: string;
    updated_at: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    orderId: row.order_id,
    orderItemId: row.order_item_id,
    productId: row.product_id,
    productName: row.product_name,
    rating: row.rating,
    body: row.body,
    displayName: row.display_name,
    images: JSON.parse(row.images_json) as string[],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function listReviewsForAdmin(status?: ReviewStatus): ProductReview[] {
  const rows = (status
    ? db.prepare(
        `SELECT r.*, p.name as product_name
         FROM product_reviews r
         JOIN products p ON p.id=r.product_id
         WHERE r.status=?
         ORDER BY r.created_at DESC`
      ).all(status)
    : db.prepare(
        `SELECT r.*, p.name as product_name
         FROM product_reviews r
         JOIN products p ON p.id=r.product_id
         ORDER BY r.created_at DESC`
      ).all()) as Array<{
    id: string;
    user_id: string;
    order_id: string;
    order_item_id: string;
    product_id: string;
    product_name: string;
    rating: number;
    body: string;
    display_name: string | null;
    images_json: string;
    status: ReviewStatus;
    created_at: string;
    updated_at: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    orderId: row.order_id,
    orderItemId: row.order_item_id,
    productId: row.product_id,
    productName: row.product_name,
    rating: row.rating,
    body: row.body,
    displayName: row.display_name,
    images: JSON.parse(row.images_json) as string[],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function listReviewableOrderItems(userId: string) {
  const rows = db
    .prepare(
      `SELECT oi.id as order_item_id, oi.order_id, oi.product_id, oi.name as product_name, oi.image,
              oi.size, oi.color, o.created_at,
              EXISTS(SELECT 1 FROM product_reviews r WHERE r.order_item_id = oi.id) as has_review
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.user_id=? AND o.payment_status='paid'
       ORDER BY o.created_at DESC`
    )
    .all(userId) as Array<{
    order_item_id: string;
    order_id: string;
    product_id: string;
    product_name: string;
    image: string;
    size: string;
    color: string;
    created_at: string;
    has_review: number;
  }>;
  return rows.map((row) => ({
    orderItemId: row.order_item_id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    image: row.image,
    size: row.size,
    color: row.color,
    createdAt: row.created_at,
    hasReview: Boolean(row.has_review),
  }));
}

export function createProductReview(input: {
  userId: string;
  orderItemId: string;
  rating: number;
  body: string;
  displayName?: string | null;
  images?: string[];
}) {
  const orderItem = db
    .prepare(
      `SELECT oi.id as order_item_id, oi.order_id, oi.product_id, o.user_id, o.payment_status
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.id=?`
    )
    .get(input.orderItemId) as
    | {
        order_item_id: string;
        order_id: string;
        product_id: string;
        user_id: string | null;
        payment_status: "paid" | "unpaid" | "failed";
      }
    | undefined;
  if (!orderItem || orderItem.user_id !== input.userId || orderItem.payment_status !== "paid") {
    return { ok: false as const, message: "Review is not allowed for this item." };
  }
  const existing = db
    .prepare("SELECT id FROM product_reviews WHERE order_item_id=?")
    .get(input.orderItemId) as { id: string } | undefined;
  if (existing) {
    return { ok: false as const, message: "Review already submitted for this purchased item." };
  }
  const now = nowISO();
  db.prepare(
    `INSERT INTO product_reviews (
      id,user_id,order_id,order_item_id,product_id,rating,body,display_name,images_json,status,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    crypto.randomUUID(),
    input.userId,
    orderItem.order_id,
    input.orderItemId,
    orderItem.product_id,
    Math.max(1, Math.min(5, Math.round(input.rating))),
    input.body.trim().slice(0, 300),
    input.displayName?.trim() || null,
    JSON.stringify((input.images ?? []).slice(0, 3)),
    "approved",
    now,
    now
  );
  return { ok: true as const };
}

export function updateReviewStatus(reviewId: string, status: ReviewStatus) {
  db.prepare("UPDATE product_reviews SET status=?, updated_at=? WHERE id=?").run(status, nowISO(), reviewId);
}

export function deleteReview(reviewId: string) {
  db.prepare("DELETE FROM product_reviews WHERE id=?").run(reviewId);
}

function hashVerificationCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export function createOrUpdatePendingEmailVerification(input: {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  marketingOptIn: boolean;
}) {
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  const resendAvailableAt = new Date(now.getTime() + 60 * 1000).toISOString();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  db.prepare(
    `INSERT INTO pending_email_verifications (
      email,first_name,last_name,password_hash,marketing_opt_in,code_hash,expires_at,resend_available_at,resend_count,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(email) DO UPDATE SET
      first_name=excluded.first_name,
      last_name=excluded.last_name,
      password_hash=excluded.password_hash,
      marketing_opt_in=excluded.marketing_opt_in,
      code_hash=excluded.code_hash,
      expires_at=excluded.expires_at,
      resend_available_at=excluded.resend_available_at,
      resend_count=0,
      updated_at=excluded.updated_at`
  ).run(
    input.email.trim().toLowerCase(),
    input.firstName.trim(),
    input.lastName.trim(),
    input.passwordHash,
    input.marketingOptIn ? 1 : 0,
    hashVerificationCode(code),
    expiresAt,
    resendAvailableAt,
    0,
    nowIso,
    nowIso
  );
  return { code, expiresAt, resendAvailableAt };
}

export function resendPendingEmailVerificationCode(email: string) {
  const row = db
    .prepare(
      "SELECT email,resend_count,resend_available_at FROM pending_email_verifications WHERE email=?"
    )
    .get(email.trim().toLowerCase()) as
    | { email: string; resend_count: number; resend_available_at: string }
    | undefined;
  if (!row) return { ok: false as const, reason: "missing" as const };
  if (row.resend_count >= 6) return { ok: false as const, reason: "rate_limited" as const };
  const now = Date.now();
  const cooldownUntil = new Date(row.resend_available_at).getTime();
  if (cooldownUntil > now) {
    return {
      ok: false as const,
      reason: "cooldown" as const,
      retryInSeconds: Math.ceil((cooldownUntil - now) / 1000),
    };
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const nowIso = new Date(now).toISOString();
  const expiresAt = new Date(now + 10 * 60 * 1000).toISOString();
  const resendAvailableAt = new Date(now + 60 * 1000).toISOString();
  db.prepare(
    `UPDATE pending_email_verifications
     SET code_hash=?, expires_at=?, resend_available_at=?, resend_count=resend_count+1, updated_at=?
     WHERE email=?`
  ).run(hashVerificationCode(code), expiresAt, resendAvailableAt, nowIso, row.email);
  return { ok: true as const, code, expiresAt, resendAvailableAt };
}

export function verifyPendingEmailVerification(input: { email: string; code: string }) {
  const row = db
    .prepare(
      `SELECT email,first_name,last_name,password_hash,marketing_opt_in,code_hash,expires_at
       FROM pending_email_verifications
       WHERE email=?`
    )
    .get(input.email.trim().toLowerCase()) as
    | {
        email: string;
        first_name: string;
        last_name: string;
        password_hash: string;
        marketing_opt_in: number;
        code_hash: string;
        expires_at: string;
      }
    | undefined;
  if (!row) return { ok: false as const, reason: "missing" as const };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false as const, reason: "expired" as const };
  }
  if (hashVerificationCode(input.code.trim()) !== row.code_hash) {
    return { ok: false as const, reason: "invalid_code" as const };
  }
  return {
    ok: true as const,
    pending: {
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      passwordHash: row.password_hash,
      marketingOptIn: Boolean(row.marketing_opt_in),
    },
  };
}

export function deletePendingEmailVerification(email: string) {
  db.prepare("DELETE FROM pending_email_verifications WHERE email=?").run(email.trim().toLowerCase());
}
