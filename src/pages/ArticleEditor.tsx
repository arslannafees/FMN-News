import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNews } from '@/context/NewsContextCore';

export function ArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getArticleById, addArticle, updateArticle, config, customImages, libraryImages, addCustomImage, deleteImage } = useNews();

  const isEditing = !!id;
  const existingArticle = isEditing ? getArticleById(id) : null;

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'World',
    author: '',
    image: '',
    readTime: '5 min read',
    featured: false,
    isBreaking: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingArticle) {
      setFormData({
        title: existingArticle.title,
        excerpt: existingArticle.excerpt,
        content: existingArticle.content,
        category: existingArticle.category,
        author: existingArticle.author,
        image: existingArticle.image,
        readTime: existingArticle.readTime || '5 min read',
        featured: existingArticle.featured || false,
        isBreaking: existingArticle.isBreaking || false,
      });
    }
  }, [existingArticle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        addCustomImage(base64String);
        setFormData(prev => ({ ...prev, image: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const articleData = {
        ...formData,
        time: 'Just now',
      };

      if (isEditing && id) {
        updateArticle(id, articleData);
      } else {
        addArticle(articleData);
      }

      navigate('/admin');
    } catch (error) {
      console.error('Error saving article:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-4 sm:py-6 lg:py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link to="/admin" className="text-gray-500 hover:text-[#e53935] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-[#1a1a1a]">
              {isEditing ? 'Edit Article' : 'Create New Article'}
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm">
              {isEditing ? 'Update your article content' : 'Write and publish a new article'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Article Title *
            </label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter article title"
              required
              className="text-sm"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Excerpt *
            </label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="Brief summary of the article"
              required
              rows={3}
              className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e53935] text-sm"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Full Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your article content here..."
              required
              rows={10}
              className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e53935] text-sm"
            />
          </div>

          {/* Two Column Layout for smaller fields */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Category */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e53935] text-sm"
                title="Select category"
              >
                {config.categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Author *
              </label>
              <Input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="Author name"
                required
                className="text-sm"
              />
            </div>
          </div>

          {/* Read Time */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Read Time
            </label>
            <Input
              type="text"
              name="readTime"
              value={formData.readTime}
              onChange={handleChange}
              placeholder="e.g., 5 min read"
              className="text-sm"
            />
          </div>

          {/* Image Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Featured Image
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs h-8"
              >
                <Upload size={14} className="mr-1" />
                Upload Image
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
                title="Upload featured image"
              />
            </div>

            {/* Custom/Uploaded Images */}
            {customImages.length > 0 && (
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-wider">Your Uploads</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
                  {customImages.map((img, idx) => (
                    <div key={`custom-${idx}`} className="relative group">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: img }))}
                        className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${formData.image === img ? 'border-[#e53935] ring-2 ring-[#e53935]/20' : 'border-transparent hover:border-gray-300'
                          }`}
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {formData.image === img && (
                          <div className="absolute inset-0 bg-[#e53935]/20 flex items-center justify-center">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#e53935] rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (formData.image === img) setFormData(prev => ({ ...prev, image: '' }));
                          deleteImage(img);
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-white shadow-md rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100"
                        title="Delete image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Library Images */}
            {libraryImages.length > 0 && (
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-wider">Library Images</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
                  {libraryImages.map((img, idx) => (
                    <div key={`library-${idx}`} className="relative group">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: img }))}
                        className={`relative aspect-square w-full rounded-lg overflow-hidden border-2 transition-all ${formData.image === img ? 'border-[#e53935] ring-2 ring-[#e53935]/20' : 'border-transparent hover:border-gray-300'
                          }`}
                      >
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {formData.image === img && (
                          <div className="absolute inset-0 bg-[#e53935]/20 flex items-center justify-center">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#e53935] rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (formData.image === img) setFormData(prev => ({ ...prev, image: '' }));
                          deleteImage(img);
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-white shadow-md rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100"
                        title="Delete image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.image && (
              <div className="mt-3 sm:mt-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-500 mb-2 font-medium">Preview Selection:</p>
                <div className="relative w-full max-w-sm h-48 sm:h-56 rounded-lg overflow-hidden shadow-sm">
                  <img
                    src={formData.image}
                    alt="Selected"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                    title="Remove selected image"
                    aria-label="Remove selected image"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Custom Image URL */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Or enter image URL
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={formData.image.startsWith('data:') || formData.image.startsWith('/') ? '' : formData.image}
                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="flex-1 text-sm"
              />
            </div>
            {(formData.image.startsWith('data:') || formData.image.startsWith('/')) && (
              <p className="text-[10px] text-gray-400 mt-1 italic">Note: Currently using an uploaded or library image.</p>
            )}
          </div>

          {/* Options */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="w-4 h-4 text-[#e53935] rounded focus:ring-[#e53935]"
              />
              <span className="text-xs sm:text-sm text-gray-700">Feature this article (main story)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isBreaking"
                checked={formData.isBreaking}
                onChange={handleChange}
                className="w-4 h-4 text-[#e53935] rounded focus:ring-[#e53935]"
              />
              <span className="text-xs sm:text-sm text-gray-700">Mark as breaking news</span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#e53935] hover:bg-[#c62828] text-white text-sm px-8"
            >
              <Save size={16} className="mr-2" />
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Article' : 'Publish Article')}
            </Button>
            <Link to="/admin">
              <Button type="button" variant="outline" className="w-full sm:w-auto text-sm">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
