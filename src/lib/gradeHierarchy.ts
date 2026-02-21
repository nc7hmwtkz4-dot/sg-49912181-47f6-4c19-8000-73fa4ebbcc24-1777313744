import type { SheldonGrade } from "@/types/coin";

// Complete Sheldon Scale hierarchy with numeric values for sorting
export const GRADE_HIERARCHY: Record<SheldonGrade, number> = {
  // Poor/Good grades (1-10)
  "P-1": 1,
  "FR-2": 2,
  "AG-3": 3,
  "G-4": 4,
  "G-6": 5,
  "VG-8": 8,
  "VG-10": 10,
  
  // Fine grades (12-19)
  "F-12": 12,
  "F-15": 15,
  
  // Very Fine grades (20-35)
  "VF-20": 20,
  "VF-25": 25,
  "VF-30": 30,
  "VF-35": 35,
  
  // Extra Fine grades (40-49)
  "XF-40": 40,
  "EF-40": 40, // Alias for XF-40
  "XF-45": 45,
  "EF-45": 45, // Alias for XF-45
  
  // About Uncirculated grades (50-59)
  "AU-50": 50,
  "AU-53": 53,
  "AU-55": 55,
  "AU-58": 58,
  
  // Mint State grades (60-70)
  "MS-60": 60,
  "MS-61": 61,
  "MS-62": 62,
  "MS-63": 63,
  "MS-64": 64,
  "MS-65": 65,
  "MS-66": 66,
  "MS-67": 67,
  "MS-68": 68,
  "MS-69": 69,
  "MS-70": 70,
  
  // Proof grades (60-70)
  "PF-60": 60,
  "PF-61": 61,
  "PF-62": 62,
  "PF-63": 63,
  "PF-64": 64,
  "PF-65": 65,
  "PF-66": 66,
  "PF-67": 67,
  "PF-68": 68,
  "PF-69": 69,
  "PF-70": 70,
  
  // Legacy/Simple grades
  "B": 3,  // Base/About Good
  "G": 4,  // Good
  "VG": 8, // Very Good
  "F": 12, // Fine
  "VF": 20, // Very Fine
  "XF": 40, // Extra Fine
  "EF": 40, // Extra Fine (alias)
  "AU": 50, // About Uncirculated
  "MS": 60, // Mint State
  "PF": 60, // Proof
};

// Helper to compare grades
export function compareGrades(gradeA: SheldonGrade, gradeB: SheldonGrade): number {
  const valueA = GRADE_HIERARCHY[gradeA] || 0;
  const valueB = GRADE_HIERARCHY[gradeB] || 0;
  return valueA - valueB;
}

// Helper to get grade display name
export function getGradeDisplayName(grade: SheldonGrade): string {
  return grade;
}

// Group grades by category
export const GRADE_CATEGORIES = {
  "Poor to Good": ["P-1", "FR-2", "AG-3", "G-4", "G-6", "B", "G"],
  "Very Good": ["VG-8", "VG-10", "VG"],
  "Fine": ["F-12", "F-15", "F"],
  "Very Fine": ["VF-20", "VF-25", "VF-30", "VF-35", "VF"],
  "Extra Fine": ["XF-40", "EF-40", "XF-45", "EF-45", "XF", "EF"],
  "About Uncirculated": ["AU-50", "AU-53", "AU-55", "AU-58", "AU"],
  "Mint State": ["MS-60", "MS-61", "MS-62", "MS-63", "MS-64", "MS-65", "MS-66", "MS-67", "MS-68", "MS-69", "MS-70", "MS"],
  "Proof": ["PF-60", "PF-61", "PF-62", "PF-63", "PF-64", "PF-65", "PF-66", "PF-67", "PF-68", "PF-69", "PF-70", "PF"],
} as const;