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
  getMenuItem,
  updateCategorySortOrders,
  updateItemSortOrders,
} from "@/lib/convex/database";
import { uploadFileToConvex } from "@/lib/convex/storage";
import { getUser, requireOwner, requireStaffOrOwner } from "@/lib/convex/auth";
import type { CustomizationStep, MenuItem } from "@/lib/types";

export interface MenuActionState {
  error?: string;
  success?: boolean;
  categoryId?: string;
}

// Categories

export async function createCategoryAction(
  _prevState: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const organizationId = formData.get("organizationId") as string;
  const name = formData.get("name") as string;
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

  if (!organizationId) return { error: "Betriebs-ID fehlt." };
  if (!name) return { error: "Name ist erforderlich." };
  if (name.length > 100) return { error: "Der Kategoriename darf maximal 100 Zeichen lang sein." };

  try {
    const { user } = await requireOwner(organizationId);

    const newDoc = await createMenuCategory({
      organizationId,
      name,
      sortOrder,
      ownerId: user.$id || user._id,
    });

    revalidatePath(`/dashboard/${organizationId}/menu`);
    return { success: true, categoryId: newDoc.$id };
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
  const categoryId = formData.get("categoryId") as string;
  const name = formData.get("name") as string;
  const sortOrder = parseInt(formData.get("sortOrder") as string);
  const organizationId = formData.get("organizationId") as string;

  if (!organizationId) return { error: "Betriebs-ID fehlt." };
  if (!name) return { error: "Name ist erforderlich." };
  if (name.length > 100) return { error: "Der Kategoriename darf maximal 100 Zeichen lang sein." };

  try {
    await requireOwner(organizationId);

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
  try {
    await requireOwner(organizationId);

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
  try {
    await requireOwner(organizationId);

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
  itemsPayload: (
    string | { id: string; sortOrder: number; categoryId?: string }
  )[],
) {
  try {
    await requireOwner(organizationId);

    const updates = itemsPayload.map((item, index) => {
      if (typeof item === "string") {
        return { id: item, sortOrder: index };
      }
      return item;
    });
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

// Menu Items

export async function createMenuItemAction(
  _prevState: MenuActionState,
  formData: FormData,
): Promise<MenuActionState> {
  const organizationId = formData.get("organizationId") as string;
  const categoryId = formData.get("categoryId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = Math.round(parseFloat(formData.get("price") as string) * 100);
  const taxRate = parseFloat(formData.get("taxRate") as string) || 19.0;
  const rawSortOrder = formData.get("sortOrder") as string;
  let sortOrder = parseInt(rawSortOrder);
  if (isNaN(sortOrder)) {
    const existingItems = await getMenuItems(organizationId);
    const categoryItems = existingItems.filter(
      (i) => i.categoryId === categoryId,
    );
    const maxSortOrder = categoryItems.reduce(
      (max, i) =>
        typeof i.sortOrder === "number" && i.sortOrder > max
          ? i.sortOrder
          : max,
      -1,
    );
    sortOrder = maxSortOrder + 1;
  }
  const imageFile = formData.get("image") as File | null;
  const customizations = (formData.get("customizations") as string) || "[]";

  if (!organizationId) return { error: "Betriebs-ID fehlt." };
  if (!name || isNaN(price)) {
    return { error: "Name und Preis sind erforderlich." };
  }
  if (name.length > 100) {
    return { error: "Der Artikelname darf maximal 100 Zeichen lang sein." };
  }
  if (description && description.length > 500) {
    return { error: "Die Beschreibung darf maximal 500 Zeichen lang sein." };
  }
  if (price < 0 || price > 10000000) {
    return { error: "Der Preis ist ungültig." };
  }

  try {
    const { user } = await requireOwner(organizationId);

    let imageStorageId: string | undefined = undefined;
    if (imageFile && imageFile.size > 0) {
      imageStorageId = await uploadFileToConvex(imageFile);
    }

    await createMenuItem({
      organizationId,
      categoryId,
      name,
      description,
      price,
      imageStorageId,
      imageId: imageStorageId,
      sortOrder,
      ownerId: user.$id || user._id,
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
  const customizations = (formData.get("customizations") as string) || "[]";

  if (!organizationId) return { error: "Betriebs-ID fehlt." };
  if (!name || isNaN(price)) {
    return { error: "Name und Preis sind erforderlich." };
  }
  if (name.length > 100) {
    return { error: "Der Artikelname darf maximal 100 Zeichen lang sein." };
  }
  if (description && description.length > 500) {
    return { error: "Die Beschreibung darf maximal 500 Zeichen lang sein." };
  }
  if (price < 0 || price > 10000000) {
    return { error: "Der Preis ist ungültig." };
  }

  try {
    await requireOwner(organizationId);

    let imageStorageId: string | undefined = existingImageId || undefined;

    if (removeExistingImage) {
      imageStorageId = undefined;
    } else if (imageFile && imageFile.size > 0) {
      imageStorageId = await uploadFileToConvex(imageFile);
    }

    await updateMenuItem(itemId, {
      name,
      description,
      price,
      available,
      imageStorageId,
      imageId: imageStorageId,
      clearImage: removeExistingImage,
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
  _imageId?: string,
) {
  try {
    await requireOwner(organizationId);

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
  organizationId?: string,
) {
  try {
    const item = await getMenuItem(itemId);
    if (!item) return { error: "Artikel nicht gefunden." };
    const orgId = organizationId || item.organizationId;

    await requireStaffOrOwner(orgId);

    const updates: Partial<MenuItem> = { available };

    if (item.customizations) {
      try {
        const steps: CustomizationStep[] = JSON.parse(item.customizations);
        if (Array.isArray(steps)) {
          const cascadedSteps = steps.map((step) => ({
            ...step,
            available,
            options: (step.options || []).map((opt) => ({
              ...opt,
              available,
            })),
          }));
          updates.customizations = JSON.stringify(cascadedSteps);
        }
      } catch {
        // ignore parse error
      }
    }

    await updateMenuItem(itemId, updates);
    if (orgId) {
      revalidatePath(`/dashboard/${orgId}/menu`);
      revalidatePath(`/availability/${orgId}`);
    }
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Verfügbarkeit konnte nicht geändert werden.";
    return { error: message };
  }
}

export async function toggleCustomizationAvailabilityAction(
  itemId: string,
  stepId: string,
  optionId: string | null,
  available: boolean,
  organizationId?: string,
) {
  try {
    const item = await getMenuItem(itemId);
    if (!item) return { error: "Artikel nicht gefunden." };
    const orgId = organizationId || item.organizationId;

    await requireStaffOrOwner(orgId);

    let steps: CustomizationStep[] = [];
    try {
      if (item.customizations) {
        steps = JSON.parse(item.customizations);
      }
    } catch {
      steps = [];
    }

    const updatedSteps = steps.map((step) => {
      const currentStepId = step.id || (step as any).$id;
      if (currentStepId !== stepId) return step;
      if (!optionId) {
        const updatedOptions = (step.options || []).map((opt) => ({
          ...opt,
          available,
        }));
        return { ...step, available, options: updatedOptions };
      } else {
        if (step.available === false && available === true) return step;
        const updatedOptions = (step.options || []).map((opt) => {
          const currentOptId = opt.id || (opt as any).$id;
          return currentOptId === optionId ? { ...opt, available } : opt;
        });
        return { ...step, options: updatedOptions };
      }
    });

    await updateMenuItem(itemId, {
      customizations: JSON.stringify(updatedSteps),
    });
    if (orgId) {
      revalidatePath(`/dashboard/${orgId}/menu`);
      revalidatePath(`/availability/${orgId}`);
    }
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Customization Verfügbarkeit konnte nicht geändert werden.";
    return { error: message };
  }
}
