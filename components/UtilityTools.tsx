import React, { useState, useEffect, useRef } from 'react';
import { 
  Key, QrCode, ScanBarcode, Fingerprint, FileCode, Hash, Palette, Zap, 
  Copy, Check, RefreshCw, Download, ArrowRight, X
} from 'lucide-react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import CryptoJS from 'crypto-js';

type UtilityTab = 'password' | 'qr' | 'barcode' | 'uuid' | 'base64' | 'hash' | 'palette' | 'gradient';

export const UtilityTools = () => {
  const [activeTab, setActiveTab] = useState<UtilityTab>('password');

  const tabs = [
    { id: 'password', label: 'Password Gen', icon: Key },
    { id: 'qr', label: 'QR Generator', icon: QrCode },
    { id: 'barcode', label: 'Barcode Gen', icon: ScanBarcode },
    { id: 'uuid', label: 'UUID Gen', icon: Fingerprint },
    { id: 'base64', label: 'Base64', icon: FileCode },
    { id: 'hash', label: 'Hash Gen', icon: Hash },
    { id: 'palette', label: 'Colors', icon: Palette },
    { id: 'gradient', label: 'Gradients', icon: Zap },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex flex-wrap gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as UtilityTab)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs md:text-sm transition-all flex-1 justify-center whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[400px]">
        {activeTab === 'password' && <PasswordGenerator />}
        {activeTab === 'qr' && <QrGenerator />}
        {activeTab === 'barcode' && <BarcodeGenerator />}
        {activeTab === 'uuid' && <UuidGenerator />}
        {activeTab === 'base64' && <Base64Tools />}
        {activeTab === 'hash' && <HashGenerator />}
        {activeTab === 'palette' && <ColorPaletteGenerator />}
        {activeTab === 'gradient' && <GradientGenerator />}
      </div>
    </div>
  );
};

// --- Sub Components ---

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-2 text-gray-500 hover:text-primary transition-colors">
      {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
    </button>
  );
};

const PasswordGenerator = () => {
  const [length, setLength] = useState(16);
  const [useSymbols, setUseSymbols] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useUpper, setUseUpper] = useState(true);
  const [password, setPassword] = useState('');

  const generate = () => {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    let chars = lower;
    if (useUpper) chars += upper;
    if (useNumbers) chars += numbers;
    if (useSymbols) chars += symbols;

    let generated = '';
    for (let i = 0; i < length; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
  };

  useEffect(() => { generate(); }, []);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Strong Password Generator</h3>
        <p className="text-gray-500">Secure your accounts with high-entropy keys.</p>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-xl flex items-center justify-between font-mono text-lg break-all">
        <span className="text-gray-800">{password}</span>
        <div className="flex gap-2">
            <button onClick={generate} className="p-2 text-gray-500 hover:text-primary"><RefreshCw size={18} /></button>
            <CopyButton text={password} />
        </div>
      </div>

      <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-100">
        <div>
           <div className="flex justify-between text-sm text-gray-600 mb-2">
             <span>Length</span>
             <span className="font-bold">{length}</span>
           </div>
           <input 
             type="range" min="6" max="64" value={length} 
             onChange={(e) => setLength(Number(e.target.value))}
             className="w-full accent-primary"
           />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
             <label className="flex items-center gap-2 cursor-pointer">
               <input type="checkbox" checked={useUpper} onChange={(e) => setUseUpper(e.target.checked)} className="rounded text-primary focus:ring-primary" />
               <span className="text-sm">Uppercase</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer">
               <input type="checkbox" checked={useNumbers} onChange={(e) => setUseNumbers(e.target.checked)} className="rounded text-primary focus:ring-primary" />
               <span className="text-sm">Numbers</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer">
               <input type="checkbox" checked={useSymbols} onChange={(e) => setUseSymbols(e.target.checked)} className="rounded text-primary focus:ring-primary" />
               <span className="text-sm">Symbols</span>
             </label>
        </div>
      </div>
      <button onClick={generate} className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">Generate New Password</button>
    </div>
  );
};

const QrGenerator = () => {
  const [text, setText] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (text) {
      QRCode.toDataURL(text, { width: 300, margin: 2 }, (err, url) => {
        if (!err) setQrUrl(url);
      });
    } else {
        setQrUrl('');
    }
  }, [text]);

  const downloadQr = () => {
      if(qrUrl) {
          const link = document.createElement('a');
          link.href = qrUrl;
          link.download = 'qrcode.png';
          link.click();
      }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">QR Code Generator</h3>
        <p className="text-gray-500">Create QR codes for URLs, text, or Wi-Fi.</p>
        
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text or URL here..."
          className="w-full h-32 p-4 border border-gray-200 rounded-xl outline-none focus:border-primary resize-none"
        />
        <p className="text-xs text-gray-400">Type above to see live preview.</p>
      </div>

      <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-xl border border-gray-100 h-full min-h-[300px]">
        {qrUrl ? (
            <>
                <img src={qrUrl} alt="QR Code" className="rounded-lg shadow-sm border border-gray-200 mb-4" />
                <button onClick={downloadQr} className="flex items-center gap-2 text-primary font-medium hover:underline">
                    <Download size={16} /> Download PNG
                </button>
            </>
        ) : (
            <div className="text-gray-300 text-center">
                <QrCode size={48} className="mx-auto mb-2" />
                <p>Preview area</p>
            </div>
        )}
      </div>
    </div>
  );
};

