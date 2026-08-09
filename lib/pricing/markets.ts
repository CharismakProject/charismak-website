export type PriceUpdateMode = "automatic" | "review" | "manual";

export type ConstructionMarket = {
  countryCode: string;
  country: string;
  currency: string;
  defaultCity: string;
  providerName: string;
  providerUrl: string;
  providerCoverage: "official-index" | "catalog-and-index";
  exactSupplierFeed: boolean;
};

export const CONSTRUCTION_MARKETS: ConstructionMarket[] = [
  {
    countryCode: "NG",
    country: "Nigeria",
    currency: "NGN",
    defaultCity: "Abuja",
    providerName: "National Bureau of Statistics - Housing, Building and Construction Statistics",
    providerUrl: "https://www.nigerianstat.gov.ng/elibrary/read/12",
    providerCoverage: "catalog-and-index",
    exactSupplierFeed: false,
  },
  {
    countryCode: "GH",
    country: "Ghana",
    currency: "GHS",
    defaultCity: "Accra",
    providerName: "Ghana Statistical Service - Prime Building Cost Index",
    providerUrl: "https://statsghana.gov.gh/data-statistics/economic-statistics?tab=price-index",
    providerCoverage: "official-index",
    exactSupplierFeed: false,
  },
  {
    countryCode: "KE",
    country: "Kenya",
    currency: "KES",
    defaultCity: "Nairobi",
    providerName: "Kenya National Bureau of Statistics - Construction Input Price Index",
    providerUrl: "https://www.knbs.or.ke/reports_category/construction-input-price-index/",
    providerCoverage: "official-index",
    exactSupplierFeed: false,
  },
  {
    countryCode: "ZA",
    country: "South Africa",
    currency: "ZAR",
    defaultCity: "Johannesburg",
    providerName: "Statistics South Africa - Construction Material Price Indices",
    providerUrl: "https://www.statssa.gov.za/?page_id=1854&PPN=P0151.1",
    providerCoverage: "official-index",
    exactSupplierFeed: false,
  },
];

export function getConstructionMarket(countryCode: string): ConstructionMarket {
  return CONSTRUCTION_MARKETS.find((market) => market.countryCode === countryCode)
    ?? CONSTRUCTION_MARKETS[0];
}
