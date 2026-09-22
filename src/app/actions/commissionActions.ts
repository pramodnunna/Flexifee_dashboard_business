'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateCommissionStatus(transactionId: string, status: string) {
  if (!transactionId || !['Pending', 'Payable', 'Paid'].includes(status)) {
    throw new Error('Invalid transaction ID or status value');
  }

  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId }
  });

  if (!tx) {
    throw new Error('Transaction not found');
  }

  const commissionPaid = status === 'Paid' ? (tx.commissionAmount || tx.commissionPaid) : (status === 'Pending' ? 0 : tx.commissionPaid);

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      commissionStatus: status,
      commissionPaid
    }
  });

  revalidatePath('/transactions');
  revalidatePath('/partner-dashboard');
  revalidatePath('/partners');
  revalidatePath('/');
}
