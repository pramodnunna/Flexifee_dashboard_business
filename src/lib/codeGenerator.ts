import { prisma } from './prisma';

/**
 * Generates a unique school code from the school name.
 * Format: Initials of each word + 3-digit number.
 * Example: "Delhi Public School" → "DPS001"
 */
export async function generateSchoolCode(name: string): Promise<string> {
  const initials = name.split(/\s+/).map(w => w[0]?.toUpperCase() || '').join('');
  const prefix = initials || 'SCH';

  // Find the highest existing number for this prefix
  const existing = await prisma.school.findMany({
    where: { code: { startsWith: prefix } },
    select: { code: true },
    orderBy: { code: 'desc' }
  });

  let nextNum = 1;
  if (existing.length > 0) {
    const lastCode = existing[0].code;
    const numPart = parseInt(lastCode.replace(prefix, ''), 10);
    if (!isNaN(numPart)) nextNum = numPart + 1;
  }

  return prefix + String(nextNum).padStart(3, '0');
}

/**
 * Generates a unique partner code from the partner name.
 * Format: First 3 letters (uppercase) + 3-digit number.
 * Example: "Rahul Sharma" → "RAH001"
 */
export async function generatePartnerCode(name: string): Promise<string> {
  const prefix = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();

  const existing = await prisma.partner.findMany({
    where: { code: { startsWith: prefix } },
    select: { code: true },
    orderBy: { code: 'desc' }
  });

  let nextNum = 1;
  if (existing.length > 0) {
    const lastCode = existing[0].code;
    const numPart = parseInt(lastCode.replace(prefix, ''), 10);
    if (!isNaN(numPart)) nextNum = numPart + 1;
  }

  return prefix + String(nextNum).padStart(3, '0');
}

/**
 * Generates a unique student code based on the school code.
 * Format: SchoolCode + 5-digit sequential number.
 * Supports 99,999 unique students per school.
 * Example: "DPS001" → "DPS00100001"
 */
export async function generateStudentCode(schoolCode: string): Promise<string> {
  const existing = await prisma.student.count({
    where: { code: { startsWith: schoolCode } }
  });

  const seq = String(existing + 1).padStart(5, '0');
  return schoolCode + seq;
}
