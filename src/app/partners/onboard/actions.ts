'use server'

import { prisma } from "@/lib/prisma";
import { generatePartnerCode } from "@/lib/codeGenerator";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function submitPartner(formData: FormData) {
  const name = formData.get('name')?.toString();
  const type = formData.get('type')?.toString();
  const contactInfo = formData.get('contactInfo')?.toString();
  const defaultCommission = parseFloat(formData.get('defaultCommission')?.toString() || '1.0');
  
  if (!name || !type || !contactInfo || isNaN(defaultCommission)) return;

  const code = await generatePartnerCode(name);

  await prisma.partner.create({
    data: {
      code,
      name,
      type,
      contactInfo,
      defaultCommission,
      status: 'Active'
    }
  });

  revalidatePath('/partners');
  redirect('/partners');
}
