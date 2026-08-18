import { motion, useReducedMotion } from 'framer-motion';
import type { HTMLMotionProps, Variants } from 'framer-motion';

export const motionTiming = {
    fast: 0.18,
    normal: 0.26,
    entrance: 0.42,
} as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

type RevealProps = HTMLMotionProps<'div'> & {
    delay?: number;
    offsetX?: number;
    offsetY?: number;
    once?: boolean;
};

export function Reveal({
    children,
    delay = 0,
    offsetX = 0,
    offsetY = 16,
    once = true,
    ...props
}: RevealProps) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            initial={
                reduceMotion ? false : { opacity: 0, x: offsetX, y: offsetY }
            }
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once, amount: 0.16 }}
            transition={{
                duration: reduceMotion ? 0 : motionTiming.entrance,
                delay: reduceMotion ? 0 : delay,
                ease: easeOut,
            }}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function PageTransition({ children, ...props }: HTMLMotionProps<'div'>) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            initial={reduceMotion ? false : { opacity: 0.97, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: reduceMotion ? 0 : motionTiming.normal,
                ease: easeOut,
            }}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function StaggerGroup({ children, ...props }: HTMLMotionProps<'div'>) {
    const reduceMotion = useReducedMotion();
    const variants: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: reduceMotion ? 0 : 0.06,
            },
        },
    };

    return (
        <motion.div
            variants={variants}
            initial={reduceMotion ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({ children, ...props }: HTMLMotionProps<'div'>) {
    const reduceMotion = useReducedMotion();
    const variants: Variants = {
        hidden: reduceMotion ? {} : { opacity: 0, y: 12 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: reduceMotion ? 0 : motionTiming.normal,
                ease: easeOut,
            },
        },
    };

    return (
        <motion.div variants={variants} {...props}>
            {children}
        </motion.div>
    );
}
