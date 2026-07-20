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
      { id: 'kitchen_sessions', name: 'Kitchen Sessions' }
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

    // Organizations
    await db.createStringAttribute(databaseId, 'organizations', 'name', 255, true);
    await db.createStringAttribute(databaseId, 'organizations', 'address', 255, false);
    await db.createStringAttribute(databaseId, 'organizations', 'logoFileId', 255, false);
    await db.createStringAttribute(databaseId, 'organizations', 'ownerId', 255, true);
    await db.createStringAttribute(databaseId, 'organizations', 'stripeAccountId', 255, false);
    await db.createBooleanAttribute(databaseId, 'organizations', 'isToGoEnabled', false, false, false);
    await db.createBooleanAttribute(databaseId, 'organizations', 'isToStayEnabled', false, false, false);
    await db.createStringAttribute(databaseId, 'organizations', 'legalName', 255, false);
    await db.createStringAttribute(databaseId, 'organizations', 'taxId', 255, false);
    await db.createStringAttribute(databaseId, 'organizations', 'currency', 10, false, 'EUR');
    await db.createBooleanAttribute(databaseId, 'organizations', 'deletionRequested', false, false, false);
    await db.createStringAttribute(databaseId, 'organizations', 'tables', 10, false, undefined, true);

    // Menu Categories
    await db.createStringAttribute(databaseId, 'menu_categories', 'organizationId', 255, true);
    await db.createStringAttribute(databaseId, 'menu_categories', 'name', 255, true);
    await db.createIntegerAttribute(databaseId, 'menu_categories', 'sortOrder', false, 0, 10000, 0);

    // Menu Items
    await db.createStringAttribute(databaseId, 'menu_items', 'organizationId', 255, true);
    await db.createStringAttribute(databaseId, 'menu_items', 'categoryId', 255, true);
    await db.createStringAttribute(databaseId, 'menu_items', 'name', 255, true);
    await db.createStringAttribute(databaseId, 'menu_items', 'description', 2000, false);
    await db.createIntegerAttribute(databaseId, 'menu_items', 'price', true, 0, 1000000);
    await db.createStringAttribute(databaseId, 'menu_items', 'imageId', 255, false);
    await db.createBooleanAttribute(databaseId, 'menu_items', 'available', false, false, false);
    await db.createIntegerAttribute(databaseId, 'menu_items', 'sortOrder', false, 0, 10000, 0);
    await db.createFloatAttribute(databaseId, 'menu_items', 'taxRate', false);

    // Orders
    await db.createStringAttribute(databaseId, 'orders', 'organizationId', 255, true);
    await db.createStringAttribute(databaseId, 'orders', 'tableNumber', 255, false);
    await db.createStringAttribute(databaseId, 'orders', 'type', 255, true);
    await db.createStringAttribute(databaseId, 'orders', 'items', 10000, true);
    await db.createIntegerAttribute(databaseId, 'orders', 'total', true, 0, 1000000);
    await db.createStringAttribute(databaseId, 'orders', 'status', 255, true);
    await db.createStringAttribute(databaseId, 'orders', 'email', 255, true);
    await db.createStringAttribute(databaseId, 'orders', 'orderNumber', 255, true);
    await db.createStringAttribute(databaseId, 'orders', 'stripePaymentId', 255, false);
    await db.createIntegerAttribute(databaseId, 'orders', 'zakkigFee', false, 0, 1000000);
    await db.createIntegerAttribute(databaseId, 'orders', 'stripeFee', false, 0, 1000000);
    await db.createIntegerAttribute(databaseId, 'orders', 'netAmount', false, 0, 1000000);
    await db.createStringAttribute(databaseId, 'orders', 'currency', 10, false, 'EUR');

    // Kitchen Sessions
    await db.createStringAttribute(databaseId, 'kitchen_sessions', 'organizationId', 255, true);
    await db.createStringAttribute(databaseId, 'kitchen_sessions', 'token', 255, true);
    await db.createDatetimeAttribute(databaseId, 'kitchen_sessions', 'expiresAt', false);

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
