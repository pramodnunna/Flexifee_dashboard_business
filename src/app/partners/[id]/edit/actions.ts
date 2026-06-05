'use server'

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function editPartner(id: string, formData: FormData) {
  const name = formData.get('name')?.toString();
  const type = formData.get('type')?.toString();
  const contactInfo = formData.get('contactInfo')?.toString();
  const revenueShare = parseFloat(formData.get('revenueShare')?.toString() || '0');
  const shareBankCommission = formData.get('shareBankCommission') === 'on';
  
  if (!name || !type || !contactInfo || isNaN(revenueShare)) return;

  await prisma.partner.update({
    where: { id },
    data: {
      name,
      type,
      contactInfo,
      revenueShare,
      shareBankCommission
    }
  });

  revalidatePath('/partners');
  redirect('/partners');
}
