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

export const seedDemoProfile = internalMutation({
  args: {
    logoStorageId: v.id("_storage"),
    bannerStorageId: v.id("_storage"),
    margheritaStorageId: v.id("_storage"),
    tartufoStorageId: v.id("_storage"),
    carbonaraStorageId: v.id("_storage"),
    tiramisuStorageId: v.id("_storage"),
    limonataStorageId: v.id("_storage"),
  },
  returns: v.object({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    categoriesCount: v.number(),
    itemsCount: v.number(),
    ordersCount: v.number(),
  }),
  handler: async (ctx, args) => {
    // 1. Ensure user selim@zakkig.de
    let user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "selim@zakkig.de"))
      .first();

    let userId = user?._id;
    if (!userId) {
      userId = await ctx.db.insert("users", {
        name: "Selim Eser",
        email: "selim@zakkig.de",
        emailVerificationTime: Date.now(),
      });
    } else {
      await ctx.db.patch(userId, {
        name: "Selim Eser",
        emailVerificationTime: Date.now(),
      });
    }

    // 2. Ensure session token session_demo_owner_session
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
    } else {
      await ctx.db.patch(existingSession._id, {
        code: userId,
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
      });
    }

    // 3. Find or create Organization for selim@zakkig.de
    let org = await ctx.db
      .query("organizations")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", userId!))
      .first();

    let orgId = org?._id;
    const orgData = {
      name: "Napoletana Craft & Gusto",
      legalName: "Napoletana Gastronomie GmbH",
      address: "Musterstraße 42, 10115 Berlin",
      ownerId: userId!,
      logoStorageId: args.logoStorageId,
      bannerStorageId: args.bannerStorageId,
      stripeAccountId: "acct_test_napoletana",
      stripeOnboardingComplete: true,
      isToGoEnabled: true,
      isToStayEnabled: true,
      currency: "EUR",
      taxId: "DE382910482",
      deletionRequested: false,
      tables: ["1", "2", "3", "4", "5", "6", "Terrasse 1", "Terrasse 2"],
    };

    if (!orgId) {
      orgId = await ctx.db.insert("organizations", orgData);
    } else {
      await ctx.db.patch(orgId, orgData);
    }

    // 4. Clean old categories, items, and orders for a clean, consistent state
    const oldCategories = await ctx.db
      .query("menuCategories")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", orgId!))
      .collect();
    for (const c of oldCategories) {
      await ctx.db.delete(c._id);
    }

    const oldItems = await ctx.db
      .query("menuItems")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", orgId!))
      .collect();
    for (const item of oldItems) {
      await ctx.db.delete(item._id);
    }

    const oldOrders = await ctx.db
      .query("orders")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", orgId!))
      .collect();
    for (const o of oldOrders) {
      await ctx.db.delete(o._id);
    }

    // 5. Insert Categories
    const catPizza = await ctx.db.insert("menuCategories", {
      organizationId: orgId!,
      name: "Pizza Napoletana",
      sortOrder: 0,
    });
    const catPasta = await ctx.db.insert("menuCategories", {
      organizationId: orgId!,
      name: "Pasta & Cucina",
      sortOrder: 1,
    });
    const catDolci = await ctx.db.insert("menuCategories", {
      organizationId: orgId!,
      name: "Dolci & Desserts",
      sortOrder: 2,
    });
    const catDrinks = await ctx.db.insert("menuCategories", {
      organizationId: orgId!,
      name: "Bevande & Drinks",
      sortOrder: 3,
    });

    // 6. Insert Menu Items
    // 1. Pizza Margherita
    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catPizza,
      name: "Pizza Margherita",
      description: "San Marzano Tomatensauce, cremiger Fior di Latte Mozzarella, frisches Basilikum und feinstes Olivenöl extra vergine auf knusprigem Leoparden-Teigrand.",
      price: 1150,
      taxRate: 7,
      available: true,
      sortOrder: 0,
      imageStorageId: args.margheritaStorageId,
      customizations: JSON.stringify([
        {
          id: "step_toppings",
          name: "Wunschbeläge",
          required: false,
          minSelect: 0,
          maxSelect: 4,
          options: [
            { id: "opt_bufala", name: "Büffelmozzarella DOP", extraPrice: 250, available: true, sortOrder: 0 },
            { id: "opt_spianata", name: "Scharfe Spianata Calabrese", extraPrice: 200, available: true, sortOrder: 1 },
            { id: "opt_cherry", name: "Frische Kirschtomaten", extraPrice: 150, available: true, sortOrder: 2 },
            { id: "opt_rucola", name: "Frischer Rucola", extraPrice: 100, available: true, sortOrder: 3 },
          ],
        },
        {
          id: "step_crust",
          name: "Kruste",
          required: true,
          minSelect: 1,
          maxSelect: 1,
          options: [
            { id: "opt_classic", name: "Klassisch neapolitanisch", extraPrice: 0, available: true, sortOrder: 0 },
            { id: "opt_ricotta", name: "Mit Ricotta gefüllter Rand", extraPrice: 250, available: true, sortOrder: 1 },
          ],
        },
      ]),
    });

    // 2. Pizza Tartufo & Funghi
    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catPizza,
      name: "Pizza Tartufo & Funghi",
      description: "Edle weiße Pizza mit Trüffelcreme, Fior di Latte, gebratenen Steinpilzen, Pfifferlingen, frischen schwarzen Trüffelhobeln und Thymian.",
      price: 1650,
      taxRate: 7,
      available: true,
      sortOrder: 1,
      imageStorageId: args.tartufoStorageId,
      customizations: JSON.stringify([
        {
          id: "step_truffle",
          name: "Trüffel-Upgrade",
          required: false,
          minSelect: 0,
          maxSelect: 1,
          options: [
            { id: "opt_double_truffle", name: "Extra Portion frischer schwarzer Trüffel", extraPrice: 350, available: true, sortOrder: 0 },
          ],
        },
      ]),
    });

    // 3. Spaghetti alla Carbonara
    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catPasta,
      name: "Spaghetti alla Carbonara",
      description: "Klassisch römisch zubereitet: Cremiges Eigelb, gereifter Pecorino Romano DOP, kross gebratener Guanciale und frisch gemahlener Tellicherry-Pfeffer.",
      price: 1450,
      taxRate: 7,
      available: true,
      sortOrder: 0,
      imageStorageId: args.carbonaraStorageId,
      customizations: JSON.stringify([
        {
          id: "step_portion",
          name: "Portionsgröße",
          required: true,
          minSelect: 1,
          maxSelect: 1,
          options: [
            { id: "opt_norm", name: "Normal (ca. 180g)", extraPrice: 0, available: true, sortOrder: 0 },
            { id: "opt_large", name: "Große Portion (+80g)", extraPrice: 300, available: true, sortOrder: 1 },
          ],
        },
        {
          id: "step_cheese",
          name: "Käse-Auswahl",
          required: true,
          minSelect: 1,
          maxSelect: 1,
          options: [
            { id: "opt_pecorino", name: "Original Pecorino Romano DOP (würzig)", extraPrice: 0, available: true, sortOrder: 0 },
            { id: "opt_grana", name: "Grana Padano (milder)", extraPrice: 0, available: true, sortOrder: 1 },
          ],
        },
      ]),
    });

    // 4. Tiramisù Tradizionale
    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catDolci,
      name: "Tiramisù Tradizionale",
      description: "Hausgemacht nach altem Familienrezept aus Treviso: Löffelbiskuits getränkt in Espresso, lockere Mascarponecreme und edler Valrhona-Kakao.",
      price: 690,
      taxRate: 7,
      available: true,
      sortOrder: 0,
      imageStorageId: args.tiramisuStorageId,
      customizations: "[]",
    });

    // 5. Hausgemachte Blutorangen-Limonade
    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catDrinks,
      name: "Hausgemachte Blutorangen-Limonade",
      description: "Sonnengereifte sizilianische Blutorangen, frischer Rosmarin, prickelndes Quellwasser und Crushed Ice.",
      price: 490,
      taxRate: 19,
      available: true,
      sortOrder: 0,
      imageStorageId: args.limonataStorageId,
      customizations: JSON.stringify([
        {
          id: "step_size",
          name: "Größe",
          required: true,
          minSelect: 1,
          maxSelect: 1,
          options: [
            { id: "opt_small", name: "0,33l Glas", extraPrice: 0, available: true, sortOrder: 0 },
            { id: "opt_large", name: "0,5l Karaffe", extraPrice: 150, available: true, sortOrder: 1 },
          ],
        },
      ]),
    });

    // 7. Insert Balanced Orders (Open & Completed)
    const now = Date.now();

    // Open Order 1: Dine-in (Table 4) - active
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      tableNumber: "4",
      type: "dine-in",
      orderNumber: "042",
      status: "in_progress",
      total: 1640,
      email: "tisch4@gast.de",
      items: JSON.stringify([
        {
          name: "Pizza Margherita",
          price: 1150,
          quantity: 1,
          customizations: [{ step: "Kruste", choice: "Klassisch neapolitanisch" }],
        },
        {
          name: "Hausgemachte Blutorangen-Limonade",
          price: 490,
          quantity: 1,
          customizations: [{ step: "Größe", choice: "0,33l Glas" }],
        },
      ]),
      zakkigFee: 16,
      stripeFee: 0,
      netAmount: 1624,
      currency: "EUR",
    });

    // Open Order 2: Takeaway - active
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      type: "takeaway",
      orderNumber: "043",
      status: "in_progress",
      total: 3790,
      email: "abholung@gast.de",
      items: JSON.stringify([
        {
          name: "Pizza Tartufo & Funghi",
          price: 1650,
          quantity: 1,
          customizations: [],
        },
        {
          name: "Spaghetti alla Carbonara",
          price: 1450,
          quantity: 1,
          customizations: [
            { step: "Portion", choice: "Normal (ca. 180g)" },
            { step: "Käse", choice: "Original Pecorino Romano DOP (würzig)" },
          ],
        },
        {
          name: "Tiramisù Tradizionale",
          price: 690,
          quantity: 1,
          customizations: [],
        },
      ]),
      zakkigFee: 38,
      stripeFee: 0,
      netAmount: 3752,
      currency: "EUR",
    });

    // Completed Order 1 (completed 5 min ago, in 15min auto-archive window)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      tableNumber: "2",
      type: "dine-in",
      orderNumber: "041",
      status: "completed",
      completedAt: now - 5 * 60 * 1000,
      total: 2790,
      email: "gast.tisch2@example.com",
      items: JSON.stringify([
        {
          name: "Pizza Margherita",
          price: 1400,
          quantity: 1,
          customizations: [{ step: "Wunschbeläge", choice: "Büffelmozzarella DOP" }],
        },
        {
          name: "Spaghetti alla Carbonara",
          price: 1450,
          quantity: 1,
          customizations: [],
        },
      ]),
      zakkigFee: 28,
      stripeFee: 0,
      netAmount: 2762,
      currency: "EUR",
    });

    // Completed Order 2 (completed 11 min ago, in 15min auto-archive window)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      type: "takeaway",
      orderNumber: "040",
      status: "completed",
      completedAt: now - 11 * 60 * 1000,
      total: 1150,
      email: "takeaway.gast@example.com",
      items: JSON.stringify([
        {
          name: "Pizza Margherita",
          price: 1150,
          quantity: 1,
          customizations: [],
        },
      ]),
      zakkigFee: 12,
      stripeFee: 0,
      netAmount: 1138,
      currency: "EUR",
    });

    // Completed Order 3 (completed 2 hours ago, in archive)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      tableNumber: "6",
      type: "dine-in",
      orderNumber: "039",
      status: "completed",
      completedAt: now - 2 * 60 * 60 * 1000,
      total: 4280,
      email: "dinner@example.com",
      items: JSON.stringify([
        {
          name: "Pizza Tartufo & Funghi",
          price: 2000,
          quantity: 1,
          customizations: [{ step: "Trüffel-Upgrade", choice: "Extra Portion frischer schwarzer Trüffel" }],
        },
        {
          name: "Spaghetti alla Carbonara",
          price: 1750,
          quantity: 1,
          customizations: [{ step: "Portion", choice: "Große Portion (+80g)" }],
        },
        {
          name: "Hausgemachte Blutorangen-Limonade",
          price: 530,
          quantity: 1,
          customizations: [],
        },
      ]),
      zakkigFee: 43,
      stripeFee: 0,
      netAmount: 4237,
      currency: "EUR",
    });

    // Completed Order 4 (completed yesterday, in archive)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      type: "takeaway",
      orderNumber: "038",
      status: "completed",
      completedAt: now - 24 * 60 * 60 * 1000,
      total: 3290,
      email: "yesterday@example.com",
      items: JSON.stringify([
        {
          name: "Pizza Margherita",
          price: 1150,
          quantity: 2,
          customizations: [],
        },
        {
          name: "Hausgemachte Blutorangen-Limonade",
          price: 490,
          quantity: 2,
          customizations: [],
        },
      ]),
      zakkigFee: 33,
      stripeFee: 0,
      netAmount: 3257,
      currency: "EUR",
    });

    // 8. Ensure Terminal Tokens
    let orderSession = await ctx.db
      .query("orderSessions")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", orgId!))
      .first();
    if (!orderSession) {
      await ctx.db.insert("orderSessions", {
        organizationId: orgId!,
        token: "demo_kitchen_token",
      });
    }

    let availSession = await ctx.db
      .query("availabilitySessions")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", orgId!))
      .first();
    if (!availSession) {
      await ctx.db.insert("availabilitySessions", {
        organizationId: orgId!,
        token: "demo_avail_token",
      });
    }

    return {
      organizationId: orgId!,
      userId: userId!,
      categoriesCount: 4,
      itemsCount: 5,
      ordersCount: 6,
    };
  },
});

