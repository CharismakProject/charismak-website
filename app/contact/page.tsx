import { Mail, MapPin, Phone } from "lucide-react";
import ContactEstimateFromQuery from "@/components/public/contact-estimate-from-query";
import { company } from "../site-data";
import { loadWebsiteContent } from "@/lib/content/website-cms";

export const metadata = {
  title: "Contact Us",
  description: "Contact Charismak Project Nigeria Limited in Abuja for construction, renovation, steel fabrication, and project management enquiries.",
};

export const revalidate = 300;

const textValue = (value: unknown, fallback: string) => {
  if (typeof value === "string") return value || fallback;
  if (value && typeof value === "object" && "text" in value) {
    const text = String((value as { text?: unknown }).text ?? "").trim();
    return text || fallback;
  }
  return fallback;
};

export default async function ContactPage() {
  const records = await loadWebsiteContent("contact");
  const byKey = new Map(records.map((record) => [record.contentKey, record.value]));
  const phone = textValue(byKey.get("company.phone"), company.phones[0]);
  const email = textValue(byKey.get("company.email"), company.email);
  const address = textValue(byKey.get("company.address"), company.addresses[0]);

  return (
    <main className="overflow-hidden bg-white pt-20">
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-24 text-white md:px-8 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(200,164,93,0.15),transparent_28rem)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">Contact Charismak</p>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">Tell us what you want to build.</h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-white/72 md:text-lg">Share your project brief, location and the stage you are currently at. We can discuss construction, renovation, engineering, project management or specialist works. If you came from the estimator, its project details will be carried into the enquiry form automatically.</p>
        </div>
      </section>

      <section className="bg-[#F7F8FA] px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="bg-[#0D3B66] p-8 text-white md:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#F2B544]">Reach Us Directly</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">Let’s start with a conversation.</h2>
            <div className="mt-10 space-y-8">
              <ContactItem icon={Phone} label="Phone"><p>{phone}</p></ContactItem>
              <ContactItem icon={Mail} label="Email"><p>{email}</p></ContactItem>
              <ContactItem icon={MapPin} label="Office"><p>{address}</p></ContactItem>
            </div>
          </div>
          <div className="bg-white p-8 shadow-[0_14px_45px_rgba(7,30,51,0.08)] md:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Project Enquiry</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-[#071E33] md:text-4xl">Send us the basics.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#3A4653]">The more context you provide, the easier it is for us to understand what kind of support you need. PDF drawings, BOQs, images, Excel and Word files can be attached directly.</p>
            <ContactEstimateFromQuery />
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactItem({ icon: Icon, label, children }: { icon: typeof Phone; label: string; children: React.ReactNode }) {
  return <div className="grid grid-cols-[44px_1fr] gap-4 border-t border-white/10 pt-6 first:border-t-0 first:pt-0"><div className="grid h-11 w-11 place-items-center border border-[#C8A45D]/35 bg-[#C8A45D]/10"><Icon className="h-5 w-5 text-[#F2B544]" /></div><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">{label}</p><div className="mt-2 space-y-1 text-sm leading-6 text-white/78">{children}</div></div></div>;
}
