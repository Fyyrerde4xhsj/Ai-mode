import React, { useEffect, useState } from 'react';
import { 
  Home, Clapperboard, Captions, Image as ImageIcon, FileText, 
  Lightbulb, NotebookPen, Calendar, Bell, ShieldCheck, HeartHandshake, Minimize2, BookOpen
} from 'lucide-react';
import { ViewState, AdConfig } from '../types';
import { rtdb } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { AdContainer } from './Tools';

interface SidebarProps {
  activeView: ViewState;
  setActiveView: (view: ViewState) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, toggleSidebar }) => {
  const [sidebarAd, setSidebarAd] = useState<AdConfig | null>(null);

  useEffect(() => {
    // Fetch sidebar ad
    const adRef = ref(rtdb, 'ads');
    const unsubscribe = onValue(adRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ads = Object.values(data) as AdConfig[];
        const found = ads.find(a => a.location === 'sidebar' && a.enabled);
        setSidebarAd(found || null);
      }
    });
    return () => unsubscribe();
  }, []);

  const navItem = (view: ViewState, label: string, Icon: React.ElementType) => (
    <button
      onClick={() => {
        setActiveView(view);
        if (window.innerWidth < 768) toggleSidebar();
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1 ${
        activeView === view 
          ? 'bg-primary text-white shadow-lg shadow-primary/30 font-medium' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="text-sm tracking-wide">{label}</span>
    </button>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#111827] border-r border-gray-800 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 overflow-y-auto scrollbar-hide flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 flex-1">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">NexusAI</h1>
          </div>

          <nav>
            <div className="mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dashboard</div>
            {navItem(ViewState.HOME, "Home", Home)}
            {navItem(ViewState.BLOG, "Blog & Tutorials", BookOpen)}

            <div className="mt-6 mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Creative Studio</div>
            {navItem(ViewState.VIDEO_EDITOR, "AI Video Script", Clapperboard)}
            {navItem(ViewState.SUBTITLES, "Subtitles", Captions)}
            {navItem(ViewState.PHOTO_ENHANCER, "Photo Enhancer", ImageIcon)}
            {navItem(ViewState.FACE_SWAP, "AI Hug Generator", HeartHandshake)}
            {navItem(ViewState.IMAGE_COMPRESSOR, "Image Compressor", Minimize2)}
            {navItem(ViewState.SCRIPT_WRITER, "Script Writer", FileText)}
            {navItem(ViewState.IDEA_GENERATOR, "Idea Generator", Lightbulb)}

            <div className="mt-6 mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Productivity</div>
            {navItem(ViewState.NOTES, "Notes", NotebookPen)}
            {navItem(ViewState.PLANNER, "Planner", Calendar)}
            {navItem(ViewState.REMINDERS, "Reminders", Bell)}

            <div className="mt-6 mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">System</div>
            {navItem(ViewState.ADMIN, "Admin Panel", ShieldCheck)}
          </nav>
        </div>

        {sidebarAd && (
          <div className="px-6 pb-6">
             <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-2 text-center">Sponsored</div>
             <div className="bg-gray-800 rounded-lg overflow-hidden min-h-[150px] flex items-center justify-center">
                <AdContainer code={sidebarAd.code} />
             </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;