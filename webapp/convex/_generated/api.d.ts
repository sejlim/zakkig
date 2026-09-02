/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authQueries from "../authQueries.js";
import type * as customAuth from "../customAuth.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as menu from "../menu.js";
import type * as orders from "../orders.js";
import type * as organizations from "../organizations.js";
import type * as seed from "../seed.js";
import type * as sessions from "../sessions.js";
import type * as storage from "../storage.js";
import type * as stripe from "../stripe.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authQueries: typeof authQueries;
  customAuth: typeof customAuth;
  emails: typeof emails;
  http: typeof http;
  menu: typeof menu;
  orders: typeof orders;
  organizations: typeof organizations;
  seed: typeof seed;
  sessions: typeof sessions;
  storage: typeof storage;
  stripe: typeof stripe;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  stripe: import("@convex-dev/stripe/_generated/component.js").ComponentApi<"stripe">;
};
