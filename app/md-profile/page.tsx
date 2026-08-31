import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  BriefcaseBusiness,
  Building2,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { mdProfile, projects } from "../site-data";
import ProfileActions from "./ProfileActions";

export const metadata: Metadata = {
  title: "Abiodun Christopher Akinola, MNIQS | Executive Profile",
  description:
    "Executive profile of Abiodun Christopher Akinola, MNIQS - Quantity Surveyor, Construction Project Manager and Managing Director of Charismak Project Nigeria Limited.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

const career = [
  {
    organisation: "Charismak Project Nigeria Limited",
    role: "Project Director | Managing Director",
    location: "Abuja, Nigeria",
    points: [
      "Leads company operations, project strategy, cost management, procurement and construction delivery.",
      "Oversees residential, commercial, renovation, specialist fabrication and consultancy assignments from planning through handover.",
    ],
  },
  {
    organisation: "ES Construction SARL",
    role: "Project Quantity Surveyor & Assistant Project Manager",
    location: "Djibouti, East Africa",
    points: [
      "Worked on a 112-unit residential development and later a 351-unit duplex project.",
      "Introduced cost-control, valuation, quantity-tracking and reporting systems to improve payment visibility, variation control and site productivity.",
    ],
  },
  {
    organisation: "Cannon Projects",
    role: "Quantity Surveyor / Project Professional",
    location: "Abuja, Nigeria",
    points: [
      "Prepared BOQs and project budgets, strengthened cost-management processes and introduced digital take-off methods across multiple projects.",
      "Used measurement, valuation and commercial review to identify potential overpayments and unsupported contractor claims.",
    ],
  },
  {
    organisation: "Three O's Nigeria Limited",
    role: "Office Quantity Surveyor to Contract Manager",
    location: "Nigeria",
    points: [
      "Progressed from office quantity surveying responsibilities into contract and project management.",
      "Managed site cost control, subcontractors, negotiation and construction monitoring on projects from foundation through handover across multiple states.",
    ],
  },
];

const expertise = [
  "Quantity Surveying",
  "Cost Planning & Control",
  "BOQ Preparation",
  "Measurement & Valuation",
  "Contract Administration",
  "Procurement Management",
  "Construction Project Management",
  "Site & Subcontractor Coordination",
  "Renovation & Finishing",
  "Steel Fabrication Coordination",
];

const professionalProjects = projects
  .filter((project) => project.publicCategory === "MD Professional Experience")
  .slice(0, 9);

export default function MDProfilePage() {
  return (
    <main className="executive-profile min-h-screen bg-[#EEF2F5] px-4 py-8 text-[#17212B] sm:px-6 lg:py-12">
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          html, body { background: #fff !important; }
          .executive-profile { background: #fff !important; padding: 0 !important; }
          .resume-shell { max-width: none !important; gap: 0 !important; }
          .resume-sheet {
            min-height: 277mm !important;
            box-shadow: none !important;
            border: 0 !important;
            padding: 9mm 10mm !important;
          }
          .resume-sheet + .resume-sheet { break-before: page; page-break-before: always; }
          .print-hide { display: none !important; }
          .career-entry { break-inside: avoid; page-break-inside: avoid; }
          .project-row { break-inside: avoid; page-break-inside: avoid; }
          a { color: inherit !important; text-decoration: none !important; }
        }
      `}</style>

      <div className="resume-shell mx-auto flex max-w-[1100px] flex-col gap-7">
        <section className="resume-sheet overflow-hidden rounded-xl border border-[#0D3B66]/10 bg-white p-6 shadow-[0_24px_70px_rgba(7,30,51,0.10)] sm:p-9 lg:p-11">
          <header className="grid gap-7 border-b border-[#0D3B66]/12 pb-8 sm:grid-cols-[150px_1fr] sm:items-start">
            <div className="relative h-[178px] w-[150px] overflow-hidden rounded-lg bg-[#DCE4EA]">
              <Image
                src={mdProfile.image}
                alt={mdProfile.name}
                fill
                priority
                sizes="150px"
                className="object-cover object-top"
              />
            </div>

            <div>
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#C09543]">
                    Executive Profile
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.035em] text-[#071E33] sm:text-4xl">
                    Abiodun Christopher Akinola, MNIQS
                  </h1>
                  <p className="mt-2 text-base font-semibold text-[#0D3B66]">
                    Project Director | Managing Director
                  </p>
                  <p className="mt-1 text-sm text-[#52606D]">
                    Quantity Surveyor · Construction Project Manager · Cost Consultant
                  </p>
                </div>
                <ProfileActions />
              </div>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#52606D]">
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#C09543]" />Abuja, Nigeria</span>
                <Link href="mailto:md@charismakproject.com" className="inline-flex items-center gap-1.5 hover:text-[#0D3B66]"><Mail className="h-3.5 w-3.5 text-[#C09543]" />md@charismakproject.com</Link>
                <Link href={`tel:${mdProfile.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-[#0D3B66]"><Phone className="h-3.5 w-3.5 text-[#C09543]" />{mdProfile.phone}</Link>
                <Link href={mdProfile.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-[#0D3B66]"><ExternalLink className="h-3.5 w-3.5 text-[#C09543]" />LinkedIn</Link>
              </div>
            </div>
          </header>

          <section className="border-b border-[#0D3B66]/10 py-7">
            <SectionLabel>Executive Summary</SectionLabel>
            <p className="mt-3 max-w-4xl text-[14px] leading-7 text-[#394754]">
              Quantity Surveyor and construction project manager with over nine years of experience across Nigeria and East Africa. Background covers cost planning, BOQ preparation, procurement, contract administration, valuation, site delivery and project leadership across consultancy, contracting and expatriate project environments. Currently leads Charismak Project Nigeria Limited.
            </p>
          </section>

          <div className="grid gap-9 pt-8 lg:grid-cols-[1.52fr_0.78fr]">
            <section>
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4 text-[#C09543]" />
                <SectionLabel>Professional Experience</SectionLabel>
              </div>
              <div className="mt-5 space-y-6">
                {career.map((item) => (
                  <article key={item.organisation} className="career-entry border-l-2 border-[#D9C49C] pl-5">
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-start">
                      <div>
                        <h2 className="text-[15px] font-semibold text-[#071E33]">{item.organisation}</h2>
                        <p className="mt-0.5 text-[12px] font-semibold text-[#0D3B66]">{item.role}</p>
                      </div>
                      <p className="text-[11px] text-[#6B7784]">{item.location}</p>
                    </div>
                    <ul className="mt-2.5 space-y-1.5 text-[12px] leading-5 text-[#44515E]">
                      {item.points.map((point) => (
                        <li key={point} className="grid grid-cols-[8px_1fr] gap-2">
                          <span className="mt-[8px] h-1 w-1 rounded-full bg-[#C09543]" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <aside className="space-y-8">
              <section>
                <SectionLabel>Career Snapshot</SectionLabel>
                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-1">
                  <Snapshot value="9+" label="Years in construction" />
                  <Snapshot value="Nigeria + East Africa" label="Project exposure" />
                  <Snapshot value="QS / Cost" label="Commercial background" />
                  <Snapshot value="Project Delivery" label="Management focus" />
                </div>
              </section>

              <section>
                <SectionLabel>Core Expertise</SectionLabel>
                <div className="mt-4 flex flex-wrap gap-2">
                  {expertise.map((item) => (
                    <span key={item} className="rounded-md border border-[#0D3B66]/10 bg-[#F5F7F9] px-2.5 py-2 text-[10px] font-semibold leading-4 text-[#334150]">
                      {item}
                    </span>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </section>

        <section className="resume-sheet rounded-xl border border-[#0D3B66]/10 bg-white p-6 shadow-[0_24px_70px_rgba(7,30,51,0.10)] sm:p-9 lg:p-11">
          <div className="border-b border-[#0D3B66]/12 pb-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#C09543]" />
              <SectionLabel>Selected Professional Projects</SectionLabel>
            </div>
            <p className="mt-3 max-w-3xl text-[12px] leading-6 text-[#52606D]">
              Selected assignments undertaken during professional engagements with other organisations. These references are shown as individual career experience, not as Charismak contracts.
            </p>
          </div>

          <div className="mt-5 overflow-hidden border-y border-[#0D3B66]/10">
            <div className="hidden grid-cols-[1.35fr_0.9fr_1fr_0.75fr] gap-4 bg-[#F4F6F8] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#6B7784] md:grid">
              <span>Project</span><span>Organisation</span><span>Role</span><span>Location</span>
            </div>
            {professionalProjects.map((project) => (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="project-row grid gap-1 border-t border-[#0D3B66]/8 px-4 py-3.5 first:border-t-0 transition hover:bg-[#F8FAFB] md:grid-cols-[1.35fr_0.9fr_1fr_0.75fr] md:gap-4"
              >
                <span className="text-[12px] font-semibold leading-5 text-[#071E33]">{project.title}</span>
                <span className="text-[11px] leading-5 text-[#44515E]">{project.organisation}</span>
                <span className="text-[11px] leading-5 text-[#44515E]">{project.role}</span>
                <span className="text-[11px] leading-5 text-[#6B7784]">{project.location}</span>
              </Link>
            ))}
          </div>

          <div className="mt-8 grid gap-8 border-t border-[#0D3B66]/10 pt-8 md:grid-cols-2">
            <section>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[#C09543]" />
                <SectionLabel>Education</SectionLabel>
              </div>
              <div className="mt-4 border-l-2 border-[#D9C49C] pl-5">
                <h2 className="text-[14px] font-semibold text-[#071E33]">B.Tech, Quantity Surveying</h2>
                <p className="mt-1 text-[12px] text-[#52606D]">Federal University of Technology, Akure</p>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#C09543]" />
                <SectionLabel>Professional Affiliations</SectionLabel>
              </div>
              <div className="mt-4 space-y-3 text-[12px] leading-5 text-[#44515E]">
                <p><strong className="text-[#071E33]">MNIQS</strong> · Professional Member, Nigerian Institute of Quantity Surveyors</p>
                <p>Member · Green Building Council Nigeria</p>
              </div>
            </section>
          </div>

          <div className="mt-8 grid gap-6 rounded-lg bg-[#071E33] p-6 text-white md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#E8C77F]">Contact</p>
              <p className="mt-2 text-lg font-semibold">Abiodun Christopher Akinola, MNIQS</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-white/75">
                <Link href="mailto:md@charismakproject.com">md@charismakproject.com</Link>
                <Link href={`tel:${mdProfile.phone.replace(/\s/g, "")}`}>{mdProfile.phone}</Link>
                <span>Abuja, Nigeria</span>
              </div>
            </div>
            <div className="print-hide"><ProfileActions /></div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A77B28]">{children}</p>;
}

function Snapshot({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-md border border-[#0D3B66]/10 bg-[#F7F9FA] p-3.5">
      <p className="text-[12px] font-semibold leading-5 text-[#071E33]">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-[#7A8793]">{label}</p>
    </div>
  );
}
