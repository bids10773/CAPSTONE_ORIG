import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
    Activity,
    ArrowRight,
    Award,
    BriefcaseMedical,
    Building2,
    CalendarCheck,
    CalendarPlus,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock3,
    FileCheck2,
    HeartPulse,
    Info,
    LogIn,
    Mail,
    MapPin,
    Menu,
    Phone,
    ShieldCheck,
    Stethoscope,
    Syringe,
    MessagesSquare,
    UsersRound,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/motion';
import logo from '/resources/images/full_logo2.png';

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
];

const clinicGallery = [
    {
        src: '/images/lmic3.png',
        alt: 'Vision examination area inside Living Myth clinic',
    },
    {
        src: '/images/lmic4.png',
        alt: 'Patient waiting area inside Living Myth clinic',
    },
    {
        src: '/images/lmic5.png',
        alt: 'Patient completing clinic documents at the service counter',
    },
    {
        src: '/images/lmic7.png',
        alt: 'Patient care and waiting area at Living Myth clinic',
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

function ContactDetail({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-moss-200">
                <Icon size={18} aria-hidden="true" />
            </span>
            <div>
                <dt className="text-xs font-bold tracking-wide text-moss-200 uppercase">
                    {label}
                </dt>
                <dd className="mt-1 text-sm leading-6 font-semibold text-white">
                    {value}
                </dd>
            </div>
        </div>
    );
}

function Navbar() {
    const [open, setOpen] = useState(false);
    const links = [
        { name: 'About', href: '#about', icon: Info },
        { name: 'Services', href: '#services', icon: BriefcaseMedical },
        {
            name: 'Corporate Programs',
            href: '#corporate',
            icon: Building2,
        },
        { name: 'Contact', href: '#contact', icon: MessagesSquare },
    ];
    return (
        <header className="sticky inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-5 py-5 sm:px-7">
                <nav className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_14px_45px_rgba(15,38,60,0.10)] backdrop-blur-lg sm:px-5">
                    <Link
                        href="/"
                        className="flex items-center gap-3"
                        aria-label="Living Myth Industrial Clinic home"
                    >
                        <span className="ph flex h-11 w-[72px] items-center justify-center rounded-xl px-1.5">
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
                    <div className="hidden items-center gap-1 lg:flex">
                        {links.map(({ name, href, icon: Icon }) => (
                            <a
                                key={name}
                                href={href}
                                className="group inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-moss-50 hover:text-moss-800 focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:outline-none"
                            >
                                <Icon className="size-4 text-slate-400 transition-colors group-hover:text-moss-600" />
                                {name}
                            </a>
                        ))}
                    </div>
                    <div className="hidden items-center gap-3 sm:flex">
                        <Link
                            href="/login"
                            className="motion-press inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-moss-50 hover:text-moss-700 focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:outline-none"
                        >
                            <LogIn className="size-4" />
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className="motion-press inline-flex items-center gap-2 rounded-xl bg-moss-800 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-moss-900/10 transition hover:-translate-y-0.5 hover:bg-moss-700 focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            <CalendarPlus className="size-4" />
                            Book a consultation
                        </Link>
                    </div>
                    <button
                        onClick={() => setOpen(!open)}
                        className="motion-press grid h-10 w-10 place-items-center rounded-xl text-slate-800 sm:hidden"
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
                            {links.map(({ name, href, icon: Icon }) => (
                                <a
                                    onClick={() => setOpen(false)}
                                    key={name}
                                    href={href}
                                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-moss-50 hover:text-moss-800"
                                >
                                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-moss-50 text-moss-700">
                                        <Icon className="size-4" />
                                    </span>
                                    {name}
                                </a>
                            ))}
                            <Link
                                href="/login"
                                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-moss-800 px-4 py-3 text-sm font-bold text-white"
                            >
                                <LogIn className="size-4" />
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
    const [galleryIndex, setGalleryIndex] = useState(0);
    const reduceMotion = useReducedMotion();
    const heroItem = {
        hidden: reduceMotion ? {} : { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
    };

    const showPreviousPhoto = () => {
        setGalleryIndex((current) =>
            current === 0 ? clinicGallery.length - 1 : current - 1,
        );
    };

    const showNextPhoto = () => {
        setGalleryIndex((current) =>
            current === clinicGallery.length - 1 ? 0 : current + 1,
        );
    };

    return (
        <>
            <Head title="Occupational Health & Corporate Care">
                <meta
                    name="description"
                    content="Occupational healthcare, medical examinations and corporate wellness programs for modern workforces."
                />
            </Head>
            <main className="overflow-x-clip bg-white font-sans text-slate-900">
                <Navbar />
                <section className="relative isolate bg-[#f4f7f3]">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_20%,rgba(168,195,160,.18),transparent_24rem),radial-gradient(circle_at_14%_85%,rgba(14,116,144,.12),transparent_26rem)]" />
                    <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-14 sm:px-7 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:gap-10 lg:pb-20">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            transition={{
                                staggerChildren: reduceMotion ? 0 : 0.08,
                                delayChildren: reduceMotion ? 0 : 0.04,
                            }}
                            className="pt-10 lg:pt-16"
                        >
                            <motion.div
                                variants={heroItem}
                                transition={{
                                    duration: reduceMotion ? 0 : 0.36,
                                }}
                                className="mb-7 inline-flex items-center gap-2 rounded-full border border-moss-200 bg-white px-3 py-1.5 text-xs font-bold text-moss-800 shadow-sm"
                            >
                                <ShieldCheck size={14} /> Occupational health,
                                done right
                            </motion.div>
                            <motion.h1
                                variants={heroItem}
                                transition={{
                                    duration: reduceMotion ? 0 : 0.36,
                                }}
                                className="max-w-3xl text-4xl leading-[1.06] font-extrabold tracking-[-0.052em] text-slate-950 sm:text-5xl xl:text-[4.2rem]"
                            >
                                Healthier people.{' '}
                                <span className="text-moss-700">
                                    Safer operations.
                                </span>
                            </motion.h1>
                            <motion.p
                                variants={heroItem}
                                transition={{
                                    duration: reduceMotion ? 0 : 0.36,
                                }}
                                className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg"
                            >
                                A trusted healthcare partner for companies that
                                put their people, performance, and compliance
                                first.
                            </motion.p>
                            <motion.div
                                variants={heroItem}
                                transition={{
                                    duration: reduceMotion ? 0 : 0.36,
                                }}
                                className="mt-8 flex flex-wrap gap-3"
                            >
                                <Link
                                    href="/register"
                                    className="motion-press group inline-flex items-center gap-2 rounded-xl bg-moss-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-moss-800/20 transition hover:-translate-y-0.5 hover:bg-moss-800"
                                >
                                    Book a Consultation{' '}
                                    <ArrowRight
                                        size={16}
                                        className="transition group-hover:translate-x-1"
                                    />
                                </Link>
                                <a
                                    href="#services"
                                    className="motion-press inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 transition hover:border-moss-600 hover:text-moss-700"
                                >
                                    Explore services <ArrowRight size={16} />
                                </a>
                            </motion.div>
                            <motion.div
                                variants={heroItem}
                                transition={{
                                    duration: reduceMotion ? 0 : 0.36,
                                }}
                                className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-slate-200 pt-6"
                            >
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
                            </motion.div>
                        </motion.div>
                        <motion.div
                            initial={
                                reduceMotion
                                    ? false
                                    : { opacity: 0, y: 12, scale: 0.98 }
                            }
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                                duration: reduceMotion ? 0 : 0.42,
                                delay: reduceMotion ? 0 : 0.22,
                            }}
                            className="relative mx-auto w-full max-w-xl lg:max-w-none"
                        >
                            <div className="relative overflow-hidden rounded-[2rem] bg-slate-300 shadow-2xl shadow-moss-900/10">
                                <img
                                    src="/images/lmic1.png"
                                    alt="Living Myth clinician consulting with a patient"
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

                <section id="about" className="scroll-mt-28 py-20 sm:py-28">
                    <Reveal className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-7 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
                        <div className="group relative overflow-hidden rounded-[1.75rem] bg-moss-50 shadow-xl shadow-moss-900/10">
                            <img
                                src="/images/lmic6.png"
                                alt="Living Myth clinic reception staff assisting a patient"
                                loading="lazy"
                                decoding="async"
                                className="h-80 w-full object-cover object-center transition duration-700 group-hover:scale-[1.02] sm:h-[400px]"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
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
                    </Reveal>
                </section>

                <section
                    aria-labelledby="clinic-gallery-title"
                    className="border-y border-slate-200 bg-[#f4f7f3] py-20 sm:py-24"
                >
                    <Reveal className="mx-auto max-w-7xl px-5 sm:px-7">
                        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                            <div>
                                <p className="mb-4 text-xs font-bold tracking-[.18em] text-moss-700 uppercase">
                                    Inside our clinic
                                </p>
                                <h2
                                    id="clinic-gallery-title"
                                    className="max-w-xl text-3xl font-extrabold tracking-[-.035em] text-slate-950 sm:text-4xl"
                                >
                                    A closer look at where care happens.
                                </h2>
                            </div>
                            <p className="max-w-md text-sm leading-6 text-slate-600">
                                Real moments from our clinic—from reception and
                                patient assistance to examinations and
                                consultations.
                            </p>
                        </div>

                        <div className="relative mt-10 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl shadow-moss-900/10">
                            <AnimatePresence mode="wait">
                                <motion.figure
                                    key={clinicGallery[galleryIndex].src}
                                    initial={{ opacity: 0, x: 28 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -28 }}
                                    transition={{ duration: 0.3 }}
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 0 }}
                                    dragElastic={0.15}
                                    onDragEnd={(_, info) => {
                                        if (info.offset.x < -60) {
                                            showNextPhoto();
                                        } else if (info.offset.x > 60) {
                                            showPreviousPhoto();
                                        }
                                    }}
                                    className="relative aspect-[4/3] cursor-grab overflow-hidden bg-moss-50 active:cursor-grabbing sm:aspect-[16/9]"
                                    aria-live="polite"
                                >
                                    <img
                                        src={clinicGallery[galleryIndex].src}
                                        alt={clinicGallery[galleryIndex].alt}
                                        loading="lazy"
                                        decoding="async"
                                        className="h-full w-full object-cover select-none"
                                        draggable={false}
                                    />
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
                                    <figcaption className="absolute right-5 bottom-5 left-5 text-sm font-bold text-white sm:right-7 sm:bottom-7 sm:left-7">
                                        Photo {galleryIndex + 1} of{' '}
                                        {clinicGallery.length}
                                    </figcaption>
                                </motion.figure>
                            </AnimatePresence>

                            <button
                                type="button"
                                onClick={showPreviousPhoto}
                                aria-label="Show previous clinic photo"
                                className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-slate-900 shadow-lg backdrop-blur transition hover:bg-white focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 focus-visible:outline-none sm:left-5"
                            >
                                <ChevronLeft size={21} aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                onClick={showNextPhoto}
                                aria-label="Show next clinic photo"
                                className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-slate-900 shadow-lg backdrop-blur transition hover:bg-white focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 focus-visible:outline-none sm:right-5"
                            >
                                <ChevronRight size={21} aria-hidden="true" />
                            </button>
                        </div>

                        <div
                            className="mt-5 flex justify-center gap-2"
                            aria-label="Choose a clinic photo"
                        >
                            {clinicGallery.map((photo, index) => (
                                <button
                                    key={photo.src}
                                    type="button"
                                    onClick={() => setGalleryIndex(index)}
                                    aria-label={`Show clinic photo ${index + 1}`}
                                    aria-current={
                                        galleryIndex === index
                                            ? 'true'
                                            : undefined
                                    }
                                    className={`h-2.5 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-moss-600 focus-visible:ring-offset-2 focus-visible:outline-none ${
                                        galleryIndex === index
                                            ? 'w-8 bg-moss-700'
                                            : 'w-2.5 bg-moss-300 hover:bg-moss-500'
                                    }`}
                                />
                            ))}
                        </div>
                    </Reveal>
                </section>

                <section
                    id="services"
                    className="scroll-mt-28 bg-moss-800 py-20 sm:py-28"
                >
                    <Reveal className="mx-auto max-w-7xl px-5 sm:px-7">
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
                        <StaggerGroup className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {services.map(
                                ({ icon: Icon, title, short, text }) => (
                                    <StaggerItem key={short}>
                                        <motion.article
                                            whileHover={{ y: -4 }}
                                            className="group h-full rounded-2xl border border-white/10 bg-white/[.045] p-6 transition hover:border-moss-400/40 hover:bg-white/[.08]"
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
                                                Learn more{' '}
                                                <ArrowRight size={13} />
                                            </span>
                                        </motion.article>
                                    </StaggerItem>
                                ),
                            )}
                        </StaggerGroup>
                    </Reveal>
                </section>

                <section id="corporate" className="scroll-mt-28 py-20 sm:py-28">
                    <Reveal className="mx-auto max-w-7xl px-5 sm:px-7">
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
                                    src="/images/lmic2.png"
                                    alt="Living Myth clinic staff assisting a patient at the service window"
                                    loading="lazy"
                                    decoding="async"
                                    className="absolute inset-0 h-full w-full object-cover object-center"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                                <p className="absolute right-7 bottom-7 left-7 text-lg leading-snug font-bold text-white">
                                    Dedicated care teams, clear reporting, and a
                                    seamless employee experience.
                                </p>
                            </div>
                        </div>
                    </Reveal>
                </section>

                <section className="border-y border-slate-200 bg-slate-50 py-20 sm:py-24">
                    <Reveal className="mx-auto max-w-7xl px-5 sm:px-7">
                        <SectionTitle
                            centered
                            eyebrow="Simple by design"
                            title="From inquiry to results, without the friction."
                        />
                        <StaggerGroup className="mt-12 grid gap-7 md:grid-cols-4">
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
                                <StaggerItem key={num} className="relative">
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
                                </StaggerItem>
                            ))}
                        </StaggerGroup>
                    </Reveal>
                </section>

                <section className="py-20 sm:py-28">
                    <Reveal className="mx-auto max-w-7xl px-5 sm:px-7">
                        <SectionTitle
                            centered
                            eyebrow="Client voices"
                            title="Trusted by the people behind great teams."
                        />
                        <StaggerGroup className="mt-12 grid gap-5 lg:grid-cols-3">
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
                                <StaggerItem key={name}>
                                    <blockquote className="h-full rounded-2xl border border-slate-200 p-7 shadow-sm transition-colors hover:border-moss-200">
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
                                </StaggerItem>
                            ))}
                        </StaggerGroup>
                    </Reveal>
                </section>

                <section className="bg-moss-50 py-20 sm:py-24">
                    <Reveal className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-7 lg:grid-cols-2">
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
                    </Reveal>
                </section>

                <section
                    id="contact"
                    className="relative isolate scroll-mt-28 overflow-hidden bg-moss-900 py-20 text-white sm:py-28"
                    style={{
                        backgroundImage: "url('/images/BGofMaps.png')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    <div
                        className="absolute inset-0 -z-10 bg-moss-950/75"
                        aria-hidden="true"
                    />
                    <div
                        className="absolute inset-0 -z-10 bg-gradient-to-r from-moss-950/50 via-transparent to-moss-950/30"
                        aria-hidden="true"
                    />
                    <div className="mx-auto max-w-7xl px-5 sm:px-7">
                        <Reveal className="mx-auto max-w-2xl text-center">
                            <p className="text-xs font-bold tracking-[.18em] text-moss-200 uppercase">
                                Contact · Find us
                            </p>
                            <h2 className="mt-4 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">
                                Visit Living Myth Industrial Clinic
                            </h2>
                            <p className="mx-auto mt-4 max-w-xl leading-7 text-white/80">
                                Find us at Serafin Business Center in Banlic,
                                Cabuyao, Laguna.
                            </p>
                        </Reveal>

                        <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-[.78fr_1.22fr] lg:gap-7">
                            <Reveal
                                offsetX={-12}
                                offsetY={0}
                                className="rounded-[1.5rem] border border-white/20 bg-moss-950/80 p-6 shadow-[0_20px_55px_rgba(12,25,15,.22)] backdrop-blur-sm sm:p-8"
                            >
                                <h3 className="text-xl font-extrabold tracking-[-.03em]">
                                    Contact information
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-white/70">
                                    Reach the clinic or visit us during our
                                    regular operating hours.
                                </p>
                                <dl className="mt-7 space-y-6">
                                    <ContactDetail
                                        icon={MapPin}
                                        label="Clinic address"
                                        value="2nd Floor, Serafin Business Center, National Highway Banlic, Cabuyao, Laguna"
                                    />
                                    <ContactDetail
                                        icon={Phone}
                                        label="Contact number"
                                        value="+63 922 889 6850"
                                    />
                                    <ContactDetail
                                        icon={Mail}
                                        label="Email"
                                        value="livingmythindustrialclinic@gmail.com"
                                    />
                                    <ContactDetail
                                        icon={Clock3}
                                        label="Clinic hours"
                                        value="Monday–Friday, 8:00 AM–5:00 PM"
                                    />
                                </dl>
                            </Reveal>

                            <Reveal offsetX={12} offsetY={0}>
                                <figure className="h-full overflow-hidden rounded-[1.5rem] border border-white/25 bg-white p-2.5 shadow-[0_20px_55px_rgba(12,25,15,.28)] sm:p-3">
                                    <div className="flex h-full min-h-72 items-center overflow-hidden rounded-[1.05rem] bg-slate-100 sm:min-h-96">
                                        <img
                                            src="/images/Maps.png"
                                            alt="Map showing the location of Living Myth Industrial Clinic"
                                            className="h-full w-full object-contain"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </div>
                                    <figcaption className="px-2 pt-3 pb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                        Clinic location · Banlic, Cabuyao,
                                        Laguna
                                    </figcaption>
                                </figure>
                            </Reveal>
                        </div>
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
