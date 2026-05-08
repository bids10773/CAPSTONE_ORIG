import { Head, Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import logo from '/resources/images/full_logo.png';
import { useLogoutModal } from '@/contexts/logout-modal-context';
import { Calendar, Settings, LogOut, Shield, CheckCircle, Clock } from 'lucide-react';

function UserMenu() {
    const { auth } = usePage().props as any;
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { openModal } = useLogoutModal();
    const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : 'U';

    return (
        <div className="relative">
            {auth?.user ? (
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center justify-center w-9 h-9 bg-blue-600 rounded-full border-2 border-white/30 font-bold text-sm hover:bg-blue-700 transition-all"
                    >
                        {getInitial(auth.user.name)}
                    </button>
                    <AnimatePresence>
                        {dropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl py-2 text-gray-800 border border-gray-100 z-50"
                            >
                                <div className="px-4 py-3 mb-1 border-b border-gray-100">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 block mb-1">Active Account</span>
                                    <span className="text-sm font-bold text-gray-900 block truncate">{auth.user.name}</span>
                                    <span className="text-xs text-gray-500 truncate block">{auth.user.email}</span>
                                </div>
                                <div className="px-2 space-y-0.5">
                                    <Link href="/settings/profile" className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl hover:bg-teal-50 hover:text-teal-700 transition-colors">
                                        <Settings className="w-4 h-4" /> Account Settings
                                    </Link>
                                    <Link href="/appointments" className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl hover:bg-teal-50 hover:text-teal-700 transition-colors">
                                        <Calendar className="w-4 h-4" /> My Appointments
                                    </Link>
                                </div>
                                <div className="mt-1 pt-1 border-t border-gray-100 px-2">
                                    <button onClick={openModal} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-600 rounded-xl hover:bg-red-50 transition-colors">
                                        <LogOut className="w-4 h-4" /> Sign Out
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <Link href="/login" className="px-5 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full text-sm font-semibold hover:opacity-90 transition-all shadow-md">
                    Login
                </Link>
            )}
        </div>
    );
}

function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
    const prefix = isLoggedIn ? '#dashboard-' : '#';

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
                    bg-[#0f172a]/70
                    backdrop-blur-2xl
                    shadow-[0_8px_32px_rgba(0,0,0,0.35)]
                    overflow-visible
                ">

                    {/* Gradient Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-cyan-500/5 to-blue-500/5 pointer-events-none" />

                    {/* LEFT */}
                    <div className="relative flex items-center gap-10">

                        {/* LOGO */}
                        <Link
                            href="/"
                            className="flex items-center gap-3 group"
                        >
                            <div className="
                                w-11 h-11
                                rounded-2xl
                                bg-gradient-to-br from-teal-400 to-cyan-600
                                flex items-center justify-center
                                shadow-lg shadow-cyan-500/20
                                group-hover:scale-105
                                transition-all
                            ">
                                <img
                                    src={logo}
                                    alt="LMC Logo"
                                    className="w-7 h-7 object-contain"
                                />
                            </div>

                            <div className="hidden sm:block">
                                <h1 className="text-white font-black text-sm leading-none tracking-wide">
                                    LIVING MYTH
                                </h1>

                                <p className="text-white/35 text-[10px] uppercase tracking-[0.25em]">
                                    PATIENT PORTAL
                                </p>
                            </div>
                        </Link>

                        {/* NAVIGATION */}
                        <div className="hidden lg:flex items-center gap-2">
                            {[
                                { name: 'Overview', href: `${prefix}about` },
                                { name: 'Services', href: `${prefix}services` },
                                { name: 'Appointments', href: `${prefix}appointments` },
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
                                        text-white/55
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

                        {/* QUICK ACTION */}
                        <Link
                            href="/appointment"
                            className="
                                hidden md:flex
                                items-center gap-2
                                px-5 py-2.5
                                rounded-xl
                                bg-gradient-to-r
                                from-teal-500
                                to-cyan-600
                                text-white
                                text-sm
                                font-bold
                                shadow-lg shadow-cyan-500/20
                                hover:scale-[1.02]
                                transition-all
                            "
                        >
                            <Calendar className="w-4 h-4" />
                            Book Appointment
                        </Link>

                        {/* USER MENU */}
                        <div className="
                            p-1
                            rounded-2xl
                            border border-white/10
                            bg-white/5
                        ">
                            <UserMenu />
                        </div>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
}

function HeroSection({ user, isLoggedIn = false }: { user?: any; isLoggedIn?: boolean }) {
    return (
        <div className="relative w-full min-h-screen bg-[#0a1628] overflow-hidden flex items-center">
            {/* Background glows */}
            <div className="absolute top-[-80px] right-[-80px] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-3xl" />
            <div className="absolute bottom-[-100px] left-[20%] w-[300px] h-[300px] rounded-full bg-blue-600/15 blur-3xl" />
            <div className="absolute top-[30%] right-[30%] w-[200px] h-[200px] rounded-full bg-cyan-400/8 blur-2xl" />

            <Navbar isLoggedIn={isLoggedIn} />

            <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-24 pb-16 flex items-center gap-16">
                {/* LEFT */}
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="flex-1"
                >
                    <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
                        Industrial Clinic
                    </div>

                    <h1 className="text-5xl font-extrabold leading-tight text-white mb-5">
                        {isLoggedIn ? (
                            <>Hello,<br /><span className="text-teal-400">{user?.first_name}!</span></>
                        ) : (
                            <>Your Trusted<br />Partner in<br /><span className="text-teal-400">Healthcare</span></>
                        )}
                    </h1>

                    <p className="text-white/55 text-base leading-relaxed mb-8 max-w-md">
                        Providing exceptional medical services to the community for over 8 years. Your health is our priority.
                    </p>

                    <div className="flex gap-3 mb-10">
                        <Link
                            href="/appointment"
                            className="px-7 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-teal-500/20"
                        >
                            {isLoggedIn ? 'Book an Appointment' : 'Make an Appointment'}
                        </Link>
                        <Link
                            href="#dashboard-about"
                            className="px-7 py-3 border border-white/20 text-white/80 rounded-full font-semibold text-sm hover:bg-white/8 transition-all"
                        >
                            Learn More
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-8">
                        {[
                            { num: '8+', label: 'Years Experience' },
                            { num: '3+', label: 'Qualified Doctors' },
                            { num: '8+', label: 'Medical Services' },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-8">
                                {i > 0 && <div className="w-px h-8 bg-white/10" />}
                                <div>
                                    <div className="text-2xl font-extrabold text-teal-400">{s.num}</div>
                                    <div className="text-xs text-white/45 mt-0.5">{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* RIGHT — floating info cards */}
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="hidden lg:flex flex-col gap-4 w-72"
                >
                    {/* Next Available */}
                    <div className="bg-white/6 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-widest font-bold mb-3">
                            <Clock className="w-3.5 h-3.5" /> Next Available
                        </div>
                        <p className="text-white font-semibold text-sm">Dr. Santos — Today 2:00 PM</p>
                        <span className="inline-block mt-2 bg-teal-500/15 text-teal-400 text-xs font-bold px-3 py-1 rounded-full border border-teal-500/20">
                            Available Now
                        </span>
                    </div>

                    {/* Services */}
                    <div className="bg-white/6 border border-white/10 rounded-2xl p-5">
                        <div className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3">Our Services</div>
                        <div className="grid grid-cols-2 gap-2">
                            {['Pre-Employment', 'Medical Clearance', 'Dental', 'Consultation'].map(s => (
                                <div key={s} className="bg-white/5 border border-white/8 rounded-lg px-2 py-1.5 text-xs text-white/60 text-center">{s}</div>
                            ))}
                        </div>
                    </div>

                    {/* Hours */}
                    <div className="bg-white/6 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-widest font-bold mb-3">
                            <Calendar className="w-3.5 h-3.5" /> Clinic Hours
                        </div>
                        <p className="text-white font-semibold text-sm">Mon–Fri &nbsp; 8:00 AM – 5:00 PM</p>
                        <span className="inline-block mt-2 bg-blue-500/15 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/20">
                            Open Today
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function AboutSection({ id }: { id: string }) {
    return (
        <motion.section
            id={id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="py-24 px-6 bg-white"
        >
            <div className="max-w-6xl mx-auto">
                <div className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-2">Who We Are</div>
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4">About Living Myth Clinic</h2>
                <p className="text-gray-500 mb-12 max-w-xl">Committed to your health and well-being since 2016.</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-3xl h-64 flex items-center justify-center border border-teal-100">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Shield className="w-10 h-10 text-teal-600" />
                            </div>
                            <p className="text-teal-700 font-bold text-sm">8+ Years of Trusted Care</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {[
                            { icon: <CheckCircle className="w-5 h-5 text-teal-600" />, bg: 'bg-teal-50', title: 'Experienced Team', desc: 'Over 8 years of trusted medical expertise serving our community.' },
                            { icon: <Calendar className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', title: 'Easy Scheduling', desc: 'Book appointments online anytime, from anywhere.' },
                            { icon: <Shield className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50', title: 'Patient Privacy', desc: 'Your data is protected under the Data Privacy Act (RA 10173).' },
                        ].map((f, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>{f.icon}</div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm mb-0.5">{f.title}</h4>
                                    <p className="text-gray-500 text-sm">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

function ServicesSection({ id }: { id: string }) {
    const services = [
        { title: 'Pre-Employment', desc: 'Medical clearance for new employees.', color: 'bg-teal-50', border: 'border-teal-100', icon: '🏥' },
        { title: 'Consultation', desc: 'Specialized care for children of all ages.', color: 'bg-blue-50', border: 'border-blue-100', icon: '👶' },
        { title: 'Dental Services', desc: 'Complete oral healthcare and hygiene.', color: 'bg-amber-50', border: 'border-amber-100', icon: '🦷' },
        { title: 'Medical Clearance', desc: 'Accurate diagnostics and blood work.', color: 'bg-purple-50', border: 'border-purple-100', icon: '🔬' },
    ];
    return (
        <motion.section
            id={id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="py-24 px-6 bg-gray-50"
        >
            <div className="max-w-6xl mx-auto">
                <div className="text-xs font-bold tracking-widest text-teal-600 uppercase mb-2">What We Offer</div>
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Our Services</h2>
                <p className="text-gray-500 mb-12">Comprehensive healthcare for every need.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {services.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            className={`bg-white rounded-2xl p-6 border ${s.border} hover:shadow-lg transition-shadow`}
                        >
                            <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center text-2xl mb-4`}>{s.icon}</div>
                            <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                            <p className="text-gray-500 text-sm">{s.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
}

function AppointmentCTA({ id }: { id: string }) {
    return (
        <motion.section
            id={id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="py-24 px-6 bg-[#0a1628] text-center"
        >
            <div className="max-w-2xl mx-auto">
                <div className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-4">Get Started</div>
                <h2 className="text-4xl font-extrabold text-white mb-4">Ready to Book Your Visit?</h2>
                <p className="text-white/50 mb-8">Schedule an appointment today and experience quality healthcare.</p>
                <Link
                    href="/appointment"
                    className="inline-block px-10 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-full font-bold text-base hover:opacity-90 transition-all shadow-xl shadow-teal-500/20"
                >
                    Book an Appointment
                </Link>
            </div>
        </motion.section>
    );
}

function PatientDashboard({ user }: { user: any }) {
    return (
        <>
            <Head title="Dashboard" />
            <HeroSection user={user} isLoggedIn={true} />
            <AboutSection id="dashboard-about" />
            <ServicesSection id="dashboard-services" />
            <AppointmentCTA id="dashboard-appointments" />
        </>
    );
}

function WelcomePage() {
    return (
        <>
            <Head title="Welcome" />
            <HeroSection isLoggedIn={false} />
            <AboutSection id="about" />
            <ServicesSection id="services" />
            <AppointmentCTA id="appointments" />
        </>
    );
}

export default function Dashboard() {
    const { auth } = usePage().props as any;
    if (auth?.user) return <PatientDashboard user={auth.user} />;
    return <WelcomePage />;
}