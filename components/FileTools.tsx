import React, { useState, useEffect } from 'react';
import { 
  FileText, Merge, Split, Image, FileImage, BarChart, 
  Upload, Download, X, MoveUp, MoveDown, AlertCircle, Loader2, File, FolderArchive, Folder
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

// Handle PDF.js import compatibility (ESM/CJS interop)
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Set worker source for PDF.js to CDNJS for better compatibility and to avoid NetworkErrors
if (pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

type ToolTab = 'merge' | 'split' | 'pdf-to-img' | 'img-to-pdf' | 'analyze' | 'zip-extractor';

export const FileTools = () => {
  const [activeTab, setActiveTab] = useState<ToolTab>('merge');
  
  const tabs = [
    { id: 'merge', label: 'PDF Merger', icon: Merge },
    { id: 'split', label: 'PDF Splitter', icon: Split },
    { id: 'pdf-to-img', label: 'PDF to Image', icon: FileImage },
    { id: 'img-to-pdf', label: 'Image to PDF', icon: Image },
    { id: 'zip-extractor', label: 'ZIP Extractor', icon: FolderArchive },
    { id: 'analyze', label: 'Size Analyzer', icon: BarChart },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex flex-wrap gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ToolTab)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all flex-1 justify-center whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-primary text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tool Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[400px]">
        {activeTab === 'merge' && <PdfMerger />}
        {activeTab === 'split' && <PdfSplitter />}
        {activeTab === 'pdf-to-img' && <PdfToImage />}
        {activeTab === 'img-to-pdf' && <ImageToPdf />}
        {activeTab === 'zip-extractor' && <ZipExtractor />}
        {activeTab === 'analyze' && <FileAnalyzer />}
      </div>
    </div>
  );
};

const PdfMerger = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const moveFile = (idx: number, direction: -1 | 1) => {
    const newFiles = [...files];
    const targetIdx = idx + direction;
    if (targetIdx >= 0 && targetIdx < newFiles.length) {
      [newFiles[idx], newFiles[targetIdx]] = [newFiles[targetIdx], newFiles[idx]];
      setFiles(newFiles);
    }
  };

  const mergePdfs = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'merged_document.pdf';
      link.click();
    } catch (e) {
      console.error(e);
      alert('Error merging PDFs. Ensure files are valid.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900">Merge Multiple PDFs</h3>
        <p className="text-gray-500">Combine multiple PDF files into one document. Ideal for small files.</p>
      </div>

      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer relative">
        <input 
          type="file" 
          multiple 
          accept="application/pdf" 
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={handleUpload}
        />
        <Upload size={32} className="mx-auto text-primary mb-3" />
        <p className="font-medium text-gray-700">Click to upload PDFs</p>
        <p className="text-xs text-gray-400 mt-1">or drag and drop files here</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="w-6 h-6 bg-red-100 text-red-600 rounded flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="truncate text-sm font-medium text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => moveFile(idx, -1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30">
                  <MoveUp size={16} />
                </button>
                <button onClick={() => moveFile(idx, 1)} disabled={idx === files.length - 1} className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30">
                  <MoveDown size={16} />
                </button>
                <button onClick={() => removeFile(idx)} className="p-1 text-red-400 hover:text-red-600 ml-2">
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button 
        onClick={mergePdfs}
        disabled={files.length < 2 || processing}
        className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {processing ? <Loader2 className="animate-spin" /> : <Merge />}
        {processing ? 'Merging...' : 'Merge PDFs'}
      </button>
    </div>
  );
};

const PdfSplitter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [range, setRange] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSplit = async () => {
    if (!file || !range) return;
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();
      const totalPages = pdf.getPageCount();
      
      const pageIndices: number[] = [];
      const parts = range.split(',').map(p => p.trim());
      
      parts.forEach(part => {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(Number);
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= totalPages) pageIndices.push(i - 1);
          }
        } else {
          const page = Number(part);
          if (page >= 1 && page <= totalPages) pageIndices.push(page - 1);
        }
      });

      // Deduplicate
      const uniqueIndices = [...new Set(pageIndices)];
      const copiedPages = await newPdf.copyPages(pdf, uniqueIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `split_${file.name}`;
      link.click();

    } catch (e) {
      console.error(e);
      alert('Invalid range or file error.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900">Split PDF</h3>
        <p className="text-gray-500">Extract specific pages from your document.</p>
      </div>

      {!file ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer relative">
          <input 
            type="file" 
            accept="application/pdf" 
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Upload size={32} className="mx-auto text-primary mb-3" />
          <p className="font-medium text-gray-700">Upload PDF to Split</p>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-red-500" />
            <span className="font-medium text-gray-700">{file.name}</span>
          </div>
          <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
            <X size={20} />
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Page Range</label>
        <input 
          type="text" 
          value={range}
          onChange={(e) => setRange(e.target.value)}
          placeholder="e.g. 1-3, 5, 8-10"
          className="w-full p-3 border border-gray-200 rounded-xl focus:border-primary outline-none"
        />
        <p className="text-xs text-gray-500 mt-2">Enter page numbers separated by commas or ranges.</p>
      </div>

      <button 
        onClick={handleSplit}
        disabled={!file || !range || processing}
        className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {processing ? <Loader2 className="animate-spin" /> : <Split />}
        {processing ? 'Splitting...' : 'Download Pages'}
      </button>
    </div>
  );
};

const PdfToImage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  const convertToImages = async () => {
    if (!file) return;
    setProcessing(true);
    setImages([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Use the resolved pdfjs instance
      const pdf = await pdfjs.getDocument(arrayBuffer).promise;
      const totalPages = pdf.numPages;
      const generatedImages: string[] = [];

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High quality scale
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            generatedImages.push(canvas.toDataURL('image/jpeg'));
        }
      }
      setImages(generatedImages);
    } catch (e) {
      console.error(e);
      alert('Error converting PDF. Please try a different file.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900">PDF to Image Converter</h3>
        <p className="text-gray-500">Convert PDF pages into high-quality images.</p>
      </div>

      {!file ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer relative">
          <input 
            type="file" 
            accept="application/pdf" 
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Upload size={32} className="mx-auto text-primary mb-3" />
          <p className="font-medium text-gray-700">Upload PDF</p>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
           <span className="font-medium">{file.name}</span>
           <button onClick={() => { setFile(null); setImages([]); }} className="text-red-500 hover:underline text-sm">Remove</button>
        </div>
      )}

      {images.length === 0 && (
          <button 
            onClick={convertToImages}
            disabled={!file || processing}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {processing ? <Loader2 className="animate-spin" /> : <FileImage />}
            {processing ? 'Converting...' : 'Convert to Images'}
          </button>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
           {images.map((img, idx) => (
             <div key={idx} className="border border-gray-200 rounded-xl p-2 bg-white shadow-sm">
                <img src={img} alt={`Page ${idx + 1}`} className="w-full h-auto rounded border border-gray-100 mb-2" />
                <div className="flex justify-between items-center px-2">
                    <span className="text-xs text-gray-500">Page {idx + 1}</span>
                    <a href={img} download={`page_${idx+1}.jpg`} className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1">
                        <Download size={14} /> Download
                    </a>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

const ImageToPdf = () => {
    const [images, setImages] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages([...images, ...Array.from(e.target.files)]);
        }
    };

    const convert = async () => {
        if (images.length === 0) return;
        setProcessing(true);
        try {
            const pdfDoc = await PDFDocument.create();
            
            for (const imgFile of images) {
                const imgBytes = await imgFile.arrayBuffer();
                const type = imgFile.type;
                let img;
                
                if (type === 'image/jpeg') {
                    img = await pdfDoc.embedJpg(imgBytes);
                } else if (type === 'image/png') {
                    img = await pdfDoc.embedPng(imgBytes);
                } else {
                    // Fallback attempt as PNG if strictly needed or skip
                    continue; 
                }

                const page = pdfDoc.addPage([img.width, img.height]);
                page.drawImage(img, {
                    x: 0,
                    y: 0,
                    width: img.width,
                    height: img.height,
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'images_converted.pdf';
            link.click();
        } catch (e) {
            console.error(e);
            alert('Error converting images. Ensure they are JPG or PNG.');
        } finally {
            setProcessing(false);
        }
    };

    const moveImage = (idx: number, dir: number) => {
        const newImgs = [...images];
        const target = idx + dir;
        if (target >= 0 && target < newImgs.length) {
            [newImgs[idx], newImgs[target]] = [newImgs[target], newImgs[idx]];
            setImages(newImgs);
        }
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">Image to PDF</h3>
                <p className="text-gray-500">Combine multiple images into a single PDF document.</p>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer relative">
                <input 
                    type="file" 
                    multiple 
                    accept="image/png, image/jpeg" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleUpload}
                />
                <Image size={32} className="mx-auto text-primary mb-3" />
                <p className="font-medium text-gray-700">Upload Images (JPG/PNG)</p>
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img, idx) => (
                        <div key={idx} className="relative group border border-gray-200 rounded-lg p-2 bg-gray-50">
                            <div className="aspect-square bg-gray-200 rounded overflow-hidden mb-2">
                                <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" alt="preview" />
                            </div>
                            <p className="text-xs truncate text-center text-gray-600 mb-2">{img.name}</p>
                            <div className="flex justify-center gap-2">
                                <button onClick={() => moveImage(idx, -1)} className="p-1 hover:bg-gray-200 rounded"><MoveUp size={14} className="-rotate-90"/></button>
                                <button onClick={() => moveImage(idx, 1)} className="p-1 hover:bg-gray-200 rounded"><MoveDown size={14} className="-rotate-90"/></button>
                                <button onClick={() => setImages(images.filter((_, i) => i !== idx))} className="p-1 text-red-500 hover:bg-red-50 rounded"><X size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button 
                onClick={convert}
                disabled={images.length === 0 || processing}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {processing ? <Loader2 className="animate-spin" /> : <Download />}
                {processing ? 'Converting...' : 'Create PDF'}
            </button>
        </div>
    );
};

const ZipExtractor = () => {
    const [file, setFile] = useState<File | null>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [processing, setProcessing] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setProcessing(true);
        setEntries([]);

        try {
            const zip = new JSZip();
            const contents = await zip.loadAsync(selectedFile);
            
            const entriesData: any[] = [];
            contents.forEach((relativePath, zipEntry) => {
                entriesData.push(zipEntry);
            });
            setEntries(entriesData);
        } catch (err) {
            console.error(err);
            alert("Failed to read ZIP file. It might be corrupted.");
            setFile(null);
        } finally {
            setProcessing(false);
        }
    };

    const downloadEntry = async (entry: any) => {
        if (entry.dir) return;
        try {
            const blob = await entry.async('blob');
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = entry.name.split('/').pop(); // Simple filename
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error(e);
            alert("Failed to download file.");
        }
    };

    return (
        <div className="space-y-6 max-w-xl mx-auto">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">ZIP Extractor</h3>
                <p className="text-gray-500">Extract files from ZIP archives in your browser.</p>
            </div>

            {!file ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer relative">
                    <input 
                        type="file" 
                        accept=".zip,application/zip,application/x-zip-compressed"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleUpload}
                    />
                    <FolderArchive size={32} className="mx-auto text-primary mb-3" />
                    <p className="font-medium text-gray-700">Upload ZIP File</p>
                </div>
            ) : (
                <div className="space-y-4">
                     <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FolderArchive className="text-yellow-600" />
                            <span className="font-medium text-gray-700">{file.name}</span>
                        </div>
                        <button onClick={() => { setFile(null); setEntries([]); }} className="text-gray-400 hover:text-red-500">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto shadow-sm">
                        {processing ? (
                            <div className="p-8 flex justify-center">
                                <Loader2 className="animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {entries.map((entry, idx) => (
                                    <div key={idx} className="p-3 flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {entry.dir ? <Folder size={18} className="text-gray-400"/> : <File size={18} className="text-gray-400"/>}
                                            <span className="text-sm text-gray-700 truncate">{entry.name}</span>
                                        </div>
                                        {!entry.dir && (
                                            <button 
                                                onClick={() => downloadEntry(entry)}
                                                className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors"
                                                title="Download File"
                                            >
                                                <Download size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {entries.length === 0 && !processing && (
                                    <div className="p-4 text-center text-gray-500 text-sm">No files found or empty archive.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const FileAnalyzer = () => {
    const [file, setFile] = useState<File | null>(null);

    return (
        <div className="space-y-6 max-w-xl mx-auto">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">File Size Analyzer</h3>
                <p className="text-gray-500">Check file details before uploading or sharing.</p>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer relative">
                <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <File size={32} className="mx-auto text-primary mb-3" />
                <p className="font-medium text-gray-700">Drop any file here to analyze</p>
            </div>

            {file && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-fade-in">
                    <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-3">
                        <FileText className="text-primary" />
                        <div>
                            <h4 className="font-bold text-gray-900">{file.name}</h4>
                            <p className="text-xs text-gray-500">{file.type || 'Unknown Type'}</p>
                        </div>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">File Size (Bytes)</p>
                            <p className="text-2xl font-mono text-gray-800">{file.size.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Formatted</p>
                            <p className="text-2xl font-mono text-primary">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <div className="col-span-2 pt-4 border-t border-gray-100">
                             <p className="text-xs text-gray-500">
                                This file is approximately <span className="font-bold text-gray-700">{(file.size / 1024).toFixed(0)} KB</span>.
                             </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};