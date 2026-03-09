import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';

interface PageTransitionProps {
    children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
    const location = useLocation();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            // Reset scroll to top on every page change
            window.scrollTo(0, 0);

            // Animation for the new page content
            gsap.fromTo(
                containerRef.current,
                {
                    opacity: 0,
                    y: 20,
                    filter: 'blur(10px)'
                },
                {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    duration: 0.8,
                    ease: 'expo.out',
                    clearProps: 'all' // Clear GSAP-applied styles after animation
                }
            );
        }
    }, [location.pathname]);

    return (
        <div ref={containerRef} className="will-change-[opacity,transform,filter]">
            {children}
        </div>
    );
}
