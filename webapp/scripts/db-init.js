import 'dotenv/config';
import { Client, Databases } from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

if (!endpoint || !projectId || !apiKey || !databaseId) {
  console.error("Missing Appwrite environment variables. Please check your .env file.");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

const db = new Databases(client);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function init() {
  console.log(`Starting database initialization for database: ${databaseId}...`);
  try {
    // 1. Create Database
    try {
      await db.get(databaseId);
      console.log(`Database '${databaseId}' already exists.`);
    } catch (e) {
      if (e.code === 404) {
        console.log(`Database '${databaseId}' not found. Creating...`);
        await db.create(databaseId, 'Webapp Database');
        console.log(`✅ Database '${databaseId}' created.`);
      } else {
        throw e;
      }
    }

    // --- Create collections & attributes ---
    
    const collections = [
      { id: 'organizations', name: 'Organizations' },
      { id: 'menu_categories', name: 'Menu Categories' },
      { id: 'menu_items', name: 'Menu Items' },
      { id: 'orders', name: 'Orders' },
      { id: 'orders_sessions', name: 'Order Sessions' },
      { id: 'availability_sessions', name: 'Availability Sessions' }
    ];

    for (const coll of collections) {
      try {
        await db.getCollection(databaseId, coll.id);
        console.log(`Collection '${coll.id}' already exists.`);
      } catch (e) {
        if (e.code === 404) {
          console.log(`Creating collection '${coll.id}'...`);
          await db.createCollection(databaseId, coll.id, coll.name);
          console.log(`✅ Collection '${coll.id}' created.`);
        } else {
          throw e;
        }
      }
    }

    console.log(`Creating attributes... (this may take a moment)`);

    async function ensureAttr(promise) {
      try { await promise; } catch(e) { if (e.code !== 409) throw e; }
    }

    // Organizations (skipping)
    // Menu Categories (skipping)
    // Menu Items (skipping)
    // Orders (skipping)

    // Order Sessions
    await ensureAttr(db.createStringAttribute(databaseId, 'orders_sessions', 'organizationId', 255, true));
    await ensureAttr(db.createStringAttribute(databaseId, 'orders_sessions', 'token', 255, true));
    await ensureAttr(db.createDatetimeAttribute(databaseId, 'orders_sessions', 'expiresAt', false));

    // Availability Sessions
    await ensureAttr(db.createStringAttribute(databaseId, 'availability_sessions', 'organizationId', 255, true));
    await ensureAttr(db.createStringAttribute(databaseId, 'availability_sessions', 'token', 255, true));
    await ensureAttr(db.createDatetimeAttribute(databaseId, 'availability_sessions', 'expiresAt', false));

    console.log(`Waiting for attributes to be ready before creating indices...`);
    await sleep(4000);

    // Indices
    try { await db.createIndex(databaseId, 'menu_categories', 'idx_org_id', 'key', ['organizationId']); } catch(e){}
    try { await db.createIndex(databaseId, 'menu_items', 'idx_org_cat', 'key', ['organizationId', 'categoryId']); } catch(e){}
    try { await db.createIndex(databaseId, 'orders', 'idx_org', 'key', ['organizationId']); } catch(e){}

    console.log(`🎉 Webapp Database initialization completed successfully!`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`Attributes or indices already exist or are currently building. It's safe to ignore this if you run it multiple times.`);
    } else {
      console.error("❌ Initialization failed:", error);
      process.exit(1);
    }
  }
}

init();
