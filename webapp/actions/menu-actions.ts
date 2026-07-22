"use server";

import { revalidatePath } from "next/cache";
import {
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItems,
  updateCategorySortOrders,
  updateItemSortOrders,
} from "@/lib/appwrite/database";
import { uploadMenuImage, deleteMenuImage } from "@/lib/appwrite/storage";
import { getUser } from "@/lib/appwrite/server";

export interface MenuActionState {
  error?: string;
  success?: boolean;
}

// ─── Categories ─────────────────────────────────────────────────

export async function createCategoryAction(
  _prevState: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  const organizationId = formData.get("organizationId") as string;
  const name = formData.get("name") as string;
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

  if (!name) return { error: "Name ist erforderlich." };

  try {
    await createMenuCategory({
      organizationId,
      name,
      sortOrder,
      ownerId: user.$id,
    });

    revalidatePath(`/dashboard/${organizationId}/menu`);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Kategorie konnte nicht erstellt werden.";
    return { error: message };
  }
}

export async function updateCategoryAction(
  _prevState: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  const categoryId = formData.get("categoryId") as string;
  const name = formData.get("name") as string;
  const sortOrder = parseInt(formData.get("sortOrder") as string);
  const organizationId = formData.get("organizationId") as string;

  if (!name) return { error: "Name ist erforderlich." };

  try {
    await updateMenuCategory(categoryId, {
      name,
      ...(isNaN(sortOrder) ? {} : { sortOrder }),
    });

    revalidatePath(`/dashboard/${organizationId}/menu`);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Kategorie konnte nicht aktualisiert werden.";
    return { error: message };
  }
}

export async function deleteCategoryAction(
  categoryId: string,
  organizationId: string,
) {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  try {
    // Delete all items in the category first
    const items = await getMenuItems(organizationId);
    const categoryItems = items.filter((i) => i.categoryId === categoryId);
    await Promise.all(
      categoryItems.map(async (item) => {
        if (item.imageId) {
          try {
            await deleteMenuImage(item.imageId);
          } catch {
            /* ignore */
          }
        }
        await deleteMenuItem(item.$id);
      }),
    );

    await deleteMenuCategory(categoryId);
    revalidatePath(`/dashboard/${organizationId}/menu`);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Kategorie konnte nicht gelöscht werden.";
    return { error: message };
  }
}

export async function reorderCategoriesAction(
  organizationId: string,
  orderedIds: string[],
) {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  try {
    const updates = orderedIds.map((id, index) => ({
      id,
      sortOrder: index,
    }));
    await updateCategorySortOrders(updates);
    revalidatePath(`/dashboard/${organizationId}/menu`);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Reihenfolge konnte nicht aktualisiert werden.";
    return { error: message };
  }
}

export async function reorderItemsAction(
  organizationId: string,
  orderedIds: string[],
) {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  try {
    const updates = orderedIds.map((id, index) => ({
      id,
      sortOrder: index,
    }));
    await updateItemSortOrders(updates);
    revalidatePath(`/dashboard/${organizationId}/menu`);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Reihenfolge konnte nicht aktualisiert werden.";
    return { error: message };
  }
}

// ─── Menu Items ─────────────────────────────────────────────────

export async function createMenuItemAction(
  _prevState: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  const organizationId = formData.get("organizationId") as string;
  const categoryId = formData.get("categoryId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = Math.round(parseFloat(formData.get("price") as string) * 100);
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
  const taxRate = parseFloat(formData.get("taxRate") as string) || 19.0;
  const imageFile = formData.get("image") as File | null;
  const customizations = formData.get("customizations") as string || "[]";

  if (!name || isNaN(price)) {
    return { error: "Name und Preis sind erforderlich." };
  }

  try {
    let imageId = "";
    if (imageFile && imageFile.size > 0) {
      imageId = await uploadMenuImage(imageFile, user.$id);
    }

    await createMenuItem({
      organizationId,
      categoryId,
      name,
      description,
      price,
      imageId,
      sortOrder,
      ownerId: user.$id,
      taxRate,
      customizations,
    });

    revalidatePath(`/dashboard/${organizationId}/menu`);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Artikel konnte nicht erstellt werden.";
    return { error: message };
  }
}

export async function updateMenuItemAction(
  _prevState: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  const itemId = formData.get("itemId") as string;
  const organizationId = formData.get("organizationId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = Math.round(parseFloat(formData.get("price") as string) * 100);
  const available = formData.get("available") === "true";
  const taxRate = parseFloat(formData.get("taxRate") as string) || 19.0;
  const imageFile = formData.get("image") as File | null;
  const existingImageId = formData.get("existingImageId") as string;
  const removeExistingImage = formData.get("removeImage") === "true";
  const customizations = formData.get("customizations") as string || "[]";

  if (!name || isNaN(price)) {
    return { error: "Name und Preis sind erforderlich." };
  }

  try {
    let imageId = existingImageId;

    // Handle image removal
    if (removeExistingImage && existingImageId) {
      try {
        await deleteMenuImage(existingImageId);
      } catch {
        /* ignore */
      }
      imageId = "";
    }

    // Handle new image upload
    if (imageFile && imageFile.size > 0) {
      if (existingImageId && !removeExistingImage) {
        try {
          await deleteMenuImage(existingImageId);
        } catch {
          /* ignore */
        }
      }
      imageId = await uploadMenuImage(imageFile, user.$id);
    }

    await updateMenuItem(itemId, {
      name,
      description,
      price,
      available,
      imageId,
      taxRate,
      customizations,
    });

    revalidatePath(`/dashboard/${organizationId}/menu`);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Artikel konnte nicht aktualisiert werden.";
    return { error: message };
  }
}

export async function deleteMenuItemAction(
  itemId: string,
  organizationId: string,
  imageId?: string,
) {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  try {
    if (imageId) {
      try {
        await deleteMenuImage(imageId);
      } catch {
        /* ignore */
      }
    }
    await deleteMenuItem(itemId);
    revalidatePath(`/dashboard/${organizationId}/menu`);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Artikel konnte nicht gelöscht werden.";
    return { error: message };
  }
}

export async function toggleMenuItemAvailability(
  itemId: string,
  available: boolean,
  organizationId: string,
) {
  const user = await getUser();
  if (!user) return { error: "Nicht authentifiziert." };

  try {
    await updateMenuItem(itemId, { available });
    revalidatePath(`/dashboard/${organizationId}/menu`);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Verfügbarkeit konnte nicht geändert werden.";
    return { error: message };
  }
}
