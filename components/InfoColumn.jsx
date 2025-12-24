import Link from "next/link";

export function InfoColumn({ title, posts, href }) {
  return (
    <div className="bg-slate-900/60 border border-blue-500/20 rounded-xl overflow-hidden">

      {/* Header */}
      <div className="bg-blue-950/60 px-4 py-3 border-b border-blue-500/20">
        <h4 className="text-lg font-semibold text-blue-300">{title}</h4>
      </div>

      {/* List */}
      <ul className="divide-y divide-blue-500/10 max-h-[360px] overflow-y-auto">
        {posts.slice(0, 8).map((post) => (
          <li
            key={post.id}
            className="px-4 py-3 hover:bg-blue-900/20 transition"
          >
            <Link
              href={`/jobs/${post.slug}`}
              className="text-sm text-blue-200 hover:text-blue-400 block leading-snug"
            >
              {post.title}
            </Link>
            <span className="text-xs text-blue-300/50">
              {new Date(post.publishedDate).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="text-center py-3 border-t border-blue-500/20">
        <Link href={href} className="text-sm text-blue-400 hover:underline">
          View More →
        </Link>
      </div>
    </div>
  );
}
