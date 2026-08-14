import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import heroImage from '/resources/images/bgpic.jpg';
import doctorImage from '/resources/images/Doctor.png';
import clinicImage from '/resources/images/smallpic.jpg';
import logo from '/resources/images/full_logo2.png';
import {
    Activity,
    ArrowRight,
    Award,
    Building2,
    CalendarCheck,
    Check,
    ChevronDown,
    Clock3,
    FileCheck2,
    HeartPulse,
    Mail,
    MapPin,
    Menu,
    MonitorSmartphone,
    Phone,
    ShieldCheck,
    Stethoscope,
    Syringe,
    UsersRound,
    X,
} from 'lucide-react';

const services = [
    {
        icon: Stethoscope,
        title: 'Pre-employment Medical Examination',
        short: 'PEME',
        text: 'Fit-for-work screening tailored to your role and industry.',
    },
    {
        icon: CalendarCheck,
        title: 'Annual Physical Examination',
        short: 'APE',
        text: 'Comprehensive annual health assessments for your workforce.',
    },
    {
        icon: ShieldCheck,
        title: 'Drug Testing',
        short: 'DOT',
        text: 'Accurate, confidential testing with dependable documentation.',
    },
    {
        icon: Activity,
        title: 'Laboratory & Diagnostics',
        short: 'LAB',
        text: 'In-house laboratory, X-ray, ECG and diagnostic services.',
    },
    {
        icon: Syringe,
        title: 'Vaccination Programs',
        short: 'VAX',
        text: 'Workplace immunization plans that keep teams protected.',
    },
    {
        icon: MonitorSmartphone,
        title: 'Teleconsultation',
        short: '24/7',
        text: 'Convenient virtual care and follow-up for your employees.',
    },
];

const faqs = [
    [
        'How soon can we receive medical results?',
        'Most standard examinations are released within 24–48 hours. We offer priority processing and a secure digital portal for corporate accounts.',
    ],
    [
        'Can you serve employees at our location?',
        'Yes. Our mobile occupational health team can provide on-site examinations, vaccination drives, and health education sessions for qualified company programs.',
    ],
    [
        'Do you support DOLE compliance requirements?',
        'Our programs are designed around occupational health requirements and include documentation, health surveillance, and reporting support for your team.',
    ],
    [
        'How do we start a corporate account?',
        'Send us an inquiry or schedule a consultation. Our corporate care team will prepare a program around your headcount, industry, and compliance needs.',
    ],
];

function SectionTitle({
    eyebrow,
    title,
    text,
    centered = false,
}: {
    eyebrow: string;
    title: string;
    text?: string;
    centered?: boolean;
}) {
    return (
        <div
            className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}
        >
            <p className="mb-4 flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-moss-700 uppercase">
                <span className="h-px w-7 bg-moss-600" />
                {eyebrow}
            </p>
            <h2 className="text-3xl leading-tight font-extrabold tracking-[-0.035em] text-slate-950 sm:text-4xl">
                {title}
            </h2>
            {text && (
                <p className="mt-5 text-base leading-7 text-slate-500">
                    {text}
                </p>
            )}
        </div>
    );
}

