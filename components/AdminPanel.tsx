import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, rtdb, ADMIN_UIDS } from '../firebaseConfig';
import { ref, onValue, set, get } from 'firebase/database';
import { AdConfig, BlogPost, ViewState } from '../types';
import { Loader2, Save, Users, Activity, LogIn, Lock, Sparkles, Link as LinkIcon, Plus, X, Key, Rocket } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateText } from '../services/geminiService';

interface AdminPanelProps {
  onNavigate: (view: ViewState) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigate }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'ads' | 'blog' | 'settings'>('ads');
  const [activeUsers, setActiveUsers] = useState(0);

  // Default ads structure
  const [ads, setAds] = useState<AdConfig[]>([
    { location: 'home', code: '<!-- AD_HOME -->', enabled: true, impressions: 0 },
    { location: 'sidebar', code: '<!-- AD_SIDEBAR -->', enabled: true, impressions: 0 },
    { location: 'video', code: '<!-- AD_VIDEO -->', enabled: false, impressions: 0 },
    { location: 'popup', code: '<!-- AD_POPUP -->', enabled: false, impressions: 0 },
  ]);

  // Settings State
  const [apiKey, setApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  // Blog State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({ title: '', content: '', imageUrl: '' });
  const [aiWriting, setAiWriting] = useState(false);

  // Initial Auth Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // DEMO MODE: Allow any logged in user. 
  // In production, revert to: const isAdmin = user && ADMIN_UIDS.includes(user.uid);
  const isAdmin = !!user; 

  // Realtime Database Sync
  useEffect(() => {
    if (isAdmin) {
      // Ads
      const adsRef = ref(rtdb, 'ads');
      const adsUnsub = onValue(adsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const loadedAds = Object.values(data) as AdConfig[];
          setAds(prevAds => {
             const mergedAds = prevAds.map(defaultAd => {
                const found = loadedAds.find(a => a.location === defaultAd.location);
                return found || defaultAd;
             });
             // Ensure popup exists if DB is old
             if (!mergedAds.find(a => a.location === 'popup')) {
               mergedAds.push({ location: 'popup', code: '', enabled: false, impressions: 0 });
             }
             return mergedAds;
          });
        }
      });

      // Posts
      const postsRef = ref(rtdb, 'blog_posts');
      const postsUnsub = onValue(postsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setPosts(Object.values(data));
        } else {
            setPosts([]); 
        }
      });

      // Fetch API Key
      get(ref(rtdb, 'settings/apiKey')).then(snap => {
        if(snap.exists()) setApiKey(snap.val());
      });

      return () => {
        adsUnsub();
        postsUnsub();
      }
    }
  }, [isAdmin]);

  // Simulate Realtime Active Users
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(Math.floor(Math.random() * (150 - 120 + 1)) + 120);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleAd = (index: number) => {
    setAds(prev => prev.map((ad, i) => i === index ? { ...ad, enabled: !ad.enabled } : ad));
  };

  const updateAdCode = (index: number, newCode: string) => {
    setAds(prev => prev.map((ad, i) => i === index ? { ...ad, code: newCode } : ad));
  };

  const handleSaveAds = async () => {
    try {
      // Sanitize before saving
      const safeAds = ads.map(ad => ({
        ...ad,
        impressions: ad.impressions || 0
      }));
      
      await set(ref(rtdb, 'ads'), safeAds);
      alert("Ads configuration synced to Realtime Database!");
    } catch (e) {
      console.error(e);
      alert("Failed to save to Firebase.");
    }
  };

  const handleSaveApiKey = async () => {
    setSavingKey(true);
    try {
      await set(ref(rtdb, 'settings/apiKey'), apiKey);
      alert("API Key updated successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to update API Key.");
    } finally {
      setSavingKey(false);
    }
  };

  // Blog Functions
  const handleAiWrite = async () => {
    if (!currentPost.title) {
        alert("Please enter a title first.");
        return;
    }
    setAiWriting(true);
    const prompt = `Write a comprehensive, engaging blog post for a tech savvy audience about: "${currentPost.title}". Include sections and formatting.`;
    const content = await generateText(prompt, 'creative');
    setCurrentPost(prev => ({ ...prev, content: content }));
    setAiWriting(false);
  };

  const toolsList: { name: string, view: ViewState }[] = [
      { name: 'Image Compressor', view: ViewState.IMAGE_COMPRESSOR },
      { name: 'Video Script', view: ViewState.VIDEO_EDITOR },
      { name: 'Face Swap', view: ViewState.FACE_SWAP },
      { name: 'Subtitles', view: ViewState.SUBTITLES },
      { name: 'Planner', view: ViewState.PLANNER },
      { name: 'Photo Enhancer', view: ViewState.PHOTO_ENHANCER }
  ];

  const insertToolLink = (tool: {name: string, view: ViewState}) => {
    // Inserts a link formatted as [Tool Name](#VIEW_STATE)
    // Removed rocket emoji as per user request
    const linkText = `\n\n[Launch ${tool.name}](#${tool.view})\n`;
    setCurrentPost(prev => ({ ...prev, content: (prev.content || '') + linkText }));
  };

  const savePost = async () => {
    if (!currentPost.title || !currentPost.content) return;
    
    const id = currentPost.id || Date.now().toString();
    const newPost = {
        id,
        title: currentPost.title,
        content: currentPost.content,
        imageUrl: currentPost.imageUrl || `https://picsum.photos/800/400?random=${Date.now()}`,
        date: currentPost.date || new Date().toISOString().split('T')[0]
    } as BlogPost;

    // Optimistic update
    let updatedPosts = [];
    if (currentPost.id) {
        updatedPosts = posts.map(p => p.id === newPost.id ? newPost : p);
    } else {
        updatedPosts = [newPost, ...posts];
    }
    setPosts(updatedPosts);

    // Save to Firebase
    try {
        await set(ref(rtdb, `blog_posts/${id}`), newPost);
        setIsEditingPost(false);
        setCurrentPost({ title: '', content: '', imageUrl: '' });
    } catch (e) {
        console.error("Error saving post:", e);
        alert("Failed to save post to cloud.");
    }
  };

  const deletePost = async (id: string) => {
      if (confirm("Are you sure you want to delete this post?")) {
          try {
              await set(ref(rtdb, `blog_posts/${id}`), null);
          } catch(e) {
              console.error(e);
          }
      }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)] text-center animate-fade-in">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-6">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          You are currently signed in as <strong>Guest</strong>. <br/>
          Please sign in to access the control panel.
        </p>
        <button 
          onClick={() => onNavigate(ViewState.LOGIN)}
          className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/30"
        >
          <LogIn size={20} /> Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Control Panel</h2>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-sm text-gray-500">Welcome back, {user.email}</p>
             {!ADMIN_UIDS.includes(user.uid) && (
               <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200">
                 Demo Mode Access
               </span>
             )}
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-white rounded-lg p-1 border border-gray-200 flex">
            <button 
              onClick={() => setActiveTab('ads')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'ads' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Ad Management
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Settings
            </button>
            <button 
              onClick={() => setActiveTab('blog')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'blog' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Blog System
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-fade-in max-w-2xl mx-auto">
           <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
               <Key size={24} />
             </div>
             <div>
               <h3 className="text-xl font-bold text-gray-900">API Configuration</h3>
               <p className="text-gray-500 text-sm">Manage connection keys for AI services.</p>
             </div>
           </div>

           <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Gemini API Key</label>
               <input 
                 type="text" 
                 value={apiKey}
                 onChange={(e) => setApiKey(e.target.value)}
                 className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-primary font-mono text-sm bg-gray-50 focus:bg-white transition-colors"
                 placeholder="AIzaSy..."
               />
               <p className="text-xs text-gray-500 mt-2">
                 This key will be used for all AI operations (text, image, video). 
                 Updates are applied immediately for all users.
               </p>
             </div>

             <div className="flex justify-end pt-4">
               <button 
                 onClick={handleSaveApiKey}
                 disabled={savingKey}
                 className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
               >
                 {savingKey ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                 {savingKey ? 'Saving...' : 'Update API Key'}
               </button>
             </div>
           </div>
        </div>
      )}

      {activeTab === 'ads' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Realtime Stats Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                   <Users size={20} />
                 </div>
                 <h3 className="font-bold text-gray-800">Realtime Users</h3>
               </div>
               <div className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                 {activeUsers}
                 <span className="flex relative h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
               </div>
               <p className="text-sm text-gray-500 mt-2">Active on site right now</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[300px]">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                   <Activity size={20} />
                 </div>
                 <h3 className="font-bold text-gray-800">Ad Impressions Analytics</h3>
               </div>
               <div className="flex-1 w-full min-h-0">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={ads} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="location" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <Tooltip 
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="impressions" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>

          {/* Ad Management Column */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Ad Units Management</h3>
                  <p className="text-sm text-gray-500">
                    Configure placement and behavior.
                  </p>
                </div>
                <button 
                  onClick={handleSaveAds}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
              
              <div className="space-y-6">
                {ads.map((ad, idx) => (
                  <div key={idx} className={`p-6 border rounded-xl hover:shadow-md transition-shadow bg-gray-50/30 ${ad.enabled ? 'border-primary/20 ring-1 ring-primary/5' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg capitalize text-gray-800">{ad.location} Unit</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${ad.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {ad.enabled ? 'Live' : 'Disabled'}
                        </span>
                      </div>
                      
                      <div 
                        onClick={() => toggleAd(idx)}
                        className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${ad.enabled ? 'bg-primary' : 'bg-gray-300'}`}
                      >
                        <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${ad.enabled ? 'translate-x-6' : ''}`}></div>
                      </div>
                    </div>
                    
                    {ad.location === 'popup' && (
                        <div className="mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex items-center gap-3">
                            <Activity size={16} className="text-yellow-600" />
                            <div className="flex-1 text-sm text-gray-700">
                                <strong>One-time Trigger:</strong> This popup will show <u>once</u> per session when the user interacts with the page.
                            </div>
                        </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        HTML / JS Code
                      </label>
                      <textarea 
                        className="w-full text-sm font-mono bg-white p-4 rounded-lg border border-gray-200 h-32 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        value={ad.code}
                        onChange={(e) => updateAdCode(idx, e.target.value)}
                        placeholder={`<!-- Paste your ${ad.location} ad code here -->`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'blog' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isEditingPost ? (
            <div className="p-8 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{currentPost.id ? 'Edit Post' : 'Create New Blog Post'}</h2>
                    <button onClick={() => setIsEditingPost(false)} className="text-gray-500 hover:text-gray-900"><X size={24} /></button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input 
                            value={currentPost.title}
                            onChange={(e) => setCurrentPost({...currentPost, title: e.target.value})}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:border-primary outline-none"
                            placeholder="e.g., 5 Ways to Use AI for Video Editing"
                        />
                    </div>

                    <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <span className="text-sm font-bold text-gray-600 flex items-center gap-1"><LinkIcon size={14}/> Link Tools in Article:</span>
                        <div className="flex flex-wrap gap-2">
                          {toolsList.map(tool => (
                              <button 
                                  key={tool.name} 
                                  onClick={() => insertToolLink(tool)}
                                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs hover:border-primary hover:text-primary transition-colors shadow-sm flex items-center gap-1 font-medium"
                              >
                                  <Rocket size={10} /> Insert Launch Button: {tool.name}
                              </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Clicking these buttons adds a "Launch" button to your blog post for users.</p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <label className="block text-sm font-medium text-gray-700">Content</label>
                             <button 
                                onClick={handleAiWrite}
                                disabled={aiWriting || !currentPost.title}
                                className="flex items-center gap-1 text-xs bg-gradient-to-r from-accent to-purple-600 text-white px-3 py-1.5 rounded-full hover:shadow-lg transition-all disabled:opacity-50"
                             >
                                {aiWriting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                {aiWriting ? 'Writing Blog...' : 'AI Auto-Write'}
                             </button>
                        </div>
                        <textarea 
                            value={currentPost.content}
                            onChange={(e) => setCurrentPost({...currentPost, content: e.target.value})}
                            className="w-full p-4 border border-gray-200 rounded-xl focus:border-primary outline-none h-64 font-sans leading-relaxed"
                            placeholder="Write your article here or use AI Auto-Write..."
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setIsEditingPost(false)}
                            className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={savePost}
                            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            Save & Publish
                        </button>
                    </div>
                </div>
            </div>
          ) : (
            <>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold">Published Posts</h3>
                    <button 
                        onClick={() => { setCurrentPost({}); setIsEditingPost(true); }}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
                    >
                    <Plus size={16} /> New Post
                    </button>
                </div>
                {posts.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">
                        No posts found. Create one to get started!
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                        <tr>
                            <th className="p-4 font-medium">Title</th>
                            <th className="p-4 font-medium">Date</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {posts.map(post => (
                            <tr key={post.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                            <td className="p-4 font-medium text-gray-800">{post.title}</td>
                            <td className="p-4 text-gray-500">{post.date}</td>
                            <td className="p-4 text-right space-x-2">
                                <button onClick={() => { setCurrentPost(post); setIsEditingPost(true); }} className="text-primary hover:underline text-sm font-medium">Edit</button>
                                <button onClick={() => deletePost(post.id)} className="text-red-500 hover:underline text-sm font-medium">Delete</button>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;