import React, { useState } from 'react';
import { Copy, Check, FileCode, FileJson, Hash, Settings, Layout } from 'lucide-react';

type GeneratorType = 'html' | 'css' | 'js' | 'firebase' | 'seo';

export const CodeGenerators = () => {
  const [activeTab, setActiveTab] = useState<GeneratorType>('html');

  const tabs = [
    { id: 'html', label: 'HTML5', icon: Layout },
    { id: 'css', label: 'CSS Reset', icon: Hash },
    { id: 'js', label: 'JS Starter', icon: FileCode },
    { id: 'firebase', label: 'Firebase', icon: Settings },
    { id: 'seo', label: 'SEO Meta', icon: FileJson },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex flex-wrap gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as GeneratorType)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all flex-1 justify-center whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[500px]">
        {activeTab === 'html' && <HtmlGenerator />}
        {activeTab === 'css' && <CssGenerator />}
        {activeTab === 'js' && <JsGenerator />}
        {activeTab === 'firebase' && <FirebaseGenerator />}
        {activeTab === 'seo' && <SeoGenerator />}
      </div>
    </div>
  );
};

const CodeBlock = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={copyToClipboard}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
            copied ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      <pre className="bg-[#1E1E1E] text-gray-300 p-6 rounded-xl overflow-x-auto text-sm font-mono leading-relaxed border border-gray-800 shadow-inner">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const HtmlGenerator = () => {
  const code = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <nav>
            <!-- Navigation links -->
        </nav>
    </header>

    <main>
        <h1>Welcome</h1>
        <p>Start building your app.</p>
    </main>

    <footer>
        <p>&copy; ${new Date().getFullYear()} Your Company</p>
    </footer>

    <script src="app.js"></script>
</body>
</html>`;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-gray-900">HTML5 Boilerplate</h3>
        <p className="text-gray-500 mb-4">A solid starting point for any web project.</p>
      </div>
      <CodeBlock code={code} />
    </div>
  );
};

const CssGenerator = () => {
  const code = `/* Modern CSS Reset & Starter */
:root {
  --primary-color: #4F46E5;
  --text-color: #1F2937;
  --bg-color: #FFFFFF;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--bg-color);
  -webkit-font-smoothing: antialiased;
}

img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}

input, button, textarea, select {
  font: inherit;
}

/* Utilities */
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.grid-cols-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}`;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Modern CSS Starter</h3>
        <p className="text-gray-500 mb-4">Includes a box-sizing reset and basic variable setup.</p>
      </div>
      <CodeBlock code={code} />
    </div>
  );
};

const JsGenerator = () => {
  const code = `/**
 * Main Application Entry
 */

'use strict';

const App = {
  init() {
    console.log('App Initialized');
    this.cacheDOM();
    this.bindEvents();
  },

  cacheDOM() {
    this.root = document.getElementById('app');
  },

  bindEvents() {
    // Event listeners go here
    document.addEventListener('DOMContentLoaded', () => {
      // DOM is ready
    });
  },

  render() {
    // Render logic
  }
};

App.init();`;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-gray-900">JavaScript Module Starter</h3>
        <p className="text-gray-500 mb-4">A structured object-oriented approach to vanilla JS.</p>
      </div>
      <CodeBlock code={code} />
    </div>
  );
};

const FirebaseGenerator = () => {
  const code = `// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-ABCDEF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };`;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Firebase v9+ Init</h3>
        <p className="text-gray-500 mb-4">Standard modular initialization for Firebase Web SDK.</p>
      </div>
      <CodeBlock code={code} />
    </div>
  );
};

const SeoGenerator = () => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [keywords, setKeywords] = useState('');
  const [author, setAuthor] = useState('');

  const generateCode = () => {
    return `<!-- SEO Meta Tags -->
<title>${title || 'Page Title'}</title>
<meta name="description" content="${desc || 'Page description goes here.'}">
<meta name="keywords" content="${keywords || 'keyword1, keyword2, keyword3'}">
<meta name="author" content="${author || 'Author Name'}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:title" content="${title || 'Page Title'}">
<meta property="og:description" content="${desc || 'Page description goes here.'}">
<meta property="og:image" content="https://example.com/image.jpg">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:title" content="${title || 'Page Title'}">
<meta property="twitter:description" content="${desc || 'Page description goes here.'}">`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">SEO Generator</h3>
          <p className="text-gray-500 mb-4">Input details to generate meta tags.</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
          <input 
            value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-primary"
            placeholder="e.g. My Awesome App"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea 
            value={desc} onChange={(e) => setDesc(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-primary h-24 resize-none"
            placeholder="Brief description of your page..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
          <input 
            value={keywords} onChange={(e) => setKeywords(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-primary"
            placeholder="react, typescript, tailwind"
          />
        </div>

         <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
          <input 
            value={author} onChange={(e) => setAuthor(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-primary"
            placeholder="John Doe"
          />
        </div>
      </div>

      <div>
         <label className="block text-sm font-medium text-gray-700 mb-2">Generated Output</label>
         <CodeBlock code={generateCode()} />
      </div>
    </div>
  );
};