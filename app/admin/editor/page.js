'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye, Briefcase, Upload, Sparkles } from 'lucide-react';

export default function BlogEditor() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [featuredImage, setFeaturedImage] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated' && postId) {
      fetchPost();
    }
  }, [status, postId]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/admin/posts`);
      const posts = await res.json();
      const post = posts.find(p => p.id === postId);
      
      if (post) {
        setTitle(post.title);
        setExcerpt(post.excerpt || '');
        setContent(post.content);
        setCategories(post.categories?.join(', ') || '');
        setTags(post.tags?.join(', ') || '');
        setStatus(post.status);
        setFeaturedImage(post.featuredImage || '');
        setMetaTitle(post.metaTitle || '');
        setMetaDescription(post.metaDescription || '');
        setMetaKeywords(post.metaKeywords || '');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      setFeaturedImage(data.url);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const generateAIContent = async () => {
    if (!content) {
      toast.error('Please write some content first');
      return;
    }

    setAiLoading(true);
    try {
      // Generate excerpt
      if (!excerpt) {
        const excerptRes = await fetch('/api/ai/excerpt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });
        const excerptData = await excerptRes.json();
        setExcerpt(excerptData.excerpt);
      }

      // Generate SEO
      if (!metaDescription || !metaKeywords) {
        const seoRes = await fetch('/api/ai/seo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content })
        });
        const seoData = await seoRes.json();
        const lines = seoData.seoData.split('\\n');
        if (!metaDescription) setMetaDescription(lines[0]?.replace(/^1\\.\\s*/, ''));
        if (!metaKeywords) setMetaKeywords(lines[1]?.replace(/^2\\.\\s*/, ''));
      }

      toast.success('AI content generated!');
    } catch (error) {
      console.error('Error generating AI content:', error);
      toast.error('Failed to generate AI content');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title || !content) {
      toast.error('Title and content are required');
      return;
    }

    setLoading(true);
    try {
      const postData = {
        title,
        excerpt,
        content,
        categories: categories.split(',').map(c => c.trim()).filter(Boolean),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        status,
        featuredImage,
        metaTitle: metaTitle || title,
        metaDescription,
        metaKeywords
      };

      const url = postId ? `/api/admin/posts/${postId}` : '/api/admin/posts';
      const method = postId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });

      if (res.ok) {
        toast.success(postId ? 'Post updated!' : 'Post created!');
        router.push('/admin/dashboard');
      } else {
        toast.error('Failed to save post');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-blue-900/30 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin/dashboard">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{postId ? 'Edit Post' : 'New Post'}</h1>
                </div>
              </div>
            </Link>
            <div className="flex gap-2">
              <Button
                onClick={generateAIContent}
                disabled={aiLoading || !content}
                variant="outline"
                className="border-purple-500/30 text-purple-300 hover:bg-purple-900/30"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {aiLoading ? 'Generating...' : 'AI Enhance'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Post'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/admin/dashboard">
          <Button variant="outline" className="mb-6 border-blue-500/30 text-blue-300 hover:bg-blue-900/30">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="grid gap-6">
          {/* Basic Info */}
          <Card className="bg-slate-900/50 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-blue-200">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title"
                  className="bg-slate-800/50 border-blue-500/30 text-white"
                />
              </div>

              <div>
                <Label htmlFor="excerpt" className="text-blue-200">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Short description (AI can generate this)"
                  className="bg-slate-800/50 border-blue-500/30 text-white"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="content" className="text-blue-200">Content *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your blog content here..."
                  className="bg-slate-800/50 border-blue-500/30 text-white"
                  rows={15}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categories" className="text-blue-200">Categories (comma-separated)</Label>
                  <Input
                    id="categories"
                    value={categories}
                    onChange={(e) => setCategories(e.target.value)}
                    placeholder="Bank Jobs, Railway Jobs"
                    className="bg-slate-800/50 border-blue-500/30 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="tags" className="text-blue-200">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="sarkari, government, jobs"
                    className="bg-slate-800/50 border-blue-500/30 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status" className="text-blue-200">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-slate-800/50 border-blue-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-blue-500/30">
                    <SelectItem value="draft" className="text-white">Draft</SelectItem>
                    <SelectItem value="published" className="text-white">Published</SelectItem>
                    <SelectItem value="scheduled" className="text-white">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card className="bg-slate-900/50 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-white">Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="image" className="text-blue-200">Upload Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="bg-slate-800/50 border-blue-500/30 text-white"
                />
              </div>
              {featuredImage && (
                <div>
                  <img src={featuredImage} alt="Featured" className="rounded-lg max-h-64 object-cover" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card className="bg-slate-900/50 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-white">SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle" className="text-blue-200">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="SEO-friendly title"
                  className="bg-slate-800/50 border-blue-500/30 text-white"
                />
              </div>

              <div>
                <Label htmlFor="metaDescription" className="text-blue-200">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="150-160 characters (AI can generate this)"
                  className="bg-slate-800/50 border-blue-500/30 text-white"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="metaKeywords" className="text-blue-200">Meta Keywords</Label>
                <Input
                  id="metaKeywords"
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  placeholder="Comma-separated keywords (AI can generate this)"
                  className="bg-slate-800/50 border-blue-500/30 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
