import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import logo from '/resources/images/full_logo.png';
import {
    Calendar,
    Shield,
    CheckCircle,
    Clock,
} from 'lucide-react';

function Navbar() {
    return (
        <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="fixed top-0 left-0 w-full z-50 px-6 pt-5"
        >
            <div className="max-w-7xl mx-auto">
                <div className="
                    relative
                    flex items-center justify-between
                    px-6 py-4
                    rounded-3xl
                    border border-white/10
                    bg-white/5
                    backdrop-blur-2xl
                    shadow-[0_8px_32px_rgba(0,0,0,0.25)]
                    overflow-hidden
                ">

                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-cyan-500/5 to-blue-500/5 pointer-events-none" />

                    {/* LEFT */}
                    <div className="relative flex items-center gap-10">
                        
                        {/* LOGO */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="
                                w-11 h-11
                                rounded-2xl
                                bg-gradient-to-br from-teal-400 to-cyan-600
                                flex items-center justify-center
                                shadow-lg shadow-teal-500/20
                                group-hover:scale-105
                                transition-all
                            ">
                                <img
                                    src={logo}
                                    alt="Logo"
                                    className="w-7 h-7 object-contain"
                                />
                            </div>

                            <div className="hidden sm:block">
                                <h1 className="text-white font-black leading-none text-sm tracking-wide">
                                    LIVING MYTH
                                </h1>

                                <p className="text-white/40 text-[10px] uppercase tracking-[0.25em]">
                                    Industrial Clinic
                                </p>
                            </div>
                        </Link>

                        {/* NAV LINKS */}
                        <div className="hidden lg:flex items-center gap-2">
                            {[
                                { name: 'Home', href: '#home' },
                                { name: 'About', href: '#about' },
                                { name: 'Services', href: '#services' },
                                { name: 'Appointments', href: '#appointments' },
                            ].map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="
                                        relative
                                        px-4 py-2
                                        rounded-xl
                                        text-sm
                                        font-medium
                                        text-white/60
                                        hover:text-white
                                        hover:bg-white/5
                                        transition-all
                                        duration-300
                                        group
                                    "
                                >
                                    {item.name}

                                    <span className="
                                        absolute left-1/2 -translate-x-1/2 bottom-1
                                        w-0 h-[2px]
                                        bg-gradient-to-r from-teal-400 to-cyan-500
                                        group-hover:w-8
                                        transition-all duration-300
                                        rounded-full
                                    " />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="relative flex items-center gap-3">

                        {/* LOGIN */}
                        <Link
                            href="/login"
                            className="
                                px-5 py-2.5
                                rounded-xl
                                border border-white/10
                                bg-white/5
                                text-white/70
                                text-sm
                                font-semibold
                                hover:bg-white/10
                                hover:text-white
                                transition-all
                            "
                        >
                            Login
                        </Link>

                        {/* REGISTER */}
                        <Link
                            href="/register"
                            className="
                                px-5 py-2.5
                                rounded-xl
                                bg-gradient-to-r from-teal-500 to-cyan-600
                                text-white
                                text-sm
                                font-bold
                                shadow-lg shadow-cyan-500/20
                                hover:scale-[1.03]
                                hover:shadow-cyan-500/40
                                transition-all
                            "
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}

function HeroSection() {
    return (
        <section
            id="home"
            className="relative min-h-screen bg-[#0a1628] overflow-hidden flex items-center"
        >
            {/* Background Glow */}
            <div className="absolute top-[-80px] right-[-80px] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-3xl" />
            <div className="absolute bottom-[-100px] left-[20%] w-[300px] h-[300px] rounded-full bg-blue-600/15 blur-3xl" />

            <Navbar />

            <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-24 pb-16 flex items-center gap-16">

                {/* LEFT */}
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex-1"
                >
                    <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
                        Living Myth Industrial Clinic
                    </div>

                    <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-white mb-5">
                        Your Trusted
                        <br />
                        Partner in
                        <br />
                        <span className="text-teal-400">
                            Healthcare
                        </span>
                    </h1>

                    <p className="text-white/55 text-base leading-relaxed mb-8 max-w-md">
                        Experience fast, reliable, and modern healthcare
                        services with Living Myth Industrial Clinic.
                    </p>

                    <div className="flex gap-3 mb-10">
                        <Link
                            href="/login"
                            className="px-7 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-teal-500/20"
                        >
                            Book Appointment
                        </Link>

                        <Link
                            href="#about"
                            className="px-7 py-3 border border-white/20 text-white/80 rounded-full font-semibold text-sm hover:bg-white/8 transition-all"
                        >
                            Learn More
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-8">
                        {[
                            { num: '8+', label: 'Years Experience' },
                            { num: '3+', label: 'Doctors' },
                            { num: '8+', label: 'Medical Services' },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-8">
                                {i > 0 && (
                                    <div className="w-px h-8 bg-white/10" />
                                )}

                                <div>
                                    <div className="text-2xl font-extrabold text-teal-400">
                                        {s.num}
                                    </div>

                                    <div className="text-xs text-white/45 mt-0.5">
                                        {s.label}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* RIGHT SIDE */}
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="hidden lg:flex flex-col gap-4 w-72"
                >
                    <div className="bg-white/6 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-widest font-bold mb-3">
                            <Clock className="w-3.5 h-3.5" />
                            Clinic Hours
                        </div>

                        <p className="text-white font-semibold text-sm">
                            Mon–Fri • 8:00 AM – 5:00 PM
                        </p>

                        <span className="inline-block mt-2 bg-teal-500/15 text-teal-400 text-xs font-bold px-3 py-1 rounded-full border border-teal-500/20">
                            Open Today
                        </span>
                    </div>

                    <div className="bg-white/6 border border-white/10 rounded-2xl p-5">
                        <div className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3">
                            Services
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {[
                                'Consultation',
                                'Dental',
                                'Laboratory',
                                'Medical Clearance',
                            ].map((s) => (
                                <div
                                    key={s}
                                    className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5 text-xs text-white/60 text-center"
                                >
                                    {s}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

function AboutSection() {
    return (
        <section
            id="about"
            className="py-24 px-6 bg-white"
        >
            <div className="max-w-6xl mx-auto">
                <div className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-2">
                    About Us
                </div>

                <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
                    About Living Myth Clinic
                </h2>

                <p className="text-gray-500 mb-12 max-w-xl">
                    We provide modern healthcare services with trusted medical professionals.
                </p>

                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        {
                            icon: <CheckCircle className="w-5 h-5 text-teal-600" />,
                            title: 'Trusted Care',
                            desc: 'Reliable healthcare for all patients.',
                        },
                        {
                            icon: <Calendar className="w-5 h-5 text-blue-600" />,
                            title: 'Easy Booking',
                            desc: 'Schedule appointments online anytime.',
                        },
                        {
                            icon: <Shield className="w-5 h-5 text-purple-600" />,
                            title: 'Secure Records',
                            desc: 'Protected patient information and records.',
                        },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className="bg-gray-50 rounded-2xl p-6 border border-gray-100"
                        >
                            <div className="mb-4">
                                {item.icon}
                            </div>

                            <h3 className="font-bold text-gray-900 mb-2">
                                {item.title}
                            </h3>

                            <p className="text-sm text-gray-500">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function AppointmentSection() {
    return (
        <section
            id="appointments"
            className="py-24 px-6 bg-[#0a1628] text-center"
        >
            <div className="max-w-2xl mx-auto">
                <div className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-4">
                    Start Today
                </div>

                <h2 className="text-4xl font-extrabold text-white mb-4">
                    Ready to Book Your Visit?
                </h2>

                <p className="text-white/50 mb-8">
                    Login or create an account to schedule your appointment.
                </p>

                <Link
                    href="/login"
                    className="inline-block px-10 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full font-bold text-base hover:opacity-90 transition-all shadow-xl shadow-teal-500/20"
                >
                    Login to Continue
                </Link>
            </div>
        </section>
    );
}

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />

            <HeroSection />
            <AboutSection />
            <AppointmentSection />
        </>
    );
}   