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
        await db.create(databaseId, 'Website Database');
        console.log(`✅ Database '${databaseId}' created.`);
      } else {
        throw e;
      }
    }

    // 2. Create 'leads' collection
    try {
      await db.getCollection(databaseId, 'leads');
      console.log(`Collection 'leads' already exists.`);
    } catch (e) {
      if (e.code === 404) {
        console.log(`Collection 'leads' not found. Creating...`);
        await db.createCollection(databaseId, 'leads', 'Waitlist Leads');
        console.log(`✅ Collection 'leads' created.`);
        
        console.log(`Creating attributes for 'leads'...`);
        await db.createEmailAttribute(databaseId, 'leads', 'email', true);
        
        // Wait for attributes to be available before creating an index
        console.log(`Waiting for attributes to be created...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await db.createIndex(databaseId, 'leads', 'idx_email', 'unique', ['email']);
        console.log(`✅ Attributes and index for 'leads' created.`);
      } else {
        throw e;
      }
    }

    console.log(`🎉 Website Database initialization completed successfully!`);
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    process.exit(1);
  }
}

init();