const BarcodeGenerator = () => {
    const [value, setValue] = useState('123456789');
    const [format, setFormat] = useState('CODE128');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && value) {
            try {
                JsBarcode(canvasRef.current, value, {
                    format: format,
                    lineColor: "#000",
                    width: 2,
                    height: 100,
                    displayValue: true
                });
            } catch (e) {
                // Ignore invalid input errors for barcode format
            }
        }
    }, [value, format]);

    const download = () => {
        if (canvasRef.current) {
            const url = canvasRef.current.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = url;
            link.download = 'barcode.png';
            link.click();
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
             <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Barcode Generator</h3>
                <p className="text-gray-500">Generate printable standard barcodes.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                    <input 
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-primary"
                        placeholder="Barcode Value"
                    />
                </div>
                <select 
                    value={format} 
                    onChange={(e) => setFormat(e.target.value)}
                    className="p-3 border border-gray-200 rounded-xl outline-none focus:border-primary bg-white"
                >
                    <option value="CODE128">Code 128</option>
                    <option value="EAN13">EAN-13</option>
                    <option value="UPC">UPC</option>
                    <option value="CODE39">Code 39</option>
                </select>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200 flex flex-col items-center justify-center min-h-[200px]">
                <canvas ref={canvasRef} className="max-w-full"></canvas>
            </div>
            
            <button onClick={download} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors flex justify-center items-center gap-2">
                <Download size={18} /> Download Image
            </button>
        </div>
    );
};

const UuidGenerator = () => {
    const [uuids, setUuids] = useState<string[]>([]);
    const [count, setCount] = useState(1);

    const generate = () => {
        const newUuids = [];
        for(let i=0; i<count; i++) {
            newUuids.push(crypto.randomUUID());
        }
        setUuids(newUuids);
    }

    useEffect(() => { generate(); }, []);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                     <h3 className="text-xl font-bold text-gray-900">UUID v4 Generator</h3>
                     <p className="text-gray-500">Generate universally unique identifiers.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Count:</span>
                    <input 
                        type="number" min="1" max="50" value={count} 
                        onChange={(e) => setCount(Number(e.target.value))}
                        className="w-16 p-2 border border-gray-200 rounded-lg text-center outline-none focus:border-primary"
                    />
                    <button onClick={generate} className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90">
                        Generate
                    </button>
                </div>
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                {uuids.map((uuid, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border-b border-gray-100 last:border-0 hover:bg-white transition-colors">
                        <span className="font-mono text-gray-700 text-sm md:text-base">{uuid}</span>
                        <CopyButton text={uuid} />
                    </div>
                ))}
            </div>
            
             <button onClick={() => navigator.clipboard.writeText(uuids.join('\n'))} className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                Copy All
            </button>
        </div>
    );
};

const Base64Tools = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [mode, setMode] = useState<'encode' | 'decode'>('encode');

    useEffect(() => {
        try {
            if (mode === 'encode') {
                setOutput(btoa(input));
            } else {
                setOutput(atob(input));
            }
        } catch (e) {
            setOutput('Invalid input for decoding.');
        }
    }, [input, mode]);

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold text-gray-900">Base64 Converter</h3>
                 <div className="bg-gray-100 p-1 rounded-lg flex">
                     <button 
                        onClick={() => setMode('encode')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'encode' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                     >Encode</button>
                     <button 
                        onClick={() => setMode('decode')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'decode' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                     >Decode</button>
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Input</label>
                     <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full h-64 p-4 border border-gray-200 rounded-xl outline-none focus:border-primary font-mono text-sm resize-none"
                        placeholder={mode === 'encode' ? 'Type text to encode...' : 'Paste Base64 string...'}
                     />
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Output</label>
                     <div className="relative">
                        <textarea 
                            readOnly
                            value={output}
                            className="w-full h-64 p-4 border border-gray-200 rounded-xl outline-none bg-gray-50 font-mono text-sm resize-none text-gray-600"
                        />
                        <div className="absolute top-2 right-2">
                            <CopyButton text={output} />
                        </div>
                     </div>
                 </div>
             </div>
        </div>
    );
};

