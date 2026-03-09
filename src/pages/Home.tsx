import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight, Clock, User, Play, TrendingUp, ArrowRight,
  Mail, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNews } from '@/context/NewsContextCore';
import type { VideoStory } from '@/types/news';
import { Slideshow } from '@/components/Slideshow';
import { VideoPlayer } from '@/components/VideoPlayer';
import { MostReadSidebar } from '@/components/MostReadSidebar';
import { Skeleton } from '@/components/ui/skeleton';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function Home() {
  const {
    getFeaturedArticles,
    getSideStories,
    getEditorsPicks,
    getLatestNews,
    articles,
    videoStories,
    trendingTopics,
    config,
    categoryColors
  } = useNews();
  const navigate = useNavigate();

  const heroRef = useRef<HTMLDivElement>(null);
  const editorsRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);

  const featuredArticles = getFeaturedArticles();

  // Use first 3 articles as featured if no articles are marked as featured
  const slideshowArticles = featuredArticles.length > 0 ? featuredArticles : articles.slice(0, 3);

  const sideStories = getSideStories();
  const editorsPicks = getEditorsPicks();
  const latestNews = getLatestNews();

  // Get unique categories for category grid from config
  const categoryArticles = config.categories.map(cat => {
    const article = articles.find(a => a.category === cat.name);
    return {
      category: cat.name,
      title: article?.title || `${cat.name} News`,
      image: article?.image || '/hero-featured.jpg',
      color: cat.color
    };
  }).slice(0, 6); // Keep it to 6 for the grid

  const [playingVideo, setPlayingVideo] = useState<VideoStory | null>(null);

  useEffect(() => {
    // Don't run animations until data has loaded and real DOM elements exist
    if (articles.length === 0) return;

    const ctx = gsap.context(() => {
      // Hero animations — only if the element exists in the DOM
      if (document.querySelector('.hero-featured')) {
        gsap.fromTo('.hero-featured',
          { opacity: 0, scale: 0.98 },
          { opacity: 1, scale: 1, duration: 1.2, ease: 'expo.out', delay: 0.2 }
        );
      }

      // Parallax effect for images
      gsap.utils.toArray('.parallax-image').forEach((image) => {
        const img = image as HTMLElement;
        const speed = parseFloat(img.dataset.speed || '0.5');
        gsap.to(img, {
          yPercent: 10 * speed,
          ease: 'none',
          scrollTrigger: {
            trigger: img,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      });

      if (document.querySelector('.hero-side-story')) {
        gsap.fromTo('.hero-side-story',
          { opacity: 0, x: 30 },
          { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out', stagger: 0.1, delay: 0.4 }
        );
      }

      // Scroll-triggered animations
      const sections = [
        { ref: editorsRef, class: '.editors-item' },
        { ref: categoriesRef, class: '.category-item' },
        { ref: latestRef, class: '.latest-item' },
        { ref: videoRef, class: '.video-item' },
        { ref: trendingRef, class: '.trending-item' }
      ];

      sections.forEach(({ ref, class: className }) => {
        if (ref.current && document.querySelector(className)) {
          gsap.fromTo(className,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: 'expo.out',
              stagger: 0.08,
              scrollTrigger: {
                trigger: ref.current,
                start: 'top 85%',
                toggleActions: 'play none none none'
              }
            }
          );
        }
      });
    });

    return () => ctx.revert();
  }, [articles.length, videoStories.length, trendingTopics.length]);

  if (articles.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        <Skeleton className="w-full h-[400px]" />
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="w-full h-[200px]" />
            <div className="grid sm:grid-cols-2 gap-6">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="w-full h-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section ref={heroRef} aria-label="Featured news" className="py-4 sm:py-6 lg:py-8 px-4 border-b border-gray-100 dark:border-zinc-800 reveal-up">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Primary Content (Slideshow + More) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Slideshow Featured */}
              <div className="hero-featured rounded-sm overflow-hidden shadow-2xl">
                <Slideshow
                  articles={slideshowArticles}
                  categoryColors={categoryColors}
                />
              </div>

              {/* Side Stories Grid (Horizontal below Slideshow on desktop) */}
              <div className="grid sm:grid-cols-2 gap-6">
                {sideStories.slice(0, 2).map((story) => (
                  <Link key={story.id} to={`/article/${story.id}`}>
                    <div className="hero-side-story flex gap-4 cursor-pointer group border-b dark:border-zinc-800 pb-4 sm:border-b-0 sm:pb-0 reveal-up delay-600">
                      <div className="w-24 sm:w-28 lg:w-32 h-16 sm:h-20 lg:h-24 rounded-sm overflow-hidden shrink-0 img-zoom bg-gray-100">
                        <img
                          src={story.image}
                          alt={story.title}
                          className="w-full h-full object-cover parallax-image"
                          data-speed="0.2"
                          width={128}
                          height={96}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {story.category}
                          </span>
                        </div>
                        <h3 className="font-display text-sm font-black text-[#1a1a1a] group-hover:text-[#EB483B] transition-colors line-clamp-2 leading-tight">
                          {story.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sidebar (Most Read) */}
            <div className="lg:col-span-4 space-y-8">
              <MostReadSidebar />
            </div>
          </div>
        </div>
      </section>

      {/* Editor's Picks */}
      <section ref={editorsRef} aria-label="Editor's picks" className="py-8 sm:py-10 lg:py-12 px-4 bg-gray-50 dark:bg-zinc-900/50 reveal-up">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="ap-section-header">Editor's Picks</h2>
            </div>
            <Link to="/category/world" className="flex items-center gap-1 sm:gap-2 text-[#EB483B] font-accent font-bold text-xs uppercase tracking-widest hover:gap-3 transition-all">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {editorsPicks.map((article) => (
              <Link key={article.id} to={`/article/${article.id}`}>
                <div
                  className="editors-item bg-white dark:bg-zinc-800 rounded-lg lg:rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 card-hover cursor-pointer group h-full"
                >
                  <div className="h-40 sm:h-44 lg:h-48 overflow-hidden img-zoom">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      width={400}
                      height={192}
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#EB483B]">
                        {article.category}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {article.readTime || '3 MIN READ'}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-black text-[#1a1a1a] dark:text-zinc-100 group-hover:text-[#EB483B] transition-colors line-clamp-2 leading-tight">
                      {article.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section ref={categoriesRef} aria-label="Browse categories" className="py-8 sm:py-10 lg:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div>
              <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-[#1a1a1a] dark:text-zinc-100">Categories</h2>
              <div className="w-16 sm:w-20 h-1 bg-[#e53935] mt-2"></div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {categoryArticles.map((article, idx) => (
              <Link key={idx} to={`/category/${article.category.toLowerCase()}`}>
                <div
                  className="category-item relative rounded-lg lg:rounded-xl overflow-hidden group cursor-pointer h-40 sm:h-52 lg:h-64"
                >
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 parallax-image"
                    data-speed="0.3"
                    width={400}
                    height={256}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-accent font-semibold ${article.color}`}>
                      {article.category}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5">
                    <h3 className="font-display text-xs sm:text-sm lg:text-base font-semibold text-white group-hover:text-[#e53935] transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section ref={latestRef} aria-label="Latest news" className="py-8 sm:py-10 lg:py-12 px-4 bg-gray-50 dark:bg-zinc-900/50 reveal-up">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8 lg:mb-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-[#1a1a1a] dark:text-zinc-100 tracking-tight">Latest News</h2>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#EB483B] rounded-full pulse-dot"></div>
              </div>
              <div className="hidden sm:block h-px w-24 bg-gray-100 dark:bg-zinc-800 mt-2"></div>
            </div>
            <Link to="/category/world" className="flex items-center gap-2 text-[#EB483B] font-accent font-bold text-xs uppercase tracking-widest hover:gap-3 transition-all bg-gray-50 dark:bg-zinc-900 px-4 py-2 rounded-full border border-gray-100 dark:border-zinc-800">
              Go to Feed <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Primary Featured Story (Left 8 columns) */}
            {latestNews[0] && (
              <div className="latest-item lg:col-span-8 group">
                <Link to={`/article/${latestNews[0].id}`}>
                  <div className="relative aspect-[16/9] sm:aspect-[21/9] lg:aspect-auto lg:h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl bg-gray-100 dark:bg-zinc-800 mb-8 card-hover">
                    <img
                      src={latestNews[0].image}
                      alt={latestNews[0].title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10 lg:p-12">
                      <span className={`inline-block px-4 py-1 rounded-full text-[10px] font-accent font-black uppercase tracking-widest mb-6 ${categoryColors[latestNews[0].category]}`}>
                        {latestNews[0].category}
                      </span>
                      <h3 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-6 leading-[1.1] tracking-tight group-hover:underline decoration-[#EB483B] decoration-4 underline-offset-8">
                        {latestNews[0].title}
                      </h3>
                      <p className="text-gray-200 text-base sm:text-lg mb-8 line-clamp-2 max-w-3xl leading-relaxed font-medium opacity-90">
                        {latestNews[0].excerpt}
                      </p>
                      <div className="flex items-center gap-6 text-white/80 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-2">
                          <User size={14} className="text-[#EB483B]" />
                          {latestNews[0].author}
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock size={14} />
                          {latestNews[0].time}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Vertical Updates Stream (Right 4 columns) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-2 mb-4 px-2">
                <div className="w-1.5 h-1.5 bg-[#EB483B] rounded-full"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Stream Updates</span>
              </div>
              <div className="space-y-2">
                {latestNews.slice(1).map((article) => (
                  <Link key={article.id} to={`/article/${article.id}`} className="block group">
                    <div className="flex gap-4 p-3 rounded-2xl transition-all duration-300 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-xl hover:-translate-y-1 group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-zinc-900">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[9px] font-black uppercase tracking-wider text-[#EB483B]">
                            {article.category}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400">• {article.time}</span>
                        </div>
                        <h4 className="font-display text-sm font-bold text-[#1a1a1a] dark:text-zinc-100 group-hover:text-[#EB483B] transition-colors line-clamp-2 leading-tight">
                          {article.title}
                        </h4>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <button className="w-full py-4 mt-4 rounded-xl border-2 border-dashed border-gray-100 dark:border-zinc-800 text-gray-400 font-accent font-bold text-[10px] uppercase tracking-widest hover:border-[#EB483B] hover:text-[#EB483B] transition-all">
                Load More Updates
              </button>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 text-center">
            <Link to="/category/world">
              <Button variant="outline" className="font-accent border-[#e53935] text-[#e53935] hover:bg-[#e53935] hover:text-white text-sm">
                Load More Articles <ChevronRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-10 sm:py-12 lg:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] rounded-xl lg:rounded-2xl p-6 sm:p-8 lg:p-12 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-[#e53935]/10 rounded-full blur-3xl float-animation"></div>
            <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-[#e53935]/5 rounded-full blur-2xl float-animation delay-4000"></div>

            <div className="relative z-10 grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                  Stay Informed
                </h2>
                <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">
                  Get the latest news delivered to your inbox every morning. Join thousands of readers who trust FMN News.
                </p>
                <ul className="space-y-2 sm:space-y-3">
                  {['Breaking news alerts', 'Weekly digest', 'No spam, ever'].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                      <Check size={14} className="text-[#e53935]" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Link to="/subscribe">
                  <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
                    <div className="flex-1 relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        className="pl-10 h-11 sm:h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-[#e53935] text-sm"
                      />
                    </div>
                    <Button className="h-11 sm:h-12 px-4 sm:px-6 bg-[#e53935] hover:bg-[#c62828] text-white font-accent text-sm">
                      Subscribe <ArrowRight size={16} />
                    </Button>
                  </form>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Stories */}
      <section ref={videoRef} aria-label="Video stories" className="py-8 sm:py-10 lg:py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div>
              <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-[#1a1a1a]">Video Stories</h2>
              <div className="w-16 sm:w-20 h-1 bg-[#e53935] mt-2"></div>
            </div>
          </div>

          {/* Main Video */}
          {videoStories[0] && (
            <div className="video-item mb-4 sm:mb-6">
              <div className="relative rounded-lg lg:rounded-xl overflow-hidden group cursor-pointer">
                <img
                  src={videoStories[0].image}
                  alt={videoStories[0].title}
                  className="w-full h-[200px] sm:h-[280px] lg:h-[350px] xl:h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
                  width={800}
                  height={400}
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlayingVideo(videoStories[0]);
                    }}
                    role="button"
                    aria-label={`Play video: ${videoStories[0].title}`}
                    className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-[#e53935] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg cursor-pointer"
                  >
                    <Play size={20} className="text-white ml-0.5 sm:ml-1" fill="white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <h3 className="font-display text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold text-white mb-1 sm:mb-2 line-clamp-2">
                    {videoStories[0].title}
                  </h3>
                  <span className="text-white/80 text-xs sm:text-sm flex items-center gap-1">
                    <Clock size={12} />
                    {videoStories[0].duration}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Thumbnail Videos */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {videoStories.slice(1).map((video) => (
              <div
                key={video.id}
                onClick={() => setPlayingVideo(video)}
                className="video-item relative rounded-lg overflow-hidden group cursor-pointer"
              >
                <img
                  src={video.image}
                  alt={video.title}
                  className="w-full h-28 sm:h-32 lg:h-40 object-cover transition-transform duration-500 group-hover:scale-105"
                  width={400}
                  height={160}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play size={14} className="text-[#1a1a1a] ml-0.5" fill="#1a1a1a" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                  <h4 className="font-display text-xs sm:text-sm font-semibold text-white line-clamp-2">
                    {video.title}
                  </h4>
                  <span className="text-white/70 text-[10px] sm:text-xs flex items-center gap-1 mt-0.5 sm:mt-1">
                    <Clock size={10} />
                    {video.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Video Player Modal - rendered via Portal to completely escape all CSS containing blocks */}
      {playingVideo && createPortal(
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4">
          <button
            onClick={() => setPlayingVideo(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-[101]"
            title="Close"
          >
            <X size={32} />
          </button>

          <div className="w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl relative z-[100]">
            <VideoPlayer url={playingVideo.url} title={playingVideo.title} />
          </div>
        </div>,
        document.body
      )}


      {/* Trending Topics */}
      <section ref={trendingRef} aria-label="Trending topics" className="py-8 sm:py-10 lg:py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingUp size={20} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-[#e53935]" />
              <div>
                <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-[#1a1a1a]">Trending Now</h2>
                <div className="w-16 sm:w-20 h-1 bg-[#e53935] mt-2"></div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            {trendingTopics.map((topic, index) => (
              <button
                key={topic.id}
                onClick={() => navigate(`/search?q=${encodeURIComponent(topic.tag.replace('#', ''))}`)}
                className={`trending-item px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-accent font-medium transition-all hover:scale-105 ${topic.size === 'large'
                  ? 'bg-[#1a1a1a] text-white text-sm sm:text-base'
                  : topic.size === 'medium'
                    ? 'bg-gray-200 text-[#1a1a1a] hover:bg-gray-300 text-xs sm:text-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs'
                  } delay-${Math.min((index + 1) * 100, 1000)}`}
              >
                {topic.tag}
                <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs opacity-60">{topic.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
