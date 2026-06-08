import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing transaction ledger, student rosters, school discounts, schools, and partners...')
  
  await prisma.transaction.deleteMany()
  console.log('✓ Cleared Transaction Ledger.')
  
  await prisma.user.deleteMany()
  console.log('✓ Cleared Users.')
  
  await prisma.student.deleteMany()
  console.log('✓ Cleared Student Roster.')
  
  await prisma.schoolDiscount.deleteMany()
  console.log('✓ Cleared School Custom Discounts.')
  
  await prisma.partner.deleteMany()
  console.log('✓ Cleared Partner Directory.')
  
  await prisma.school.deleteMany()
  console.log('✓ Cleared School Directory.')
  
  // Make sure we keep/restore the baseline FinanceCutoff matrix
  console.log('Re-seeding baseline FinanceCutoff matrix...')
  await prisma.financeCutoff.deleteMany()
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
  console.log('✓ Restored 5 baseline Finance Cutoff rules.')
  
  console.log('✓ Restored 5 baseline Finance Cutoff rules.')
  
  console.log('Seeding default Admin user...')
  const passwordHash = await bcrypt.hash('Flexifee@2026', 10)
  await prisma.user.create({
    data: {
      email: 'Admin@flexifee.in',
      name: 'Super Admin',
      role: 'admin',
      passwordHash
    }
  })
  console.log('✓ Seeded default Admin account.')
  
  console.log('Seeding default Ops user...')
  const opsPasswordHash = await bcrypt.hash('ops123', 10)
  await prisma.user.create({
    data: {
      email: 'ops@flexifee.in',
      name: 'Operations Officer',
      role: 'ops',
      passwordHash: opsPasswordHash
    }
  })
  console.log('✓ Seeded default Ops account.')
  
  console.log('\nDatabase cleaned successfully! Ready for real onboarding data.')
}

main()
  .catch((e) => {
    console.error('❌ Failed to clean database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
