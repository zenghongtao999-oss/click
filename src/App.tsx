/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smile, 
  Sparkles, 
  X, 
  Share2, 
  Copy, 
  Check, 
  Heart, 
  Send, 
  RotateCcw, 
  PartyPopper, 
  Sparkle,
  Bookmark,
  Undo2,
  ExternalLink
} from 'lucide-react';

// Design Themes Configuration
interface Theme {
  id: string;
  name: string;
  fromColor: string;
  toColor: string;
  bgGradient: string;
  accentColor: string;
  textColor: string;
  btnBg: string;
  btnHover: string;
  glow: string;
}

const THEMES: Record<string, Theme> = {
  rose: {
    id: 'rose',
    name: '落日暖霞 (暖粉)',
    fromColor: 'from-rose-400',
    toColor: 'to-orange-300',
    bgGradient: 'from-rose-50/70 via-orange-50/50 to-rose-50/30',
    accentColor: 'text-rose-500',
    textColor: 'text-rose-600',
    btnBg: 'bg-gradient-to-r from-rose-500 to-orange-400',
    btnHover: 'hover:from-rose-600 hover:to-orange-500',
    glow: 'shadow-rose-500/25',
  },
  indigo: {
    id: 'indigo',
    name: '星空极光 (深邃紫蓝)',
    fromColor: 'from-indigo-500',
    toColor: 'to-teal-450',
    bgGradient: 'from-indigo-50/70 via-sky-50/50 to-indigo-50/30',
    accentColor: 'text-indigo-500',
    textColor: 'text-indigo-600',
    btnBg: 'bg-gradient-to-r from-indigo-600 to-teal-500',
    btnHover: 'hover:from-indigo-700 hover:to-teal-600',
    glow: 'shadow-indigo-500/25',
  },
  emerald: {
    id: 'emerald',
    name: '林间清晨 (晨森绿)',
    fromColor: 'from-emerald-400',
    toColor: 'to-teal-300',
    bgGradient: 'from-emerald-50/70 via-teal-50/50 to-emerald-50/30',
    accentColor: 'text-emerald-500',
    textColor: 'text-emerald-600',
    btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    btnHover: 'hover:from-emerald-600 hover:to-teal-500',
    glow: 'shadow-emerald-500/25',
  },
  amber: {
    id: 'amber',
    name: '向日葵海 (活力金黄)',
    fromColor: 'from-amber-400',
    toColor: 'to-orange-450',
    bgGradient: 'from-amber-50/70 via-orange-50/50 to-amber-50/30',
    accentColor: 'text-amber-500',
    textColor: 'text-amber-600',
    btnBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    btnHover: 'hover:from-amber-600 hover:to-orange-600',
    glow: 'shadow-amber-500/25',
  },
};

const PRESET_MESSAGES = [
  { title: "日常问候", text: "忙碌的生活中，也别忘了给自己一个灿烂的微笑。祝你今天有个好心情！☕" },
  { title: "暖心治愈", text: "愿你眼里有光，心中有爱，手上有力量，在每一个普通的日子里都闪闪发光。" },
  { title: "温馨祝愿", text: "无论你正在经历什么，请相信美好总在不期而遇，愿你一切顺利、平安喜乐！✨" },
  { title: "生日快乐", text: "祝你生日快乐！愿你所有的梦想如期而至，生活常伴温暖与欢笑。🎂" },
];

