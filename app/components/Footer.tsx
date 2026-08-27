import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { company } from "../site-data";

export default function Footer() {
  const whatsappLink =
    "https://wa.me/2347066619598?text=Hello%20Charismak%20Project%2C%20I%20would%20like%20to%20discuss%20a%20construction%20project.";

  return (
    <footer className="bg-[#071E33] text-white">
      <section className="border-b border-white/10 px-5 py-16 md:px-8">
        <div className="mx-auto max-w-7xl rounded-[24px] border border-white/10 bg-white/[0.035] px-6 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.14)] backdrop-blur md:px-8 md:py-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.45fr] lg:items-center">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
                Work With Charismak
              </p>

              <h2 className="max-w-4xl text-3xl font-semibold leading-tight md:text-5xl lg:text-6xl">
                Let’s build your next project together.
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/68 md:text-lg">
                We are ready to deliver value, quality and excellence on your next
                construction requirement.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href={whatsappLink}
                target="_blank"
                className="inline-flex items-center gap-3 rounded-xl bg-[#8B1E00] px-7 py-4 font-bold text-white shadow-[0_10px_24px_rgba(139,30,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#A82B05]"
              >
                WhatsApp Us <Phone className="h-5 w-5" />
              </Link>

              <Link
                href={`mailto:${company.email}`}
                className="inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/[0.025] px-7 py-4 font-bold text-white transition hover:-translate-y-0.5 hover:border-[#C8A45D] hover:bg-white/5"
              >
                Email Us <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.3fr_0.8fr_1fr]">
          <div>
            <h3 className="text-2xl font-bold uppercase tracking-[0.18em]">
              Charismak
            </h3>
            <p className="mt-3 text-sm font-medium text-[#C8A45D]">
              Project Nigeria Limited
            </p>
            <p className="mt-6 max-w-md leading-7 text-white/62">
              {company.about}
            </p>
            <p className="mt-6 inline-flex rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-semibold text-white/50">
              {company.rcNumber}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.22em] text-[#C8A45D]">
              Quick Links
            </h4>

            <div className="mt-6 grid gap-3 text-sm text-white/62">
              {[
                ["About", "/about"],
                ["Services", "/services"],
                ["Projects", "/projects"],
                ["Construction Estimator", "/estimator"],
                ["Leadership", "/leadership"],
                ["MD Profile", "/md-profile"],
                ["Contact", "/contact"],
              ].map(([label, href]) => (
                <Link key={href} href={href} className="w-fit transition hover:text-[#C8A45D]">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.22em] text-[#C8A45D]">
              Contact
            </h4>

            <div className="mt-6 space-y-5 text-sm leading-6 text-white/62">
              <p className="flex gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#C8A45D]" />
                <span>{company.email}</span>
              </p>

              <p className="flex gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#C8A45D]" />
                <span>{company.phones[0]}</span>
              </p>

              <p className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#C8A45D]" />
                <span>{company.addresses[0]}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-6 text-sm text-white/42 md:px-8">
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