const HashGenerator = () => {
    const [input, setInput] = useState('');
    
    return (
        <div className="space-y-6">
             <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Hash Generator</h3>
                <p className="text-gray-500">Calculate cryptographic hashes (MD5, SHA).</p>
            </div>

            <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter text to hash..."
                className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-primary text-lg"
            />

            <div className="space-y-4">
                {[
                    { label: 'MD5', val: CryptoJS.MD5(input).toString() },
                    { label: 'SHA-1', val: CryptoJS.SHA1(input).toString() },
                    { label: 'SHA-256', val: CryptoJS.SHA256(input).toString() },
                    { label: 'SHA-512', val: CryptoJS.SHA512(input).toString() },
                ].map((item) => (
                    <div key={item.label}>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{item.label}</label>
                        <div className="flex bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                            <input 
                                readOnly 
                                value={item.val} 
                                className="flex-1 p-3 bg-transparent outline-none font-mono text-sm text-gray-700"
                            />
                            <div className="border-l border-gray-200 flex items-center px-2">
                                <CopyButton text={item.val} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ColorPaletteGenerator = () => {
    const [colors, setColors] = useState<string[]>([]);

    const generate = () => {
        // Simple random HSL generator with complementary logic
        const newColors = [];
        const baseHue = Math.floor(Math.random() * 360);
        
        for (let i = 0; i < 5; i++) {
            const hue = (baseHue + (i * 40)) % 360;
            const sat = 60 + Math.random() * 20;
            const lig = 40 + Math.random() * 40;
            newColors.push(`hsl(${hue}, ${sat}%, ${lig}%)`);
        }
        setColors(newColors);
    };

    const hslToHex = (hsl: string) => {
        // Create a temp element to convert color via computed style
        const div = document.createElement('div');
        div.style.color = hsl;
        document.body.appendChild(div);
        const rgb = window.getComputedStyle(div).color;
        document.body.removeChild(div);
        
        const rgbArr = rgb.match(/\d+/g);
        if (!rgbArr) return hsl;
        
        const r = parseInt(rgbArr[0]);
        const g = parseInt(rgbArr[1]);
        const b = parseInt(rgbArr[2]);
        
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    useEffect(() => { generate(); }, []);

    return (
        <div className="space-y-8">
             <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold text-gray-900">Color Palette Generator</h3>
                 <button onClick={generate} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90">
                     <RefreshCw size={18} /> Generate New
                 </button>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-5 h-64 rounded-2xl overflow-hidden shadow-lg">
                 {colors.map((color, idx) => {
                     const hex = hslToHex(color);
                     return (
                        <div key={idx} className="h-full flex flex-col justify-end p-4 group relative" style={{ background: color }}>
                            <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg text-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                <p className="font-mono font-bold text-gray-800">{hex}</p>
                                <button 
                                    onClick={() => navigator.clipboard.writeText(hex)}
                                    className="text-xs text-primary hover:underline mt-1"
                                >
                                    Copy HEX
                                </button>
                            </div>
                        </div>
                     );
                 })}
             </div>
             
             <div className="grid grid-cols-5 gap-4">
                  {colors.map((color, idx) => (
                      <div key={idx} className="text-center">
                          <div className="w-full h-2 rounded-full mb-2" style={{ background: color }}></div>
                          <span className="text-xs font-mono text-gray-500">{hslToHex(color)}</span>
                      </div>
                  ))}
             </div>
        </div>
    );
};

const GradientGenerator = () => {
    const [color1, setColor1] = useState('#4F46E5');
    const [color2, setColor2] = useState('#9333EA');
    const [direction, setDirection] = useState('to right');

    const css = `background: linear-gradient(${direction}, ${color1}, ${color2});`;

    return (
        <div className="space-y-8">
            <h3 className="text-xl font-bold text-gray-900">CSS Gradient Generator</h3>
            
            <div className="h-48 w-full rounded-2xl shadow-inner border border-gray-200" style={{ background: `linear-gradient(${direction}, ${color1}, ${color2})` }}></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color 1</label>
                    <div className="flex items-center gap-2">
                        <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                        <input type="text" value={color1} onChange={(e) => setColor1(e.target.value)} className="flex-1 p-2 border border-gray-200 rounded-lg outline-none font-mono text-sm uppercase" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color 2</label>
                    <div className="flex items-center gap-2">
                        <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                        <input type="text" value={color2} onChange={(e) => setColor2(e.target.value)} className="flex-1 p-2 border border-gray-200 rounded-lg outline-none font-mono text-sm uppercase" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
                    <select value={direction} onChange={(e) => setDirection(e.target.value)} className="w-full p-2.5 bg-white border border-gray-200 rounded-lg outline-none">
                        <option value="to right">Right →</option>
                        <option value="to left">Left ←</option>
                        <option value="to bottom">Bottom ↓</option>
                        <option value="to top">Top ↑</option>
                        <option value="to bottom right">Diagonal ↘</option>
                        <option value="to top left">Diagonal ↖</option>
                    </select>
                </div>
            </div>

            <div className="bg-gray-900 text-gray-300 p-6 rounded-xl font-mono text-sm relative group">
                <code className="break-all">{css}</code>
                <div className="absolute top-4 right-4">
                    <CopyButton text={css} />
                </div>
            </div>
        </div>
    );
};