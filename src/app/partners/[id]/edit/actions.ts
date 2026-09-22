'use server'

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function editPartner(id: string, formData: FormData) {
  const name = formData.get('name')?.toString();
  const type = formData.get('type')?.toString();
  const contactInfo = formData.get('contactInfo')?.toString();
  const defaultCommission = parseFloat(formData.get('defaultCommission')?.toString() || '1.0');
  
  if (!name || !type || !contactInfo || isNaN(defaultCommission)) return;

  await prisma.partner.update({
    where: { id },
    data: {
      name,
      type,
      contactInfo,
      defaultCommission
    }
  });

  revalidatePath('/partners');
  redirect('/partners');
}
