'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deboardPartner(formData: FormData) {
  const id = formData.get('id')?.toString();
  if (!id) return;

  await prisma.partner.update({
    where: { id },
    data: { status: 'Inactive' }
  });

  revalidatePath('/partners');
}

export async function deboardSchool(formData: FormData) {
  const id = formData.get('id')?.toString();
  if (!id) return;

  await prisma.school.update({
    where: { id },
    data: { status: 'Inactive' }
  });

  revalidatePath('/schools');
}

export async function deboardStudent(formData: FormData) {
  const id = formData.get('id')?.toString();
  if (!id) return;

  await prisma.student.update({
    where: { id },
    data: { status: 'Inactive' }
  });

  revalidatePath('/students');
}

export async function activatePartner(formData: FormData) {
  const id = formData.get('id')?.toString();
  if (!id) return;

  await prisma.partner.update({
    where: { id },
    data: { status: 'Active' }
  });

  revalidatePath('/partners');
}
