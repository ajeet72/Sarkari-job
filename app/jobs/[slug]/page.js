'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Eye, ThumbsUp, Tag, ArrowLeft, Share2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function BlogDetail() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (params.slug) {
      fetchPost();
      incrementView();
    }
  }, [params.slug]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${params.slug}`);
      if (!res.ok) {
        router.push('/');
        return;
      }
      const data = await res.json();
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const incrementView = async () => {
    try {
      await fetch(`/api/posts/${params.slug}/view`, { method: 'POST' });
    } catch (error) {
      console.error('Error incrementing view:', error);
    }
  };

  const handleLike = async () => {
    if (liked) return;
    try {
      const res = await fetch(`/api/posts/${params.slug}/like`, { method: 'POST' });
      const data = await res.json();
      setPost({ ...post, likes: data.likes });
      setLiked(true);
      toast.success('Thanks for liking!');
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderContent = (content) => {
    try {
      const data = JSON.parse(content);
      return data.blocks?.map((block, index) => {
        switch (block.type) {
          case 'header':
            const HeaderTag = `h${block.data.level}`;
            return <HeaderTag key={index} className="text-white font-bold my-4">{block.data.text}</HeaderTag>;
          case 'paragraph':
            return <p key={index} className="text-blue-100/80 my-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: block.data.text }} />;
          case 'list':
            const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
            return (
              <ListTag key={index} className="text-blue-100/80 my-4 ml-6 list-disc">
                {block.data.items.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: item }} />)}
              </ListTag>
            );
          case 'code':
            return (
              <pre key={index} className="bg-slate-800 p-4 rounded-lg my-4 overflow-x-auto">
                <code className="text-blue-300">{block.data.code}</code>
              </pre>
            );
          case 'image':
            return (
              <div key={index} className="my-6">
                <img src={block.data.file.url} alt={block.data.caption || ''} className="rounded-lg w-full" />
                {block.data.caption && <p className="text-center text-blue-300/60 text-sm mt-2">{block.data.caption}</p>}
              </div>
            );
          default:
            return null;
        }
      });
    } catch (error) {
      return <div className="text-blue-100/80" dangerouslySetInnerHTML={{ __html: content }} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-blue-900/30 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Sarkari Job Blog
                  </h1>
                  <p className="text-xs text-blue-300/70">Latest Government Job Updates</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="outline" className="mb-6 border-blue-500/30 text-blue-300 hover:bg-blue-900/30">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <article className="max-w-4xl mx-auto">
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative h-96 rounded-2xl overflow-hidden mb-8">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Post Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-blue-300/70 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {formatDate(post.publishedDate)}
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {post.views} views
              </div>
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5" />
                {post.likes} likes
              </div>
              <div className="text-blue-300/70">By {post.adminAuthor?.username || post.author}</div>
            </div>

            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.categories.map((cat) => (
                  <Badge key={cat} className="bg-blue-900/50 text-blue-300 border-blue-500/30">
                    {cat}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <div className="bg-slate-900/50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
              <p className="text-xl text-blue-100/90 italic">{post.excerpt}</p>
            </div>
          )}

          {/* Content */}
          <Card className="bg-slate-900/50 border-blue-500/20 p-8 mb-8">
            <div className="prose prose-invert max-w-none">
              {renderContent(post.content)}
            </div>
          </Card>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-blue-500/30 text-blue-300">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleLike}
              disabled={liked}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              {liked ? 'Liked!' : 'Like this post'}
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard!');
              }}
              variant="outline"
              className="border-blue-500/30 text-blue-300 hover:bg-blue-900/30"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </article>
      </div>

      {/* Footer */}
      <footer className="border-t border-blue-900/30 bg-slate-950/50 backdrop-blur-md py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-blue-300/70">
            © 2025 Sarkari Job Blog. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
