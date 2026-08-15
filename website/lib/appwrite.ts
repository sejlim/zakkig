import "server-only";
import { Client, Databases } from "node-appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  throw new Error(
    "Appwrite environment variables are missing (NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY)",
  );
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

export const db = new Databases(client);
export const WEBSITE_DB_ID = process.env
  .NEXT_PUBLIC_APPWRITE_DATABASE_ID as string;

if (!WEBSITE_DB_ID) {
  throw new Error(
    "NEXT_PUBLIC_APPWRITE_DATABASE_ID environment variable is missing",
  );
}
