import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Radio, Pin, Clock, ChevronLeft, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { useNews } from '@/context/NewsContextCore';
import type { LiveBlog, LiveBlogUpdate } from '@/types/news';

const apiBase = () => import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;

function timeFormat(ts: string) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function dateFormat(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function LiveBlogPage() {
  const { articleId } = useParams<{ articleId: string }>();
  const { isAdmin, getArticleById } = useNews();
  const article = getArticleById(articleId || '');
  const [blog, setBlog] = useState<LiveBlog | null>(null);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [posting, setPosting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBlog = async () => {
    if (!articleId) return;
    try {
      const res = await fetch(`${apiBase()}/liveblog/${articleId}`);
      if (res.ok) setBlog(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchBlog();
    // Poll every 30s when live
    intervalRef.current = setInterval(fetchBlog, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [articleId]);

  const toggleLive = async () => {
    if (!blog) return;
    const token = localStorage.getItem('fmn_token');
    const res = await fetch(`${apiBase()}/liveblog/${blog.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isLive: !blog.isLive })
    });
    if (res.ok) setBlog(await res.json());
  };

  const postUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blog || !newContent.trim()) return;
    setPosting(true);
    const token = localStorage.getItem('fmn_token');
    const res = await fetch(`${apiBase()}/liveblog/${blog.id}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: newContent.trim(), label: newLabel.trim() || undefined })
    });
    if (res.ok) {
      const update: LiveBlogUpdate = await res.json();
      setBlog(prev => prev ? { ...prev, updates: [update, ...prev.updates] } : prev);
      setNewContent(''); setNewLabel('');
    }
    setPosting(false);
  };

  const deleteUpdate = async (updateId: string) => {
    const token = localStorage.getItem('fmn_token');
    const res = await fetch(`${apiBase()}/liveblog/updates/${updateId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setBlog(prev => prev ? { ...prev, updates: prev.updates.filter(u => u.id !== updateId) } : prev);
  };

  // Group updates by date
  const grouped = (blog?.updates || []).reduce<Record<string, LiveBlogUpdate[]>>((acc, u) => {
    const day = dateFormat(u.timestamp);
    (acc[day] = acc[day] || []).push(u);
    return acc;
  }, {});

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <RefreshCw className="animate-spin text-[#EB483B] mx-auto mb-4" size={32} />
      <p className="text-gray-500 text-sm">Loading live blog...</p>
    </div>
  );

  if (!blog) return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <p className="text-gray-500 mb-4">No live blog found for this article.</p>
      {article && <p className="text-sm text-gray-400">Article: {article.title}</p>}
    </div>
  );

  return (
    <div className="py-6 lg:py-10">
      <title>{blog.title} – Live Blog – FMN News</title>
      <div className="max-w-3xl mx-auto px-4">

        {/* Header */}
        {article && (
          <Link to={`/article/${articleId}`} className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#EB483B] transition-colors mb-4">
            <ChevronLeft size={14} /> Back to article
          </Link>
        )}

        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {blog.isLive ? (
                <span className="badge-live"><span className="w-1.5 h-1.5 rounded-full bg-white pulse-dot" />LIVE</span>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">ENDED</span>
              )}
              <span className="text-[10px] font-bold text-gray-400">{blog.updates.length} updates</span>
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-black text-[#1a1a1a] dark:text-zinc-100 leading-tight">{blog.title}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={fetchBlog} className="p-2 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors" title="Refresh">
              <RefreshCw size={15} className="text-gray-500" />
            </button>
            {isAdmin && (
              <button onClick={toggleLive} className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-full transition-colors ${blog.isLive ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                {blog.isLive ? 'End Live' : 'Go Live'}
              </button>
            )}
          </div>
        </div>

        {/* Admin: Post Update */}
        {isAdmin && blog.isLive && (
          <form onSubmit={postUpdate} className="mb-8 p-4 sm:p-5 rounded-xl border-2 border-dashed border-[#EB483B]/30 bg-red-50/30 dark:bg-red-950/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#EB483B] mb-3 flex items-center gap-2"><Plus size={12} /> Post New Update</p>
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Label (optional, e.g. 'Key Development')"
              className="w-full px-3 py-2 text-sm border rounded-lg mb-2 bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#EB483B]"
            />
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Write your update here..."
              rows={3}
              required
              className="w-full px-3 py-2 text-sm border rounded-lg mb-3 bg-white dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#EB483B]"
            />
            <button type="submit" disabled={posting || !newContent.trim()} className="bg-[#e53935] hover:bg-[#c62828] text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg disabled:opacity-50 transition-colors">
              {posting ? 'Posting...' : 'Post Update'}
            </button>
          </form>
        )}

        {/* Updates Feed */}
        {blog.updates.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Radio size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-bold">No updates yet</p>
            <p className="text-sm">Updates will appear here as the story develops.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {Object.entries(grouped).map(([day, updates]) => (
              <div key={day}>
                {/* Day separator */}
                <div className="flex items-center gap-3 py-4">
                  <div className="flex-1 h-px bg-gray-100 dark:bg-zinc-800" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{day}</span>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-zinc-800" />
                </div>

                {/* Updates for this day */}
                <div className="space-y-0">
                  {updates.map((update, idx) => (
                    <div key={update.id} className={`relative pl-14 pb-6 group ${idx < updates.length - 1 ? 'border-l-2 border-gray-100 dark:border-zinc-800 ml-6' : ''}`}>
                      {/* Timestamp bubble */}
                      <div className={`absolute left-0 top-0 w-12 text-right ${update.isPinned ? 'top-0' : ''}`}>
                        <span className={`inline-block text-[10px] font-black tabular-nums ${update.isPinned ? 'text-[#EB483B]' : 'text-gray-400'}`}>
                          {timeFormat(update.timestamp)}
                        </span>
                        {update.isPinned && <Pin size={10} className="text-[#EB483B] ml-auto mt-0.5" />}
                      </div>

                      {/* Timeline dot */}
                      <div className={`absolute left-6 top-1 w-2.5 h-2.5 rounded-full -translate-x-[5px] border-2 border-white dark:border-zinc-950 ${update.isPinned ? 'bg-[#EB483B]' : 'bg-gray-300 dark:bg-zinc-600'}`} />

                      {/* Content card */}
                      <div className={`bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-700 ${update.isPinned ? 'border-[#EB483B]/30 bg-red-50/20 dark:bg-red-950/10' : ''}`}>
                        {update.label && (
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#EB483B] mb-2">{update.label}</p>
                        )}
                        <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">{update.content}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock size={10} /> {new Date(update.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                          </span>
                          {isAdmin && (
                            <button onClick={() => deleteUpdate(update.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all" title="Delete update">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
