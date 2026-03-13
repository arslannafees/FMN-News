import { useState } from 'react';
import { MessageCircle, User, Trash2, Send, ThumbsUp, CornerDownRight } from 'lucide-react';
import { useNews } from '@/context/NewsContextCore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { timeAgo } from '@/utils/timeAgo';
import type { ArticleComment } from '@/types/news';

interface CommentSectionProps {
    articleId: string;
    comments?: ArticleComment[];
}

function CommentItem({ comment, articleId, depth = 0 }: { comment: ArticleComment; articleId: string; depth?: number }) {
    const { addComment, deleteComment, isAdmin } = useNews();
    const [replyOpen, setReplyOpen] = useState(false);
    const [replyAuthor, setReplyAuthor] = useState('');
    const [replyContent, setReplyContent] = useState('');
    const [upvotes, setUpvotes] = useState(comment.upvotes || 0);

    const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;

    const handleUpvote = async () => {
        try {
            const res = await fetch(`${apiBase}/comments/${comment.id}/upvote`, { method: 'POST' });
            if (res.ok) { const data = await res.json(); setUpvotes(data.upvotes); }
        } catch { setUpvotes(v => v + 1); }
    };

    const handleReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyAuthor.trim() && replyContent.trim()) {
            addComment(articleId, { author: replyAuthor.trim(), content: replyContent.trim(), parentId: comment.id });
            setReplyAuthor(''); setReplyContent(''); setReplyOpen(false);
        }
    };

    return (
        <div className={depth > 0 ? 'ml-8 sm:ml-12 border-l-2 border-gray-100 dark:border-zinc-800 pl-4' : ''}>
            <div className="flex gap-3 sm:gap-4 group">
                <div className="flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-gray-500">
                        <User size={16} />
                    </div>
                </div>
                <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                        <h5 className="font-bold text-sm text-[#1a1a1a] dark:text-zinc-100">{comment.author}</h5>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
                            {isAdmin && (
                                <button onClick={() => deleteComment(articleId, comment.id)} className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Delete">
                                    <Trash2 size={13} />
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg mb-2">
                        {comment.content}
                    </p>
                    <div className="flex items-center gap-3">
                        <button onClick={handleUpvote} className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-[#EB483B] transition-colors">
                            <ThumbsUp size={12} /> {upvotes > 0 && upvotes}
                        </button>
                        {depth < 2 && (
                            <button onClick={() => setReplyOpen(v => !v)} className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-[#EB483B] transition-colors">
                                <CornerDownRight size={12} /> Reply
                            </button>
                        )}
                    </div>
                    {replyOpen && (
                        <form onSubmit={handleReply} className="mt-3 space-y-2">
                            <Input placeholder="Your name" value={replyAuthor} onChange={e => setReplyAuthor(e.target.value)} className="text-sm h-8" required />
                            <Textarea placeholder={`Reply to ${comment.author}...`} value={replyContent} onChange={e => setReplyContent(e.target.value)} className="text-sm min-h-[70px]" required />
                            <div className="flex gap-2">
                                <Button type="submit" size="sm" className="bg-[#e53935] hover:bg-[#c62828] text-white text-xs h-7">
                                    <Send size={12} className="mr-1" /> Post Reply
                                </Button>
                                <Button type="button" size="sm" variant="outline" className="text-xs h-7" onClick={() => setReplyOpen(false)}>Cancel</Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 space-y-4">
                    {comment.replies.map(reply => (
                        <CommentItem key={reply.id} comment={reply} articleId={articleId} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function CommentSection({ articleId, comments = [] }: CommentSectionProps) {
    const { addComment } = useNews();
    const [author, setAuthor] = useState('');
    const [content, setContent] = useState('');

    const topLevel = comments.filter(c => !c.parentId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (author.trim() && content.trim()) {
            addComment(articleId, { author: author.trim(), content: content.trim() });
            setAuthor(''); setContent('');
        }
    };

    return (
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t dark:border-zinc-800">
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#1a1a1a] dark:text-zinc-100 mb-6 flex items-center gap-2">
                <MessageCircle size={18} /> Comments ({comments.length})
            </h3>

            <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 dark:bg-zinc-900/40 rounded-xl p-4 sm:p-5 border border-gray-100 dark:border-zinc-800">
                <h4 className="text-sm font-bold text-[#1a1a1a] dark:text-zinc-100 mb-4">Leave a comment</h4>
                <div className="grid gap-3">
                    <Input placeholder="Your name" value={author} onChange={e => setAuthor(e.target.value)} className="bg-white dark:bg-zinc-800 text-sm" required />
                    <Textarea placeholder="Share your thoughts..." value={content} onChange={e => setContent(e.target.value)} className="bg-white dark:bg-zinc-800 text-sm min-h-[100px]" required />
                    <div className="flex justify-end">
                        <Button type="submit" className="bg-[#e53935] hover:bg-[#c62828] text-white flex items-center gap-2" disabled={!author.trim() || !content.trim()}>
                            <Send size={16} /> Post Comment
                        </Button>
                    </div>
                </div>
            </form>

            <div className="space-y-6">
                {topLevel.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-zinc-900/20 rounded-xl">
                        <p className="text-gray-500 dark:text-zinc-500 text-sm">Be the first to comment on this article.</p>
                    </div>
                ) : (
                    topLevel.slice().reverse().map(comment => (
                        <CommentItem key={comment.id} comment={comment} articleId={articleId} />
                    ))
                )}
            </div>
        </div>
    );
}
