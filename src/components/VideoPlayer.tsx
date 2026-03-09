import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
    Video, Settings2, Check
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import gsap from 'gsap';

interface VideoPlayerProps {
    url?: string;
    title?: string;
}

type Quality = 'Auto' | '1080p' | '720p' | '480p';

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [quality, setQuality] = useState<Quality>('Auto');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [error, setError] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isHovering, setIsHovering] = useState(false);

    // Optimized Control Visibility Handler
    const handleMouseMove = useCallback(() => {
        setShowControls(true);
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

        if (isPlaying && !isHovering) {
            timeoutRef.current = window.setTimeout(() => setShowControls(false), 2500);
        }
    }, [isPlaying, isHovering]);

    // Setup interactions
    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('mousemove', handleMouseMove);
            container.addEventListener('touchstart', handleMouseMove);
        }

        return () => {
            if (container) {
                container.removeEventListener('mousemove', handleMouseMove);
                container.removeEventListener('touchstart', handleMouseMove);
            }
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        };
    }, [handleMouseMove]);

    // Optimized Control Animation
    useEffect(() => {
        if (controlsRef.current) {
            gsap.to(controlsRef.current, {
                y: showControls ? 0 : 10,
                opacity: showControls ? 1 : 0,
                duration: 0.3,
                ease: 'power3.out',
                overwrite: true
            });
        }
    }, [showControls]);

    const togglePlay = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    }, []);

    const handleLoadedMetadata = useCallback(() => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    }, []);

    const handleSeek = useCallback((value: number[]) => {
        if (videoRef.current) {
            videoRef.current.currentTime = value[0];
            setCurrentTime(value[0]);
        }
    }, []);

    const handleVolumeChange = useCallback((value: number[]) => {
        const newVolume = value[0];
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
            setIsMuted(newVolume === 0);
        }
    }, []);

    const toggleMute = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            const newMute = !isMuted;
            videoRef.current.muted = newMute;
            setIsMuted(newMute);
            if (!newMute && volume === 0) {
                const defaultVolume = 0.5;
                setVolume(defaultVolume);
                videoRef.current.volume = defaultVolume;
            }
        }
    }, [isMuted, volume]);

    const toggleFullscreen = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(() => {
                setError(true);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    const formatTime = useMemo(() => (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }, []);

    const isEmbed = useMemo(() =>
        url?.includes('youtube.com') || url?.includes('youtu.be') || url?.includes('vimeo.com'),
        [url]);

    if (!url || error) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-white p-6 text-center rounded-xl border border-white/5 shadow-2xl">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 ring-1 ring-white/10">
                    <Video size={32} className="text-zinc-500" />
                </div>
                <h3 className="text-lg font-bold mb-1 tracking-tight">{title || 'Media Player'}</h3>
                <p className="text-zinc-500 text-xs max-w-[240px]">
                    {!url ? 'Media source is missing.' : 'Unable to play video at this time.'}
                </p>
            </div>
        );
    }

    if (isEmbed) {
        let embedUrl = url;
        if (url.includes('youtube.com/watch?v=')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&quality=hd1080`;
        } else if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&quality=hd1080`;
        } else if (url.includes('vimeo.com/') && !url.includes('player.vimeo.com')) {
            const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
            if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1`;
        }

        return (
            <div className="w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                <iframe
                    src={embedUrl}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={title}
                ></iframe>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            key={url}
            className="group relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5 select-none"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
                setIsHovering(false);
                if (isPlaying) setShowControls(false);
            }}
        >
            <video
                ref={videoRef}
                src={url}
                className="w-full h-full object-contain cursor-pointer transition-opacity duration-300"
                onClick={() => togglePlay()}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={() => setError(true)}
                playsInline
                autoPlay
            />

            {/* Premium Center Overlay */}
            {!isPlaying && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer"
                    onClick={() => togglePlay()}
                >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#EB483B] text-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(235,72,59,0.3)] transform transition-transform hover:scale-110 active:scale-95 duration-300">
                        <Play size={32} className="fill-white ml-1.5" />
                    </div>
                </div>
            )}

            {/* Custom Controls Layer */}
            <div
                ref={controlsRef}
                className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-auto"
                onMouseEnter={() => setShowControls(true)}
            >
                {/* Progress Bar with Tooltip Area (potential future enhancement) */}
                <div className="mb-4 group/progress relative px-1">
                    <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={0.01}
                        onValueChange={handleSeek}
                        className="cursor-pointer h-1.5 hover:h-2 transition-all"
                    />
                </div>

                <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-1 sm:gap-3 lg:gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10 rounded-full h-9 w-9 sm:h-10 sm:w-10 transition-transform active:scale-90"
                            onClick={(e) => togglePlay(e)}
                        >
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                        </Button>

                        <div className="flex items-center gap-1 sm:gap-2 group/volume relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/10 rounded-full h-9 w-9 sm:h-10 sm:w-10 transition-transform active:scale-90"
                                onClick={toggleMute}
                            >
                                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </Button>
                            <div className="w-0 overflow-hidden group-hover/volume:w-20 sm:group-hover/volume:w-24 transition-all duration-500 ease-in-out">
                                <Slider
                                    value={[isMuted ? 0 : volume]}
                                    max={1}
                                    step={0.01}
                                    onValueChange={handleVolumeChange}
                                    className="w-16 sm:w-20 ml-2"
                                />
                            </div>
                        </div>

                        <div className="text-white text-[10px] sm:text-xs lg:text-sm font-medium font-mono tabular-nums opacity-90 hidden xs:block">
                            {formatTime(currentTime)} <span className="text-white/30 mx-0.5">/</span> {formatTime(duration)}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Quality & Settings Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-9 w-9 sm:h-10 sm:w-10">
                                    <Settings2 size={18} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#121212]/95 backdrop-blur-xl border-white/10 text-white min-w-[140px] shadow-2xl z-[150]">
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-white/40 px-3 py-2">Playback Speed</DropdownMenuLabel>
                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                    <DropdownMenuItem
                                        key={rate}
                                        className="hover:bg-white/10 cursor-pointer focus:bg-white/10 focus:text-white flex justify-between items-center px-3 py-1.5 transition-colors"
                                        onClick={() => {
                                            if (videoRef.current) {
                                                videoRef.current.playbackRate = rate;
                                                setPlaybackRate(rate);
                                            }
                                        }}
                                    >
                                        <span className="text-sm">{rate}x</span>
                                        {playbackRate === rate && <Check size={14} className="text-[#EB483B]" />}
                                    </DropdownMenuItem>
                                ))}

                                <DropdownMenuSeparator className="bg-white/5" />

                                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-white/40 px-3 py-2">Quality</DropdownMenuLabel>
                                {(['Auto', '1080p', '720p', '480p'] as Quality[]).map((q) => (
                                    <DropdownMenuItem
                                        key={q}
                                        className="hover:bg-white/10 cursor-pointer focus:bg-white/10 focus:text-white flex justify-between items-center px-3 py-1.5 transition-colors"
                                        onClick={() => setQuality(q)}
                                    >
                                        <span className="text-sm">{q}</span>
                                        {quality === q && <Check size={14} className="text-[#EB483B]" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10 rounded-full h-9 w-9 sm:h-10 sm:w-10 transition-transform active:scale-90"
                            onClick={toggleFullscreen}
                        >
                            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
