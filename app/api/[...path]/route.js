import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';
import { generateExcerpt, generateSEO } from '@/lib/openai';

export const dynamic = 'force-dynamic'; // <-- Add this
export const runtime = 'nodejs'; 

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }));
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params;
  const route = `/${path.join('/')}`;
  const method = request.method;

  try {
    // PUBLIC ROUTES
    
    // GET /api/posts - Get all published posts
    if (route === '/posts' && method === 'GET') {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') || 'published';
      const category = searchParams.get('category');
      const search = searchParams.get('search');
      const limit = parseInt(searchParams.get('limit') || '10');
      const skip = parseInt(searchParams.get('skip') || '0');
      
      const where = { status };
      if (category) where.categories = { has: category };
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      const posts = await prisma.post.findMany({
        where,
        orderBy: { publishedDate: 'desc' },
        take: limit,
        skip,
        include: { adminAuthor: { select: { username: true } } }
      });
      
      const total = await prisma.post.count({ where });
      
      return handleCORS(NextResponse.json({ posts, total }));
    }
    
    // GET /api/posts/[slug] - Get single post by slug
    if (route.startsWith('/posts/') && method === 'GET') {
      const slug = path[1];
      const post = await prisma.post.findUnique({
        where: { slug },
        include: { adminAuthor: { select: { username: true } } }
      });
      
      if (!post) {
        return handleCORS(NextResponse.json({ error: 'Post not found' }, { status: 404 }));
      }
      
      return handleCORS(NextResponse.json(post));
    }
    
    // POST /api/posts/[slug]/view - Increment view count
    if (route.match(/^\/posts\/.+\/view$/) && method === 'POST') {
      const slug = path[1];
      const post = await prisma.post.update({
        where: { slug },
        data: { views: { increment: 1 } }
      });
      
      return handleCORS(NextResponse.json({ views: post.views }));
    }
    
    // POST /api/posts/[slug]/like - Increment like count
    if (route.match(/^\/posts\/.+\/like$/) && method === 'POST') {
      const slug = path[1];
      const post = await prisma.post.update({
        where: { slug },
        data: { likes: { increment: 1 } }
      });
      
      return handleCORS(NextResponse.json({ likes: post.likes }));
    }
    
    // GET /api/categories - Get all unique categories
    if (route === '/categories' && method === 'GET') {
      const posts = await prisma.post.findMany({
        where: { status: 'published' },
        select: { categories: true }
      });
      
      const categories = [...new Set(posts.flatMap(p => p.categories))];
      return handleCORS(NextResponse.json(categories));
    }
    
    // GET /api/tags - Get all unique tags
    if (route === '/tags' && method === 'GET') {
      const posts = await prisma.post.findMany({
        where: { status: 'published' },
        select: { tags: true }
      });
      
      const tags = [...new Set(posts.flatMap(p => p.tags))];
      return handleCORS(NextResponse.json(tags));
    }
    
    // ADMIN ROUTES (Protected)
    const session = await getServerSession(authOptions);
    
    // POST /api/admin/setup - Create initial admin (only if no admins exist)
    if (route === '/admin/setup' && method === 'POST') {
      const adminCount = await prisma.admin.count();
      if (adminCount > 0) {
        return handleCORS(NextResponse.json({ error: 'Admin already exists' }, { status: 400 }));
      }
      
      const body = await request.json();
      const hashedPassword = await hash(body.password, 12);
      
      const admin = await prisma.admin.create({
        data: {
          username: body.username,
          email: body.email,
          password: hashedPassword
        }
      });
      
      return handleCORS(NextResponse.json({ message: 'Admin created', id: admin.id }));
    }
    
    if (!session) {
      return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }
    
    // GET /api/admin/dashboard - Get dashboard statistics
    if (route === '/admin/dashboard' && method === 'GET') {
      const totalPosts = await prisma.post.count();
      const publishedPosts = await prisma.post.count({ where: { status: 'published' } });
      const draftPosts = await prisma.post.count({ where: { status: 'draft' } });
      const scheduledPosts = await prisma.post.count({ where: { status: 'scheduled' } });
      
      const postsWithStats = await prisma.post.findMany({
        select: { views: true, likes: true }
      });
      
      const totalViews = postsWithStats.reduce((sum, p) => sum + p.views, 0);
      const totalLikes = postsWithStats.reduce((sum, p) => sum + p.likes, 0);
      
      return handleCORS(NextResponse.json({
        totalPosts,
        publishedPosts,
        draftPosts,
        scheduledPosts,
        totalViews,
        totalLikes
      }));
    }
    
    // GET /api/admin/posts - Get all posts (with filters)
    if (route === '/admin/posts' && method === 'GET') {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      
      const where = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      const posts = await prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { adminAuthor: { select: { username: true } } }
      });
      
      return handleCORS(NextResponse.json(posts));
    }
    
    // POST /api/admin/posts - Create new post
    if (route === '/admin/posts' && method === 'POST') {
      const body = await request.json();
      const admin = await prisma.admin.findUnique({ where: { email: session.user.email } });
      
      // Generate slug from title
      const slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Generate AI-powered excerpt and SEO if requested
      let excerpt = body.excerpt;
      let metaDescription = body.metaDescription;
      let metaKeywords = body.metaKeywords;
      
      if (body.useAI && body.content) {
        if (!excerpt) {
          excerpt = await generateExcerpt(body.content);
        }
        if (!metaDescription || !metaKeywords) {
          const seoData = await generateSEO(body.title, body.content);
          if (seoData) {
            const lines = seoData.split('\\n');
            metaDescription = metaDescription || lines[0]?.replace(/^1\\.\\s*/, '');
            metaKeywords = metaKeywords || lines[1]?.replace(/^2\\.\\s*/, '');
          }
        }
      }
      
      const post = await prisma.post.create({
        data: {
          title: body.title,
          slug,
          excerpt,
          content: body.content,
          author: admin.username,
          authorId: admin.id,
          tags: body.tags || [],
          categories: body.categories || [],
          status: body.status || 'draft',
          scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
          publishedDate: body.status === 'published' ? new Date() : null,
          metaTitle: body.metaTitle || body.title,
          metaDescription,
          metaKeywords,
          ogImage: body.ogImage,
          twitterCard: body.twitterCard,
          featuredImage: body.featuredImage
        }
      });
      
      return handleCORS(NextResponse.json(post));
    }
    
    // PUT /api/admin/posts/[id] - Update post
    if (route.match(/^\/admin\/posts\/.+$/) && method === 'PUT') {
      const id = path[2];
      const body = await request.json();
      
      const updateData = {
        title: body.title,
        excerpt: body.excerpt,
        content: body.content,
        tags: body.tags,
        categories: body.categories,
        status: body.status,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        metaKeywords: body.metaKeywords,
        ogImage: body.ogImage,
        twitterCard: body.twitterCard,
        featuredImage: body.featuredImage
      };
      
      if (body.status === 'published' && !body.publishedDate) {
        updateData.publishedDate = new Date();
      }
      
      const post = await prisma.post.update({
        where: { id },
        data: updateData
      });
      
      return handleCORS(NextResponse.json(post));
    }
    
    // DELETE /api/admin/posts/[id] - Delete post
    if (route.match(/^\/admin\/posts\/.+$/) && method === 'DELETE') {
      const id = path[2];
      await prisma.post.delete({ where: { id } });
      
      return handleCORS(NextResponse.json({ message: 'Post deleted' }));
    }
    
    // POST /api/upload - Upload image to Cloudinary
    if (route === '/upload' && method === 'POST') {
      const formData = await request.formData();
      const file = formData.get('file');
      
      if (!file) {
        return handleCORS(NextResponse.json({ error: 'No file provided' }, { status: 400 }));
      }
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'sarkari-blog' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
      
      return handleCORS(NextResponse.json({ url: result.secure_url }));
    }
    
    // POST /api/ai/excerpt - Generate excerpt using AI
    if (route === '/ai/excerpt' && method === 'POST') {
      const body = await request.json();
      const excerpt = await generateExcerpt(body.content);
      return handleCORS(NextResponse.json({ excerpt }));
    }
    
    // POST /api/ai/seo - Generate SEO metadata using AI
    if (route === '/ai/seo' && method === 'POST') {
      const body = await request.json();
      const seoData = await generateSEO(body.title, body.content);
      return handleCORS(NextResponse.json({ seoData }));
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ));

  } catch (error) {
    console.error('API Error:', error);
    return handleCORS(NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    ));
  }
}

// Export all HTTP methods
export const GET = handleRoute;
export const POST = handleRoute;
export const PUT = handleRoute;
export const DELETE = handleRoute;
export const PATCH = handleRoute;