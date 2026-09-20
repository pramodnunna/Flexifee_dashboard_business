'use server';

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateSchool(formData: FormData) {
  const schoolId = formData.get('schoolId')?.toString();
  const name = formData.get('name')?.toString();
  const location = formData.get('location')?.toString();
  const partnerId = formData.get('partnerId')?.toString();
  const status = formData.get('status')?.toString() || 'Active';

  if (!schoolId || !name || !location) return;

  // Extract discount entries from form data
  const discountsToUpsert: { tenure: number; advanceEmi: number; discountRate: number }[] = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith('discount_') && value !== '') {
      const parts = key.split('_');
      const tenure = parseInt(parts[1], 10);
      const advanceEmi = parseInt(parts[2], 10);
      const rate = parseFloat(value.toString());

      if (!isNaN(tenure) && !isNaN(advanceEmi) && !isNaN(rate)) {
        discountsToUpsert.push({ tenure, advanceEmi, discountRate: rate });
      }
    }
  }

  // Update school basic info
  await prisma.school.update({
    where: { id: schoolId },
    data: {
      name,
      location,
      status,
      onboardingPartnerId: partnerId || null,
    },
  });

  // Re-sync discounts: remove existing discounts and recreate updated set
  await prisma.schoolDiscount.deleteMany({
    where: { schoolId },
  });

  if (discountsToUpsert.length > 0) {
    await prisma.schoolDiscount.createMany({
      data: discountsToUpsert.map(d => ({
        schoolId,
        tenure: d.tenure,
        advanceEmi: d.advanceEmi,
        discountRate: d.discountRate,
      })),
    });
  }

  revalidatePath('/schools');
  revalidatePath(`/schools/${schoolId}/edit`);
  revalidatePath('/students/onboard');
  redirect('/schools');
}
