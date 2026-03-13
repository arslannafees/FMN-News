import { useParams, Link } from 'react-router-dom';
import { Clock, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNews } from '@/context/NewsContextCore';
import { MarketPulse } from '@/components/MarketPulse';

export function Category() {
  const { category } = useParams<{ category: string }>();
  const { getArticlesByCategory, categoryColors, config } = useNews();

  const categoryName = category ? category.charAt(0).toUpperCase() + category.slice(1) : '';
  const categoryArticles = getArticlesByCategory(categoryName);

  // Get featured article for this category
  const featuredArticle = categoryArticles[0];
  const otherArticles = categoryArticles.slice(1);


  if (categoryArticles.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1a1a1a] mb-4">No Articles Found</h1>
        <p className="text-gray-600 mb-6 text-center">There are no articles in this category yet.</p>
        <Link to="/">
          <Button className="bg-[#e53935] hover:bg-[#c62828] text-white">
            <ArrowLeft size={18} className="mr-2" /> Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {categoryName.toLowerCase() === 'business' && <MarketPulse />}
      <div className="py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
            <Link to="/" className="text-gray-500 hover:text-[#e53935] transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <span className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-accent font-semibold mb-1 sm:mb-2 ${categoryColors[categoryName]}`}>
                {categoryName}
              </span>
              <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-[#1a1a1a]">
                {categoryName} News
              </h1>
            </div>
          </div>

          {/* Featured Article */}
          {featuredArticle && (
            <div className="mb-8 sm:mb-12">
              <Link to={`/article/${featuredArticle.id}`}>
                <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 bg-white dark:bg-zinc-800 rounded-lg lg:rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                  <div className="h-48 sm:h-64 lg:h-80 overflow-hidden">
                    <img
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
                    <span className={`inline-block w-fit px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-accent font-semibold mb-3 sm:mb-4 ${categoryColors[featuredArticle.category]}`}>
                      {featuredArticle.category}
                    </span>
                    <h2 className="font-display text-lg sm:text-xl lg:text-2xl font-bold text-[#1a1a1a] dark:text-zinc-100 group-hover:text-[#e53935] transition-colors mb-3 sm:mb-4">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-gray-600 dark:text-zinc-300 text-sm mb-4 sm:mb-6 line-clamp-3">
                      {featuredArticle.excerpt}
                    </p>
                    <div className="flex items-center gap-3 sm:gap-4 text-gray-500 dark:text-zinc-400 text-xs">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {featuredArticle.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {featuredArticle.time}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Article Grid */}
          {otherArticles.length > 0 && (
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#1a1a1a] mb-4 sm:mb-6">
                More {categoryName} News
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {otherArticles.map((article) => (
                  <Link key={article.id} to={`/article/${article.id}`}>
                    <div className="bg-white dark:bg-zinc-800 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group h-full">
                      <div className="h-40 sm:h-44 overflow-hidden">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-3 sm:p-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-accent font-semibold mb-2 ${categoryColors[article.category]}`}>
                          {article.category}
                        </span>
                        <h3 className="font-display text-sm sm:text-base font-semibold text-[#1a1a1a] dark:text-zinc-100 group-hover:text-[#e53935] transition-colors line-clamp-2 mb-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-500 dark:text-zinc-400 text-xs line-clamp-2 mb-2">
                          {article.excerpt}
                        </p>
                        <span className="text-[10px] sm:text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1">
                          <Clock size={10} />
                          {article.time}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Other Categories */}
          <div className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t">
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#1a1a1a] mb-4 sm:mb-6">Browse Other Categories</h2>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {config.categories.map((cat) => (
                cat.name !== categoryName && (
                  <Link
                    key={cat.name}
                    to={`/category/${cat.name.toLowerCase()}`}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-accent font-medium text-xs sm:text-sm transition-all hover:scale-105 ${cat.color}`}
                  >
                    {cat.name}
                  </Link>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
