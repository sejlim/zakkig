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
    logoStorageId: v.optional(v.id("_storage")),
    bannerStorageId: v.optional(v.id("_storage")),
    bbqStorageId: v.optional(v.id("_storage")),
    cheeseStorageId: v.optional(v.id("_storage")),
    beefStorageId: v.optional(v.id("_storage")),
    chickenStorageId: v.optional(v.id("_storage")),
    hawaiiStorageId: v.optional(v.id("_storage")),
    bologneseStorageId: v.optional(v.id("_storage")),
    wunschStorageId: v.optional(v.id("_storage")),
    garlicBreadStorageId: v.optional(v.id("_storage")),
    mozzarellaSticksStorageId: v.optional(v.id("_storage")),
    onionRingsStorageId: v.optional(v.id("_storage")),
    potatoesStorageId: v.optional(v.id("_storage")),
    lasagneStorageId: v.optional(v.id("_storage")),
    macCheeseStorageId: v.optional(v.id("_storage")),
    cookieDoughStorageId: v.optional(v.id("_storage")),
    cherryPieStorageId: v.optional(v.id("_storage")),
    benJerrysStorageId: v.optional(v.id("_storage")),
    pepsiStorageId: v.optional(v.id("_storage")),
    pepsiZeroStorageId: v.optional(v.id("_storage")),
    mirindaStorageId: v.optional(v.id("_storage")),
    sevenUpStorageId: v.optional(v.id("_storage")),
    waterStorageId: v.optional(v.id("_storage")),
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

    // Ensure authAccount with password (TobiIstCool12.)
    const existingAccount = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", userId!).eq("provider", "password")
      )
      .first();

    const passwordHash =
      "b214787761be4824a10ee92a39d0ab1a:d7635764984256caba819516041e2bf4160fe346a6e353401fbbb647954a4f7a804f3936cea239db07a20041ee80d3660ac841fadd9fc88d43e0679f590500f7";

    if (!existingAccount) {
      await ctx.db.insert("authAccounts", {
        userId: userId!,
        provider: "password",
        providerAccountId: "selim@zakkig.de",
        secret: passwordHash,
      });
    } else {
      await ctx.db.patch(existingAccount._id, {
        secret: passwordHash,
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

    const logoStorageId = args.logoStorageId ?? org?.logoStorageId;
    const bannerStorageId = args.bannerStorageId ?? org?.bannerStorageId;

    const orgData = {
      name: "Pizza Hut",
      legalName: "Pizza Hut Deutschland Gastronomie GmbH",
      address: "Kurfürstendamm 212, 10719 Berlin",
      ownerId: userId!,
      logoStorageId,
      bannerStorageId,
      stripeAccountId: "acct_test_pizzahut",
      stripeOnboardingComplete: true,
      isToGoEnabled: true,
      isToStayEnabled: true,
      currency: "EUR",
      taxId: "DE382910482",
      deletionRequested: false,
      tables: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    };

    if (!orgId) {
      orgId = await ctx.db.insert("organizations", orgData);
    } else {
      await ctx.db.patch(orgId, orgData);
    }

    // 4. Clean old categories, items, and orders for a clean state
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
      name: "Pan Pizza & Cheezy Crust",
      sortOrder: 0,
    });
    const catStarters = await ctx.db.insert("menuCategories", {
      organizationId: orgId!,
      name: "Vorspeisen & Fingerfood",
      sortOrder: 1,
    });
    const catPasta = await ctx.db.insert("menuCategories", {
      organizationId: orgId!,
      name: "Pasta & Bakes",
      sortOrder: 2,
    });
    const catDesserts = await ctx.db.insert("menuCategories", {
      organizationId: orgId!,
      name: "Desserts",
      sortOrder: 3,
    });
    const catDrinks = await ctx.db.insert("menuCategories", {
      organizationId: orgId!,
      name: "Getränke",
      sortOrder: 4,
    });

    // 6. Customization Templates
    const pizzaCustomizations = JSON.stringify([
      {
        id: "step_crust",
        name: "Kruste & Teigart",
        required: true,
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: "opt_pan", name: "Pan Pizza (fluffig & kross)", extraPrice: 0, available: true, sortOrder: 0 },
          { id: "opt_cheezy", name: "Cheezy Crust (mit Käse gefüllter Rand)", extraPrice: 350, available: true, sortOrder: 1 },
          { id: "opt_thin", name: "Classic Thin (dünn & knusprig)", extraPrice: 0, available: true, sortOrder: 2 },
        ],
      },
      {
        id: "step_size",
        name: "Größe",
        required: true,
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: "opt_reg", name: "Regular (ca. 23cm)", extraPrice: 0, available: true, sortOrder: 0 },
          { id: "opt_large", name: "Large (ca. 33cm)", extraPrice: 450, available: true, sortOrder: 1 },
        ],
      },
      {
        id: "step_toppings",
        name: "Zusätzliche Beläge & Dips",
        required: false,
        minSelect: 0,
        maxSelect: 5,
        options: [
          { id: "opt_mozz", name: "Extra Mozzarella", extraPrice: 150, available: true, sortOrder: 0 },
          { id: "opt_beef", name: "Rinderhack", extraPrice: 180, available: true, sortOrder: 1 },
          { id: "opt_bacon", name: "Rauchiger Bacon", extraPrice: 180, available: true, sortOrder: 2 },
          { id: "opt_jalapenos", name: "Scharfe Jalapeños", extraPrice: 100, available: true, sortOrder: 3 },
          { id: "opt_mushrooms", name: "Frische Champignons", extraPrice: 120, available: true, sortOrder: 4 },
          { id: "opt_garlic_dip", name: "Knoblauchsauce-Dip", extraPrice: 120, available: true, sortOrder: 5 },
        ],
      },
    ]);

    const drinkCustomizations = JSON.stringify([
      {
        id: "step_size",
        name: "Größe",
        required: true,
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: "opt_small", name: "0,33l Glas", extraPrice: 0, available: true, sortOrder: 0 },
          { id: "opt_large", name: "0,5l Flasche", extraPrice: 100, available: true, sortOrder: 1 },
        ],
      },
    ]);

    const waterCustomizations = JSON.stringify([
      {
        id: "step_type",
        name: "Kohlensäure",
        required: true,
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: "opt_still", name: "Still (ohne Kohlensäure)", extraPrice: 0, available: true, sortOrder: 0 },
          { id: "opt_sparkling", name: "Prickelnd (mit Kohlensäure)", extraPrice: 0, available: true, sortOrder: 1 },
        ],
      },
      {
        id: "step_size",
        name: "Größe",
        required: true,
        minSelect: 1,
        maxSelect: 1,
        options: [
          { id: "opt_small", name: "0,25l Glas", extraPrice: 0, available: true, sortOrder: 0 },
          { id: "opt_large", name: "0,75l Flasche", extraPrice: 310, available: true, sortOrder: 1 },
        ],
      },
    ]);

    // 7. Insert Menu Items
    // Category 1: Pan Pizza & Cheezy Crust
    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catPizza,
      name: "Pizza Barbecue Lover's",
      description: "Zart marinierte Hähnchenbruststreifen, rauchiger Bacon, rote Zwiebeln und würzige Barbecue-Sauce auf knusprigem Pfannenteig.",
      price: 1390,
      taxRate: 7,
      available: true,
      sortOrder: 0,
      imageStorageId: args.bbqStorageId,
      customizations: pizzaCustomizations,
    });

    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catPizza,
      name: "Pizza Cheezy Cheese Lover's",
      description: "Reichhaltiger Mix aus sonnengereifter Tomatensauce, cremigem Mozzarella, herzhaftem Cheddar und feinstem Grana Padano.",
      price: 1290,
      taxRate: 7,
      available: true,
      sortOrder: 1,
      imageStorageId: args.cheeseStorageId,
      customizations: pizzaCustomizations,
    });

    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catPizza,
      name: "Pizza Beef Supreme",
      description: "100% gewürztes Rinderhackfleisch, frische Champignons, rote Zwiebeln, grüne Paprika und Mozzarella.",
      price: 1450,
      taxRate: 7,
      available: true,
      sortOrder: 2,
      imageStorageId: args.beefStorageId,
      customizations: pizzaCustomizations,
    });

    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catPizza,
      name: "Pizza Chicken Supreme",
      description: "Zarte Hähnchenbrust, frische braune Champignons, knackige rote Zwiebeln und Mozzarella auf fruchtiger Tomatensauce.",
      price: 1420,
      taxRate: 7,
      available: true,
      sortOrder: 3,
      imageStorageId: args.chickenStorageId,
      customizations: pizzaCustomizations,
    });

    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catPizza,
      name: "Pizza Hawaii",
      description: "Der beliebte Pizza Hut Klassiker mit saftigem Hinterschinken, fruchtig-süßen Ananasstücken und geschmolzenem Mozzarella.",
      price: 1250,
      taxRate: 7,
      available: true,
      sortOrder: 4,
      imageStorageId: args.hawaiiStorageId,
      customizations: pizzaCustomizations,
    });

    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catPizza,
      name: "Pizza Bolognese",
      description: "Traditionell geschmortes Rinderhack-Ragout mit aromatischen Kräutern, roten Zwiebeln und Mozzarella.",
      price: 1350,
      taxRate: 7,
      available: true,
      sortOrder: 5,
      imageStorageId: args.bologneseStorageId,
      customizations: pizzaCustomizations,
    });

    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catPizza,
      name: "Wunschpizza",
      description: "Kreiere deine eigene Pizza Hut Legende mit deinem Lieblingsteig, Kruste und frischen Wunsch-Toppings.",
      price: 1190,
      taxRate: 7,
      available: true,
      sortOrder: 6,
      imageStorageId: args.wunschStorageId ?? args.bbqStorageId,
      customizations: pizzaCustomizations,
    });

    // Category 2: Vorspeisen & Fingerfood
    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catStarters,
      name: "Garlic Bread Mozzarella",
      description: "Knusprig gebackenes Baguette mit würziger Knoblauchbutter und mit goldgelbem Mozzarella überbacken (4 Stück).",
      price: 490,
      taxRate: 7,
      available: true,
      sortOrder: 0,
      imageStorageId: args.garlicBreadStorageId,
      customizations: "[]",
    });

    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catStarters,
      name: "Mozzarella Sticks (6 Stück)",
      description: "Knusprig panierte Käsestangen mit flüssigem Mozzarellakern, serviert mit fruchtigem Tomaten-Dip.",
      price: 650,
      taxRate: 7,
      available: true,
      sortOrder: 1,
      imageStorageId: args.mozzarellaSticksStorageId,
      customizations: "[]",
    });

    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catStarters,
      name: "Crispy Onion Rings (8 Stück)",
      description: "Goldgelb im Bierteig gebackene Zwiebelringe, außen herrlich kross, serviert mit Barbecue-Dip.",
      price: 550,
      taxRate: 7,
      available: true,
      sortOrder: 2,
      imageStorageId: args.onionRingsStorageId,
      customizations: "[]",
    });

    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catStarters,
      name: "Country Potatoes",
      description: "Würzige Kartoffelecken, außen knusprig frittiert und innen zart, serviert mit kühler Sour Cream.",
      price: 490,
      taxRate: 7,
      available: true,
      sortOrder: 3,
      imageStorageId: args.potatoesStorageId,
      customizations: "[]",
    });

    // Category 3: Pasta & Bakes
    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catPasta,
      name: "Lasagne Bolognese",
      description: "Klassisch geschichtete Teigblätter mit herzhafter Rinderhack-Bolognese und samtiger Béchamelsauce, im Ofen goldbraun überbacken.",
      price: 1190,
      taxRate: 7,
      available: true,
      sortOrder: 0,
      imageStorageId: args.lasagneStorageId,
      customizations: "[]",
    });

    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catPasta,
      name: "Macaroni & Cheese",
      description: "Amerikanischer Pasta-Klassiker: Zarte Makkaroni in einer reichhaltigen Käsesauce mit Cheddar gratiniert.",
      price: 990,
      taxRate: 7,
      available: true,
      sortOrder: 1,
      imageStorageId: args.macCheeseStorageId,
      customizations: "[]",
    });

    // Category 4: Desserts
    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catDesserts,
      name: "Warm Cookie Dough Double Chocolate",
      description: "Ofenfrisch gebackener Schokoladenteig mit schmelzendem Kern und Schokostückchen, heiß serviert.",
      price: 590,
      taxRate: 7,
      available: true,
      sortOrder: 0,
      imageStorageId: args.cookieDoughStorageId,
      customizations: "[]",
    });

    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catDesserts,
      name: "American Cherry Pie",
      description: "Klassischer amerikanischer Kirschkuchen mit feiner Mürbeteigkruste und fruchtiger Sauerkirschfüllung.",
      price: 520,
      taxRate: 7,
      available: true,
      sortOrder: 1,
      imageStorageId: args.cherryPieStorageId,
      customizations: "[]",
    });

    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catDesserts,
      name: "Ben & Jerry's Cookie Dough (465ml)",
      description: "Legendäre Vanille-Eiscreme mit Riesenstücken aus Plätzchenteig und schokoladigen Bits.",
      price: 790,
      taxRate: 7,
      available: true,
      sortOrder: 2,
      imageStorageId: args.benJerrysStorageId,
      customizations: "[]",
    });

    // Category 5: Getränke
    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catDrinks,
      name: "Pepsi",
      description: "Der legendäre Cola-Geschmack, eiskalt serviert.",
      price: 320,
      taxRate: 19,
      available: true,
      sortOrder: 0,
      imageStorageId: args.pepsiStorageId,
      customizations: drinkCustomizations,
    });

    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catDrinks,
      name: "Pepsi Zero Zucker",
      description: "Voller Geschmack ohne Zucker, eiskalt erfrischend.",
      price: 320,
      taxRate: 19,
      available: true,
      sortOrder: 1,
      imageStorageId: args.pepsiZeroStorageId,
      customizations: drinkCustomizations,
    });

    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catDrinks,
      name: "Mirinda Orange",
      description: "Fruchtig-prickelnde Orangenlimonade mit intensivem Geschmack.",
      price: 320,
      taxRate: 19,
      available: true,
      sortOrder: 2,
      imageStorageId: args.mirindaStorageId,
      customizations: drinkCustomizations,
    });

    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catDrinks,
      name: "7Up Lemon-Lime",
      description: "Erfrischender Geschmack aus Zitronen und Limetten.",
      price: 320,
      taxRate: 19,
      available: true,
      sortOrder: 3,
      imageStorageId: args.sevenUpStorageId,
      customizations: drinkCustomizations,
    });

    await ctx.db.insert("menuItems", {
      organizationId: orgId!,
      categoryId: catDrinks,
      name: "Mineralwasser",
      description: "Klares Erfrischungsquellwasser, wahlweise still oder mit feiner Kohlensäure.",
      price: 280,
      taxRate: 19,
      available: true,
      sortOrder: 4,
      imageStorageId: args.waterStorageId,
      customizations: waterCustomizations,
    });

    // 8. Insert Balanced Orders (Active Kitchen Board, Recent Completed & Archive)
    const now = Date.now();

    // Active Order 1: Dine-in Table 3 (1 min ago)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      tableNumber: "3",
      type: "dine-in",
      orderNumber: "051",
      status: "in_progress",
      createdAt: now - 1 * 60 * 1000,
      total: 2730,
      email: "tisch3@gast.de",
      items: JSON.stringify([
        {
          name: "Pizza Barbecue Lover's",
          price: 2310,
          quantity: 1,
          customizations: [
            { stepName: "Kruste & Teigart", optionName: "Cheezy Crust (mit Käse gefüllter Rand)", choice: "Cheezy Crust (mit Käse gefüllter Rand)", extraPrice: 350 },
            { stepName: "Größe", optionName: "Large (ca. 33cm)", choice: "Large (ca. 33cm)", extraPrice: 450 },
            { stepName: "Zusätzliche Beläge & Dips", optionName: "Knoblauchsauce-Dip", choice: "Knoblauchsauce-Dip", extraPrice: 120 },
          ],
        },
        {
          name: "Pepsi Zero Zucker",
          price: 420,
          quantity: 1,
          customizations: [
            { stepName: "Größe", optionName: "0,5l Flasche", choice: "0,5l Flasche", extraPrice: 100 },
          ],
        },
      ]),
      zakkigFee: 27,
      stripeFee: 0,
      netAmount: 2703,
      currency: "EUR",
    });

    // Active Order 2: Takeaway (3 min ago)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      type: "takeaway",
      orderNumber: "052",
      status: "in_progress",
      createdAt: now - 3 * 60 * 1000,
      total: 2690,
      email: "abholer@gast.de",
      items: JSON.stringify([
        {
          name: "Pizza Beef Supreme",
          price: 1450,
          quantity: 1,
          customizations: [
            { stepName: "Kruste & Teigart", optionName: "Pan Pizza (fluffig & kross)", choice: "Pan Pizza (fluffig & kross)", extraPrice: 0 },
            { stepName: "Größe", optionName: "Regular (ca. 23cm)", choice: "Regular (ca. 23cm)", extraPrice: 0 },
          ],
        },
        {
          name: "Mozzarella Sticks (6 Stück)",
          price: 650,
          quantity: 1,
          customizations: [],
        },
        {
          name: "Warm Cookie Dough Double Chocolate",
          price: 590,
          quantity: 1,
          customizations: [],
        },
      ]),
      zakkigFee: 27,
      stripeFee: 0,
      netAmount: 2663,
      currency: "EUR",
    });

    // Active Order 3: Dine-in Table 7 (6 min ago)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      tableNumber: "7",
      type: "dine-in",
      orderNumber: "053",
      status: "in_progress",
      createdAt: now - 6 * 60 * 1000,
      total: 2560,
      email: "tisch7@gast.de",
      items: JSON.stringify([
        {
          name: "Wunschpizza",
          price: 2240,
          quantity: 1,
          customizations: [
            { stepName: "Kruste & Teigart", optionName: "Cheezy Crust (mit Käse gefüllter Rand)", choice: "Cheezy Crust (mit Käse gefüllter Rand)", extraPrice: 350 },
            { stepName: "Größe", optionName: "Large (ca. 33cm)", choice: "Large (ca. 33cm)", extraPrice: 450 },
            { stepName: "Zusätzliche Beläge & Dips", optionName: "Scharfe Jalapeños", choice: "Scharfe Jalapeños", extraPrice: 100 },
            { stepName: "Zusätzliche Beläge & Dips", optionName: "Extra Mozzarella", choice: "Extra Mozzarella", extraPrice: 150 },
          ],
        },
        {
          name: "7Up Lemon-Lime",
          price: 320,
          quantity: 1,
          customizations: [
            { stepName: "Größe", optionName: "0,33l Glas", choice: "0,33l Glas", extraPrice: 0 },
          ],
        },
      ]),
      zakkigFee: 26,
      stripeFee: 0,
      netAmount: 2534,
      currency: "EUR",
    });

    // Active Order 4: Takeaway (8 min ago)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      type: "takeaway",
      orderNumber: "054",
      status: "in_progress",
      createdAt: now - 8 * 60 * 1000,
      total: 2990,
      email: "familie.schmidt@gast.de",
      items: JSON.stringify([
        {
          name: "Pizza Hawaii",
          price: 1250,
          quantity: 2,
          customizations: [
            { stepName: "Kruste & Teigart", optionName: "Pan Pizza (fluffig & kross)", choice: "Pan Pizza (fluffig & kross)", extraPrice: 0 },
            { stepName: "Größe", optionName: "Regular (ca. 23cm)", choice: "Regular (ca. 23cm)", extraPrice: 0 },
          ],
        },
        {
          name: "Country Potatoes",
          price: 490,
          quantity: 1,
          customizations: [],
        },
      ]),
      zakkigFee: 30,
      stripeFee: 0,
      netAmount: 2960,
      currency: "EUR",
    });

    // Completed Order 1: Table 1 (dine-in, completed 7 min ago)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      tableNumber: "1",
      type: "dine-in",
      orderNumber: "050",
      status: "completed",
      createdAt: now - 18 * 60 * 1000,
      completedAt: now - 7 * 60 * 1000,
      total: 1680,
      email: "gast.tisch1@example.com",
      items: JSON.stringify([
        {
          name: "Lasagne Bolognese",
          price: 1190,
          quantity: 1,
          customizations: [],
        },
        {
          name: "Garlic Bread Mozzarella",
          price: 490,
          quantity: 1,
          customizations: [],
        },
      ]),
      zakkigFee: 17,
      stripeFee: 0,
      netAmount: 1663,
      currency: "EUR",
    });

    // Completed Order 2: Takeaway (completed 16 min ago)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      type: "takeaway",
      orderNumber: "049",
      status: "completed",
      createdAt: now - 28 * 60 * 1000,
      completedAt: now - 16 * 60 * 1000,
      total: 1710,
      email: "takeaway.pizza@example.com",
      items: JSON.stringify([
        {
          name: "Pizza Cheezy Cheese Lover's",
          price: 1290,
          quantity: 1,
          customizations: [
            { stepName: "Kruste & Teigart", optionName: "Pan Pizza (fluffig & kross)", choice: "Pan Pizza (fluffig & kross)", extraPrice: 0 },
            { stepName: "Größe", optionName: "Regular (ca. 23cm)", choice: "Regular (ca. 23cm)", extraPrice: 0 },
          ],
        },
        {
          name: "Pepsi",
          price: 420,
          quantity: 1,
          customizations: [
            { stepName: "Größe", optionName: "0,5l Flasche", choice: "0,5l Flasche", extraPrice: 100 },
          ],
        },
      ]),
      zakkigFee: 17,
      stripeFee: 0,
      netAmount: 1693,
      currency: "EUR",
    });

    // Archive Order 1: Table 5 (dine-in, completed 2 hours ago)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      tableNumber: "5",
      type: "dine-in",
      orderNumber: "048",
      status: "completed",
      createdAt: now - 2 * 60 * 60 * 1000 - 25 * 60 * 1000,
      completedAt: now - 2 * 60 * 60 * 1000,
      total: 5770,
      email: "group.tisch5@example.com",
      items: JSON.stringify([
        {
          name: "Pizza Barbecue Lover's",
          price: 2190,
          quantity: 2,
          customizations: [
            { stepName: "Kruste & Teigart", optionName: "Cheezy Crust (mit Käse gefüllter Rand)", choice: "Cheezy Crust (mit Käse gefüllter Rand)", extraPrice: 350 },
            { stepName: "Größe", optionName: "Large (ca. 33cm)", choice: "Large (ca. 33cm)", extraPrice: 450 },
          ],
        },
        {
          name: "Crispy Onion Rings (8 Stück)",
          price: 550,
          quantity: 1,
          customizations: [],
        },
        {
          name: "Pepsi",
          price: 420,
          quantity: 2,
          customizations: [
            { stepName: "Größe", optionName: "0,5l Flasche", choice: "0,5l Flasche", extraPrice: 100 },
          ],
        },
      ]),
      zakkigFee: 58,
      stripeFee: 0,
      netAmount: 5712,
      currency: "EUR",
    });

    // Archive Order 2: Takeaway (completed 4 hours ago)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      type: "takeaway",
      orderNumber: "047",
      status: "completed",
      createdAt: now - 4 * 60 * 60 * 1000 - 20 * 60 * 1000,
      completedAt: now - 4 * 60 * 60 * 1000,
      total: 2210,
      email: "abendessen@example.com",
      items: JSON.stringify([
        {
          name: "Pizza Chicken Supreme",
          price: 1420,
          quantity: 1,
          customizations: [
            { stepName: "Kruste & Teigart", optionName: "Pan Pizza (fluffig & kross)", choice: "Pan Pizza (fluffig & kross)", extraPrice: 0 },
            { stepName: "Größe", optionName: "Regular (ca. 23cm)", choice: "Regular (ca. 23cm)", extraPrice: 0 },
          ],
        },
        {
          name: "Ben & Jerry's Cookie Dough (465ml)",
          price: 790,
          quantity: 1,
          customizations: [],
        },
      ]),
      zakkigFee: 22,
      stripeFee: 0,
      netAmount: 2188,
      currency: "EUR",
    });

    // Archive Order 3: Table 2 (dine-in, completed 7 hours ago)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      tableNumber: "2",
      type: "dine-in",
      orderNumber: "046",
      status: "completed",
      createdAt: now - 7 * 60 * 60 * 1000 - 15 * 60 * 1000,
      completedAt: now - 7 * 60 * 60 * 1000,
      total: 1480,
      email: "lunch.tisch2@example.com",
      items: JSON.stringify([
        {
          name: "Macaroni & Cheese",
          price: 990,
          quantity: 1,
          customizations: [],
        },
        {
          name: "Garlic Bread Mozzarella",
          price: 490,
          quantity: 1,
          customizations: [],
        },
      ]),
      zakkigFee: 15,
      stripeFee: 0,
      netAmount: 1465,
      currency: "EUR",
    });

    // Archive Order 4: Table 8 (dine-in, completed 1 day ago)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      tableNumber: "8",
      type: "dine-in",
      orderNumber: "045",
      status: "completed",
      createdAt: now - 25 * 60 * 60 * 1000,
      completedAt: now - 24 * 60 * 60 * 1000 - 30 * 60 * 1000,
      total: 4830,
      email: "feier.tisch8@example.com",
      items: JSON.stringify([
        {
          name: "Pizza Cheezy Cheese Lover's",
          price: 1290,
          quantity: 3,
          customizations: [
            { stepName: "Kruste & Teigart", optionName: "Pan Pizza (fluffig & kross)", choice: "Pan Pizza (fluffig & kross)", extraPrice: 0 },
            { stepName: "Größe", optionName: "Regular (ca. 23cm)", choice: "Regular (ca. 23cm)", extraPrice: 0 },
          ],
        },
        {
          name: "Pepsi Zero Zucker",
          price: 320,
          quantity: 3,
          customizations: [
            { stepName: "Größe", optionName: "0,33l Glas", choice: "0,33l Glas", extraPrice: 0 },
          ],
        },
      ]),
      zakkigFee: 48,
      stripeFee: 0,
      netAmount: 4782,
      currency: "EUR",
    });

    // Archive Order 5: Takeaway (completed 1 day ago)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      type: "takeaway",
      orderNumber: "044",
      status: "completed",
      createdAt: now - 27 * 60 * 60 * 1000,
      completedAt: now - 26 * 60 * 60 * 1000,
      total: 2990,
      email: "takeaway.yesterday@example.com",
      items: JSON.stringify([
        {
          name: "Pizza Hawaii",
          price: 1250,
          quantity: 2,
          customizations: [],
        },
        {
          name: "Country Potatoes",
          price: 490,
          quantity: 1,
          customizations: [],
        },
      ]),
      zakkigFee: 30,
      stripeFee: 0,
      netAmount: 2960,
      currency: "EUR",
    });

    // Archive Order 6: Table 10 (dine-in, completed 2 days ago)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      tableNumber: "10",
      type: "dine-in",
      orderNumber: "043",
      status: "completed",
      createdAt: now - 49 * 60 * 60 * 1000,
      completedAt: now - 48 * 60 * 60 * 1000,
      total: 4030,
      email: "dinein.tisch10@example.com",
      items: JSON.stringify([
        {
          name: "Pizza Beef Supreme",
          price: 2250,
          quantity: 1,
          customizations: [
            { stepName: "Kruste & Teigart", optionName: "Cheezy Crust (mit Käse gefüllter Rand)", choice: "Cheezy Crust (mit Käse gefüllter Rand)", extraPrice: 350 },
            { stepName: "Größe", optionName: "Large (ca. 33cm)", choice: "Large (ca. 33cm)", extraPrice: 450 },
          ],
        },
        {
          name: "Lasagne Bolognese",
          price: 1190,
          quantity: 1,
          customizations: [],
        },
        {
          name: "Mineralwasser",
          price: 590,
          quantity: 1,
          customizations: [
            { stepName: "Kohlensäure", optionName: "Prickelnd (mit Kohlensäure)", choice: "Prickelnd (mit Kohlensäure)", extraPrice: 0 },
            { stepName: "Größe", optionName: "0,75l Flasche", choice: "0,75l Flasche", extraPrice: 310 },
          ],
        },
      ]),
      zakkigFee: 40,
      stripeFee: 0,
      netAmount: 3990,
      currency: "EUR",
    });

    // Archive Order 7: Takeaway (completed 3 days ago)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      type: "takeaway",
      orderNumber: "042",
      status: "completed",
      createdAt: now - 73 * 60 * 60 * 1000,
      completedAt: now - 72 * 60 * 60 * 1000,
      total: 3930,
      email: "takeaway.3days@example.com",
      items: JSON.stringify([
        {
          name: "Wunschpizza",
          price: 1640,
          quantity: 2,
          customizations: [
            { stepName: "Kruste & Teigart", optionName: "Pan Pizza (fluffig & kross)", choice: "Pan Pizza (fluffig & kross)", extraPrice: 0 },
            { stepName: "Größe", optionName: "Large (ca. 33cm)", choice: "Large (ca. 33cm)", extraPrice: 450 },
          ],
        },
        {
          name: "Mozzarella Sticks (6 Stück)",
          price: 650,
          quantity: 1,
          customizations: [],
        },
      ]),
      zakkigFee: 39,
      stripeFee: 0,
      netAmount: 3891,
      currency: "EUR",
    });

    // Archive Order 8: Table 12 (dine-in, completed 4 days ago)
    await ctx.db.insert("orders", {
      organizationId: orgId!,
      tableNumber: "12",
      type: "dine-in",
      orderNumber: "041",
      status: "completed",
      createdAt: now - 97 * 60 * 60 * 1000,
      completedAt: now - 96 * 60 * 60 * 1000,
      total: 2230,
      email: "dinner.tisch12@example.com",
      items: JSON.stringify([
        {
          name: "Pizza Barbecue Lover's",
          price: 1390,
          quantity: 1,
          customizations: [
            { stepName: "Kruste & Teigart", optionName: "Pan Pizza (fluffig & kross)", choice: "Pan Pizza (fluffig & kross)", extraPrice: 0 },
            { stepName: "Größe", optionName: "Regular (ca. 23cm)", choice: "Regular (ca. 23cm)", extraPrice: 0 },
          ],
        },
        {
          name: "American Cherry Pie",
          price: 520,
          quantity: 1,
          customizations: [],
        },
        {
          name: "Pepsi",
          price: 320,
          quantity: 1,
          customizations: [
            { stepName: "Größe", optionName: "0,33l Glas", choice: "0,33l Glas", extraPrice: 0 },
          ],
        },
      ]),
      zakkigFee: 22,
      stripeFee: 0,
      netAmount: 2208,
      currency: "EUR",
    });

    // 9. Ensure Terminal Tokens
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
      categoriesCount: 5,
      itemsCount: 21,
      ordersCount: 14,
    };
  },
});

