'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Calendar, Eye, ThumbsUp, Tag, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [selectedCategory, searchQuery]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let url = '/api/posts?status=published&limit=20';
      if (selectedCategory !== 'all') url += `&category=${selectedCategory}`;
      if (searchQuery) url += `&search=${searchQuery}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-fade-in">
            Find Your Dream Government Job
          </h2>
          <p className="text-xl text-blue-200/80 mb-8 max-w-2xl mx-auto">
            Stay updated with the latest notifications, results, and career guidance
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-blue-500/20 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
                <Input
                  placeholder="Search for jobs, exams, results..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-blue-500/30 text-white placeholder:text-blue-300/50 focus:border-blue-400"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="md:w-[200px] bg-slate-800/50 border-blue-500/30 text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-blue-500/30">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-white">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={fetchPosts}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
            Latest Updates
          </h3>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-slate-900/50 border-blue-500/20 animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-slate-800 rounded mb-2"></div>
                    <div className="h-4 bg-slate-800 rounded w-2/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-slate-800 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-blue-300/70 text-lg">No posts found. Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.id} href={`/jobs/${post.slug}`}>
                  <Card className="bg-slate-900/50 border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer h-full">
                    {post.featuredImage && (
                      <div className="relative h-48 overflow-hidden rounded-t-lg">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-white hover:text-blue-400 transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="text-blue-300/70 line-clamp-2">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.categories?.slice(0, 2).map((cat) => (
                          <Badge key={cat} variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-500/30">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-blue-300/60">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(post.publishedDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {post.views}
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {post.likes}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

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
