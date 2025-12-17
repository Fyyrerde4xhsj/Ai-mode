// In a real production app, this would be strictly env vars. 
// However, per instructions to make the provided key work immediately:
export const PROVIDED_API_KEY = "AIzaSyCy_lE_5GXusVXNo9zyOoCTd6VeCChLUs4";

export const APP_NAME = "NexusAI";

export const SLIDES = [
  {
    id: 1,
    title: "AI Video Script",
    desc: "Transform your raw footage ideas into cinematic scripts and detailed editing plans.",
    image: "https://picsum.photos/1200/600?grayscale",
    action: "VIDEO_EDITOR"
  },
  {
    id: 2,
    title: "Script Writer",
    desc: "Generate engaging scripts for YouTube, TikTok, and professional blogs in seconds.",
    image: "https://picsum.photos/1200/600?blur=2",
    action: "SCRIPT_WRITER"
  },
  {
    id: 3,
    title: "Photo Enhancer",
    desc: "Get professional lighting advice or generate high-quality enhanced versions of your photos.",
    image: "https://picsum.photos/1200/600?random=3",
    action: "PHOTO_ENHANCER"
  }
];

export const MOCK_BLOG_POSTS = [
  { id: '1', title: 'The Future of AI Video', content: 'AI is changing how we edit...', date: '2023-10-15' },
  { id: '2', title: 'Productivity Hacks', content: 'Use AI to plan your day...', date: '2023-10-20' },
];