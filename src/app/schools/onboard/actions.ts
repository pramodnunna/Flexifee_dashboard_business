'use server'

import { prisma } from "@/lib/prisma";
import { generateSchoolCode } from "@/lib/codeGenerator";
import { redirect } from "next/navigation";

export async function submitSchool(formData: FormData) {
  const name = formData.get('name')?.toString();
  const location = formData.get('location')?.toString();
  const partnerId = formData.get('partnerId')?.toString();
  
  if (!name || !location) return;

  // Parse the dynamic discount rates (format: "discount_{tenure}_{advEmi}")
  const discountsToCreate: { tenure: number; advanceEmi: number; discountRate: number }[] = [];
  
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('discount_') && value) {
      const parts = key.split('_');
      const tenure = parseInt(parts[1], 10);
      const advanceEmi = parseInt(parts[2], 10);
      const rate = parseFloat(value.toString());
      
      if (!isNaN(tenure) && !isNaN(advanceEmi) && !isNaN(rate)) {
        discountsToCreate.push({ tenure, advanceEmi, discountRate: rate });
      }
    }
  }

  const code = await generateSchoolCode(name);

  await prisma.school.create({
    data: {
      code,
      name,
      location,
      onboardingPartnerId: partnerId || null,
      agreementStarts: new Date(),
      status: 'Active',
      discounts: discountsToCreate.length > 0 ? { create: discountsToCreate } : undefined
    }
  });

  redirect('/schools');
}
