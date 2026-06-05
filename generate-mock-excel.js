const XLSX = require('xlsx');

// 1. Create a sheet with validation errors
const wbInvalid = XLSX.utils.book_new();
const invalidData = [
  {
    "Student Name": "Bulk Student AutoPartner",
    "School Code": "DPS001",
    "Annual Fee": 150000,
    "Loan Amount": 150000,
    "Tenure": 10,
    "Advance EMI": 1,
    "Partner Code": ""
  },
  {
    "Student Name": "Bulk Student InvalidSchool",
    "School Code": "INVALID_SCH", // Should fail
    "Annual Fee": 100000,
    "Loan Amount": 100000,
    "Tenure": 6,
    "Advance EMI": 1,
    "Partner Code": ""
  }
];
const wsInvalid = XLSX.utils.json_to_sheet(invalidData);
XLSX.utils.book_append_sheet(wbInvalid, wsInvalid, "Sheet1");
XLSX.writeFile(wbInvalid, "test_import_students_invalid.xlsx");

// 2. Create a completely valid sheet
const wbValid = XLSX.utils.book_new();
const validData = [
  {
    "Student Name": "Bulk Student AutoPartner",
    "School Code": "DPS001",
    "Annual Fee": 150000,
    "Loan Amount": 150000,
    "Tenure": 10,
    "Advance EMI": 1,
    "Partner Code": "" // Empty: should automatically attribute to Delhi Public School's onboarding partner (EDU101)
  },
  {
    "Student Name": "Bulk Student OverridePartner",
    "School Code": "DPS001",
    "Annual Fee": 150000,
    "Loan Amount": 150000,
    "Tenure": 12,
    "Advance EMI": 2,
    "Partner Code": "RAH102" // Override: should attribute to Rahul Sharma (RAH102) instead of EDU101
  }
];
const wsValid = XLSX.utils.json_to_sheet(validData);
XLSX.utils.book_append_sheet(wbValid, wsValid, "Sheet1");
XLSX.writeFile(wbValid, "test_import_students_valid.xlsx");

console.log("Mock Excel files created successfully: test_import_students_invalid.xlsx, test_import_students_valid.xlsx");
