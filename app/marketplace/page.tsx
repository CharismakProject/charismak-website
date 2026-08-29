import { redirect } from "next/navigation";

export const metadata = {
  title: "Construction Material Prices & Suppliers",
  description:
    "Supplier offers are now accessed from each construction material or equipment item in the Charismak price list.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function MarketplacePage() {
  redirect("/prices");
}
