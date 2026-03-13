import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { calculateReadingTime } from '@/utils/readingTime';
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
    tags: '',
    featured: false,
    isBreaking: false,
    publishAt: '',
    articleType: 'News',
    dateline: '',
    imageCaption: '',
    imageCredit: '',
    correction: '',
    editedBy: '',
    series: '',
    seriesPart: '',
    seriesTotal: '',
    factCheckVerdict: '',
    lastVerified: '',
    aboutArticle: '',
    sources: '',
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
        tags: Array.isArray(existingArticle.tags) ? existingArticle.tags.join(', ') : (existingArticle.tags || ''),
        featured: existingArticle.featured || false,
        isBreaking: existingArticle.isBreaking || false,
        publishAt: existingArticle.publishAt ? existingArticle.publishAt.slice(0, 16) : '',
        articleType: existingArticle.articleType || 'News',
        dateline: existingArticle.dateline || '',
        imageCaption: existingArticle.imageCaption || '',
        imageCredit: existingArticle.imageCredit || '',
        correction: existingArticle.correction || '',
        editedBy: existingArticle.editedBy || '',
        series: existingArticle.series || '',
        seriesPart: existingArticle.seriesPart ? String(existingArticle.seriesPart) : '',
        seriesTotal: existingArticle.seriesTotal ? String(existingArticle.seriesTotal) : '',
        factCheckVerdict: existingArticle.factCheckVerdict || '',
        lastVerified: existingArticle.lastVerified ? existingArticle.lastVerified.slice(0, 10) : '',
        aboutArticle: existingArticle.aboutArticle || '',
        sources: existingArticle.sources || '',
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const apiBase = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace('/api', '')
        : `${window.location.protocol}//${window.location.hostname}:5000`;
      const res = await fetch(`${apiBase}/api/upload`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      addCustomImage(url);
      setFormData(prev => ({ ...prev, image: url }));
    } catch {
      // Fallback to Base64 if server unavailable
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
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      const publishAt = formData.publishAt ? new Date(formData.publishAt).toISOString() : undefined;
      const status = publishAt && new Date(formData.publishAt) > new Date() ? 'scheduled' : 'published';
      const articleData = {
        ...formData,
        tags: tagsArray,
        publishAt,
        status,
        readTime: calculateReadingTime(formData.content),
        time: 'Just now',
        seriesPart: formData.seriesPart ? parseInt(formData.seriesPart) : undefined,
        seriesTotal: formData.seriesTotal ? parseInt(formData.seriesTotal) : undefined,
        lastVerified: formData.lastVerified ? new Date(formData.lastVerified).toISOString() : undefined,
        factCheckVerdict: formData.factCheckVerdict || undefined,
        aboutArticle: formData.aboutArticle || undefined,
        sources: formData.sources || undefined,
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
              <div className="mt-3 sm:mt-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2 font-medium">Preview Selection:</p>
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

          {/* Tags */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Tags <span className="text-gray-400 font-normal">(comma-separated)</span>
            </label>
            <Input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g. Pakistan, Economy, IMF"
              className="text-sm"
            />
          </div>

          {/* Article Type & Dateline */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Article Type
              </label>
              <select
                name="articleType"
                value={formData.articleType}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e53935] text-sm"
                title="Select article type"
              >
                {['News', 'Analysis', 'Opinion', 'Explainer', 'Fact Check', 'Feature', 'Exclusive', 'In Depth', 'Investigation'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Dateline <span className="text-gray-400 font-normal">(e.g. ISLAMABAD)</span>
              </label>
              <Input
                type="text"
                name="dateline"
                value={formData.dateline}
                onChange={handleChange}
                placeholder="ISLAMABAD"
                className="text-sm"
              />
            </div>
          </div>

          {/* Image Caption & Credit */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Image Caption
              </label>
              <Input
                type="text"
                name="imageCaption"
                value={formData.imageCaption}
                onChange={handleChange}
                placeholder="Describe what's in the photo"
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Image Credit <span className="text-gray-400 font-normal">(e.g. AFP/Reuters)</span>
              </label>
              <Input
                type="text"
                name="imageCredit"
                value={formData.imageCredit}
                onChange={handleChange}
                placeholder="AFP / Reuters / AP"
                className="text-sm"
              />
            </div>
          </div>

          {/* Edited By */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Editing by
            </label>
            <Input
              type="text"
              name="editedBy"
              value={formData.editedBy}
              onChange={handleChange}
              placeholder="Editor name"
              className="text-sm"
            />
          </div>

          {/* Correction Notice */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Correction Notice <span className="text-gray-400 font-normal">(leave blank if none)</span>
            </label>
            <textarea
              name="correction"
              value={formData.correction}
              onChange={handleChange}
              placeholder="An earlier version of this story misstated..."
              rows={2}
              className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e53935] text-sm"
            />
          </div>

          {/* Series */}
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="sm:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Series Name
              </label>
              <Input
                type="text"
                name="series"
                value={formData.series}
                onChange={handleChange}
                placeholder="e.g. Pakistan Economy Crisis"
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Part #
              </label>
              <Input
                type="number"
                name="seriesPart"
                value={formData.seriesPart}
                onChange={handleChange}
                placeholder="1"
                min="1"
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Total Parts
              </label>
              <Input
                type="number"
                name="seriesTotal"
                value={formData.seriesTotal}
                onChange={handleChange}
                placeholder="5"
                min="1"
                className="text-sm"
              />
            </div>
          </div>

          {/* Fact Check Verdict */}
          {formData.articleType === 'Fact Check' && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Fact-Check Verdict
              </label>
              <select
                name="factCheckVerdict"
                value={formData.factCheckVerdict}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e53935] text-sm"
                title="Select verdict"
              >
                <option value="">Select verdict</option>
                {['True', 'False', 'Misleading', 'Partly True', 'Unverified'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          )}

          {/* About Article + Sources */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              About This Article <span className="text-gray-400 font-normal">(reporting notes, sources methodology)</span>
            </label>
            <textarea
              name="aboutArticle"
              value={formData.aboutArticle}
              onChange={handleChange}
              placeholder="This story was reported over 3 days. Sources include..."
              rows={3}
              className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e53935] text-sm"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Sources <span className="text-gray-400 font-normal">(one per line: Label | URL)</span>
              </label>
              <textarea
                name="sources"
                value={formData.sources}
                onChange={handleChange}
                placeholder={"UN Security Council Report | https://un.org/...\nReuters | https://reuters.com/..."}
                rows={4}
                className="w-full px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e53935] text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Last Verified Date
              </label>
              <Input
                type="date"
                name="lastVerified"
                value={formData.lastVerified}
                onChange={handleChange}
                className="text-sm"
              />
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Schedule Publish <span className="text-gray-400 font-normal">(leave blank to publish now)</span>
            </label>
            <Input
              type="datetime-local"
              name="publishAt"
              value={formData.publishAt}
              onChange={handleChange}
              className="text-sm"
            />
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Article' : formData.publishAt && new Date(formData.publishAt) > new Date() ? 'Schedule Article' : 'Publish Article'}
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
