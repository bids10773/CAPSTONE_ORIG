import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { show } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';
import type { NavItem } from '@/types';

import { motion } from "framer-motion";

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: null,
    },
    {
        title: 'Password',
        href: editPassword(),
        icon: null,
    },
    {
        title: 'Two-Factor Auth',
        href: show(),
        icon: null,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: null,
    },
];

/* ANIMATION VARIANTS */

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12
        }
    }
};

const item = {
    hidden: { opacity: 0, x: -20 },
    show: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.35 }
    }
};

const content = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4 }
    }
};

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentUrl } = useCurrentUrl();

    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <motion.div
    className="px-4 py-6 min-h-screen bg-gray-50 dark:bg-gray-950 rounded-2xl p-6 shadow-sm"
    initial="hidden"
    animate="show"
    variants={container}
>

            {/* HEADER */}

            <motion.div variants={content}>
                <Heading
                    title="Settings"
                    description="Manage your profile and account settings"
                />
            </motion.div>


            <div className="mt-8 flex flex-col lg:flex-row lg:space-x-12">

                {/* SIDEBAR */}

                <aside className="w-full max-w-xl lg:w-48">

                    <motion.nav
                        variants={container}
                        className="flex flex-col space-y-1 space-x-0"
                        aria-label="Settings"
                    >

                        {sidebarNavItems.map((itemNav, index) => {
                            const active = isCurrentUrl(itemNav.href);

                            return (

                                <motion.div
                                    key={`${toUrl(itemNav.href)}-${index}`}
                                    variants={item}
                                    whileHover={{ scale: 1.03 }}
                                >

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        asChild
                                        className={cn(
                                            'w-full justify-start transition-all duration-200',
                                            'hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20',
                                            active
                                                ? 'bg-primary/15 text-primary font-bold shadow-sm dark:bg-primary/25'
                                                : 'text-muted-foreground dark:text-neutral-400'
                                        )}
                                    >
                                        <Link href={itemNav.href}>
                                            {itemNav.icon && (
                                                <itemNav.icon className="mr-2 h-4 w-4" />
                                            )}
                                            {itemNav.title}
                                        </Link>
                                    </Button>

                                </motion.div>

                            );
                        })}

                    </motion.nav>

                </aside>

                <Separator className="my-6 lg:hidden" />


                {/* CONTENT */}

                <motion.div
                    variants={content}
                    className="flex-1 md:max-w-2xl"
                >

                    <section className="max-w-xl space-y-12">

                        <div className="text-foreground dark:text-white">
                            {children}
                        </div>

                    </section>

                </motion.div>

            </div>

        </motion.div>
    );
}