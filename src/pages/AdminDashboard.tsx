import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Search, Filter, ArrowLeft,
  Eye, TrendingUp, Video, Newspaper, Settings, Upload, LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNews } from '@/context/NewsContextCore';

type TabType = 'articles' | 'videos' | 'trending' | 'breaking';

export function AdminDashboard() {
  const {
    articles,
    videoStories,
    trendingTopics,
    breakingNews,
    deleteArticle,
    deleteVideoStory,
    deleteTrendingTopic,
    deleteBreakingNews,
    addBreakingNews,
    addTrendingTopic,
    addVideoStory,
    categoryColors,
    config,
    logout
  } = useNews();

  const [activeTab, setActiveTab] = useState<TabType>('articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Breaking News state
  const [newBreakingNews, setNewBreakingNews] = useState('');

  // Trending state
  const [trendingForm, setTrendingForm] = useState({ tag: '', count: '' });

  // Video management state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoForm, setVideoForm] = useState({
    title: '',
    duration: '',
    image: '',
    url: ''
  });

  // Filter articles
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory ? article.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteArticle = (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      deleteArticle(id);
    }
  };

  const handleAddBreakingNews = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newBreakingNews.trim()) {
      addBreakingNews(newBreakingNews.trim());
      setNewBreakingNews('');
    }
  };

  const handleAddTrendingTopic = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (trendingForm.tag.trim()) {
      addTrendingTopic({
        tag: trendingForm.tag.startsWith('#') ? trendingForm.tag : `#${trendingForm.tag}`,
        count: trendingForm.count || '0',
        size: 'medium'
      });
      setTrendingForm({ tag: '', count: '' });
    }
  };

  const getVideoDuration = (fileOrUrl: string | File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        if (typeof fileOrUrl !== 'string') {
          window.URL.revokeObjectURL(video.src);
        }
        const minutes = Math.floor(video.duration / 60);
        const seconds = Math.floor(video.duration % 60);
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      };
      video.onerror = () => {
        resolve('0:00');
      };

      if (typeof fileOrUrl === 'string') {
        video.src = fileOrUrl;
      } else {
        video.src = URL.createObjectURL(fileOrUrl);
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'url') => {
    const file = e.target.files?.[0];
    if (file) {
      if (field === 'url') {
        const duration = await getVideoDuration(file);
        setVideoForm(prev => ({ ...prev, duration }));
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setVideoForm(prev => ({ ...prev, [field]: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addVideoStory(videoForm);
    setVideoForm({ title: '', duration: '', image: '', url: '' });
    setIsVideoModalOpen(false);
  };


  const handleDeleteVideo = (id: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      deleteVideoStory(id);
    }
  };

  const tabs = [
    { id: 'articles' as TabType, label: 'Articles', icon: Newspaper, count: articles.length },
    { id: 'videos' as TabType, label: 'Videos', icon: Video, count: videoStories.length },
    { id: 'trending' as TabType, label: 'Trending', icon: TrendingUp, count: trendingTopics.length },
    { id: 'breaking' as TabType, label: 'Breaking News', icon: Settings, count: breakingNews.length },
  ];

  return (
    <div className="py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/" className="text-gray-500 hover:text-[#e53935] transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-[#1a1a1a]">
                Admin Dashboard
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-gray-500 text-xs sm:text-sm">Manage your news content</p>
                <button
                  onClick={() => {
                    logout();
                  }}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                >
                  <LogOut size={12} />
                  Logout
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {activeTab === 'videos' && (
              <Button
                onClick={() => {
                  setVideoForm({ title: '', duration: '', image: '', url: '' });
                  setIsVideoModalOpen(true);
                }}
                className="bg-[#e53935] hover:bg-[#c62828] text-white text-sm"
              >
                <Plus size={16} className="mr-2" /> New Video
              </Button>
            )}
            {activeTab === 'articles' && (
              <Link to="/admin/create">
                <Button className="bg-[#e53935] hover:bg-[#c62828] text-white text-sm">
                  <Plus size={16} className="mr-2" /> New Article
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 sm:p-4 rounded-lg sm:rounded-xl text-left transition-all ${activeTab === tab.id
                ? 'bg-[#e53935] text-white'
                : 'bg-gray-100 text-[#1a1a1a] hover:bg-gray-200'
                }`}
            >
              <tab.icon size={18} className="mb-2" />
              <div className="font-display text-xl sm:text-2xl font-bold">{tab.count}</div>
              <div className="text-[10px] sm:text-xs opacity-80">{tab.label}</div>
            </button>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6 border-b pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-2 font-accent text-xs sm:text-sm font-medium transition-colors ${activeTab === tab.id
                ? 'text-[#e53935] border-b-2 border-[#e53935]'
                : 'text-gray-500 hover:text-[#1a1a1a]'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Articles Tab */}
        {activeTab === 'articles' && (
          <div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#e53935]"
                  title="Filter by category"
                >
                  <option value="">All Categories</option>
                  {config.categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Articles Table */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-accent font-semibold text-gray-600">Article</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-accent font-semibold text-gray-600 hidden sm:table-cell">Category</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-accent font-semibold text-gray-600 hidden md:table-cell">Author</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-accent font-semibold text-gray-600 hidden lg:table-cell">Date</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-accent font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredArticles.map((article) => (
                      <tr key={article.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <img
                              src={article.image}
                              alt={article.title}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover hidden xs:block"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-xs sm:text-sm text-[#1a1a1a] line-clamp-1">{article.title}</p>
                              <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1 sm:hidden">{article.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 hidden sm:table-cell">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-accent ${categoryColors[article.category]}`}>
                            {article.category}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-gray-600 hidden md:table-cell">{article.author}</td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs text-gray-500 hidden lg:table-cell">
                          {new Date(article.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <Link to={`/article/${article.id}`}>
                              <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                                <Eye size={14} />
                              </button>
                            </Link>
                            <Link to={`/admin/edit/${article.id}`}>
                              <button className="p-1.5 sm:p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Edit">
                                <Edit2 size={14} />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDeleteArticle(article.id)}
                              className="p-1.5 sm:p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredArticles.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">No articles found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div className="space-y-6">
            {isVideoModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                  <h3 className="font-display text-xl font-bold mb-4">
                    Add New Video
                  </h3>
                  <form onSubmit={handleVideoSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                      <Input
                        required
                        value={videoForm.title}
                        onChange={e => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Video title"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Auto)</label>
                        <Input
                          readOnly
                          value={videoForm.duration}
                          placeholder="Detected automatically"
                          className="bg-gray-50 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Thumbnail</label>
                        <div className="flex gap-2">
                          <Input
                            required
                            value={videoForm.image}
                            onChange={e => setVideoForm(prev => ({ ...prev, image: e.target.value }))}
                            placeholder="/vid-thumb.jpg"
                            className="flex-1"
                          />
                          <label className="shrink-0 p-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                            <Upload size={16} />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => handleFileUpload(e, 'image')}
                              title="Upload thumbnail"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Video Source (URL or File)</label>
                      <div className="flex gap-2">
                        <Input
                          value={videoForm.url}
                          onChange={async (e) => {
                            const url = e.target.value;
                            setVideoForm(prev => ({ ...prev, url }));
                            if (url && (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg'))) {
                              const duration = await getVideoDuration(url);
                              setVideoForm(prev => ({ ...prev, duration }));
                            }
                          }}
                          placeholder="https://..."
                          className="flex-1"
                        />
                        <label className="shrink-0 p-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                          <Upload size={16} />
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={e => handleFileUpload(e, 'url')}
                            title="Upload video"
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 italic">
                        Supported: YouTube/Vimeo links or direct video files.
                      </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsVideoModalOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-[#e53935] hover:bg-[#c62828] text-white flex-1">
                        Add
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videoStories.map((video) => (
                <div key={video.id} className="bg-white rounded-xl shadow-sm overflow-hidden group border border-gray-100">
                  <div className="relative h-40">
                    <img
                      src={video.image}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        className="p-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-[10px] font-bold rounded">
                      {video.duration}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm text-[#1a1a1a] line-clamp-1">{video.title}</p>
                    {video.url && (
                      <p className="text-[10px] text-gray-400 truncate mt-1">{video.url}</p>
                    )}
                  </div>
                </div>
              ))}
              {videoStories.length === 0 && (
                <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Video size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No videos story found.</p>
                  <Button
                    variant="link"
                    className="text-[#e53935]"
                    onClick={() => {
                      setVideoForm({ title: '', duration: '', image: '', url: '' });
                      setIsVideoModalOpen(true);
                    }}
                  >
                    Add your first video
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trending Tab */}
        {activeTab === 'trending' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
              <h3 className="font-display text-lg font-bold mb-4">Add Trending Topic</h3>
              <form onSubmit={handleAddTrendingTopic} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="#TopicName"
                    value={trendingForm.tag}
                    onChange={(e) => setTrendingForm(prev => ({ ...prev, tag: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <Input
                    type="text"
                    placeholder="Count (e.g. 10K)"
                    value={trendingForm.count}
                    onChange={(e) => setTrendingForm(prev => ({ ...prev, count: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <Button type="submit" className="bg-[#e53935] hover:bg-[#c62828] text-white text-sm">
                  <Plus size={16} className="mr-1" /> Add Topic
                </Button>
              </form>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm divide-y overflow-hidden">
              {trendingTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#e53935]/10 flex items-center justify-center text-[#e53935]">
                      <TrendingUp size={14} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-[#1a1a1a]">{topic.tag}</p>
                      <p className="text-[10px] text-gray-500">{topic.count} interactions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTrendingTopic(topic.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {trendingTopics.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">No trending topics found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Breaking News Tab */}
        {activeTab === 'breaking' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
              <h3 className="font-display text-lg font-bold mb-4">Add Breaking News</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddBreakingNews();
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Input
                  type="text"
                  placeholder="Enter breaking news headline..."
                  value={newBreakingNews}
                  onChange={(e) => setNewBreakingNews(e.target.value)}
                  className="flex-1 text-sm"
                />
                <Button
                  type="button"
                  onClick={() => handleAddBreakingNews()}
                  className="bg-[#e53935] hover:bg-[#c62828] text-white text-sm"
                >
                  <Plus size={16} className="mr-1" /> Add Headline
                </Button>
              </form>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm divide-y overflow-hidden">
              {breakingNews.map((news, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-2 h-2 bg-[#e53935] rounded-full shrink-0 animate-pulse"></div>
                    <p className="text-sm text-[#1a1a1a] line-clamp-2">{news}</p>
                  </div>
                  <button
                    onClick={() => deleteBreakingNews(index)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {breakingNews.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-sm">No breaking news found.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
