export type MarketAlternative = {
  label: string;
  unit: string;
  priceLow: number;
  priceHigh: number;
  reference: number;
};

export type MarketSnapshot = {
  itemId: string;
  marketName: string;
  unit: string;
  priceLow: number;
  priceHigh: number;
  reference: number;
  location: string;
  specification?: string;
  sourceLabel: string;
  sourceCount: number;
  checkedAt: string;
  note?: string;
  primarySourceUrl: string;
  sourceUrls: string[];
  alternatives?: MarketAlternative[];
};

// Current public-market observations reviewed on 27 Aug 2026.
// These are marketplace observations, not supplier quotations. Obvious malformed
// or implausible outlier adverts are excluded from the displayed reference range.
export const JIJI_MARKET_SNAPSHOT: Record<string, MarketSnapshot> = {
  "cement-50kg": {
    itemId: "cement-50kg",
    marketName: "Dangote / BUA cement",
    unit: "50 kg bag",
    priceLow: 9999,
    priceHigh: 12000,
    reference: 11500,
    location: "Abuja (FCT)",
    specification: "Retail / contractor supply",
    sourceLabel: "Jiji Abuja",
    sourceCount: 15,
    checkedAt: "2026-08-27T12:30:00+01:00",
    note: "Current visible Abuja listings cluster around ₦11,500 per bag. Bulk and delivery terms vary by seller.",
    primarySourceUrl: "https://jiji.ng/abuja/165-dangote-cement",
    sourceUrls: [
      "https://jiji.ng/abuja/165-dangote-cement",
      "https://jiji.ng/abuja/building-materials",
    ],
  },
  "sharp-sand": {
    itemId: "sharp-sand",
    marketName: "Sharp sand",
    unit: "30-tonne tipper",
    priceLow: 300000,
    priceHigh: 400000,
    reference: 380000,
    location: "Nigeria market benchmark",
    specification: "30-tonne truckload",
    sourceLabel: "Jiji Nigeria",
    sourceCount: 4,
    checkedAt: "2026-08-27T12:30:00+01:00",
    note: "Abuja ads currently often omit truck capacity, so the displayed truckload range uses explicit 30-tonne Jiji listings elsewhere in Nigeria. Abuja delivered price must be confirmed by haulage distance.",
    primarySourceUrl: "https://jiji.ng/abuja/165-sharp-sand",
    sourceUrls: [
      "https://jiji.ng/abuja/165-sharp-sand",
      "https://jiji.ng/ojodu/165-sharp-sand",
      "https://jiji.ng/ogun/building-materials/iron",
    ],
    alternatives: [
      {
        label: "Smaller truck benchmark",
        unit: "10-tonne tipper",
        priceLow: 150000,
        priceHigh: 160000,
        reference: 160000,
      },
    ],
  },
  "granite-aggregate": {
    itemId: "granite-aggregate",
    marketName: "Granite chippings / aggregate",
    unit: "30-tonne tipper",
    priceLow: 700000,
    priceHigh: 750000,
    reference: 720000,
    location: "Nigeria market benchmark",
    specification: "Typical 3/4 aggregate truckload",
    sourceLabel: "Jiji Nigeria",
    sourceCount: 4,
    checkedAt: "2026-08-27T12:30:00+01:00",
    note: "Malformed ads showing implausibly low 30-tonne totals were excluded. Delivered price changes materially with quarry and haulage distance.",
    primarySourceUrl: "https://jiji.ng/abuja/165-chippings/stone",
    sourceUrls: [
      "https://jiji.ng/abuja/165-chippings/stone",
      "https://jiji.ng/ogba/165-granite",
      "https://jiji.ng/ibadan/165-granite",
    ],
    alternatives: [
      {
        label: "20-tonne benchmark",
        unit: "20-tonne tipper",
        priceLow: 300000,
        priceHigh: 480000,
        reference: 400000,
      },
    ],
  },
  "block-225": {
    itemId: "block-225",
    marketName: "9-inch sandcrete block",
    unit: "piece",
    priceLow: 700,
    priceHigh: 800,
    reference: 700,
    location: "Abuja (FCT)",
    specification: "225 mm / 9-inch block",
    sourceLabel: "Jiji Abuja",
    sourceCount: 3,
    checkedAt: "2026-08-27T12:30:00+01:00",
    note: "One current ₦700 listing states delivery is included. Strength, cement content and delivery zone should still be confirmed.",
    primarySourceUrl: "https://jiji.ng/lugbe/building-materials/9-inch-block-for-sale-BkWumLuF21elOSOgy42mf6i1.html",
    sourceUrls: [
      "https://jiji.ng/abuja/165-blocks",
      "https://jiji.ng/lugbe/building-materials/9-inch-block-for-sale-BkWumLuF21elOSOgy42mf6i1.html",
      "https://jiji.ng/lugbe/building-materials/block-for-sales-mI6O3viRtY4SDI8ccxWY5B7e.html",
    ],
  },
  "reinforcement-steel": {
    itemId: "reinforcement-steel",
    marketName: "Y12 / 12 mm reinforcement bar",
    unit: "12 m length",
    priceLow: 11250,
    priceHigh: 12500,
    reference: 12000,
    location: "Abuja (FCT)",
    specification: "12 mm TMT / reinforcement bar",
    sourceLabel: "Jiji Abuja",
    sourceCount: 5,
    checkedAt: "2026-08-27T12:30:00+01:00",
    note: "Brand, actual bar length and weight per tonne differ. Compare both piece price and tonne price before bulk procurement.",
    primarySourceUrl: "https://jiji.ng/abuja/165-rods/12mm",
    sourceUrls: [
      "https://jiji.ng/abuja/165-rods/12mm",
      "https://jiji.ng/dei-dei/building-materials/abj-tmt-iron-rods-yutIv7CD8MU5TD5nwBtcaZZ8.html",
      "https://jiji.ng/dei-dei/building-materials/royal-tmt-iron-rods-in-all-sizes-8IRfKH1LCpeV2qXadpMJuVgV.html",
      "https://jiji.ng/dei-dei/building-materials/12mm-abuja-tmt-per-ton-poaNwxz58LoIhHApneQZiXzo.html",
    ],
    alternatives: [
      {
        label: "Local reinforcement",
        unit: "tonne",
        priceLow: 780000,
        priceHigh: 810000,
        reference: 780000,
      },
      {
        label: "TMT reinforcement",
        unit: "tonne",
        priceLow: 920000,
        priceHigh: 1025000,
        reference: 920000,
      },
    ],
  },
  "formwork-sheet": {
    itemId: "formwork-sheet",
    marketName: "Marine plywood for formwork",
    unit: "4 × 8 ft sheet",
    priceLow: 22000,
    priceHigh: 27000,
    reference: 24000,
    location: "Abuja (FCT)",
    specification: "16 mm marine plywood",
    sourceLabel: "Jiji Abuja",
    sourceCount: 3,
    checkedAt: "2026-08-27T12:30:00+01:00",
    note: "Higher-grade German/rubber boards are substantially more expensive; reuse count should be considered, not only first cost.",
    primarySourceUrl: "https://jiji.ng/dei-dei/building-materials/16mm-marine-board-4ftx8ft-k0Q5uXJkGYQbwFAqG9cFZSm2.html",
    sourceUrls: [
      "https://jiji.ng/abuja/building-materials/plywood",
      "https://jiji.ng/dei-dei/building-materials/16mm-marine-board-4ftx8ft-k0Q5uXJkGYQbwFAqG9cFZSm2.html",
      "https://jiji.ng/dei-dei/building-materials/marine-boards-hSdPU5N9sJnQTNgJpsNtUsMY.html",
    ],
  },
  "floor-tile": {
    itemId: "floor-tile",
    marketName: "60 × 60 floor tile",
    unit: "carton / seller pack",
    priceLow: 6100,
    priceHigh: 8500,
    reference: 8000,
    location: "Abuja (FCT)",
    specification: "60 × 60 cm glazed / porcelain",
    sourceLabel: "Jiji Abuja",
    sourceCount: 6,
    checkedAt: "2026-08-27T12:30:00+01:00",
    note: "Jiji listings commonly show a pack price but may omit pieces or square metres per carton. Confirm carton coverage before comparing unit cost.",
    primarySourceUrl: "https://jiji.ng/wuse/building-materials/floor-tiles-60x60-hM5JTfzgbyT9OV4pOzdSmRt.html",
    sourceUrls: [
      "https://jiji.ng/abuja/165-tile/floor",
      "https://jiji.ng/abuja/165-tile/glazed",
      "https://jiji.ng/wuse/building-materials/floor-tiles-60x60-hM5JTfzgbyT9OV4pOzdSmRt.html",
    ],
  },
  "ppr-pipe-25": {
    itemId: "ppr-pipe-25",
    marketName: "25 mm PPR pipe",
    unit: "4 m length",
    priceLow: 2400,
    priceHigh: 2500,
    reference: 2500,
    location: "Abuja (FCT)",
    specification: "25 mm PPR water pipe",
    sourceLabel: "Jiji Abuja",
    sourceCount: 2,
    checkedAt: "2026-08-27T12:30:00+01:00",
    note: "One listing offers ₦2,400 from 10 pieces. Another advert uses a 3 m length, so length must be confirmed before price comparison.",
    primarySourceUrl: "https://jiji.ng/dei-dei/plumbing-and-water-supply/ppr-pipes-and-fittings-in-all-kinds-and-sizes-hEpIrbgpEpXl24aHMBigNu4C.html",
    sourceUrls: [
      "https://jiji.ng/dei-dei/plumbing-and-water-supply/ppr-pipes-and-fittings-in-all-kinds-and-sizes-hEpIrbgpEpXl24aHMBigNu4C.html",
      "https://jiji.ng/dei-dei/plumbing-and-water-supply/ppr-pipes-and-fittings-20mm-to-110mm-vVJ9OP2NnTsUbcep7U1rLBtA.html",
    ],
  },
  "longspan-roof-sheet": {
    itemId: "longspan-roof-sheet",
    marketName: "0.55 aluminium longspan roofing",
    unit: "running metre",
    priceLow: 10500,
    priceHigh: 13800,
    reference: 11500,
    location: "Abuja (FCT)",
    specification: "0.55 market/complete gauge listings",
    sourceLabel: "Jiji Abuja",
    sourceCount: 5,
    checkedAt: "2026-08-27T12:30:00+01:00",
    note: "Gauge descriptions on roofing adverts are inconsistent. Confirm actual micrometre thickness, width and whether accessories are included.",
    primarySourceUrl: "https://jiji.ng/abuja/165-roofing-materials/aluminium",
    sourceUrls: [
      "https://jiji.ng/abuja/165-roofing-materials/aluminium",
      "https://jiji.ng/idu-industrial/building-materials/0-55mm-stucco-complete-gauge-aluminium-longspan-roofing-sheets-oMM4yoLMu1LnecNbgNFSZupi.html",
      "https://jiji.ng/idu-industrial/building-materials/market-complete-0-55mm-aluminium-longspan-roofing-sheet-wHGrCLmbcH8nkTT5vrWr0Ria.html",
    ],
  },
  "concrete-mixer": {
    itemId: "concrete-mixer",
    marketName: "500 L concrete mixer",
    unit: "machine (purchase)",
    priceLow: 3350000,
    priceHigh: 3800000,
    reference: 3350000,
    location: "Abuja (FCT)",
    specification: "500 L diesel mixer, brand new",
    sourceLabel: "Jiji Abuja",
    sourceCount: 3,
    checkedAt: "2026-08-27T12:30:00+01:00",
    note: "This is a purchase-price benchmark, not the estimator's plant allowance per m³. Used and refurbished mixers are priced separately.",
    primarySourceUrl: "https://jiji.ng/abuja/274-concrete-mixers",
    sourceUrls: [
      "https://jiji.ng/abuja/274-concrete-mixers",
    ],
  },
};
