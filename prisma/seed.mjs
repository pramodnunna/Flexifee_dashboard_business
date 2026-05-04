import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Code generation utilities
function generateSchoolCode(name) {
  // Take initials of each word: "Delhi Public School" → "DPS"
  const initials = name.split(/\s+/).map(w => w[0].toUpperCase()).join('')
  const num = String(Math.floor(Math.random() * 900) + 100) // 100-999
  return initials + num
}

function generatePartnerCode(name) {
  // First 3 letters uppercased + 3-digit number
  const prefix = name.replace(/\s+/g, '').substring(0, 3).toUpperCase()
  const num = String(Math.floor(Math.random() * 900) + 100)
  return prefix + num
}

async function generateStudentCode(schoolCode) {
  // SchoolCode + 5-digit sequential number (supports 99999 per school)
  const count = await prisma.student.count({
    where: { code: { startsWith: schoolCode } }
  })
  const seq = String(count + 1).padStart(5, '0')
  return schoolCode + seq
}

async function main() {
  console.log('Clearing old data...')
  await prisma.transaction.deleteMany()
  await prisma.student.deleteMany()
  await prisma.schoolDiscount.deleteMany()
  await prisma.financeCutoff.deleteMany()
  await prisma.partner.deleteMany()
  await prisma.school.deleteMany()

  console.log('Seeding Finance Cutoffs...')
  const cutoffs = [
    { tenure: 6, advanceEmi: 1, subvention: 4.5, pf: 0 },
    { tenure: 8, advanceEmi: 1, subvention: 6.0, pf: 0 },
    { tenure: 10, advanceEmi: 1, subvention: 7.5, pf: 0 },
    { tenure: 10, advanceEmi: 2, subvention: 6.0, pf: 0 },
    { tenure: 12, advanceEmi: 2, subvention: 7.5, pf: 0 },
  ]
  for (const c of cutoffs) {
    await prisma.financeCutoff.create({ data: c })
  }

  console.log('Seeding Schools & Discounts...')
  const school1Code = 'DPS001'
  const school1 = await prisma.school.create({
    data: {
      code: school1Code,
      name: 'Delhi Public School',
      location: 'Delhi',
      totalStudentsCap: 5000,
      agreementStarts: new Date('2024-01-01'),
      status: 'Active',
      discounts: {
        create: [
          { tenure: 10, advanceEmi: 1, discountRate: 10.0 },
          { tenure: 12, advanceEmi: 2, discountRate: 10.0 },
        ]
      }
    }
  })

  const school2Code = 'RI002'
  const school2 = await prisma.school.create({
    data: {
      code: school2Code,
      name: 'Ryan International',
      location: 'Mumbai',
      totalStudentsCap: 3000,
      agreementStarts: new Date('2024-02-15'),
      status: 'Active',
      discounts: {
        create: [
          { tenure: 6, advanceEmi: 1, discountRate: 7.0 },
          { tenure: 10, advanceEmi: 2, discountRate: 9.0 },
        ]
      }
    }
  })

  console.log('Seeding Partners...')
  const partner1 = await prisma.partner.create({
    data: {
      code: 'EDU101',
      name: 'EduConsult Pvt Ltd',
      type: 'Organization',
      contactInfo: 'contact@educonsult.com',
      revenueShare: 50.0,
    }
  })

  const partner2 = await prisma.partner.create({
    data: {
      code: 'RAH102',
      name: 'Rahul Sharma',
      type: 'Individual',
      contactInfo: 'rahul.s@example.com',
      revenueShare: 30.0,
    }
  })

  // Link DPS to EduConsult
  await prisma.school.update({
    where: { id: school1.id },
    data: { onboardingPartnerId: partner1.id }
  })

  console.log('Seeding Students & Transactions...')
  const students = [
    { name: 'Aarav Kumar', schoolId: school1.id, schoolCode: school1Code, annualFee: 150000, loanAmount: 100000, tenure: 10, advanceEmi: 1, partnerId: partner1.id },
    { name: 'Vivaan Patel', schoolId: school1.id, schoolCode: school1Code, annualFee: 150000, loanAmount: 150000, tenure: 12, advanceEmi: 2, partnerId: partner1.id },
    { name: 'Aditya Singh', schoolId: school2.id, schoolCode: school2Code, annualFee: 200000, loanAmount: 100000, tenure: 6, advanceEmi: 1, partnerId: partner2.id },
    { name: 'Vihaan Gupta', schoolId: school2.id, schoolCode: school2Code, annualFee: 200000, loanAmount: 200000, tenure: 10, advanceEmi: 2, partnerId: null },
  ]

  for (const s of students) {
    const studentCode = await generateStudentCode(s.schoolCode)
    const student = await prisma.student.create({
      data: {
        code: studentCode,
        name: s.name,
        schoolId: s.schoolId,
        annualFee: s.annualFee,
        loanAmount: s.loanAmount,
        emiTenureMonths: s.tenure,
        advanceEmi: s.advanceEmi,
        status: 'Active',
      }
    })

    // Subvention engine
    const cutoff = cutoffs.find(c => c.tenure === s.tenure && c.advanceEmi === s.advanceEmi)?.subvention || 0
    
    const s1Discounts = [{ tenure: 10, advanceEmi: 1, discountRate: 10.0 }, { tenure: 12, advanceEmi: 2, discountRate: 10.0 }]
    const s2Discounts = [{ tenure: 6, advanceEmi: 1, discountRate: 7.0 }, { tenure: 10, advanceEmi: 2, discountRate: 9.0 }]
    const allDiscounts = s.schoolId === school1.id ? s1Discounts : s2Discounts
    
    const schoolDiscountRate = allDiscounts.find(d => d.tenure === s.tenure && d.advanceEmi === s.advanceEmi)?.discountRate || 0

    const flexiProfitPercent = schoolDiscountRate - cutoff
    const revenueEarned = (flexiProfitPercent / 100) * s.annualFee

    // Partner share (Agent priority -> School Onboarder fallback)
    let commissionPaid = 0
    let finalPartnerId = s.partnerId

    if (!finalPartnerId && s.schoolId === school1.id) {
      finalPartnerId = partner1.id
    }

    if (finalPartnerId) {
      const partnerRevShare = finalPartnerId === partner1.id ? 50.0 : 30.0
      commissionPaid = (partnerRevShare / 100) * revenueEarned
    }

    await prisma.transaction.create({
      data: {
        studentId: student.id,
        schoolId: s.schoolId,
        partnerId: finalPartnerId,
        feeAmount: s.annualFee,
        discountApplied: schoolDiscountRate,
        revenueEarned,
        commissionPaid,
        date: new Date(),
      }
    })
  }

  console.log('Seeding Complete!')
  console.log('School Codes: DPS001, RI002')
  console.log('Partner Codes: EDU101, RAH102')
  console.log('Student Codes: DPS00100001-2, RI00200001-2')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
