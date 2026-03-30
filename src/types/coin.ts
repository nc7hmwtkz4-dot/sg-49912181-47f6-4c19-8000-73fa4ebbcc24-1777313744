export interface Coin {
  id: string;
  sku: string;
  coinName: string; // e.g., "5 Francs - Léopold II petit..."
  countryCode: string;
  kmNumber: string;
  year: number;
  mintmark: string;
  metal: "gold" | "silver" | "copper" | "platinum" | "palladium" | "other";
  purity: number;
  weight: number;
  sheldonGrade: SheldonGrade;
  purchasePrice: number; // CHF
  purchaseDate: string;
  notes?: string;
  obverseImageUrl?: string;
  reverseImageUrl?: string;
  isSold: boolean;
  saleId?: string;
  listingId?: string;
}

export interface Buyer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  postcode?: string;
  city?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  coinId: string;
  sku: string;
  coinName: string;
  saleDate: string;
  salePrice: number;
  purchasePrice: number;
  profit: number;
  markupPercentage?: number;
  buyerInfo: string;
  notes: string;
  buyerId?: string;
  buyer?: Buyer;
}

export const SHELDON_GRADES = [
  // Poor/Good grades
  "P-1", "FR-2", "AG-3", "G-4", "G-6", "VG-8", "VG-10",
  // Fine grades
  "F-12", "F-15",
  // Very Fine grades
  "VF-20", "VF-25", "VF-30", "VF-35",
  // Extra Fine grades
  "XF-40", "EF-40", "XF-45", "EF-45",
  // About Uncirculated grades
  "AU-50", "AU-53", "AU-55", "AU-58",
  // Mint State grades
  "MS-60", "MS-61", "MS-62", "MS-63", "MS-64", "MS-65", "MS-66", "MS-67", "MS-68", "MS-69", "MS-70",
  // Proof grades
  "PF-60", "PF-61", "PF-62", "PF-63", "PF-64", "PF-65", "PF-66", "PF-67", "PF-68", "PF-69", "PF-70",
  // Legacy/Simple grades
  "B", "G", "VG", "F", "VF", "XF", "EF", "AU", "MS", "PF"
] as const;

export type SheldonGrade = typeof SHELDON_GRADES[number];

export interface CollectionStats {
  totalCoins: number;
  totalValue: number; // CHF - current market value
  totalPurchaseValue: number; // CHF
  totalSalesAmount: number; // CHF
  totalProfit: number; // CHF
  profitMargin: number; // percentage
  bullionValue: number; // CHF - total bullion value based on spot prices
  coinsByCountry: Record<string, number>;
  coinsByMetal: Record<string, number>;
}

export const COUNTRY_CODES: { [key: string]: string } = {
  "us": "United States",
  "FR": "France",
  "US": "United States",
  "GB": "Great Britain",
  "DE": "Germany",
  "IT": "Italy",
  "ES": "Spain",
  "CH": "Switzerland",
  "CA": "Canada",
  "AU": "Australia",
  "CN": "China",
  "JP": "Japan",
  "KR": "South Korea",
  "MX": "Mexico",
  "BR": "Brazil",
  "AR": "Argentina",
  "RU": "Russia",
  "IN": "India",
  "ZA": "South Africa",
  "AT": "Austria",
  "BE": "Belgium",
  "NL": "Netherlands",
  "SE": "Sweden",
  "NO": "Norway",
  "DK": "Denmark",
  "PL": "Poland",
  "GR": "Greece",
  "TR": "Turkey",
  "EG": "Egypt"
};