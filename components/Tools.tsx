import React, { useState, useEffect, useRef } from 'react';
import { generateText, analyzeImage, analyzeVideo, enhancePhoto, transformPerson } from '../services/geminiService';
import { Copy, Loader2, Sparkles, Upload, Video, AlertCircle, Download, Image as ImageIcon, User, ArrowRight, HeartHandshake, Minimize2, FileDown } from 'lucide-react';
import { ViewState } from '../types';

// Helper component to safely execute scripts in Ad codes by isolating them in an iframe
export const AdContainer: React.FC<{ code: string }> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = ''; // Clean up

    // Create a shadow iframe to isolate the script execution
    const iframe = document.createElement('iframe');
    
    // minimal styling to fit container
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.style.overflow = 'hidden';
    
    // Append to DOM first so contentWindow exists
    container.appendChild(iframe);

    try {
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        // Wrap code in basic html structure to ensure styles apply
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; background: transparent; font-family: sans-serif; }
                img { max-width: 100%; height: auto; }
              </style>
            </head>
            <body>
              ${code}
            </body>
          </html>
        `);
        doc.close();
      }
    } catch (e) {
      console.warn("Ad injection warning:", e);
      // Fallback if iframe interaction is completely blocked
      if (container) {
          container.innerText = "Ad content";
      }
    }

  }, [code]);

  return <div ref={containerRef} className="w-full h-full flex justify-center items-center overflow-hidden" />;
};

export interface ToolWrapperProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

export const ToolWrapper: React.FC<ToolWrapperProps> = ({ title, description, icon: Icon, children }) => (
  <div className="max-w-4xl mx-auto animate-fade-in">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <Icon size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-500 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      {children}
    </div>
  </div>
);

interface GenericGeneratorProps {
  promptTemplate: string;
  placeholder: string;
  buttonLabel: string;
  modelType?: 'basic' | 'creative';
}

export const GenericGenerator: React.FC<GenericGeneratorProps> = ({ promptTemplate, placeholder, buttonLabel, modelType = 'basic' }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const fullPrompt = promptTemplate.replace('{{INPUT}}', input);
    const result = await generateText(fullPrompt, modelType as 'basic' | 'creative');
    setOutput(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Input</label>
        <textarea 
          className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>
      
      <div className="flex justify-end">
        <button 
          onClick={handleGenerate}
          disabled={loading || !input}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-deepBlue hover:to-primary text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          {loading ? 'Generating...' : buttonLabel}
        </button>
      </div>

      {output && (
        <div className="mt-8 border-t border-gray-100 pt-8 animate-fade-in-up">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">AI Result</h3>
            <button 
              onClick={() => navigator.clipboard.writeText(output)}
              className="p-2 text-gray-400 hover:text-primary transition-colors"
              title="Copy to clipboard"
            >
              <Copy size={18} />
            </button>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 prose prose-indigo max-w-none whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
            {output}
          </div>
        </div>
      )}
    </div>
  );
};

export const PhotoEnhancer = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [instructions, setInstructions] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');
    setResultImage(null);
    setResultText('');
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
         setError('File size exceeds 100MB limit.');
         return;
      }
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEnhance = async () => {
    if (!selectedImage) return;
    setLoading(true);
    setResultImage(null);
    setResultText('');
    
    // Extract base64
    const base64 = selectedImage.split(',')[1];
    
    const result = await enhancePhoto(base64, mimeType, instructions);
    
    if (result.image) {
      setResultImage(`data:image/png;base64,${result.image}`);
    }
    if (result.text) {
      setResultText(result.text);
    }
    
    setLoading(false);
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = 'enhanced-photo-nexusai.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`border-2 border-dashed ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:bg-gray-50'} rounded-xl p-8 text-center transition-colors`}>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload} 
          className="hidden" 
          id="photo-upload"
        />
        <label htmlFor="photo-upload" className="cursor-pointer block">
          {selectedImage ? (
            <img src={selectedImage} alt="Upload" className="max-h-64 mx-auto rounded-lg shadow-md" />
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary/10 rounded-full text-primary mb-4">
                <Upload size={32} />
              </div>
              <span className="text-gray-600 font-medium">Click to upload photo</span>
              <span className="text-gray-400 text-sm mt-1">JPG, PNG, WEBP up to 100MB</span>
            </div>
          )}
        </label>
      </div>
      
      {error && <div className="text-red-500 text-sm flex items-center gap-2"><AlertCircle size={14}/> {error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Enhancement Instructions (Optional)</label>
        <input 
          type="text" 
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g., Increase brightness, remove noise, make it high quality..."
          className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </div>

      <button 
        onClick={handleEnhance}
        disabled={loading || !selectedImage}
        className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
        {loading ? 'Enhancing Image...' : 'Enhance & Generate New Image'}
      </button>

      {(resultImage || resultText) && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 animate-fade-in">
          <h3 className="font-bold text-gray-900 mb-4">Enhancement Result:</h3>
          
          {resultImage && (
            <div className="mb-4">
              <img src={resultImage} alt="Enhanced" className="rounded-lg shadow-lg max-h-96 w-full object-contain bg-black/5" />
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <Download size={18} /> Download HD Image
                </button>
              </div>
            </div>
          )}
          
          {resultText && (
             <p className="text-gray-700 whitespace-pre-wrap">{resultText}</p>
          )}
        </div>
      )}
    </div>
  );
};

