import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { company } from "../site-data";

export default function Footer() {
  const whatsappLink =
    "https://wa.me/2347066619598?text=Hello%20Charismak%20Project%2C%20I%20would%20like%20to%20discuss%20a%20construction%20project.";

  return (
    <footer className="bg-[#071E33] text-white">
      <section className="border-b border-white/10 px-5 py-16 md:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">
              Work With Charismak
            </p>
            <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-6xl">
              Let’s build something that performs as well as it looks.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/65">
              Construction, renovation, engineering and project delivery supported by clear planning, disciplined supervision and practical commercial control.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/quote"
              className="inline-flex items-center gap-3 bg-[#C8A45D] px-6 py-4 text-sm font-bold text-[#071E33] hover:bg-[#E8C77F]"
            >
              Start a Project <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={whatsappLink}
              target="_blank"
              className="inline-flex items-center gap-3 border border-white/20 px-6 py-4 text-sm font-bold text-white hover:border-white/45 hover:bg-white/5"
            >
              WhatsApp <Phone className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1fr]">
          <div>
            <h3 className="text-xl font-black tracking-[0.08em]">CHARISMAK</h3>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C8A45D]">
              Project Nigeria Limited
            </p>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/55">
              {company.about}
            </p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
              {company.rcNumber}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.22em] text-[#C8A45D]">
              Company
            </h4>
            <div className="mt-6 flex flex-col gap-3 text-sm text-white/58">
              <Link className="hover:text-white" href="/about">About</Link>
              <Link className="hover:text-white" href="/services">Services</Link>
              <Link className="hover:text-white" href="/projects">Projects</Link>
              <Link className="hover:text-white" href="/leadership">Leadership</Link>
              <Link className="hover:text-white" href="/contact">Contact</Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.22em] text-[#C8A45D]">
              Digital Tools
            </h4>
            <div className="mt-6 flex flex-col gap-3 text-sm text-white/58">
              <Link className="hover:text-white" href="/estimator">Estimator</Link>
              <Link className="hover:text-white" href="/prices">Prices & Suppliers</Link>
              <Link className="hover:text-white" href="/blog">Blog</Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.22em] text-[#C8A45D]">
              Contact
            </h4>
            <div className="mt-6 space-y-5 text-sm text-white/58">
              <Link href={`mailto:${company.email}`} className="flex gap-3 hover:text-white">
                <Mail className="h-4 w-4 shrink-0 text-[#C8A45D]" />
                <span>{company.email}</span>
              </Link>
              <p className="flex gap-3">
                <Phone className="h-4 w-4 shrink-0 text-[#C8A45D]" />
                <span>{company.phones[0]}</span>
              </p>
              <p className="flex gap-3 leading-6">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C8A45D]" />
                <span>{company.addresses[0]}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-6 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs text-white/35 md:flex-row">
          <p>© {new Date().getFullYear()} Charismak Project Nigeria Limited. All rights reserved.</p>
          <p>Design · Cost · Build</p>
        </div>
      </section>
    </footer>
  );
}
