import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

// --- Components ---

const GlitchText = ({ text }: { text: string }) => {
    return (
        <div className="relative inline-block group">
            <span className="relative z-10">{text}</span>
            <span className="absolute top-0 left-0 -z-10 w-full h-full text-red-400 opacity-0 group-hover:opacity-70 animate-pulse translate-x-[2px]">
                {text}
            </span>
            <span className="absolute top-0 left-0 -z-10 w-full h-full text-white opacity-0 group-hover:opacity-70 animate-pulse -translate-x-[2px]">
                {text}
            </span>
        </div>
    );
};

const Particle = ({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) => {
    return (
        <motion.div
            className="absolute rounded-full bg-red-500 blur-[1px]"
            style={{
                width: size,
                height: size,
                left: x,
                top: y,
            }}
            animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
            }}
            transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: delay,
                ease: "easeInOut",
            }}
        />
    );
};

const Star = ({ x, y, size }: { x: number; y: number; size: number }) => {
    return (
        <motion.div
            className="absolute bg-white rounded-full"
            style={{
                width: size,
                height: size,
                left: `${x}%`,
                top: `${y}%`,
            }}
            animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1],
            }}
            transition={{
                duration: 3 + Math.random() * 3,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        />
    );
};

// --- Main Page Component ---

export default function Cosmic404() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);
    const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

    // Mouse tracking for parallax effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const x = useSpring(mouseX, springConfig);
    const y = useSpring(mouseY, springConfig);

    // Parallax transforms
    const rotateX = useTransform(y, [-0.5, 0.5], ["5deg", "-5deg"]);
    const rotateY = useTransform(x, [-0.5, 0.5], ["-5deg", "5deg"]);

    useEffect(() => {
        // Generate random particles
        const newParticles = Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 6 + 2,
            delay: Math.random() * 2,
        }));
        setParticles(newParticles);

        // Generate background stars
        const newStars = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 1,
        }));
        setStars(newStars);
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const normalizedX = (e.clientX - rect.left) / width - 0.5;
        const normalizedY = (e.clientY - rect.top) / height - 0.5;
        mouseX.set(normalizedX);
        mouseY.set(normalizedY);
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative min-h-screen w-full bg-black overflow-hidden flex items-center justify-center font-sans selection:bg-red-500 selection:text-white"
        >
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,0,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />

            {/* Stars Layer */}
            <div className="absolute inset-0 pointer-events-none">
                {stars.map((star) => (
                    <Star key={star.id} {...star} />
                ))}
            </div>

            {/* Floating Particles Layer */}
            <div className="absolute inset-0 pointer-events-none">
                {particles.map((p) => (
                    <Particle key={p.id} {...p} />
                ))}
            </div>

            {/* Main Content Container with 3D Tilt */}
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                className="relative z-10 text-center p-8 max-w-4xl mx-auto perspective-1000"
            >
                {/* Warning Icon */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 1.5, bounce: 0.5 }}
                    className="mb-6 flex justify-center"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500 blur-xl opacity-50 animate-pulse" />
                        <AlertTriangle className="w-20 h-20 text-red-500 relative z-10" strokeWidth={1.5} />
                    </div>
                </motion.div>

                {/* 404 Text */}
                <motion.h1
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-[12rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-red-100 to-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.5)] select-none"
                    style={{ textShadow: "0 0 50px rgba(255,0,0,0.3)" }}
                >
                    <GlitchText text="404" />
                </motion.h1>

                {/* Subtitle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="space-y-4 mt-4"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-white tracking-wider uppercase">
                        Signal Lost
                    </h2>
                    <p className="text-red-200/80 text-lg md:text-xl max-w-lg mx-auto font-light tracking-wide">
                        The page you are looking for has drifted into the void or never existed in this dimension.
                    </p>
                </motion.div>

                {/* Action Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="mt-12"
                >
                    <a
                        href="/"
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-transparent overflow-hidden rounded-none border border-red-500 text-red-500 font-bold uppercase tracking-widest transition-all hover:text-black hover:bg-red-500"
                    >
                        <span className="absolute inset-0 w-full h-full bg-red-500 transform -translate-x-full skew-x-12 group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                        <ArrowLeft className="w-5 h-5 relative z-10 group-hover:-translate-x-1 transition-transform" />
                        <span className="relative z-10">Return to Base</span>
                    </a>
                </motion.div>

                {/* Decorative Circles */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-red-500/20 rounded-full pointer-events-none"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-dashed border-red-500/30 rounded-full pointer-events-none"
                />
            </motion.div>

            {/* Bottom Status Bar */}
            <div className="absolute bottom-0 left-0 w-full p-6 border-t border-red-900/30 bg-black/50 backdrop-blur-sm flex justify-between items-center text-xs text-red-500/60 font-mono uppercase tracking-widest">
                <div>Error Code: 0x404</div>
                <div className="flex gap-4">
                    <span>Sys: Offline</span>
                    <span>Loc: Unknown</span>
                </div>
            </div>
        </div>
    );
}