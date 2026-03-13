import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
    Video, Settings2
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import gsap from 'gsap';

interface VideoPlayerProps {
    url?: string;
    title?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number | null>(null);
    const volumeLeaveTimer = useRef<number | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [error, setError] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isHovering, setIsHovering] = useState(false);
    const [showVolumeBar, setShowVolumeBar] = useState(false);

    const handleVolumeEnter = useCallback(() => {
        if (volumeLeaveTimer.current) window.clearTimeout(volumeLeaveTimer.current);
        setShowVolumeBar(true);
    }, []);

    const handleVolumeLeave = useCallback(() => {
        volumeLeaveTimer.current = window.setTimeout(() => setShowVolumeBar(false), 300);
    }, []);

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

                        <div
                            className="flex items-center gap-1 sm:gap-2 relative"
                            onMouseEnter={handleVolumeEnter}
                            onMouseLeave={handleVolumeLeave}
                        >
                            {/* Vertical volume bar popup */}
                            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col items-center z-[200] transition-all duration-200 ${showVolumeBar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                                <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl px-2.5 py-2.5 shadow-2xl flex flex-col items-center gap-1.5">
                                    <span className="text-white/50 text-[9px] font-mono tabular-nums">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                                    <div className="h-14 flex items-center justify-center">
                                        <Slider
                                            orientation="vertical"
                                            value={[isMuted ? 0 : volume]}
                                            max={1}
                                            step={0.01}
                                            onValueChange={handleVolumeChange}
                                            className="[&[data-orientation=vertical]]:min-h-0 [&[data-orientation=vertical]]:h-full [&_[data-slot=slider-thumb]]:bg-[#EB483B] [&_[data-slot=slider-thumb]]:border-[#EB483B] [&_[data-slot=slider-thumb]]:shadow-[0_0_8px_rgba(235,72,59,0.6)] [&_[data-slot=slider-range]]:bg-[#EB483B] [&_[data-slot=slider-track]]:bg-white/10"
                                        />
                                    </div>
                                </div>
                                {/* Arrow pointer */}
                                <div className="w-2 h-2 bg-zinc-900/95 border-r border-b border-white/10 rotate-45 -mt-1"></div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/10 rounded-full h-9 w-9 sm:h-10 sm:w-10 transition-transform active:scale-90"
                                onClick={toggleMute}
                            >
                                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </Button>
                        </div>

                        <div className="text-white text-[10px] sm:text-xs lg:text-sm font-medium font-mono tabular-nums opacity-90 hidden xs:block">
                            {formatTime(currentTime)} <span className="text-white/30 mx-0.5">/</span> {formatTime(duration)}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Settings Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-9 w-9 sm:h-10 sm:w-10">
                                    <Settings2 size={18} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-black backdrop-blur-xl border-white/10 text-white min-w-[200px] shadow-2xl z-[150] p-0 overflow-hidden rounded-xl">
                                {/* Playback Speed Section */}
                                <div className="px-3 pt-3 pb-3">
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <div className="w-[3px] h-4 bg-[#EB483B] rounded-full"></div>
                                        <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Playback Speed</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                            <button
                                                key={rate}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                                                    playbackRate === rate
                                                        ? 'bg-[#EB483B] text-white shadow-[0_0_10px_rgba(235,72,59,0.4)]'
                                                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                                }`}
                                                onClick={() => {
                                                    if (videoRef.current) {
                                                        videoRef.current.playbackRate = rate;
                                                        setPlaybackRate(rate);
                                                    }
                                                }}
                                            >
                                                {rate}x
                                            </button>
                                        ))}
                                    </div>
                                </div>

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
