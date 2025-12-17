import React, { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { rtdb } from './firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { ViewState, AdConfig } from './types';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import { GenericGenerator, PhotoEnhancer, ToolWrapper, VideoAnalyst, AdContainer, PersonTransformer, ImageCompressor } from './components/Tools';
import { NotesApp, PlannerApp, RemindersApp } from './components/Productivity';
import AdminPanel from './components/AdminPanel';
import { AuthPage } from './components/Auth';
import { Blog } from './components/Blog';

// Icons for dynamic wrappers
import { Clapperboard, Captions, FileText, Lightbulb, Bell, HeartHandshake, Minimize2 } from 'lucide-react';

const App = () => {
  const [activeView, setActiveView] = useState<ViewState>(ViewState.HOME);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Ad State
  const [globalAd, setGlobalAd] = useState<AdConfig | null>(null);
  const [popupAd, setPopupAd] = useState<AdConfig | null>(null);
  
  // Pop-up Logic
  const [showPopup, setShowPopup] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);

  // Fetch Ads (Home Banner and Popup Settings)
  useEffect(() => {
    const adRef = ref(rtdb, 'ads');
    const unsubscribe = onValue(adRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ads = Object.values(data) as AdConfig[];
        // 'home' ad unit
        const homeFound = ads.find(a => a.location === 'home' && a.enabled);
        setGlobalAd(homeFound || null);

        // 'popup' ad unit
        const popupFound = ads.find(a => a.location === 'popup' && a.enabled);
        setPopupAd(popupFound || null);
      }
    });
    return () => unsubscribe();
  }, []);

  // One-time Popup Logic
  useEffect(() => {
    const handleGlobalInteraction = () => {
      if (popupAd && popupAd.enabled && !hasShownPopup && !showPopup) {
         setShowPopup(true);
         setHasShownPopup(true);
      }
    };

    if (!hasShownPopup) {
        window.addEventListener('click', handleGlobalInteraction);
        window.addEventListener('touchstart', handleGlobalInteraction); // Mobile support
    }

    return () => {
        window.removeEventListener('click', handleGlobalInteraction);
        window.removeEventListener('touchstart', handleGlobalInteraction);
    };
  }, [popupAd, showPopup, hasShownPopup]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  // Render Logic
  const renderContent = () => {
    switch (activeView) {
      case ViewState.HOME:
        return <Home onNavigate={setActiveView} />;
      
      case ViewState.LOGIN:
        return <AuthPage onLoginSuccess={() => setActiveView(ViewState.HOME)} />;

      case ViewState.BLOG:
        return <Blog onNavigate={setActiveView} />;

      case ViewState.VIDEO_EDITOR:
        return (
          <ToolWrapper 
            title="AI Video Script" 
            description="Upload your raw video file. Our AI analyzes the footage to provide a complete editing script, suggesting specific cuts, transitions, and narrative improvements to make your content engaging." 
            icon={Clapperboard}
          >
            <VideoAnalyst />
          </ToolWrapper>
        );

      case ViewState.SUBTITLES:
        return (
          <ToolWrapper 
            title="Subtitle Generator" 
            description="Paste your video script or audio transcript here. The AI will format it into a timestamped SRT subtitle file, ready to be uploaded to YouTube or other video platforms." 
            icon={Captions}
          >
            <GenericGenerator 
              promptTemplate="Format the following text into SRT subtitle format with estimated timestamps starting from 00:00:00. Text: {{INPUT}}" 
              placeholder="Paste your script or transcript here..."
              buttonLabel="Generate Captions"
            />
          </ToolWrapper>
        );

      case ViewState.SCRIPT_WRITER:
        return (
          <ToolWrapper 
            title="Script Writer" 
            description="Need a script? Describe your topic, tone, and target audience. The AI will write a full script with hooks, body content, and call-to-actions, optimized for your specific platform." 
            icon={FileText}
          >
            <GenericGenerator 
              promptTemplate="Write a creative script for {{INPUT}}. Include Hook, Body, and Call to Action." 
              placeholder="e.g., A 60-second YouTube Short about AI tools..."
              buttonLabel="Write Script"
              modelType="creative"
            />
          </ToolWrapper>
        );

      case ViewState.IDEA_GENERATOR:
        return (
          <ToolWrapper 
            title="Idea Generator" 
            description="Stuck on what to create? Enter your niche (e.g., Cooking, Tech). The AI will generate a list of viral-potential video ideas, including catchy titles and content angles." 
            icon={Lightbulb}
          >
            <GenericGenerator 
              promptTemplate="Generate 10 viral video ideas and catchy titles for the niche: {{INPUT}}" 
              placeholder="e.g., Tech Reviews, Cooking, Travel Vlogging..."
              buttonLabel="Get Ideas"
            />
          </ToolWrapper>
        );

      case ViewState.PHOTO_ENHANCER:
        return (
          <ToolWrapper 
            title="Photo Enhancer" 
            description="Upload a photo that needs improvement. The AI will analyze lighting and composition, then generate a high-definition, enhanced version of your image for you to download." 
            icon={Clapperboard}
          >
            <PhotoEnhancer />
          </ToolWrapper>
        );

      case ViewState.FACE_SWAP:
        return (
          <ToolWrapper 
            title="AI Hug Generator" 
            description="Upload photos of two different people. The AI will generate a heartwarming, realistic image of them hugging each other while preserving their unique facial features." 
            icon={HeartHandshake}
          >
            <PersonTransformer />
          </ToolWrapper>
        );

      case ViewState.IMAGE_COMPRESSOR:
        return (
          <ToolWrapper 
            title="Image Compressor" 
            description="Reduce your image file size to a specific KB target without manual resizing. Upload an image, set your desired size, and let our tool optimize it for you." 
            icon={Minimize2}
          >
            <ImageCompressor />
          </ToolWrapper>
        );

      case ViewState.NOTES:
        return (
          <ToolWrapper 
            title="Smart Notes" 
            description="Capture your thoughts and let AI organize, summarize, and polish them into clear, actionable notes." 
            icon={FileText}
          >
            <NotesApp />
          </ToolWrapper>
        );

      case ViewState.PLANNER:
        return (
          <ToolWrapper 
            title="Daily Planner" 
            description="Input your goals or profession, and let the AI generate a structured, productive daily schedule to maximize your efficiency." 
            icon={FileText}
          >
            <PlannerApp />
          </ToolWrapper>
        );

      case ViewState.REMINDERS:
        return (
          <ToolWrapper 
            title="Reminders" 
            description="Keep track of your tasks. Set specific date and time reminders to ensure you never miss a deadline." 
            icon={Bell}
          >
            <RemindersApp onNavigate={setActiveView} />
          </ToolWrapper>
        );

      case ViewState.ADMIN:
        return (
           <div className="w-full">
             <div className="mb-4">
                <button onClick={() => setActiveView(ViewState.HOME)} className="text-gray-500 hover:text-gray-900 flex items-center gap-2">
                   ← Back to Home
                </button>
             </div>
             <AdminPanel onNavigate={setActiveView} />
           </div>
        );

      default:
        return <Home onNavigate={setActiveView} />;
    }
  };

  const isFullPageView = activeView === ViewState.ADMIN || activeView === ViewState.LOGIN;

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex relative">
      {!isFullPageView && (
        <Sidebar 
          activeView={activeView} 
          setActiveView={setActiveView} 
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 min-h-screen transition-all ${!isFullPageView ? 'md:ml-64' : ''}`}>
        {/* Top Header Mobile */}
        {!isFullPageView && (
          <header className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-30 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-gray-900">
              NexusAI
            </div>
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600">
              <Menu />
            </button>
          </header>
        )}

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* Global Top Banner Ad - Displayed on all pages except full page views */}
          {!isFullPageView && globalAd && (
            <div className="w-full mb-8 animate-fade-in">
              <div className="text-center text-[10px] text-gray-400 uppercase tracking-widest mb-1">Sponsored</div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-center items-center min-h-[100px] overflow-hidden">
                <AdContainer code={globalAd.code} />
              </div>
            </div>
          )}
          
          {renderContent()}
        </div>
      </main>

      {/* Popup Ad Overlay */}
      {showPopup && popupAd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative overflow-hidden flex flex-col">
            <div className="flex justify-end p-2 bg-gray-50 border-b border-gray-100">
               <button 
                 onClick={() => setShowPopup(false)}
                 className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors"
               >
                 <X size={24} />
               </button>
            </div>
            <div className="p-6 min-h-[300px] flex items-center justify-center bg-white">
               <AdContainer code={popupAd.code} />
            </div>
            <div className="bg-gray-50 p-2 text-center text-[10px] text-gray-400 uppercase tracking-widest">
              Advertisement
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;