function Navbar() {
    const [open, setOpen] = useState(false);
    const links = [
        ['About', '#about'],
        ['Services', '#services'],
        ['Corporate Programs', '#corporate'],
        ['Contact', '#contact'],
    ];
    return (
        <header className="absolute inset-x-0 top-0 z-50">
            <div className="mx-auto max-w-7xl px-5 py-5 sm:px-7">
                <nav className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_14px_45px_rgba(15,38,60,0.10)] backdrop-blur-lg sm:px-5">
                    <Link
                        href="/"
                        className="flex items-center gap-3"
                        aria-label="Living Myth Industrial Clinic home"
                    >
                        <span className="flex h-11 w-[72px] items-center justify-center rounded-xl bg-moss-800 px-1.5 shadow-sm">
                            <img
                                src={logo}
                                alt="Living Myth Industrial Clinic"
                                className="h-full w-full object-contain"
                            />
                        </span>
                        <span className="leading-tight">
                            <span className="block text-sm font-extrabold tracking-[-0.03em] text-slate-950">
                                LIVING MYTH
                            </span>
                            <span className="block text-[9px] font-bold tracking-[0.18em] text-moss-700 uppercase">
                                Industrial Clinic
                            </span>
                        </span>
                    </Link>
                    <div className="hidden items-center gap-7 lg:flex">
                        {links.map(([name, href]) => (
                            <a
                                key={name}
                                href={href}
                                className="text-sm font-semibold text-slate-600 transition hover:text-moss-700"
                            >
                                {name}
                            </a>
                        ))}
                    </div>
                    <div className="hidden items-center gap-3 sm:flex">
                        <Link
                            href="/login"
                            className="px-3 py-2 text-sm font-bold text-slate-700 transition hover:text-moss-700"
                        >
                            Login
                        </Link>
                        <a
                            href="#contact"
                            className="rounded-xl bg-moss-800 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-moss-900/10 transition hover:-translate-y-0.5 hover:bg-moss-700"
                        >
                            Book a consultation
                        </a>
                    </div>
                    <button
                        onClick={() => setOpen(!open)}
                        className="grid h-10 w-10 place-items-center rounded-xl text-slate-800 sm:hidden"
                        aria-label="Toggle navigation"
                    >
                        {open ? <X size={21} /> : <Menu size={21} />}
                    </button>
                </nav>
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="mt-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl sm:hidden"
                        >
                            {links.map(([name, href]) => (
                                <a
                                    onClick={() => setOpen(false)}
                                    key={name}
                                    href={href}
                                    className="block rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                                >
                                    {name}
                                </a>
                            ))}
                            <Link
                                href="/login"
                                className="mt-1 block rounded-xl bg-moss-800 px-4 py-3 text-center text-sm font-bold text-white"
                            >
                                Client Login
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
}

