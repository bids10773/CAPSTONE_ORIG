import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import bgimage from '/public/images/bgpic.jpg';
import heroimage from '/public/images/Doctor.png';
import smallimage from '/public/images/smallpic.jpg';
import logo from '/public/images/full_logo.png';
import { User, LogOut } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage().props;
const isAuthenticated = !!auth?.user;

    const roleDashboardMap: Record<string, string> = {
        admin: '/admin/dashboard',
        doctor: '/doctor/dashboard',
        medtech: '/medtech/dashboard',
        radtech: '/radtech/dashboard',
        company: '/company/dashboard',
    };

    const dashboardHref = auth?.user ? roleDashboardMap[auth.user.role ?? ''] ?? '/dashboard' : '/login';

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net"
                    rel="stylesheet"
                />
            </Head>

            {/* HERO SECTION */}
            <div
                id="home"
                className="relative w-full h-screen bg-cover bg-center overflow-hidden"
                style={{ backgroundImage: `url(${bgimage})` }}
            >
                {/* DARK OVERLAY */}
                <div className="absolute inset-0 bg-black/60 z-0" />

                {/* BLUE GRADIENT RIGHT */}
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-600/80 to-transparent z-0" />
                
                {/* NAVBAR - Slide Down */}
                <motion.nav 
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    transition={{ type: 'spring', stiffness: 50, delay: 0.2 }}
                    className="fixed top-0 left-0 w-full z-50 flex justify-center pt-6 px-10"
                >
                    <div className="flex items-center justify-between w-full max-w-7xl px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-white">
                        
                        {/* Left Side: Logo & Links */}
                        <div className="flex items-center gap-10">
                            <img src={logo} alt="LMC Logo" className="h-10 w-auto" />
                            <div className="hidden md:flex gap-8">
                                <Link href="#home" className="hover:text-blue-300 transition-colors">Home</Link>
                                <Link href="#about" className="hover:text-blue-300 transition-colors">About</Link>
                                <Link href="#services" className="hover:text-blue-300 transition-colors">Services</Link>
                                <Link href="#appointments" className="hover:text-blue-300 transition-colors">Appointments</Link>
                            </div>
                        </div>

                        {/* Right Side: Login Button */}
                        <Link
                            href={dashboardHref}
                            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all shadow-md font-medium"
                        >
                            {isAuthenticated ? 'Dashboard' : 'Login'}
                        </Link>
                    </div>
                </motion.nav>

                {/* LEFT CONTENT - Slide in from Left */}
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative z-10 h-full px-20 pt-32"
                >
                    <div className="max-w-xl text-white">
                        <p className="text-lg opacity-80 mb-2 text-blue-400">
                            Well Beyond Care
                        </p>

                        <h1 className="text-5xl font-bold leading-tight uppercase">
                            YOUR TRUSTED <br />
                            PARTNER IN <br />
                           <span className="text-blue-500">Health</span>
                        </h1>

                        <Link
                            href={isAuthenticated ? '/appointment' : '/login'}
                            className="inline-block mt-6 px-8 py-3 bg-blue-500 rounded-full hover:bg-blue-600 transition shadow-lg font-semibold text-white"
                        >
                            Make An Appointment
                        </Link>

                        {/* STATS CARD - Pop up animation */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.8 }}
                            className="mt-10 flex items-center gap-6 p-6 rounded-xl bg-white/90 text-gray-800 shadow-lg w-fit"
                        >
                            <img
                                src={smallimage}
                                alt="Clinic"
                                className="w-28 h-20 object-cover rounded-lg"
                            />

                            <div className="grid grid-cols-3 gap-8 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">8+</p>
                                    <p className="text-sm">Years of Experience</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">3+</p>
                                    <p className="text-sm">Qualified Doctors</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">8+</p>
                                    <p className="text-sm">Medical Services</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* HERO DOCTOR IMAGE - Slide in from Right */}
                <motion.div 
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="absolute bottom-[150px] right-[-300px] h-[120%] z-20"
                >
                    <img
                        src={heroimage}
                        alt="Doctor"
                        className="h-1000px object-contain drop-shadow-2xl"
                    />
                </motion.div>
            </div>

            {/* ABOUT SECTION - Reveal on Scroll */}
            <motion.section 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                id="about" 
                className="min-h-screen px-20 py-24 bg-white text-gray-800"
            >
                <h2 className="text-4xl font-bold mb-6">About Us</h2>
                <p className="text-lg max-w-2xl">
                    Our clinic has been providing exceptional healthcare services for over 8 years.
                    We prioritize patient care and safety, offering a wide range of medical services tailored to your needs.
                </p>
            </motion.section>

            {/* SERVICES SECTION - Reveal on Scroll */}
            <motion.section 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                id="services" 
                className="min-h-screen px-20 py-24 bg-gray-100 text-gray-800"
            >
                <h2 className="text-4xl font-bold mb-6">Services</h2>
                <ul className="list-disc list-inside space-y-2 max-w-2xl text-lg">
                    <li>General Consultation</li>
                    <li>Pediatric Care</li>
                    <li>Dental Services</li>
                    <li>Laboratory Tests</li>
                    <li>Medical Imaging</li>
                </ul>
            </motion.section>

            {/* APPOINTMENTS SECTION - Reveal on Scroll */}
            <motion.section 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                id="appointments" 
                className="min-h-screen px-20 py-24 bg-white text-gray-800"
            >
                <h2 className="text-4xl font-bold mb-6">Doctors</h2>
                <p className="text-lg max-w-2xl">
        
                </p>
            </motion.section>
        </>
    );
}
