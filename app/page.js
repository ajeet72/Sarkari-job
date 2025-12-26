"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Calendar, Eye, ThumbsUp, Briefcase } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { InfoColumn } from "@/components/InfoColumn";
import { CATEGORIES } from "@/lib/Types";

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  /* ✅ KEY LOGIC */
  const isFiltered =
    searchQuery.trim().length > 0 || selectedCategory !== "all";

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [searchQuery, selectedCategory]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let url = "/api/posts?status=published&limit=20";

      if (selectedCategory !== "all") {
        url += `&category=${selectedCategory}`;
      }

      if (searchQuery) {
        url += `&search=${searchQuery}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* ================= HEADER ================= */}
      <header className="border-b border-blue-900/30 bg-slate-950/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">OnlineAlert.in</h1>
              <p className="text-xs text-blue-300/70">
                Click, Complete, Stay Connected
              </p>
            </div>
          </Link>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl font-bold text-blue-400 mb-4">
            Find Your Dream Government Job
          </h2>
          <p className="text-xl text-blue-200/80 mb-8">
            Latest jobs, results, admit cards & yojana
          </p>

          <div className="max-w-3xl mx-auto bg-slate-900/50 p-6 rounded-xl border border-blue-500/20">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
                <Input
                  placeholder="Search jobs, exams, results..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-blue-500/30 text-white"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="md:w-[200px] bg-slate-800/50 border-blue-500/30 text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>

                <SelectContent className="bg-slate-900 border-blue-500/30">
                  <SelectItem value="all">All Categories</SelectItem>

                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>


              <Button
                onClick={fetchPosts}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= POSTS ================= */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-white mb-8">Latest Updates</h3>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 bg-slate-800/50 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : isFiltered ? (
            posts.length === 0 ? (
              <p className="text-center text-blue-300">No posts found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <Link key={post.id} href={`/jobs/${post.slug}`}>
                    <Card className="bg-slate-900/50 border-blue-500/20 hover:scale-105 transition">
                      {post.featuredImage && (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="h-48 w-full object-cover rounded-t-lg"
                        />
                      )}
                      <CardHeader>
                        <CardTitle className="text-white line-clamp-2">
                          {post.title}
                        </CardTitle>
                        <CardDescription className="text-blue-300/70 line-clamp-2">
                          {post.excerpt}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.categories?.map((c) => (
                            <Badge key={c} className="bg-blue-900/50">
                              {c}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-sm text-blue-300/60 flex gap-4">
                          <span className="flex gap-1 items-center">
                            <Calendar className="h-4 w-4" />
                            {formatDate(post.publishedDate)}
                          </span>
                          <span className="flex gap-1 items-center">
                            <Eye className="h-4 w-4" />
                            {post.views}
                          </span>
                          <span className="flex gap-1 items-center">
                            <ThumbsUp className="h-4 w-4" />
                            {post.likes}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
                <InfoColumn
                  title="Banking Updates"
                  posts={posts.filter((p) => p.categories?.includes("Banking Updates"))}
                  href="/banking-updates"
                />

                <InfoColumn
                  title="Latest Jobs"
                  posts={posts.filter((p) => p.categories?.includes("Latest Jobs"))}
                  href="/latest-jobs"
                />

                <InfoColumn
                  title="Sarkari Yojana"
                  posts={posts.filter((p) => p.categories?.includes("Sarkari Yojana"))}
                  href="/sarkari-yojana"
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <InfoColumn
                  title="Admit Card"
                  posts={posts.filter((p) => p.categories?.includes("Admit Card"))}
                  href="/admit-card"
                />

                <InfoColumn
                  title="Results"
                  posts={posts.filter((p) => p.categories?.includes("Results"))}
                  href="/results"
                />

                <InfoColumn
                  title="Admission"
                  posts={posts.filter((p) => p.categories?.includes("Admission"))}
                  href="/admission"
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
