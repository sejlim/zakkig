import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const seedDemoData = internalMutation({
  args: {},
  returns: v.object({
    organizationId: v.id("organizations"),
    categoriesCount: v.number(),
    itemsCount: v.number(),
    ordersCount: v.number(),
  }),
  handler: async (ctx) => {
    // 0. Ensure Demo Owner User & Session
    let demoUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "selim@zakkig.de"))
      .first();

    let userId = demoUser?._id;
    if (!userId) {
      userId = await ctx.db.insert("users", {
        name: "Selim Eser",
        email: "selim@zakkig.de",
        emailVerificationTime: Date.now(),
      });
    }

    const existingSession = await ctx.db
      .query("verificationCodes")
      .withIndex("by_identifier", (q) => q.eq("identifier", "session_demo_owner_session"))
      .first();

    if (!existingSession) {
      await ctx.db.insert("verificationCodes", {
        identifier: "session_demo_owner_session",
        code: userId,
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });
    }

    // 1. Check if organization already exists
    const existingOrg = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("name"), "Pizzeria Gusto & Zakkig"))
      .first();

    let orgId = existingOrg?._id;

    if (!orgId) {
      orgId = await ctx.db.insert("organizations", {
        name: "Pizzeria Gusto & Zakkig",
        address: "Musterstraße 42, 10115 Berlin",
        ownerId: userId,
        stripeAccountId: "acct_test_123",
        stripeOnboardingComplete: true,
        isToGoEnabled: true,
        isToStayEnabled: true,
        legalName: "Gusto Gastronomie GmbH",
        taxId: "DE123456789",
        currency: "EUR",
        tables: ["1", "2", "3", "4", "5", "6", "Terrasse 1", "Terrasse 2"],
      });
    } else if (existingOrg && orgId && existingOrg.ownerId !== userId) {
      await ctx.db.patch(orgId, { ownerId: userId });
    }

    // 2. Insert Menu Categories
    const categoriesData = [
      { name: "Pizza", sortOrder: 0 },
      { name: "Pasta", sortOrder: 1 },
      { name: "Getränke", sortOrder: 2 },
      { name: "Desserts", sortOrder: 3 },
    ];

    const categoryMap: Record<string, any> = {};

    for (const cat of categoriesData) {
      let existingCat = await ctx.db
        .query("menuCategories")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", orgId!))
        .filter((q) => q.eq(q.field("name"), cat.name))
        .first();

      if (!existingCat) {
        const catId = await ctx.db.insert("menuCategories", {
          organizationId: orgId!,
          name: cat.name,
          sortOrder: cat.sortOrder,
        });
        categoryMap[cat.name] = catId;
      } else {
        categoryMap[cat.name] = existingCat._id;
      }
    }

    // 3. Insert Menu Items
    const itemsData = [
      {
        name: "Pizza Margherita",
        description: "Fruchtige Tomatensauce, Fior di Latte Mozzarella, frisches Basilikum und feines Olivenöl.",
        price: 850,
        categoryName: "Pizza",
        available: true,
        sortOrder: 0,
        taxRate: 7,
        customizations: [],
      },
      {
        name: "Wunschpizza",
        description: "Stelle deine Lieblingspizza nach deinen Wünschen zusammen.",
        price: 1050,
        categoryName: "Pizza",
        available: true,
        sortOrder: 1,
        taxRate: 7,
        customizations: [
          {
            id: "step_size",
            name: "Größe",
            required: true,
            minSelections: 1,
            maxSelections: 1,
            options: [
              { id: "opt_norm", name: "Klassisch (30cm)", price: 0, available: true },
              { id: "opt_large", name: "Familienpizza (38cm)", price: 400, available: true },
            ],
          },
          {
            id: "step_toppings",
            name: "Zusätzliche Beläge",
            required: false,
            minSelections: 0,
            maxSelections: 5,
            options: [
              { id: "opt_sal", name: "Salami Milano", price: 150, available: true },
              { id: "opt_parma", name: "Parmaschinken", price: 250, available: true },
              { id: "opt_champ", name: "Frische Champignons", price: 100, available: true },
              { id: "opt_gorg", name: "Gorgonzola DOP", price: 150, available: true },
              { id: "opt_rucola", name: "Rucola & Parmesan", price: 150, available: true },
            ],
          },
        ],
      },
      {
        name: "Pizza Diavola",
        description: "Scharfe Spianata Calabrese, Peperoni, Mozzarella und Chili-Öl.",
        price: 1100,
        categoryName: "Pizza",
        available: true,
        sortOrder: 2,
        taxRate: 7,
        customizations: [],
      },
      {
        name: "Pasta Carbonara Originale",
        description: "Spaghetti alla Chitarra mit krossem Guanciale, Eigelb, Pecorino Romano und schwarzem Pfeffer.",
        price: 1250,
        categoryName: "Pasta",
        available: true,
        sortOrder: 0,
        taxRate: 7,
        customizations: [],
      },
      {
        name: "Penne all'Arrabbiata",
        description: "Penne mit pikanter San Marzano Tomatensauce, Knoblauch und frischer Petersilie.",
        price: 980,
        categoryName: "Pasta",
        available: true,
        sortOrder: 1,
        taxRate: 7,
        customizations: [],
      },
      {
        name: "Hausgemachte Limonade",
        description: "Frische Zitrone, Minze und Beeren auf Crushed Ice (0,4l).",
        price: 450,
        categoryName: "Getränke",
        available: true,
        sortOrder: 0,
        taxRate: 19,
        customizations: [],
      },
      {
        name: "San Pellegrino 0,5l",
        description: "Feinperliges italienisches Mineralwasser.",
        price: 380,
        categoryName: "Getränke",
        available: true,
        sortOrder: 1,
        taxRate: 19,
        customizations: [],
      },
      {
        name: "Klassisches Tiramisu",
        description: "Nach traditionellem Familienrezept mit Löffelbiskuits und Mascarponecreme.",
        price: 580,
        categoryName: "Desserts",
        available: true,
        sortOrder: 0,
        taxRate: 7,
        customizations: [],
      },
    ];

    let itemsCount = 0;
    for (const item of itemsData) {
      const categoryId = categoryMap[item.categoryName];
      if (!categoryId) continue;

      const existingItem = await ctx.db
        .query("menuItems")
        .withIndex("by_categoryId", (q) => q.eq("categoryId", categoryId))
        .filter((q) => q.eq(q.field("name"), item.name))
        .first();

      if (!existingItem) {
        await ctx.db.insert("menuItems", {
          organizationId: orgId!,
          categoryId,
          name: item.name,
          description: item.description,
          price: item.price,
          available: item.available,
          sortOrder: item.sortOrder,
          taxRate: item.taxRate,
          customizations: JSON.stringify(item.customizations),
        });
        itemsCount++;
      }
    }

    // 4. Insert Live Orders
    const existingOrders = await ctx.db
      .query("orders")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", orgId!))
      .take(5);

    if (existingOrders.length === 0) {
      await ctx.db.insert("orders", {
        organizationId: orgId!,
        tableNumber: "5",
        type: "dine-in",
        orderNumber: "001",
        status: "in_progress",
        total: 2400,
        email: "gast1@zakkig.de",
        items: JSON.stringify([
          {
            name: "Pizza Margherita",
            price: 850,
            quantity: 1,
            customizations: [],
          },
          {
            name: "Wunschpizza",
            price: 1100,
            quantity: 1,
            customizations: [{ stepName: "Größe", optionName: "Klassisch (30cm)", price: 0 }],
          },
          {
            name: "San Pellegrino 0,5l",
            price: 380,
            quantity: 1,
            customizations: [],
          },
        ]),
        zakkigFee: 24,
        stripeFee: 0,
        netAmount: 2376,
        currency: "EUR",
      });

      await ctx.db.insert("orders", {
        organizationId: orgId!,
        type: "takeaway",
        orderNumber: "002",
        status: "in_progress",
        total: 1700,
        email: "abholer@zakkig.de",
        items: JSON.stringify([
          {
            name: "Pasta Carbonara Originale",
            price: 1250,
            quantity: 1,
            customizations: [],
          },
          {
            name: "Hausgemachte Limonade",
            price: 450,
            quantity: 1,
            customizations: [],
          },
        ]),
        zakkigFee: 17,
        stripeFee: 0,
        netAmount: 1683,
        currency: "EUR",
      });

      await ctx.db.insert("orders", {
        organizationId: orgId!,
        tableNumber: "2",
        type: "dine-in",
        orderNumber: "003",
        status: "completed",
        total: 580,
        email: "dessert@zakkig.de",
        items: JSON.stringify([
          {
            name: "Klassisches Tiramisu",
            price: 580,
            quantity: 1,
            customizations: [],
          },
        ]),
        zakkigFee: 6,
        stripeFee: 0,
        netAmount: 574,
        currency: "EUR",
      });
    }

    // 5. Insert Terminal Sessions for Kitchen Board & Availability Terminal
    const existingOrderSession = await ctx.db
      .query("orderSessions")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", orgId!))
      .first();

    if (!existingOrderSession) {
      await ctx.db.insert("orderSessions", {
        organizationId: orgId!,
        token: "demo_kitchen_token",
      });
    }

    const existingAvailSession = await ctx.db
      .query("availabilitySessions")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", orgId!))
      .first();

    if (!existingAvailSession) {
      await ctx.db.insert("availabilitySessions", {
        organizationId: orgId!,
        token: "demo_avail_token",
      });
    }

    return {
      organizationId: orgId!,
      categoriesCount: categoriesData.length,
      itemsCount: itemsData.length,
      ordersCount: 3,
    };
  },
});