export default function Welcome() {
    const [faq, setFaq] = useState<number | null>(0);
    return (
        <>
            <Head title="Occupational Health & Corporate Care">
                <meta
                    name="description"
                    content="Occupational healthcare, medical examinations and corporate wellness programs for modern workforces."
                />
            </Head>
            <main className="overflow-hidden bg-white font-sans text-slate-900">
                <Navbar />
                <section className="relative isolate bg-[#f4f7f3] pt-32">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_20%,rgba(168,195,160,.18),transparent_24rem),radial-gradient(circle_at_14%_85%,rgba(14,116,144,.12),transparent_26rem)]" />
                    <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-14 sm:px-7 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:gap-10 lg:pb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.65 }}
                            className="pt-10 lg:pt-16"
                        >
                            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-moss-200 bg-white px-3 py-1.5 text-xs font-bold text-moss-800 shadow-sm">
                                <ShieldCheck size={14} /> Occupational health,
                                done right
                            </div>
                            <h1 className="max-w-3xl text-4xl leading-[1.06] font-extrabold tracking-[-0.052em] text-slate-950 sm:text-5xl xl:text-[4.2rem]">
                                Healthier people.{' '}
                                <span className="text-moss-700">
                                    Safer operations.
                                </span>
                            </h1>
                            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                                A trusted healthcare partner for companies that
                                put their people, performance, and compliance
                                first.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <a
                                    href="#contact"
                                    className="group inline-flex items-center gap-2 rounded-xl bg-moss-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-moss-800/20 transition hover:-translate-y-0.5 hover:bg-moss-800"
                                >
                                    Book a Consultation{' '}
                                    <ArrowRight
                                        size={16}
                                        className="transition group-hover:translate-x-1"
                                    />
                                </a>
                                <a
                                    href="#services"
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 transition hover:border-moss-600 hover:text-moss-700"
                                >
                                    Explore services <ArrowRight size={16} />
                                </a>
                            </div>
                            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-slate-200 pt-6">
                                <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                    <Check
                                        size={17}
                                        className="text-moss-600"
                                    />{' '}
                                    Fast turnaround
                                </span>
                                <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                    <Check
                                        size={17}
                                        className="text-moss-600"
                                    />{' '}
                                    Corporate-ready care
                                </span>
                                <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                                    <Check
                                        size={17}
                                        className="text-moss-600"
                                    />{' '}
                                    Digital records
                                </span>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7, delay: 0.12 }}
                            className="relative mx-auto w-full max-w-xl lg:max-w-none"
                        >
                            <div className="relative overflow-hidden rounded-[2rem] bg-slate-300 shadow-2xl shadow-moss-900/10">
                                <img
                                    src={heroImage}
                                    alt="Professional healthcare team at work"
                                    className="h-[390px] w-full object-cover sm:h-[500px]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent" />
                            </div>
                            <div className="absolute -bottom-5 -left-2 rounded-2xl border border-white/90 bg-white p-4 shadow-xl sm:-left-8 sm:p-5">
                                <div className="flex items-center gap-3">
                                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-moss-50 text-moss-700">
                                        <HeartPulse size={20} />
                                    </span>
                                    <span>
                                        <strong className="block text-lg leading-none text-slate-950">
                                            12,000+
                                        </strong>
                                        <small className="mt-1 block text-xs font-medium text-slate-500">
                                            Employees cared for
                                        </small>
                                    </span>
                                </div>
                            </div>
                            <div className="absolute top-4 right-4 rounded-xl bg-moss-800/90 px-3 py-2 text-xs font-bold text-white backdrop-blur">
                                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-moss-400" />
                                Clinic open today
                            </div>
                        </motion.div>
                    </div>
                    <div className="border-y border-slate-200 bg-white/80">
                        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-5 sm:px-7">
                            <p className="text-xs font-bold tracking-[.14em] text-slate-400 uppercase">
                                Trusted by teams across industries
                            </p>
                            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-extrabold tracking-wide text-slate-400">
                                <span>METROBUILD</span>
                                <span>APEX MFG</span>
                                <span>NORTHSTAR</span>
                                <span>BLUEFORGE</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="about" className="py-20 sm:py-28">
                    <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-7 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
                        <div className="relative">
                            <img
                                src={clinicImage}
                                alt="Living Myth clinic care environment"
                                className="h-80 w-full rounded-[1.75rem] object-cover sm:h-[400px]"
                            />
                            <div className="absolute right-5 bottom-5 rounded-2xl bg-moss-700 px-5 py-4 text-white shadow-xl">
                                <strong className="block text-3xl tracking-tight">
                                    8+
                                </strong>
                                <span className="text-xs font-semibold text-moss-100">
                                    Years of trusted care
                                </span>
                            </div>
                        </div>
                        <div>
                            <SectionTitle
                                eyebrow="The Living Myth difference"
                                title="Healthcare that keeps your workforce moving."
                                text="We combine clinical excellence with a practical understanding of the demands behind every shift, site, and safety program."
                            />
                            <div className="mt-9 grid gap-5 sm:grid-cols-2">
                                {[
                                    [
                                        Award,
                                        'Licensed professionals',
                                        'Experienced physicians and medical technologists you can rely on.',
                                    ],
                                    [
                                        FileCheck2,
                                        'Compliance-minded',
                                        'Programs built to support workplace health and safety needs.',
                                    ],
                                    [
                                        Clock3,
                                        'Efficient experience',
                                        'Streamlined workflows that respect your team’s time.',
                                    ],
                                    [
                                        UsersRound,
                                        'Human-centered care',
                                        'Clear guidance and thoughtful support at every visit.',
                                    ],
                                ].map(([Icon, title, text]) => (
                                    <div
                                        key={String(title)}
                                        className="flex gap-3"
                                    >
                                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-moss-50 text-moss-700">
                                            <Icon size={19} />
                                        </span>
                                        <p className="text-sm leading-6 text-slate-500">
                                            <strong className="block text-slate-900">
                                                {String(title)}
                                            </strong>
                                            {String(text)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="services" className="bg-moss-800 py-20 sm:py-28">
                    <div className="mx-auto max-w-7xl px-5 sm:px-7">
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                            <div>
                                <p className="mb-4 text-xs font-bold tracking-[.18em] text-moss-300 uppercase">
                                    Clinical services
                                </p>
                                <h2 className="max-w-xl text-3xl font-extrabold tracking-[-.035em] text-white sm:text-4xl">
                                    Complete care for every stage of employment.
                                </h2>
                            </div>
                            <a
                                href="#contact"
                                className="inline-flex items-center gap-2 text-sm font-bold text-moss-300 hover:text-white"
                            >
                                Talk to our team <ArrowRight size={16} />
                            </a>
                        </div>
                        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {services.map(
                                ({ icon: Icon, title, short, text }) => (
                                    <motion.article
                                        whileHover={{ y: -4 }}
                                        key={short}
                                        className="group rounded-2xl border border-white/10 bg-white/[.045] p-6 transition hover:border-moss-400/40 hover:bg-white/[.08]"
                                    >
                                        <div className="flex items-start justify-between">
                                            <span className="grid h-11 w-11 place-items-center rounded-xl bg-moss-400/10 text-moss-300">
                                                <Icon size={21} />
                                            </span>
                                            <span className="text-xs font-extrabold tracking-wider text-slate-500">
                                                {short}
                                            </span>
                                        </div>
                                        <h3 className="mt-7 text-lg font-bold text-white">
                                            {title}
                                        </h3>
                                        <p className="mt-3 text-sm leading-6 text-slate-400">
                                            {text}
                                        </p>
                                        <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-moss-300 opacity-0 transition group-hover:opacity-100">
                                            Learn more <ArrowRight size={13} />
                                        </span>
                                    </motion.article>
                                ),
                            )}
                        </div>
                    </div>
                </section>

                <section id="corporate" className="py-20 sm:py-28">
                    <div className="mx-auto max-w-7xl px-5 sm:px-7">
                        <SectionTitle
                            eyebrow="Corporate solutions"
                            title="One healthcare partner. A stronger workforce."
                            text="Flexible, end-to-end programs designed for modern businesses—from a single clinic day to continuous workforce health management."
                        />
                        <div className="mt-12 grid overflow-hidden rounded-[1.75rem] border border-slate-200 lg:grid-cols-2">
                            <div className="bg-[#edf4eb] p-8 sm:p-11">
                                <div className="grid h-12 w-12 place-items-center rounded-xl bg-moss-700 text-white">
                                    <Building2 size={23} />
                                </div>
                                <h3 className="mt-7 text-2xl font-extrabold tracking-[-.03em] text-slate-950">
                                    Built around your operation
                                </h3>
                                <ul className="mt-6 space-y-4">
                                    {[
                                        'Company healthcare programs',
                                        'On-site medical services',
                                        'Employee wellness programs',
                                        'Health surveillance & reporting',
                                        'Annual company medical exams',
                                    ].map((item) => (
                                        <li
                                            key={item}
                                            className="flex gap-3 text-sm font-medium text-slate-600"
                                        >
                                            <Check
                                                size={18}
                                                className="shrink-0 text-moss-600"
                                            />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <a
                                    href="#contact"
                                    className="mt-9 inline-flex items-center gap-2 rounded-xl bg-moss-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-moss-700"
                                >
                                    Discuss a corporate program{' '}
                                    <ArrowRight size={16} />
                                </a>
                            </div>
                            <div className="relative min-h-80">
                                <img
                                    src={doctorImage}
                                    alt="Clinic doctor ready to support corporate employees"
                                    className="absolute inset-0 h-full w-full object-cover object-top"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                                <p className="absolute right-7 bottom-7 left-7 text-lg leading-snug font-bold text-white">
                                    Dedicated care teams, clear reporting, and a
                                    seamless employee experience.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-y border-slate-200 bg-slate-50 py-20 sm:py-24">
                    <div className="mx-auto max-w-7xl px-5 sm:px-7">
                        <SectionTitle
                            centered
                            eyebrow="Simple by design"
                            title="From inquiry to results, without the friction."
                        />
                        <div className="mt-12 grid gap-7 md:grid-cols-4">
                            {[
                                [
                                    '01',
                                    'Tell us what you need',
                                    'Share your team size, needs, and preferred timeline.',
                                ],
                                [
                                    '02',
                                    'We schedule your team',
                                    'Choose in-clinic, on-site, or a hybrid setup.',
                                ],
                                [
                                    '03',
                                    'Your employees are cared for',
                                    'A smooth, professional clinic experience from arrival to assessment.',
                                ],
                                [
                                    '04',
                                    'Receive secure results',
                                    'Get clear, timely reports through your designated channel.',
                                ],
                            ].map(([num, title, text], i) => (
                                <div key={num} className="relative">
                                    <span className="text-5xl font-extrabold tracking-[-.07em] text-moss-100">
                                        {num}
                                    </span>
                                    {i < 3 && (
                                        <span className="absolute top-7 right-0 hidden h-px w-1/2 bg-slate-200 md:block" />
                                    )}
                                    <h3 className="mt-4 text-base font-extrabold text-slate-950">
                                        {title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        {text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-20 sm:py-28">
                    <div className="mx-auto max-w-7xl px-5 sm:px-7">
                        <SectionTitle
                            centered
                            eyebrow="Client voices"
                            title="Trusted by the people behind great teams."
                        />
                        <div className="mt-12 grid gap-5 lg:grid-cols-3">
                            {[
                                [
                                    '“Their process is incredibly organized. We can manage our annual exams with confidence and minimal downtime.”',
                                    'Maria Santos',
                                    'HR Manager, Manufacturing',
                                ],
                                [
                                    '“Responsive, professional, and fast. Living Myth is a true extension of our employee care program.”',
                                    'John Reyes',
                                    'Safety Officer, Logistics',
                                ],
                                [
                                    '“The digital results and dedicated support make managing compliance much simpler for our team.”',
                                    'Aileen Cruz',
                                    'People Operations Lead',
                                ],
                            ].map(([quote, name, role]) => (
                                <blockquote
                                    key={name}
                                    className="rounded-2xl border border-slate-200 p-7 shadow-sm"
                                >
                                    <div className="mb-6 text-lg tracking-[.18em] text-moss-500">
                                        ★★★★★
                                    </div>
                                    <p className="text-base leading-7 text-slate-700">
                                        {quote}
                                    </p>
                                    <footer className="mt-7 border-t border-slate-100 pt-5">
                                        <strong className="block text-sm text-slate-950">
                                            {name}
                                        </strong>
                                        <span className="mt-1 block text-xs text-slate-500">
                                            {role}
                                        </span>
                                    </footer>
                                </blockquote>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-moss-50 py-20 sm:py-24">
                    <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-7 lg:grid-cols-2">
                        <SectionTitle
                            eyebrow="Frequently asked questions"
                            title="Straight answers for smarter planning."
                        />
                        <div className="divide-y divide-moss-900/10">
                            {faqs.map(([question, answer], i) => (
                                <div key={question}>
                                    <button
                                        onClick={() =>
                                            setFaq(faq === i ? null : i)
                                        }
                                        className="flex w-full items-center justify-between gap-5 py-5 text-left text-sm font-bold text-slate-900"
                                    >
                                        <span>{question}</span>
                                        <ChevronDown
                                            size={19}
                                            className={`shrink-0 text-moss-700 transition ${faq === i ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    <AnimatePresence>
                                        {faq === i && (
                                            <motion.p
                                                initial={{
                                                    height: 0,
                                                    opacity: 0,
                                                }}
                                                animate={{
                                                    height: 'auto',
                                                    opacity: 1,
                                                }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden pb-5 text-sm leading-6 text-slate-600"
                                            >
                                                {answer}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section
                    id="contact"
                    className="bg-moss-800 py-20 text-white sm:py-28"
                >
                    <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-7 lg:grid-cols-[.9fr_1.1fr]">
                        <div>
                            <p className="mb-4 text-xs font-bold tracking-[.18em] text-moss-300 uppercase">
                                Let’s talk
                            </p>
                            <h2 className="text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">
                                Ready to care for your workforce better?
                            </h2>
                            <p className="mt-5 max-w-md leading-7 text-slate-400">
                                Tell us about your organization and our
                                corporate care team will be in touch within one
                                business day.
                            </p>
                            <div className="mt-9 space-y-5 text-sm">
                                <p className="flex gap-3">
                                    <Phone
                                        className="shrink-0 text-moss-300"
                                        size={19}
                                    />
                                    <span>
                                        <strong className="block text-white">
                                            (02) 8123 4567
                                        </strong>
                                        <span className="text-slate-400">
                                            Mon–Fri, 8:00 AM–5:00 PM
                                        </span>
                                    </span>
                                </p>
                                <p className="flex gap-3">
                                    <Mail
                                        className="shrink-0 text-moss-300"
                                        size={19}
                                    />
                                    <span>
                                        <strong className="block text-white">
                                            livingmythindustrialclinic@gmail.com
                                        </strong>
                                        <span className="text-slate-400">
                                            Corporate care inquiries
                                        </span>
                                    </span>
                                </p>
                                <p className="flex gap-3">
                                    <MapPin
                                        className="shrink-0 text-moss-300"
                                        size={19}
                                    />
                                    <span>
                                        <strong className="block text-white">
                                            Living Myth Industrial Clinic
                                        </strong>
                                        <span className="text-slate-400">
                                            Your trusted local health partner
                                        </span>
                                    </span>
                                </p>
                            </div>
                        </div>
                        <form
                            className="rounded-[1.5rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-8"
                            onSubmit={(e) => e.preventDefault()}
                        >
                            <h3 className="text-xl font-extrabold tracking-[-.03em]">
                                Request a consultation
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                We’ll tailor a program to your company’s needs.
                            </p>
                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                {[
                                    ['Name', 'Your full name'],
                                    ['Company', 'Company name'],
                                    ['Work email', 'you@company.com'],
                                    ['Phone', 'Your contact number'],
                                ].map(([label, placeholder]) => (
                                    <label
                                        key={label}
                                        className="text-xs font-bold text-slate-700"
                                    >
                                        {label}
                                        <input
                                            aria-label={label}
                                            placeholder={placeholder}
                                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm transition outline-none placeholder:text-slate-400 focus:border-moss-600 focus:bg-white focus:ring-2 focus:ring-moss-100"
                                        />
                                    </label>
                                ))}
                            </div>
                            <label className="mt-4 block text-xs font-bold text-slate-700">
                                How can we help?
                                <textarea
                                    aria-label="How can we help?"
                                    rows={3}
                                    placeholder="Tell us about your workforce needs..."
                                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm transition outline-none placeholder:text-slate-400 focus:border-moss-600 focus:bg-white focus:ring-2 focus:ring-moss-100"
                                />
                            </label>
                            <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-moss-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-moss-800">
                                Send inquiry <ArrowRight size={16} />
                            </button>
                        </form>
                    </div>
                </section>
                <footer className="bg-moss-800 px-5 pb-7 sm:px-7">
                    <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
                        <span>
                            © {new Date().getFullYear()} Living Myth Industrial
                            Clinic. All rights reserved.
                        </span>
                        <span>
                            Occupational healthcare for safer, stronger
                            workplaces.
                        </span>
                    </div>
                </footer>
            </main>
        </>
    );
}
