'use server'

import { prisma } from "@/lib/prisma";
import { generateStudentCode } from "@/lib/codeGenerator";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function submitStudent(formData: FormData) {
  // 1. Gather Inputs
  const name = formData.get('name')?.toString();
  const schoolId = formData.get('schoolId')?.toString();
  const partnerId = formData.get('partnerId')?.toString();
  const annualFee = parseFloat(formData.get('annualFee')?.toString() || '0');
  const loanAmount = parseFloat(formData.get('loanAmount')?.toString() || '0');
  const tenure = parseInt(formData.get('tenure')?.toString() || '0', 10);
  const advanceEmi = parseInt(formData.get('advanceEmi')?.toString() || '0', 10);
  
  if (!name || !schoolId || isNaN(annualFee) || isNaN(loanAmount) || isNaN(tenure) || isNaN(advanceEmi)) {
    redirect('/students/onboard?error=Missing+required+fields');
  }
  
  if (loanAmount > annualFee) {
     redirect('/students/onboard?error=Loan+amount+cannot+exceed+annual+fee');
  }

  // 2. Fetch Database Data for Subvention Engine
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { discounts: true }
  });

  const cutoff = await prisma.financeCutoff.findUnique({
    where: { tenure_advanceEmi: { tenure, advanceEmi } }
  });

  if (!school) {
     redirect('/students/onboard?error=School+not+found');
  }

  if (!cutoff) {
     redirect(`/students/onboard?error=No+Finance+Cutoff+defined+for+${tenure}+months+and+${advanceEmi}+Advance+EMIs`);
  }

  const schoolDiscount = school.discounts.find(d => d.tenure === tenure && d.advanceEmi === advanceEmi);

  if (!schoolDiscount) {
     redirect(`/students/onboard?error=Strict+Mode+Failure:+School+has+not+negotiated+a+discount+rate+for+the+${tenure}M/${advanceEmi}A+EMI+configuration.`);
  }

  // 3. Mathematical Profit Engine
  const flexiProfitPercent = schoolDiscount.discountRate - cutoff.subvention;
  const revenueEarned = (flexiProfitPercent / 100) * annualFee;

  // 4. Commission Attribution Engine Priority
  let finalPartnerId = partnerId || school.onboardingPartnerId;
  let commissionPaid = 0;

  if (finalPartnerId) {
    const partner = await prisma.partner.findUnique({ where: { id: finalPartnerId } });
    if (partner) {
      commissionPaid = (partner.revenueShare / 100) * revenueEarned;
    }
  }

  const bankCommission = annualFee * 0.01;

  // 5. Database Commit
  const studentCode = await generateStudentCode(school.code);

  await prisma.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: {
        code: studentCode,
        name,
        schoolId,
        annualFee,
        loanAmount,
        emiTenureMonths: tenure,
        advanceEmi: advanceEmi,
        status: 'Active'
      }
    });

    await tx.transaction.create({
      data: {
        studentId: student.id,
        schoolId: schoolId,
        partnerId: finalPartnerId,
        feeAmount: annualFee,
        discountApplied: schoolDiscount.discountRate,
        revenueEarned,
        commissionPaid,
        bankCommission,
        date: new Date()
      }
    });
  });

  revalidatePath('/students');
  revalidatePath('/');
  redirect('/students');
}
