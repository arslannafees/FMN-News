import React from 'react';
import { Link } from 'react-router-dom';
import { User, Clock } from 'lucide-react';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import type { Article } from '@/types/news';

interface SlideshowProps {
    articles: Article[];
    categoryColors: Record<string, string>;
}

export function Slideshow({ articles, categoryColors }: SlideshowProps) {
    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);


    const plugin = React.useRef(
        Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })
    );

    React.useEffect(() => {
        if (!api) return;

        setCurrent(api.selectedScrollSnap());

        api.on('select', () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    if (!articles || articles.length === 0) return null;

    return (
        <Carousel
            setApi={setApi}
            plugins={[plugin.current]}
            opts={{
                loop: true,
            }}
            className="w-full relative group"
            onMouseEnter={() => { }}
            onMouseLeave={() => { }}
            aria-roledescription="carousel"
            aria-label="Featured news slideshow"
        >
            <CarouselContent className="-ml-0">
                {articles.map((article) => (
                    <CarouselItem key={article.id} className="pl-0">
                        <Link to={`/article/${article.id}`}>
                            <div className="relative h-[350px] sm:h-[400px] lg:h-[500px] xl:h-[550px] rounded-xl lg:rounded-2xl overflow-hidden group/slide cursor-pointer">
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/slide:scale-105"
                                    width={800}
                                    height={550}
                                    fetchPriority="high"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
                                    <span className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-accent font-semibold mb-2 sm:mb-4 ${categoryColors[article.category]}`}>
                                        {article.category}
                                    </span>
                                    <h1 className="font-display text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-2 sm:mb-4 leading-tight line-clamp-3">
                                        {article.title}
                                    </h1>
                                    <p className="text-white/80 text-xs sm:text-sm mb-2 sm:mb-4 max-w-2xl line-clamp-2 hidden sm:block">
                                        {article.excerpt}
                                    </p>
                                    <div className="flex items-center gap-3 sm:gap-4 text-white/70 text-xs">
                                        <span className="flex items-center gap-1">
                                            <User size={12} />
                                            {article.author}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {article.time}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 border-none text-white hover:bg-black/40" />
            <CarouselNext className="right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 border-none text-white hover:bg-black/40" />

            {/* Slide Indicators */}
            <div className="absolute bottom-4 right-8 flex gap-2">
                {articles.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => api?.scrollTo(index)}
                        className={`h-1.5 transition-all duration-300 rounded-full ${index === current ? 'w-8 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </Carousel>
    );
}
