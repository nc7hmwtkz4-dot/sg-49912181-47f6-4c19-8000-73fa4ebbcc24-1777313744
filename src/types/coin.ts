export interface Coin {
  id: string;
  sku: string;
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
  imageUrl?: string;
  isSold: boolean;
  saleId?: string;
}

export interface Sale {
  id: string;
  coinId: string;
  saleDate: string;
  salePrice: number; // CHF
  buyerInfo?: string;
  notes?: string;
}

export type SheldonGrade = 
  | "PO-1" | "FR-2" | "AG-3" | "G-4" | "G-6" 
  | "VG-8" | "VG-10" | "F-12" | "F-15" 
  | "VF-20" | "VF-25" | "VF-30" | "VF-35"
  | "XF-40" | "XF-45" | "AU-50" | "AU-53" | "AU-55" | "AU-58"
  | "MS-60" | "MS-61" | "MS-62" | "MS-63" | "MS-64" | "MS-65" 
  | "MS-66" | "MS-67" | "MS-68" | "MS-69" | "MS-70"
  | "PF-60" | "PF-61" | "PF-62" | "PF-63" | "PF-64" | "PF-65"
  | "PF-66" | "PF-67" | "PF-68" | "PF-69" | "PF-70";

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

export const SHELDON_GRADES: SheldonGrade[] = [
  "PO-1", "FR-2", "AG-3", "G-4", "G-6",
  "VG-8", "VG-10", "F-12", "F-15",
  "VF-20", "VF-25", "VF-30", "VF-35",
  "XF-40", "XF-45", "AU-50", "AU-53", "AU-55", "AU-58",
  "MS-60", "MS-61", "MS-62", "MS-63", "MS-64", "MS-65",
  "MS-66", "MS-67", "MS-68", "MS-69", "MS-70",
  "PF-60", "PF-61", "PF-62", "PF-63", "PF-64", "PF-65",
  "PF-66", "PF-67", "PF-68", "PF-69", "PF-70"
];

export const COUNTRY_CODES: Record<string, string> = {
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