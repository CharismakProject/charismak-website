import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { company } from "../site-data";

export default function Footer() {
  const whatsappLink =
    "https://wa.me/2347066619598?text=Hello%20Charismak%20Project%2C%20I%20would%20like%20to%20discuss%20a%20construction%20project.";

  return (
    <footer className="bg-[#071E33] text-white">
      <section className="border-b border-white/10 px-5 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.45fr] lg:items-center">
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
              Work With Charismak
            </p>

            <h2 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
              Let’s build your next project together.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
              We are ready to deliver value, quality and excellence on your next
              construction requirement.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 lg:justify-end">
            <Link
              href={whatsappLink}
              target="_blank"
              className="inline-flex items-center gap-3 bg-[#8B1E00] px-7 py-4 font-bold text-white transition hover:bg-[#C8A45D]"
            >
              WhatsApp Us <Phone className="h-5 w-5" />
            </Link>

            <Link
              href={`mailto:${company.email}`}
              className="inline-flex items-center gap-3 border border-white/20 px-7 py-4 font-bold text-white transition hover:border-[#C8A45D]"
            >
              Email Us <Mail className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <h3 className="text-2xl font-bold uppercase tracking-[0.18em]">
              Charismak
            </h3>
            <p className="mt-4 text-sm font-medium text-[#C8A45D]">
              Project Nigeria Limited
            </p>
            <p className="mt-6 max-w-md leading-7 text-white/65">
              {company.about}
            </p>
            <p className="mt-6 text-sm font-semibold text-white/45">
              {company.rcNumber}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.22em] text-[#C8A45D]">
              Quick Links
            </h4>

            <div className="mt-6 flex flex-col gap-3 text-sm text-white/65">
              <Link href="/about">About</Link>
              <Link href="/services">Services</Link>
              <Link href="/projects">Projects</Link>
              <Link href="/leadership">Leadership</Link>
              <Link href="/md-profile">MD Profile</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.22em] text-[#C8A45D]">
              Contact
            </h4>

            <div className="mt-6 space-y-5 text-sm text-white/65">
              <p className="flex gap-3">
                <Mail className="h-5 w-5 shrink-0 text-[#C8A45D]" />
                {company.email}
              </p>

              <p className="flex gap-3">
                <Phone className="h-5 w-5 shrink-0 text-[#C8A45D]" />
                {company.phones[0]}
              </p>

              <p className="flex gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-[#C8A45D]" />
                {company.addresses[0]}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-6 text-sm text-white/45 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 md:flex-row">
          <p>
            © {new Date().getFullYear()} Charismak Project Nigeria Limited. All
            rights reserved.
          </p>

          <p>Construction • Engineering • Project Delivery</p>
        </div>
      </section>
    </footer>
  );
}