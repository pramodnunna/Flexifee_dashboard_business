'use server'

import { prisma } from "@/lib/prisma";
import { generatePartnerCode } from "@/lib/codeGenerator";
import { redirect } from "next/navigation";

export async function submitPartner(formData: FormData) {
  const name = formData.get('name')?.toString();
  const type = formData.get('type')?.toString();
  const contactInfo = formData.get('contactInfo')?.toString();
  const revenueShare = parseFloat(formData.get('revenueShare')?.toString() || '0');
  
  if (!name || !type || !contactInfo || isNaN(revenueShare)) return;

  const code = await generatePartnerCode(name);

  await prisma.partner.create({
    data: {
      code,
      name,
      type,
      contactInfo,
      revenueShare
    }
  });

  redirect('/partners');
}
