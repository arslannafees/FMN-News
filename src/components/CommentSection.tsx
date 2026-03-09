import { useState } from 'react';
import { MessageCircle, User, Trash2, Send } from 'lucide-react';
import { useNews } from '@/context/NewsContextCore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import type { ArticleComment } from '@/types/news';

interface CommentSectionProps {
    articleId: string;
    comments?: ArticleComment[];
}

export function CommentSection({ articleId, comments = [] }: CommentSectionProps) {
    const { addComment, deleteComment, isAdmin } = useNews();
    const [author, setAuthor] = useState('');
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (author.trim() && content.trim()) {
            addComment(articleId, {
                author: author.trim(),
                content: content.trim(),
            });
            setAuthor('');
            setContent('');
        }
    };

    return (
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t">
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#1a1a1a] mb-6 flex items-center gap-2">
                <MessageCircle size={18} />
                Comments ({comments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 rounded-lg p-4 sm:p-6">
                <h4 className="text-sm font-semibold text-[#1a1a1a] mb-4">Leave a comment</h4>
                <div className="grid gap-4">
                    <Input
                        placeholder="Your name"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="bg-white"
                        required
                    />
                    <Textarea
                        placeholder="Share your thoughts..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="bg-white min-h-[100px]"
                        required
                    />
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            className="bg-[#e53935] hover:bg-[#c62828] text-white flex items-center gap-2"
                            disabled={!author.trim() || !content.trim()}
                        >
                            <Send size={16} />
                            Post Comment
                        </Button>
                    </div>
                </div>
            </form>

            {/* Comments List */}
            <div className="space-y-6">
                {comments.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-sm">Be the first to comment on this article.</p>
                    </div>
                ) : (
                    comments.slice().reverse().map((comment) => (
                        <div key={comment.id} className="flex gap-3 sm:gap-4 group">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                    <User size={20} />
                                </div>
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center justify-between mb-1">
                                    <h5 className="font-semibold text-sm text-[#1a1a1a]">{comment.author}</h5>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] sm:text-xs text-gray-500">
                                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                        </span>
                                        {isAdmin && (
                                            <button
                                                onClick={() => deleteComment(articleId, comment.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete comment"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
