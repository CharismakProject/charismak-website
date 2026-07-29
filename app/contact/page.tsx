import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { company } from "../site-data";

export const metadata = {
  title: "Contact Us",
  description:
    "Contact Charismak Project Nigeria Limited in Abuja for construction, renovation, steel fabrication, and project management enquiries.",
};

export default function ContactPage() {
  return (
    <main className="bg-white pt-20">
      <section className="bg-[#071E33] px-5 py-24 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
            Contact
          </p>
          <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-7xl">
            Get in touch with Charismak.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/75">
            Speak with us about construction, renovation, steel fabrication,
            consultancy, project management and finishing works.
          </p>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-10">
            <div>
              <Phone className="h-7 w-7 text-[#8B1E00]" />
              <h3 className="mt-4 text-lg font-bold text-[#0D3B66]">Phone</h3>
              <div className="mt-3 space-y-2 text-[#3A4653]">
                {company.phones.map((phone) => (
                  <p key={phone}>{phone}</p>
                ))}
              </div>
            </div>

            <div>
              <Mail className="h-7 w-7 text-[#8B1E00]" />
              <h3 className="mt-4 text-lg font-bold text-[#0D3B66]">Email</h3>
              <p className="mt-3 text-[#3A4653]">{company.email}</p>
            </div>

            <div>
              <MapPin className="h-7 w-7 text-[#8B1E00]" />
              <h3 className="mt-4 text-lg font-bold text-[#0D3B66]">
                Office Address
              </h3>
              <div className="mt-3 space-y-2 text-[#3A4653]">
                {company.addresses.map((address) => (
                  <p key={address}>{address}</p>
                ))}
              </div>
            </div>
          </div>

          <form className="grid gap-4 bg-[#F7F8FA] p-8">
            <input
              className="border border-[#0D3B66]/10 bg-white p-4 text-[#151B22] outline-none placeholder:text-[#9AA3AF] focus:border-[#8B1E00]"
              placeholder="Your Name"
            />
            <input
              className="border border-[#0D3B66]/10 bg-white p-4 text-[#151B22] outline-none placeholder:text-[#9AA3AF] focus:border-[#8B1E00]"
              placeholder="Your Email"
            />
            <input
              className="border border-[#0D3B66]/10 bg-white p-4 text-[#151B22] outline-none placeholder:text-[#9AA3AF] focus:border-[#8B1E00]"
              placeholder="Phone Number"
            />
            <textarea
              className="min-h-[160px] border border-[#0D3B66]/10 bg-white p-4 text-[#151B22] outline-none placeholder:text-[#9AA3AF] focus:border-[#8B1E00]"
              placeholder="Your Message"
            />
            <Link
              href={`mailto:${company.email}`}
              className="bg-[#8B1E00] px-6 py-4 text-center font-bold text-white transition hover:bg-[#C8A45D]"
            >
              Send Message
            </Link>
          </form>
        </div>
      </section>
    </main>
  );
}