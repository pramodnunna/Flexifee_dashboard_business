'use server'

import { prisma } from "@/lib/prisma";
import * as XLSX from 'xlsx';
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ImportResult = {
  success: boolean;
  errors?: string[];
  count?: number;
};

export async function importStudents(prevState: any, formData: FormData): Promise<ImportResult> {
  const file = formData.get('file') as File;
  if (!file || file.size === 0) {
    return { success: false, errors: ["Please select a valid Excel or CSV file to upload."] };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse the file using xlsx
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet) as any[];

    if (rawRows.length === 0) {
      return { success: false, errors: ["The uploaded file is empty."] };
    }

    const errors: string[] = [];
    const validatedRows: any[] = [];
    const schoolCounters = new Map<string, number>();

    // Step 1: Validate all rows first (All-or-Nothing validation)
    for (let idx = 0; idx < rawRows.length; idx++) {
      const row = rawRows[idx];
      const rowNum = idx + 2; // Row 1 is header

      // Normalize row keys to handle case-insensitivity and spaces
      const normalizedRow: Record<string, any> = {};
      for (const [key, value] of Object.entries(row)) {
        const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        normalizedRow[normKey] = value;
      }

      const name = normalizedRow['studentname'] || normalizedRow['name'];
      const schoolCode = normalizedRow['schoolcode'] || normalizedRow['school'];
      const annualFeeRaw = normalizedRow['annualfee'] || normalizedRow['fee'] || normalizedRow['annualfeesetup'];
      const loanAmountRaw = normalizedRow['loanamount'] || normalizedRow['loan'] || normalizedRow['approvedloanamount'];
      const tenureRaw = normalizedRow['tenure'] || normalizedRow['tenuremonths'] || normalizedRow['emitenuremonths'];
      const advanceEmiRaw = normalizedRow['advanceemi'] || normalizedRow['advemi'] || normalizedRow['advanceemispaidupfront'];
      const partnerCode = normalizedRow['partnercode'] || normalizedRow['sourcepartnercode'] || normalizedRow['partner'];

      // Basic validations
      if (!name) {
        errors.push(`Row ${rowNum}: Student Name is missing.`);
        continue;
      }
      if (!schoolCode) {
        errors.push(`Row ${rowNum}: School Code is missing.`);
        continue;
      }

      const annualFee = parseFloat(String(annualFeeRaw || '0'));
      const loanAmount = parseFloat(String(loanAmountRaw || '0'));
      const tenure = parseInt(String(tenureRaw || '0'), 10);
      const advanceEmi = parseInt(String(advanceEmiRaw || '0'), 10);

      if (isNaN(annualFee) || annualFee <= 0) {
        errors.push(`Row ${rowNum}: Annual Fee must be a positive number.`);
        continue;
      }
      if (isNaN(loanAmount) || loanAmount <= 0) {
        errors.push(`Row ${rowNum}: Loan Amount must be a positive number.`);
        continue;
      }
      if (loanAmount > annualFee) {
        errors.push(`Row ${rowNum}: Loan Amount (${loanAmount}) cannot exceed Annual Fee (${annualFee}).`);
        continue;
      }
      if (![6, 8, 10, 12].includes(tenure)) {
        errors.push(`Row ${rowNum}: Tenure must be 6, 8, 10, or 12 months.`);
        continue;
      }
      if (![1, 2].includes(advanceEmi)) {
        errors.push(`Row ${rowNum}: Advance EMI must be 1 or 2.`);
        continue;
      }

      // Database-backed validations
      const school = await prisma.school.findUnique({
        where: { code: String(schoolCode).trim() },
        include: { discounts: true }
      });

      if (!school) {
        errors.push(`Row ${rowNum}: School with code "${schoolCode}" not found.`);
        continue;
      }
      if (school.status !== 'Active') {
        errors.push(`Row ${rowNum}: School "${school.name}" is deboarded/inactive.`);
        continue;
      }

      const schoolDiscount = school.discounts.find(d => d.tenure === tenure && d.advanceEmi === advanceEmi);
      if (!schoolDiscount) {
        errors.push(`Row ${rowNum}: School "${school.name}" has no negotiated discount rate for ${tenure}M / ${advanceEmi} Adv EMI.`);
        continue;
      }

      const cutoff = await prisma.financeCutoff.findUnique({
        where: { tenure_advanceEmi: { tenure, advanceEmi } }
      });
      if (!cutoff) {
        errors.push(`Row ${rowNum}: No finance cutoff found for ${tenure}M / ${advanceEmi} Adv EMI.`);
        continue;
      }

      // Check Partner Code lookup or automatic attribution
      let finalPartnerId: string | null = null;
      let partner: any = null;

      if (partnerCode) {
        partner = await prisma.partner.findUnique({
          where: { code: String(partnerCode).trim() }
        });
        if (!partner) {
          errors.push(`Row ${rowNum}: Partner with code "${partnerCode}" not found.`);
          continue;
        }
        if (partner.status !== 'Active') {
          errors.push(`Row ${rowNum}: Partner "${partner.name}" is deboarded/inactive.`);
          continue;
        }
        finalPartnerId = partner.id;
      } else {
        // AUTOMATIC ATTRIBUTION: Default to school onboarding partner if it exists
        if (school.onboardingPartnerId) {
          partner = await prisma.partner.findUnique({
            where: { id: school.onboardingPartnerId }
          });
          if (partner && partner.status === 'Active') {
            finalPartnerId = partner.id;
          }
        }
      }

      // Math subvention engine
      const flexiProfitPercent = schoolDiscount.discountRate - cutoff.subvention;
      const revenueEarned = (flexiProfitPercent / 100) * annualFee;
      const bankCommission = annualFee * 0.01;
      
      let commissionPaid = 0;
      if (partner) {
        if (partner.shareBankCommission) {
          commissionPaid = (partner.revenueShare / 100) * (revenueEarned + bankCommission);
        } else {
          commissionPaid = (partner.revenueShare / 100) * revenueEarned;
        }
      }

      // Generate unique code inside the loop safely
      let currentSeq = schoolCounters.get(school.code);
      if (currentSeq === undefined) {
        const existingCount = await prisma.student.count({
          where: { code: { startsWith: school.code } }
        });
        currentSeq = existingCount;
      }
      currentSeq++;
      schoolCounters.set(school.code, currentSeq);
      const studentCode = school.code + String(currentSeq).padStart(5, '0');

      validatedRows.push({
        studentData: {
          code: studentCode,
          name,
          schoolId: school.id,
          annualFee,
          loanAmount,
          emiTenureMonths: tenure,
          advanceEmi,
          status: 'Active'
        },
        transactionData: {
          schoolId: school.id,
          partnerId: finalPartnerId,
          feeAmount: annualFee,
          discountApplied: schoolDiscount.discountRate,
          revenueEarned,
          commissionPaid,
          bankCommission,
          date: new Date()
        }
      });
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Step 2: Write all validated entries to the database inside a transaction
    await prisma.$transaction(async (tx) => {
      for (const row of validatedRows) {
        const student = await tx.student.create({
          data: row.studentData
        });
        await tx.transaction.create({
          data: {
            ...row.transactionData,
            studentId: student.id
          }
        });
      }
    });

  } catch (error: any) {
    return { success: false, errors: [`Failed to parse file: ${error.message}`] };
  }

  revalidatePath('/students');
  revalidatePath('/');
  redirect('/students');
}