export const ImageCompressor = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  
  const [targetKB, setTargetKB] = useState<number | ''>('');
  
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');
    setCompressedImage(null);
    setCompressedSize(0);
    
    if (file) {
      if (file.type.indexOf('image/') === -1) {
        setError('Please upload a valid image file.');
        return;
      }
      setSelectedFile(file);
      setOriginalSize(file.size / 1024); // KB
      
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const compressImage = async () => {
    if (!selectedFile || !targetKB || !previewUrl) return;
    setLoading(true);
    setError('');

    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise(r => img.onload = r);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      let width = img.width;
      let height = img.height;
      
      // QUALITY STRATEGY: 
      // User requested "Don't reduce quality".
      // We fix the JPEG quality at a high value (0.9) to minimize artifacts.
      // We strictly reduce Dimensions (resolution) to hit the target size.
      const fixedQuality = 0.9; 
      
      let success = false;
      let attempt = 0;
      let resultDataUrl = '';
      
      const targetBytes = (Number(targetKB)) * 1024;

      while (!success && attempt < 30) {
        // Set dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw image
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress with fixed high quality
        resultDataUrl = canvas.toDataURL('image/jpeg', fixedQuality);
        
        // Estimate size (Base64 size overhead is ~33%, so *0.75 gets close to binary size)
        const head = 'data:image/jpeg;base64,';
        const sizeInBytes = Math.round((resultDataUrl.length - head.length) * 3 / 4);

        if (sizeInBytes <= targetBytes) {
          success = true;
          setCompressedSize(sizeInBytes / 1024);
        } else {
          // Reduce dimensions by 10% each iteration
          width *= 0.90;
          height *= 0.90;
        }
        attempt++;
      }

      setCompressedImage(resultDataUrl);
      
      if (!success) {
        setError(`Could not reach ${targetKB}KB even after resizing. Closest match: ${(compressedSize).toFixed(1)}KB`);
      }

    } catch (e) {
      console.error(e);
      setError("An error occurred during compression.");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (compressedImage) {
      const link = document.createElement('a');
      link.href = compressedImage;
      link.download = `compressed-${selectedFile?.name.split('.')[0] || 'image'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className={`border-2 border-dashed ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:bg-gray-50'} rounded-xl p-8 text-center transition-colors`}>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleUpload} 
          className="hidden" 
          id="compress-upload"
        />
        <label htmlFor="compress-upload" className="cursor-pointer block">
          {previewUrl ? (
            <div className="flex flex-col items-center">
              <img src={previewUrl} alt="Preview" className="max-h-64 rounded-lg shadow-md mb-4" />
              <p className="text-gray-600 font-medium">Original: {originalSize.toFixed(2)} KB</p>
              <p className="text-primary text-sm mt-2">Click to change image</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary/10 rounded-full text-primary mb-4">
                <Upload size={32} />
              </div>
              <span className="text-gray-600 font-medium">Upload Image to Compress</span>
              <span className="text-gray-400 text-sm mt-1">Supports JPG, PNG, WEBP</span>
            </div>
          )}
        </label>
      </div>

      {error && <div className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg"><AlertCircle size={14}/> {error}</div>}

      {/* Controls */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col md:flex-row items-end md:items-center gap-4">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">Target File Size (KB)</label>
          <div className="relative">
            <input 
              type="number" 
              value={targetKB}
              onChange={(e) => setTargetKB(Number(e.target.value) || '')}
              placeholder="e.g. 500"
              className="w-full p-3 pl-4 pr-12 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">KB</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
             <Sparkles size={12} className="text-primary" /> 
             <span>Recommended: <span className="font-semibold text-gray-700">500 KB</span> for best experience</span>
          </p>
        </div>
        
        <button 
          onClick={compressImage}
          disabled={loading || !selectedFile || !targetKB}
          className="w-full md:w-auto bg-primary text-white px-8 py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-[52px]"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Minimize2 size={20} />}
          {loading ? 'Compressing...' : 'Reduce Size'}
        </button>
      </div>

      {/* Result */}
      {compressedImage && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-primary"></div>
          
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Compression Successful!</h3>
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                 <div className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-sm line-through decoration-red-600/50">
                    {originalSize.toFixed(1)} KB
                 </div>
                 <ArrowRight size={16} className="text-gray-400" />
                 <div className="bg-green-100 text-green-700 px-4 py-1.5 rounded-lg font-bold text-lg">
                    {compressedSize.toFixed(1)} KB
                 </div>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                Your image has been optimized by reducing resolution while maintaining high visual quality.
              </p>
              
              <button 
                onClick={downloadImage}
                className="w-full md:w-auto bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-xl shadow-gray-200"
              >
                <FileDown size={20} /> Download Compressed Image
              </button>
            </div>
            
            <div className="flex-1">
               <img src={compressedImage} alt="Compressed" className="rounded-xl shadow-inner border border-gray-100 max-h-80 w-auto mx-auto" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PersonTransformer = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceMime, setSourceMime] = useState<string>('image/jpeg');
  
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [targetMime, setTargetMime] = useState<string>('image/jpeg');

  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'source' | 'target') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
         setError('Each file size must be under 10MB.');
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'source') {
          setSourceImage(reader.result as string);
          setSourceMime(file.type);
        } else {
          setTargetImage(reader.result as string);
          setTargetMime(file.type);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTransform = async () => {
    if (!sourceImage || !targetImage) return;
    setLoading(true);
    setResultImage(null);
    setResultText('');
    setError('');
    
    const base64Source = sourceImage.split(',')[1];
    const base64Target = targetImage.split(',')[1];
    
    const result = await transformPerson(base64Source, sourceMime, base64Target, targetMime);
    
    if (result.image) {
      setResultImage(`data:image/png;base64,${result.image}`);
    }
    if (result.text) {
      setResultText(result.text);
    }
    
    setLoading(false);
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = 'ai-hug-nexusai.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-8">
      {error && <div className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg"><AlertCircle size={14}/> {error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* Person 1 Input */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <User size={18} className="text-primary"/> 
            Person 1 (Left)
          </h3>
          <div className={`border-2 border-dashed ${sourceImage ? 'border-primary/50 bg-primary/5' : 'border-gray-300 hover:bg-gray-50'} rounded-xl h-64 flex flex-col items-center justify-center transition-all overflow-hidden relative group`}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleUpload(e, 'source')} 
              className="hidden" 
              id="source-upload"
            />
            <label htmlFor="source-upload" className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center z-10">
              {sourceImage ? (
                <img src={sourceImage} alt="Person 1" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-500">
                    <User size={24} />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Upload Person 1</span>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Heart Icon for Desktop */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white p-3 rounded-full shadow-lg text-pink-500 border border-pink-100">
           <HeartHandshake size={32} />
        </div>

        {/* Person 2 Input */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <User size={18} className="text-primary"/> 
            Person 2 (Right)
          </h3>
          <div className={`border-2 border-dashed ${targetImage ? 'border-primary/50 bg-primary/5' : 'border-gray-300 hover:bg-gray-50'} rounded-xl h-64 flex flex-col items-center justify-center transition-all overflow-hidden relative group`}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleUpload(e, 'target')} 
              className="hidden" 
              id="target-upload"
            />
            <label htmlFor="target-upload" className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center z-10">
              {targetImage ? (
                <img src={targetImage} alt="Person 2" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-500">
                    <User size={24} />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Upload Person 2</span>
                </div>
              )}
            </label>
          </div>
        </div>
      </div>

      <button 
        onClick={handleTransform}
        disabled={loading || !sourceImage || !targetImage}
        className="w-full bg-gradient-to-r from-pink-500 to-primary text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
      >
        {loading ? <Loader2 className="animate-spin" size={24} /> : <HeartHandshake size={24} />}
        {loading ? 'Generating Hug...' : 'Generate Hug Scene'}
      </button>

      {(resultImage || resultText) && (
        <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 animate-fade-in text-center">
          <h3 className="font-bold text-gray-900 mb-6 text-xl">Generated Scene</h3>
          
          {resultImage && (
            <div className="mb-6 inline-block relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <img src={resultImage} alt="Generated Hug" className="relative rounded-lg shadow-xl max-h-[500px] max-w-full object-contain bg-white" />
              
              <div className="mt-6 flex justify-center">
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-full font-bold hover:bg-black transition-all shadow-lg transform hover:-translate-y-1"
                >
                  <Download size={20} /> Download Image
                </button>
              </div>
            </div>
          )}
          
          {resultText && (
             <p className="text-gray-700 whitespace-pre-wrap max-w-2xl mx-auto mt-4 bg-white p-4 rounded-lg border border-gray-100 text-left">{resultText}</p>
          )}
        </div>
      )}
    </div>
  );
};

export const VideoAnalyst = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB Check
         setError('File size exceeds 100MB limit.');
         return;
      }
      setFileName(file.name);
      setMimeType(file.type);
      
      const reader = new FileReader();
      reader.onloadend = () => setSelectedVideo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedVideo) return;
    setLoading(true);
    
    const base64 = selectedVideo.split(',')[1];
    const prompt = `Act as a creative scriptwriter and video editor. Analyze this video and generate a detailed script and editing plan. ${instructions ? `Focus on: ${instructions}` : ''}`;
    
    const result = await analyzeVideo(base64, mimeType, prompt);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className={`border-2 border-dashed ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:bg-gray-50'} rounded-xl p-8 text-center transition-colors`}>
        <input 
          type="file" 
          accept="video/*" 
          onChange={handleVideoUpload} 
          className="hidden" 
          id="video-upload"
        />
        <label htmlFor="video-upload" className="cursor-pointer block">
          {selectedVideo ? (
            <div className="flex flex-col items-center">
               <Video size={48} className="text-primary mb-4"/>
               <span className="font-semibold text-gray-800">{fileName}</span>
               <span className="text-green-600 text-sm mt-1">Ready to analyze</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary/10 rounded-full text-primary mb-4">
                <Video size={32} />
              </div>
              <span className="text-gray-600 font-medium">Click to upload video</span>
              <span className="text-gray-400 text-sm mt-1">MP4, MOV up to 100MB</span>
            </div>
          )}
        </label>
      </div>

      {error && <div className="text-red-500 text-sm flex items-center gap-2"><AlertCircle size={14}/> {error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Script/Edit Focus (Optional)</label>
        <input 
          type="text" 
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g., Create a funny voiceover script, or a cinematic travel vlog script..."
          className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </div>

      <button 
        onClick={handleAnalyze}
        disabled={loading || !selectedVideo}
        className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
        {loading ? 'Analyzing Video...' : 'Generate AI Script & Plan'}
      </button>

      {analysis && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 whitespace-pre-wrap text-sm text-gray-700">
          <h3 className="font-bold text-gray-900 mb-2">AI Script & Analysis:</h3>
          {analysis}
        </div>
      )}
    </div>
  );
};