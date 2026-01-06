import React, { useState, useEffect } from 'react';
import { BlogPost, ViewState } from '../types';
import { rtdb } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { Calendar, ChevronRight, ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';

interface BlogProps {
  onNavigate: (view: ViewState) => void;
}

export const Blog: React.FC<BlogProps> = ({ onNavigate }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postsRef = ref(rtdb, 'blog_posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array
        const postsArray = Object.values(data) as BlogPost[];
        // Sort by date descending
        setPosts(postsArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (href.startsWith('#')) {
      const viewKey = href.substring(1); 
      // Check if viewKey matches a ViewState
      if (Object.values(ViewState).includes(viewKey as ViewState)) {
          onNavigate(viewKey as ViewState);
          // Scroll to top is handled in App.tsx now
      }
    }
  };

  const renderContent = (content: string) => {
    // Process text line by line to handle paragraphs
    return content.split('\n').map((paragraph, pIdx) => {
        if (!paragraph.trim()) return <br key={pIdx} />;
        
        const parts = [];
        let lastIndex = 0;
        // Regex to match markdown links like [Text](#Target)
        // Improved regex to better handle spaces or special chars in title
        const regex = /\[(.*?)\]\((#.*?)\)/g;
        let match;
        
        while ((match = regex.exec(paragraph)) !== null) {
            // Text before match
            if (match.index > lastIndex) {
                parts.push(paragraph.substring(lastIndex, match.index));
            }
            
            const linkText = match[1];
            const linkTarget = match[2];
            const isLaunchLink = linkText.toLowerCase().includes('launch');

            // The Link - Rendered as a styled interactive element
            parts.push(
                <a 
                    key={match.index} 
                    href={linkTarget} 
                    onClick={(e) => handleLinkClick(e, linkTarget)}
                    className={`inline-flex items-center gap-2 mx-1 font-bold cursor-pointer transition-all transform hover:-translate-y-0.5 ${
                      isLaunchLink 
                        ? 'bg-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 hover:shadow-lg no-underline text-sm'
                        : 'text-primary hover:underline'
                    }`}
                >
                    {linkText} 
                    {!isLaunchLink && <ExternalLink size={12} />}
                </a>
            );
            lastIndex = regex.lastIndex;
        }
        // Remaining text
        if (lastIndex < paragraph.length) {
            parts.push(paragraph.substring(lastIndex));
        }

        return <p key={pIdx} className="mb-4 text-gray-700 leading-relaxed flex flex-wrap items-center">{parts}</p>;
    });
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (selectedPost) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <button 
          onClick={() => setSelectedPost(null)}
          className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Articles
        </button>

        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {selectedPost.imageUrl && (
            <div className="h-64 md:h-96 w-full overflow-hidden">
              <img 
                src={selectedPost.imageUrl} 
                alt={selectedPost.title} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Calendar size={16} />
              {selectedPost.date}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 leading-tight">
              {selectedPost.title}
            </h1>
            
            <div className="prose prose-lg max-w-none">
              {renderContent(selectedPost.content)}
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center py-10">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Latest Updates & Tutorials</h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Discover how to use AI tools effectively, read about the latest updates, and get creative inspiration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.length > 0 ? (
          posts.map(post => (
            <div 
              key={post.id} 
              onClick={() => setSelectedPost(post)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full"
            >
              <div className="h-48 overflow-hidden bg-gray-100">
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <BookOpen size={48} />
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Article</span>
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">
                  {/* Strip markdown links for preview */}
                  {post.content.replace(/\[(.*?)\]\(.*?\)/g, '$1').substring(0, 100)}...
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                   <span className="text-xs text-gray-400">{post.date}</span>
                   <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                     Read More <ChevronRight size={16} />
                   </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500">No blog posts found. Create one in the Admin Panel!</p>
          </div>
        )}
      </div>
    </div>
  );
};