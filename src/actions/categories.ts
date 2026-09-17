"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { writeAudit } from "@/lib/business";
import { ok, fail, handleActionError } from "@/lib/actions";

export async function createCategoryAction(prevState: any, formData: FormData) {
  try {
    const session = await requireAuth();
    if (!session.businessId) return fail("No business");
    const name = String(formData.get("name")).trim();
    if (!name) return fail("Category name required");
    const existing = await prisma.category.findFirst({ where: { businessId: session.businessId, name } });
    if (existing) return fail("Category already exists");
    const category = await prisma.category.create({
      data: {
        businessId: session.businessId,
        name,
        description: String(formData.get("description") ?? "") || null,
      },
    });
    await writeAudit(session.businessId, session, "Category created", "Category", category.id, `${name} added.`);
    return ok(category);
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    const session = await requireAuth();
    if (!session.businessId) return fail("No business");
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat || cat.businessId !== session.businessId) return fail("Category not found");
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return fail("Cannot delete a category that has products. Reassign products first.");
    }
    await prisma.category.delete({ where: { id } });
    await writeAudit(session.businessId, session, "Category deleted", "Category", id, `${cat.name} removed.`);
    return ok({ id });
  } catch (e) {
    return handleActionError(e);
  }
}