// Encode unicode safely to URL-safe Base64
const encodeBase64 = (str: string): string => {
  if (!str) return '';
  try {
    const utf8Bytes = new TextEncoder().encode(str);
    const binString = Array.from(utf8Bytes, (byte) => String.fromCharCode(byte)).join('');
    return btoa(binString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    return encodeURIComponent(str);
  }
};

// Decode URL-safe Base64 safely
const decodeBase64 = (str: string): string => {
  if (!str) return '';
  try {
    if (str.includes('%')) {
      return decodeURIComponent(str);
    }
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binString = atob(base64);
    const utf8Bytes = Uint8Array.from(binString, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(utf8Bytes);
  } catch (e) {
    try {
      return decodeURIComponent(str);
    } catch {
      return str;
    }
  }
};

// Strip WeChat singlemessage/timeline garbage trackers
const sanitizeWeChatParams = (val: string): string => {
  if (!val) return '';
  const lowercase = val.toLowerCase().trim();
  if (
    lowercase === 'singlemessage' ||
    lowercase === 'groupmessage' ||
    lowercase === 'timeline' ||
    lowercase === 'app' ||
    lowercase === 'session'
  ) {
    return '';
  }
  return val;
};

export default function App() {
  // Query state derived from URL
  const [isReceivedMode, setIsReceivedMode] = useState(false);
  const [receivedParams, setReceivedParams] = useState({
    to: '',
    from: '',
    msg: '',
    theme: 'indigo'
  });

  // Creator state
  const [toName, setToName] = useState('我的朋友');
  const [fromName, setFromName] = useState('');
  const [customMsg, setCustomMsg] = useState('祝你今天开心，眼里有光，心中有爱！✨');
  const [selectedTheme, setSelectedTheme] = useState<string>('indigo');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [isExportingImg, setIsExportingImg] = useState(false);
  const [exportedImgUrl, setExportedImgUrl] = useState<string | null>(null);
  const [modalQrDataUrl, setModalQrDataUrl] = useState('');
  const [customDomain, setCustomDomain] = useState(() => localStorage.getItem('custom_domain') || '');

  // Persist customDomain config locally to memory
  useEffect(() => {
    localStorage.setItem('custom_domain', customDomain);
  }, [customDomain]);

  // Generate offline base64 QR code locally with NO external API requests
  useEffect(() => {
    if (generatedLink) {
      QRCode.toDataURL(generatedLink, { width: 360, margin: 1, errorCorrectionLevel: 'M' })
        .then(url => {
          setModalQrDataUrl(url);
        })
        .catch(err => {
          console.error("Local QR generation failed", err);
        });
    }
  }, [generatedLink]);

  // Recipient playback states
  const [isEnvelopeOpened, setIsEnvelopeOpened] = useState(false);

  // Parse URL search parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const msgQuery = params.get('msg');
    const toQuery = params.get('to') || '';
    const fromQuery = params.get('from') || '';
    const theme = params.get('theme') || 'indigo';

    if (msgQuery) {
      const decodedMsg = decodeBase64(msgQuery);
      const decodedTo = sanitizeWeChatParams(decodeBase64(toQuery));
      const decodedFrom = sanitizeWeChatParams(decodeBase64(fromQuery));

      setIsReceivedMode(true);
      setReceivedParams({
        to: decodedTo,
        from: decodedFrom,
        msg: decodedMsg,
        theme: THEMES[theme] ? theme : 'indigo'
      });
    } else {
      setIsReceivedMode(false);
    }
  }, []);

  // Update shareable link whenever creator configurations change
  useEffect(() => {
    if (!isReceivedMode) {
      let baseUrl = '';
      if (customDomain.trim()) {
        let cleanDomain = customDomain.trim();
        // Automatically add protocol if missing
        if (!/^https?:\/\//i.test(cleanDomain)) {
          cleanDomain = 'https://' + cleanDomain;
        }
        // Remove trailing slash if exists, but append pathname
        cleanDomain = cleanDomain.replace(/\/$/, '');
        baseUrl = cleanDomain + window.location.pathname;
      } else {
        let origin = window.location.origin;
        // Convert internal development preview host (ais-dev-) to public shareable preview host (ais-pre-)
        // so users are never prompted for Google Login/Permission when viewing with standard browsers
        if (origin.includes('ais-dev-')) {
          origin = origin.replace('ais-dev-', 'ais-pre-');
        }
        baseUrl = origin + window.location.pathname;
      }

      const params = new URLSearchParams();
      params.set('msg', encodeBase64(customMsg));
      if (toName) params.set('to', encodeBase64(toName));
      if (fromName) params.set('from', encodeBase64(fromName));
      if (selectedTheme !== 'indigo') params.set('theme', selectedTheme);
      
      setGeneratedLink(`${baseUrl}?${params.toString()}`);
    }
  }, [toName, fromName, customMsg, selectedTheme, isReceivedMode, customDomain]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback selector for browsers that block clipboard API
      const input = document.getElementById('generated-link-input') as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const currentTheme = THEMES[isReceivedMode ? receivedParams.theme : selectedTheme] || THEMES.indigo;

  // Custom function to return to pure Creator Mode
  const handleGoToCreator = () => {
    // Elegant client side transition without fully destroying state if possible, but resetting URL params
    window.history.pushState({}, '', window.location.pathname);
    setIsReceivedMode(false);
    setIsEnvelopeOpened(false);
  };

  // Helper function to insert preset message
  const handleApplyPreset = (text: string) => {
    setCustomMsg(text);
  };

  // Canvas render based exporter to generate perfect JPG/PNG electronic postcard images
  const handleExportImage = (excludeQr: boolean) => {
    setIsExportingImg(true);
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = excludeQr ? 800 : 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExportingImg(false);
      return;
    }

    // 1. Draw beautiful soft gradient background matches current selected theme
    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (selectedTheme === 'rose') {
      grad.addColorStop(0, '#fff1f2'); // rose-50
      grad.addColorStop(0.5, '#fff7ed'); // orange-50
      grad.addColorStop(1, '#ffe4e6'); // rose-100
    } else if (selectedTheme === 'emerald') {
      grad.addColorStop(0, '#f0fdf4'); // emerald-50
      grad.addColorStop(0.5, '#f0fdfa'); // teal-50
      grad.addColorStop(1, '#ccfbf1'); // teal-100
    } else if (selectedTheme === 'amber') {
      grad.addColorStop(0, '#fef8e6'); // amber-50
      grad.addColorStop(0.5, '#fff7ed'); // orange-50
      grad.addColorStop(1, '#fef3c7'); // amber-100
    } else {
      // Indigo theme
      grad.addColorStop(0, '#e0e7ff'); // indigo-100
      grad.addColorStop(0.5, '#f0f9ff'); // sky-50
      grad.addColorStop(1, '#e0f2fe'); // sky-100
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, canvas.height);

    // 2. Draw card container with deep soft luxury drop shadow
    ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
    ctx.shadowBlur = 45;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = '#ffffff';

    const cardX = 60;
    const cardY = 80;
    const cardW = 680;
    const cardH = excludeQr ? 640 : 840;
    const r = 36; // rounded corners

    ctx.beginPath();
    ctx.moveTo(cardX + r, cardY);
    ctx.lineTo(cardX + cardW - r, cardY);
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r);
    ctx.lineTo(cardX + cardW, cardY + cardH - r);
    ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH);
    ctx.lineTo(cardX + r, cardY + cardH);
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - r);
    ctx.lineTo(cardX, cardY + r);
    ctx.quadraticCurveTo(cardX, cardY, cardX + r, cardY);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent'; // reset shadow

    // 3. Draw gradient top-bar inside the card
    let stripGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
    if (selectedTheme === 'rose') {
      stripGrad.addColorStop(0, '#fb7185'); // rose-400
      stripGrad.addColorStop(1, '#fdbb2d'); // orange-300
    } else if (selectedTheme === 'emerald') {
      stripGrad.addColorStop(0, '#34d399'); // emerald-400
      stripGrad.addColorStop(1, '#5eead4'); // teal-300
    } else if (selectedTheme === 'amber') {
      stripGrad.addColorStop(0, '#fbbf24'); // amber-400
      stripGrad.addColorStop(1, '#f97316'); // orange-500
    } else {
      stripGrad.addColorStop(0, '#6366f1'); // indigo-500
      stripGrad.addColorStop(1, '#14b8a6'); // teal-500
    }
    ctx.fillStyle = stripGrad;
    ctx.beginPath();
    ctx.moveTo(cardX + r, cardY);
    ctx.lineTo(cardX + cardW - r, cardY);
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r);
    ctx.lineTo(cardX + cardW, cardY + 24);
    ctx.lineTo(cardX, cardY + 24);
    ctx.lineTo(cardX, cardY + r);
    ctx.quadraticCurveTo(cardX, cardY, cardX + r, cardY);
    ctx.closePath();
    ctx.fill();

    // 4. Draw Smiley Circle Emblem
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(400, 195, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 2;
    ctx.stroke();

    const brandingColor = selectedTheme === 'rose' ? '#f43f5e' : selectedTheme === 'emerald' ? '#10b981' : selectedTheme === 'amber' ? '#d97706' : '#4f46e5';
    ctx.strokeStyle = brandingColor;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    
    // Draw Eyes
    ctx.fillStyle = brandingColor;
    ctx.beginPath();
    ctx.arc(382, 188, 4.5, 0, Math.PI * 2);
    ctx.arc(418, 188, 4.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Smile Arc
    ctx.beginPath();
    ctx.arc(400, 198, 18, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // 5. Header Title Text
    ctx.font = 'bold 36px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText('专属祝福心愿卡', 400, 290);

    // Subtle divider
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(250, 318);
    ctx.lineTo(550, 318);
    ctx.stroke();

    // 6. To Whom text
    ctx.font = 'normal 26px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'left';
    ctx.fillText(`Dear ${toName || '朋友'} :`, 130, 385);

    // 7. Message Content drawing with auto layout text wrapping
    ctx.font = 'italic 28px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = '#334155';
    
    // Clean wrapping algorithm
    const messageText = `“ ${customMsg} ”`;
    const maxTextWidth = 545;
    const words = messageText.split('');
    let currentLine = '';
    let currY = 445;
    const lineSpacing = 48;

    for (let i = 0; i < words.length; i++) {
      let testLine = currentLine + words[i];
      let testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxTextWidth && i > 0) {
        ctx.fillText(currentLine, 130, currY);
        currentLine = words[i];
        currY += lineSpacing;
      } else {
        currentLine = testLine;
      }
    }
    ctx.fillText(currentLine, 130, currY);

    // 8. Signature Name
    if (fromName) {
      ctx.font = 'bold 24px "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = brandingColor;
      ctx.textAlign = 'right';
      ctx.fillText(`—— ${fromName}`, 670, currY + 80);
    }

    const triggerDownload = () => {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        setExportedImgUrl(dataUrl);
        const downloadLink = document.createElement('a');
        downloadLink.download = `精美电子祝福卡_${toName || '朋友'}.png`;
        downloadLink.href = dataUrl;
        downloadLink.click();
      } catch (err) {
        console.error("Canvas serialization failed", err);
      }
      setIsExportingImg(false);
    };

    if (excludeQr) {
      // 9. Bottom decorative action guides
      ctx.font = 'normal 20px "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText('💖 愿这声轻柔的问候，为您带去温暖与欢笑', 400, 645);
      triggerDownload();
    } else {
      // 9. Bottom decorative action guides
      ctx.font = 'normal 18px "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText('🎁 长按或扫码，拆开属于您的精美动态问候网页', 400, 850);

      // 10. Draw dynamically generated QR for frictionless device navigation
      QRCode.toDataURL(generatedLink, { width: 150, margin: 1, errorCorrectionLevel: 'M' })
        .then(url => {
          const qrImage = new Image();
          qrImage.onload = () => {
            try {
              ctx.drawImage(qrImage, 325, 665, 150, 150);
              triggerDownload();
            } catch (e) {
              triggerDownload();
            }
          };
          qrImage.onerror = () => {
            triggerDownload();
          };
          qrImage.src = url;
        })
        .catch(err => {
          console.error("Local QR rendering for Canvas failed", err);
          triggerDownload();
        });
    }
  };

  return (
    <div id="app-root" className={`min-h-screen bg-gradient-to-br ${currentTheme.bgGradient} flex flex-col items-center justify-center p-4 md:p-8 select-none font-sans relative overflow-hidden transition-all duration-700`}>
      {/* Decorative ambient blurred orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-white/40 rounded-full blur-3xl pointer-events-none" />

      {/* RECIPIENT MODE: Displaying received surprise card */}
      {isReceivedMode ? (
        <div className="w-full max-w-md relative z-10 flex flex-col items-center justify-center min-h-[480px]">
          <AnimatePresence mode="wait">
            {!isEnvelopeOpened ? (
              /* Envelope View */
              <motion.div
                key="envelope"
                id="envelope-view"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="w-full bg-white border border-slate-100/80 rounded-[2rem] shadow-2xl p-8 text-center flex flex-col items-center relative overflow-hidden"
              >
                {/* Visual Top Highlight bar matching selected custom theme */}
                <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${currentTheme.fromColor} ${currentTheme.toColor}`} />
                
                <div className="mt-4 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100/80 inline-block">
                  <PartyPopper className={`w-12 h-12 ${currentTheme.accentColor} animate-bounce`} />
                </div>

                <p className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                  Special Delivery
                </p>

                <h1 className="text-2xl font-semibold text-slate-800 tracking-tight leading-snug mb-3">
                  {receivedParams.to ? `${receivedParams.to}，收信快乐` : "您拥有一张专属问候卡"}
                </h1>

                <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-8">
                  {receivedParams.from ? `您的朋友【${receivedParams.from}】` : "有人"} 为你定制了一句非常温暖的话，点击下方即可拆开。
                </p>

                <motion.button
                  id="btn-open-envelope"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEnvelopeOpened(true)}
                  className={`w-full py-4 text-white font-medium text-base rounded-2xl shadow-xl ${currentTheme.btnBg} ${currentTheme.btnHover} ${currentTheme.glow} transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer outline-none border-none`}
                >
                  <Sparkles className="w-5 h-5" />
                  拆开心愿卡
                </motion.button>
              </motion.div>
            ) : (
              /* Opened Card View */
              <motion.div
                key="card-opened"
                id="opened-card-view"
                initial={{ opacity: 0, scale: 0.9, rotate: -1 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 18 }}
                className="w-full bg-white border border-slate-100 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] p-10 flex flex-col items-center text-center relative overflow-hidden"
              >
                {/* Floating ambient theme accents */}
                <div className="absolute top-4 left-6 animate-pulse">
                  <Sparkle className="w-5 h-5 text-yellow-400 opacity-60" />
                </div>
                <div className="absolute bottom-16 right-6 animate-ping duration-1000">
                  <Heart className={`w-4 h-4 ${currentTheme.accentColor} opacity-30`} />
                </div>

                {/* Sender/Receiver Banner */}
                <div className="mb-8 w-full">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-medium bg-slate-50 border border-slate-100/50 ${currentTheme.textColor}`}>
                    Personal Message
                  </span>
                </div>

                {receivedParams.to && (
                  <h3 className="text-xl font-medium text-slate-700 tracking-tight mb-4">
                    Dear {receivedParams.to} :
                  </h3>
                )}

                {/* Clean beautiful statement container */}
                <div className="min-h-[110px] flex items-center justify-center px-4 mb-6">
                  <p className="text-2xl font-normal leading-relaxed text-slate-800 tracking-wide font-sans italic">
                    “ {receivedParams.msg} ”
                  </p>
                </div>

                {/* Sender Signature */}
                {receivedParams.from && (
                  <div className="flex items-center gap-2 justify-end w-full mb-10 text-slate-500 font-medium text-sm">
                    <span>——</span>
                    <span className={currentTheme.textColor}>{receivedParams.from}</span>
                  </div>
                )}

                {/* Return/Creator CTA */}
                <div className="w-full border-t border-slate-100 pt-8 flex flex-col gap-3">
                  <button
                    id="btn-close-and-write"
                    onClick={handleGoToCreator}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-colors cursor-pointer border-none flex items-center justify-center gap-2 shadow-md"
                  >
                    我也要制作这种专属问候链接 🪄
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* CREATOR MODE: Building custom links and preview */
        <div className="w-full max-w-4xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-4">
          
          {/* Creator Configuration Workspace (Left Panel) */}
          <div id="creator-workspace" className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-100/50 p-6 md:p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Smile className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
                  专属问候链接生成器
                </h1>
                <p className="text-xs text-slate-400">
                  定制专属的温馨问候，生成可供任何人预览的精美链接
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              
              {/* Receiver / Sender Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">
                    对方称呼 / 名字 (To)
                  </label>
                  <input
                    id="input-to"
                    type="text"
                    maxLength={15}
                    value={toName}
                    onChange={(e) => setToName(e.target.value)}
                    placeholder="例如：小美"
                    className="w-full px-4 py-3 bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-100 focus:border-indigo-500 rounded-xl text-sm text-slate-700 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">
                    您的署名 (From) — 可选
                  </label>
                  <input
                    id="input-from"
                    type="text"
                    maxLength={15}
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="您的名字"
                    className="w-full px-4 py-3 bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-100 focus:border-indigo-500 rounded-xl text-sm text-slate-700 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2.5">
                  选择视觉色彩主题 (Theme)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.values(THEMES).map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedTheme === theme.id 
                          ? 'border-slate-800 bg-slate-50/80 ring-2 ring-slate-800/10' 
                          : 'border-slate-100 bg-white hover:bg-slate-50/55'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-gradient-to-r ${theme.fromColor} ${theme.toColor} shrink-0`} />
                      <span className="text-[11px] font-medium text-slate-700 truncate">{theme.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Message Body */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-medium text-slate-500">
                    温馨寄语内容 (Message)
                  </label>
                  <span className="text-[10px] text-slate-300">
                    {customMsg.length}/80 字
                  </span>
                </div>
                <textarea
                  id="textarea-msg"
                  maxLength={80}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="在这里输入你想对他说的话..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-100 focus:border-indigo-500 rounded-2xl text-sm text-slate-700 outline-none transition-all resize-none leading-relaxed placeholder:text-slate-300"
                />
              </div>

              {/* Quick Preset Library */}
              <div>
                <span className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
                  <Bookmark className="w-3 h-3 text-slate-400" />
                  精选寄语推荐 (一键套用)
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_MESSAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset.text)}
                      className="text-xs bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-100 text-slate-600 transition-colors cursor-pointer"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Generation Section */}
              <div className="pt-5 border-t border-slate-100 flex flex-col gap-4">
                
                {/* DOMAIN COMPATIBILITY SETTINGS MODULE */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 md:p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      🌐 国内网络直连与微信兼容设置 (免翻/防屏蔽)
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse">
                      极致推荐
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                    当前默认为谷歌云测试地址（.run.app），受国内网络防火墙和微信流量限制，<strong>手机扫码可能会提示“连接超时”或“无法打开网页”</strong>。
                    由于软件采用<strong>高兼容性纯前端SPA架构</strong>，您可通过导出代码将网页一键部署至 <strong>Gitee Pages (码云，国内 100% 秒开且免费)</strong>、<strong>腾讯云/阿里云静态存储</strong> 或 GitHub Pages 等，并将新网址粘贴在下方：
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        id="input-custom-domain"
                        type="text"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        placeholder="输入您的自定义发布地址 (例如: mycard.vercel.app)"
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs text-slate-700 outline-none transition-all placeholder:text-slate-300"
                      />
                      {customDomain && (
                        <button
                          type="button"
                          onClick={() => setCustomDomain('')}
                          className="px-2.5 py-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors border border-slate-100"
                        >
                          重置
                        </button>
                      )}
                    </div>
                    
                    {customDomain ? (
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        ✨ 网址已完美重写适配！您再次复制或渲染的图片二维码即为微信直连链接。
                      </p>
                    ) : (
                      <div className="text-[10px] text-slate-400 bg-white border border-slate-100 rounded-lg p-2.5 space-y-1">
                        <div className="font-semibold text-slate-600">🛠️ 国内网络 100% 免翻极速部署（只要三步）：</div>
                        <div>1. 在本网页所在的 <strong>AI Studio 顶部最右侧</strong>（或设置 ⚙️ 图标附近）找到并选择 <strong>“Export” / “Download ZIP”</strong> 导出完整的项目源码包。</div>
                        <div>2. <strong>使用码云 Gitee Pages (推荐：国内不限速)</strong>：注册并登录 <a href="https://gitee.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline hover:text-emerald-700">Gitee (码云)</a>，新建一个静态仓库，将 ZIP 源码解压并上传，开启「Gitee Pages」服务，即可一键获得国内微信无障碍急速链接！</div>
                        <div>3. <strong>使用腾讯微程 / 阿里云 OSS</strong>：将 ZIP 解压出的静态网页文件（执行 <code>npm run build</code> 后产生的 <code>dist</code> 文件夹里的全部内容）上传至腾讯云 CloudBase 或阿里云 OSS 静态网站托管，100% 畅通支持微信直连。</div>
                        <div>4. 将获得的新专属网址复制并粘贴到上方输入框，再次复制链接或渲染的贺卡图片二维码即为微信无墙的完美互动网页！</div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                    已为您生成的专属问候链接：
                  </label>
                  
                  <div className="space-y-2.5">
                  <div className="relative flex-1">
                    <input
                      id="generated-link-input"
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="w-full pl-3 pr-10 py-3 bg-slate-50 text-xs font-mono text-slate-500 rounded-xl border border-slate-100 outline-none select-all"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <motion.button
                      id="btn-copy-generated"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCopyLink}
                      className="flex-1 py-3 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer bg-slate-900 hover:bg-slate-800 transition-colors shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-teal-400" />
                          <span>已复制链接</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>复制链接</span>
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      id="btn-show-qrcode"
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowQrCode(true)}
                      className="flex-1 py-3 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200/40 transition-colors shrink-0"
                    >
                      <span>📱 手机扫码预览</span>
                    </motion.button>
                  </div>

                  {/* HIGH-FIDELITY OFFLINE IMAGE GENERATORS CTA */}
                  <div className="flex flex-col gap-2.5">
                    <motion.button
                      id="btn-export-card-image-pure"
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleExportImage(true)}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10 transition-all border-none"
                      disabled={isExportingImg}
                    >
                      {isExportingImg ? (
                        <>
                          <span className="animate-spin mr-1">⏳</span>
                          <span>正在精细绘制唯美贺卡图片中...</span>
                        </>
                      ) : (
                        <>
                          <span>🎨 保存「纯净版高清贺卡」(极力推荐：发微信好友即看，免扫码 100% 成功)</span>
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      id="btn-export-card-image-qr"
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleExportImage(false)}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-slate-200/40"
                      disabled={isExportingImg}
                    >
                      {isExportingImg ? (
                        <>
                          <span className="animate-spin mr-1">⏳</span>
                          <span>正在绘制精细图卡中...</span>
                        </>
                      ) : (
                        <>
                          <span>🔗 保存「含网页扫码版」贺卡 (图片附带二维码，受国内网络限制)</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 flex flex-col gap-2.5 bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                  <div className="text-[10px] text-emerald-700 leading-normal flex flex-col gap-1 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/30">
                    <span className="font-semibold flex items-center gap-1">🌸 国内网络及微信 100% 访问保障方案 (动态点击/弹窗支持篇):</span>
                    <span>1. 由于原始调试环境和 Share 网址部署在谷歌云（Cloud Run），其主域名尾缀为 <strong>.run.app</strong>，在中国大陆的部分网络下，微信和手机浏览器会因为防火墙或微信内测策略拦截该域名而显示网络超时。</span>
                    <span>2. <strong>互动与弹窗方案</strong>：请放心，本贺卡采用高内聚、零数据库纯前端 SPA (单页面应用) 架构。只要微信/浏览器能载入网页，一切<strong>点击 envelope（拆开信封）、弹窗动画及交互</strong>都可以在任何国内 CDN 极速打开！</span>
                    <span className="mt-1 font-semibold text-rose-600">🎯 操作路径：点击 AI Studio 界面顶栏的 Export 导出并下载 ZIP 源码包，上传并托管至您的 <strong>Gitee Pages (码云，国内 100% 免费秒开)</strong> 或腾讯云、阿里云静态存储等，然后在上方［国内网络直连与微信兼容设置］中填入您的新地址，扫码与链接瞬间便能完美永久畅爽点击，且完美触发任何点击和弹窗交互！</span>
                  </div>

                  <p className="text-[10px] text-amber-600/95 leading-normal flex items-start gap-1 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/30">
                    <span>⚠️ 动态网页连通性提示：</span>
                    <span>若想用网页超链接打开动态效果，请确保：1. 当前网页右上角蓝色 <strong>"Share" (分享)</strong> 按钮点击了部署。2. 手机打开时网络处于不受限环境。</span>
                  </p>
                  
                  {/* Browser Compatibility Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100/40">
                    <span className="text-[9px] text-slate-400 font-medium mr-1 select-none">全端环境支持:</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-[9px] font-medium text-blue-600 border border-blue-100/50">
                      Microsoft Edge
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-[9px] font-medium text-amber-600 border border-amber-100/50">
                      Chrome
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-50 text-[9px] font-medium text-sky-600 border border-sky-100/50">
                      Safari
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-[9px] font-medium text-emerald-600 border border-emerald-100/50">
                      WeChat (微信)
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Dynamic Real-time Preview (Right Panel) */}
          <div id="creator-preview" className="lg:col-span-5 flex flex-col gap-4 self-stretch justify-center">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest pl-2">
              💌 实时预览效果 (对方打开时看到的界面)
            </span>
            
            {/* Live Card Device Mockup Wrapper */}
            <div className="bg-slate-950/5 border border-slate-100 shadow-xs rounded-3xl p-4 aspect-[4/5] flex items-center justify-center relative overflow-hidden bg-radial from-white to-transparent">
              <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,transparent)] opacity-40" />
              
              {/* Scale Mini mockup for fidelity */}
              <div className="w-full scale-95 transition-all duration-500">
                <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-6 text-center flex flex-col items-center relative overflow-hidden">
                  
                  {/* Accent Highlight Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${currentTheme.fromColor} ${currentTheme.toColor}`} />

                  <div className="mt-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100/80 inline-block">
                    <Smile className={`w-7 h-7 ${currentTheme.accentColor}`} />
                  </div>

                  {toName && (
                    <h4 className="text-base font-semibold text-slate-800 mb-1">
                      {toName}，收信快乐
                    </h4>
                  )}

                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-4">
                    {fromName ? `【${fromName}】` : "有人"} 为你定制了一句非常温暖的话，点击即可拆开。
                  </p>

                  <div className={`w-full py-2.5 text-white font-medium text-[11px] rounded-lg shadow-sm ${currentTheme.btnBg} transition-all duration-300 flex items-center justify-center gap-1.5 pointer-events-none opacity-85`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    拆开属于你的心愿卡
                  </div>
                </div>
              </div>
            </div>

            <button
              id="btn-self-preview"
              onClick={() => {
                // Navigate directly to the generated query params mock client style
                const params = new URLSearchParams();
                params.set('msg', encodeBase64(customMsg));
                if (toName) params.set('to', encodeBase64(toName));
                if (fromName) params.set('from', encodeBase64(fromName));
                if (selectedTheme !== 'indigo') params.set('theme', selectedTheme);
                window.location.search = params.toString();
              }}
              className="text-center text-xs text-indigo-600 hover:text-indigo-800 font-medium py-1 cursor-pointer underline flex items-center justify-center gap-1"
            >
              在当前窗口进入此链接效果预览 ↗
            </button>
          </div>

        </div>
      )}

      {/* QR Code Modal Overlay */}
      <AnimatePresence>
        {showQrCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQrCode(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2rem] border border-slate-100/80 shadow-2xl p-6 md:p-8 max-w-sm w-full relative z-10 text-center flex flex-col items-center"
            >
              <button
                type="button"
                onClick={() => setShowQrCode(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-4 p-3 bg-indigo-50 rounded-2xl">
                <Smile className="w-8 h-8 text-indigo-600" />
              </div>

              <h3 className="text-base font-semibold text-slate-800 tracking-tight mb-1">
                手机扫码，即刻极速访问 📱
              </h3>
              <p className="text-[11px] text-slate-400 mb-5 leading-normal max-w-xs">
                使用手机浏览器、“扫一扫”或微信相机直接对准屏幕，即可瞬间在手机端打开属于您的独特问候！
              </p>

              {/* QR Image Container with subtle glow and placeholder */}
              <div className="relative w-[190px] h-[190px] bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 p-2 mb-5">
                {modalQrDataUrl ? (
                  <img
                    src={modalQrDataUrl}
                    className="w-full h-full rounded-xl"
                    alt="QR Code"
                  />
                ) : (
                  <div className="text-xs text-slate-400 animate-pulse">正在本地生成防墙二维码...</div>
                )}
              </div>

              {/* Warm Notice */}
              <div className="bg-emerald-50/80 border border-emerald-100/50 rounded-xl p-3.5 text-left">
                <p className="text-[10px] text-emerald-800 leading-normal flex items-start gap-1 mb-1 font-semibold">
                  <span>💡</span>
                  <span>微信扫码加载慢或网络黑屏？</span>
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed pl-3">
                  由于谷歌云主域名 <strong>.run.app</strong> 受中国大陆出口网络与微信内部机制限制，会有加载过慢的问题。<strong>强烈推荐您使用我们专门研发的“一键保存精美手机贺卡图片”功能！</strong> 渲染的高清图片发给亲友无论在何种微信网络下均可秒看，极致稳定得体！
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* High-Fidelity Exported Card Image Preview Modal */}
      <AnimatePresence>
        {exportedImgUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExportedImgUrl(null)}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2rem] border border-slate-100/80 shadow-2xl p-5 md:p-6 max-w-lg w-full relative z-10 text-center flex flex-col items-center"
            >
              <button
                type="button"
                onClick={() => setExportedImgUrl(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-3 p-2 bg-rose-50 rounded-2xl inline-block">
                <Heart className="w-6 h-6 text-rose-500 animate-pulse" />
              </div>

              <h3 className="text-base font-semibold text-slate-800 tracking-tight mb-0.5">
                🎉 您的专属精美贺卡图片已完美绘制！
              </h3>
              <p className="text-[11px] text-slate-400 mb-4 leading-normal max-w-sm">
                电脑端用户可<strong>右键另存为</strong>，手机端用户可<strong>长按下方贺卡图片保存</strong>并直接发送至微信朋友圈或好友，100%全网免过滤、即刻秒开！
              </p>

              {/* High-res Image Preview */}
              <div className="relative max-h-[48vh] overflow-y-auto rounded-xl border border-slate-100 p-1 bg-slate-50 shadow-inner mb-4 w-full">
                <img
                  src={exportedImgUrl}
                  className="w-full h-auto rounded-lg shadow-sm max-h-[44vh] object-contain mx-auto"
                  alt="Saved Greeting Card"
                />
              </div>

              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => {
                    const downloadLink = document.createElement('a');
                    downloadLink.download = `精美电子祝福卡_${toName || '朋友'}.png`;
                    downloadLink.href = exportedImgUrl;
                    downloadLink.click();
                  }}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-rose-500/15 border-none"
                >
                  📥 再次直接下载到设备
                </button>
                <button
                  type="button"
                  onClick={() => setExportedImgUrl(null)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs rounded-xl transition-all cursor-pointer border-none"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


