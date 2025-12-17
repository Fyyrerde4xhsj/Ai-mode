import React, { useState, useEffect } from 'react';
import { SLIDES } from '../constants';
import { ViewState } from '../types';
import { ChevronRight, ArrowRight, Rocket } from 'lucide-react';

interface HomeProps {
  onNavigate: (view: ViewState) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Carousel */}
      <div className="relative h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl group">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 bg-black/40 z-10" />
            <img 
              src={slide.image} 
              alt={slide.title} 
              className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-[2000ms]"
            />
            
            {/* Content */}
            <div className="absolute inset-0 z-20 flex flex-col justify-center items-start px-8 md:px-16 lg:px-24">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight animate-fade-in-up">
                {slide.title}
              </h2>
              <p className="text-xl text-gray-200 mb-8 max-w-2xl leading-relaxed animate-fade-in-up delay-100">
                {slide.desc}
              </p>
              <button 
                onClick={() => onNavigate(slide.action as ViewState)}
                className="bg-white text-gray-900 px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-gray-100 transition-all transform hover:scale-105 animate-fade-in-up delay-200 shadow-lg"
              >
                Try Now <ChevronRight size={20} />
              </button>
            </div>
          </div>
        ))}
        
        {/* Indicators */}
        <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center gap-3">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {[
          { title: 'AI Video Script', desc: 'Smart cuts & scene improvements', view: ViewState.VIDEO_EDITOR },
          { title: 'Auto Subtitles', desc: 'Generate captions instantly', view: ViewState.SUBTITLES },
          { title: 'Idea Generator', desc: 'Never run out of content ideas', view: ViewState.IDEA_GENERATOR },
          { title: 'Productivity', desc: 'AI Planners & Notes', view: ViewState.PLANNER },
        ].map((card, idx) => (
          <div 
            key={idx}
            onClick={() => onNavigate(card.view)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <ArrowRight size={20} />
                </div>
                
                {/* Visual Launch Badge */}
                <div className="bg-gray-50 border border-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1 group-hover:bg-primary group-hover:text-white group-hover:border-primary/20 transition-all shadow-sm">
                   <Rocket size={10} />
                   <span>Launch!</span>
                </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;