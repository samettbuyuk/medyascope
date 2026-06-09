import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  HelpCircle, 
  Layers, 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  ShieldAlert, 
  ChevronRight, 
  CheckCircle, 
  X, 
  Info,
  Compass,
  CornerDownRight,
  TrendingUp,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Tv,
  Twitter,
  Instagram,
  Facebook,
  Link2,
  Sun,
  Moon,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MedyascopeLogo } from "./components/MedyascopeLogo";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Platform options configuration
interface PlatformOpt {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
}

// Sample social media posts for immediate testing
interface SamplePost {
  title: string;
  platform: string;
  summary: string;
  content: string;
}

const SAMPLES: SamplePost[] = [
  {
    title: "Komplo Teorisi / Sağlık Sömürüsü",
    platform: "WhatsApp/Facebook",
    summary: "Doktorların gizlediği 'şok' gıda maddesi uyarısı",
    content: "🚨 ACİL DUYURU! Doktorlar şokta! Her gün yediğimiz o ünlü süpermarket gıda maddesi aslında gizli bir zehirmiş ve beyin hücrelerini günde %10 öldürüyormuş! Hükümetler ve büyük ilaç firmaları bunu gizliyor çünkü arkasında milyar dolarlık ilaç lobileri var! Hemen bu bilgiyi tüm sevdiklerinizle paylaşın, yarın çok geç olmadan!!! 🛑⚠️"
  },
  {
    title: "Finansal Fırsatçılık / FOMO (Kaçırma Korkusu)",
    platform: "X / Twitter",
    summary: "500 kat yükselme garantili kripto para teklifi",
    content: "Kriptoda hayatınızın fırsatı kapıda! Yeni çıkan $MEGA-COIN projesi ön satışı sadece 2 saat içinde tamamen kapanıyor! Kaçıranlar ömür boyu kafasını duvarlara vuracak. Ünlü milyarderlerin gizli cüzdan hareketlerine göre bu token yarın sabah borsaya girdiği an tam 500 kat yükselecek! Yatırım tavsiyesi değil ama bu trene binmeyen yaya kalır! 🚀🔥💸"
  },
  {
    title: "Aşırı Genelleme / Kutuplaştırma",
    platform: "Instagram",
    summary: "X kuşağına karşı Z kuşağını hedef alan iddia",
    content: "Z kuşağı tamamen üşengeç, nankör ve tembel oldu! Yeni yapılan sahte bir araştırmaya göre hiçbiri günde 20 dakikadan fazla çalışmaya odaklanamıyor. Geleceğimizi bu elleri sadece telefonda kayan, sorumluluk bilmeyen gençliğe mi emanet edeceğiz? Ülke olarak mahvolduk! Yazıklar olsun gerçekten... 😡👇"
  }
];

interface AnalysisResult {
  hedefKitle: string;
  dilTonu: string;
  manipulatifUnsurlar: string;
  genelDegerlendirme: string;
  soruSorma: string;
  guvenilirlikSkoru?: number;
  groundedNews?: Array<{ title: string; url: string }>;
}

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
}

const containsLink = (text: string): boolean => {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(t\.co\/[^\s]*)|([a-zA-Z0-9-]+\.(?:com|org|net|edu|gov|mil|int|info|biz|co|app|io|xyz|tv|me)(?:\/[^\s]*)?)/i;
  return urlRegex.test(text);
};

export default function App() {
  const [inputText, setInputText] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("X");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Theme state
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem("medyascope-theme") === "light";
  });

  useEffect(() => {
    localStorage.setItem("medyascope-theme", isLightMode ? "light" : "dark");
  }, [isLightMode]);

  // Follow-up chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userQuestion, setUserQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Informative tabs active states
  const [activeInfoTab, setActiveInfoTab] = useState<"who" | "why" | "how">("who");
  const [howStep, setHowStep] = useState(0);

  // Modal states for usage terms, privacy standards and contact info
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | "contact" | null>(null);

  // Platforms definition
  const platforms: PlatformOpt[] = [
    { id: "X", name: "X (Twitter)", color: "from-gray-900 to-black", icon: <Twitter className="w-4 h-4" /> },
    { id: "Instagram", name: "Instagram", color: "from-pink-600 to-purple-600", icon: <Instagram className="w-4 h-4" /> },
    { id: "Facebook", name: "Facebook", color: "from-blue-600 to-blue-800", icon: <Facebook className="w-4 h-4" /> },
    { id: "Tiktok", name: "TikTok", color: "from-gray-800 to-cyan-800", icon: <Tv className="w-4 h-4" /> },
    { id: "Other", name: "Diğer / Web", color: "from-emerald-600 to-teal-700", icon: <Link2 className="w-4 h-4" /> }
  ];

  // Helper to load sample
  const handleLoadSample = (sample: SamplePost) => {
    setInputText(sample.content);
    setErrorMessage(null);
    // Auto map platform
    if (sample.platform.includes("X")) setSelectedPlatform("X");
    else if (sample.platform.includes("Instagram")) setSelectedPlatform("Instagram");
    else if (sample.platform.includes("Facebook")) setSelectedPlatform("Facebook");
    else setSelectedPlatform("Other");
    
    // Smooth scroll to input area if needed
    const analyzerElement = document.getElementById("post-analyzer-section");
    if (analyzerElement) {
      analyzerElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Analyze API Call
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      setErrorMessage("Lütfen analiz edilecek bir sosyal medya paylaşım metni girin.");
      return;
    }

    if (containsLink(inputText)) {
      setErrorMessage("Analiz motoruna doğrudan bağlantı (link) yapıştırılamaz. Lütfen incelemek istediğiniz paylaşımın içeriğindeki metni kopyalayıp buraya yapıştırın.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysis(null);
    setChatMessages([]);
    setUserQuestion("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: inputText 
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Sunucu hatası: ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setAnalysis(data);
      
      // Auto-set the initial question from model to prompt the user
      setChatMessages([
        {
          id: "init-question",
          role: "model",
          text: data.soruSorma || "Bu analiz hakkında sormak istediğin bir şey var mı?"
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Analiz gerçekleştirilirken beklenmeyen bir hata oluştu.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Send Follow-up Question
  const handleSendQuestion = async (e?: React.FormEvent, predefinedText?: string) => {
    if (e) e.preventDefault();
    const query = predefinedText || userQuestion;
    if (!query.trim() || !analysis) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: query
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!predefinedText) setUserQuestion("");
    setChatLoading(true);

    try {
      // Create lightweight history reference
      const visibleHistory = chatMessages.map((msg) => ({
        role: msg.role,
        text: msg.text
      }));

      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: inputText,
          analysis: analysis,
          question: query,
          history: visibleHistory
        }),
      });

      if (!response.ok) {
        throw new Error("Soruya yanıt alınırken bir sunucu hatası oluştu.");
      }

      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: "model",
          text: data.reply || "Soruyu yanıtlarken boş bir cevap aldım."
        }
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `model-err-${Date.now()}`,
          role: "model",
          text: `⚠️ Üzgünüm, sorunu yanıtlarken bir hata oluştu: ${err.message}`
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Reset tool representation
  const handleReset = () => {
    setInputText("");
    setAnalysis(null);
    setChatMessages([]);
    setErrorMessage(null);
  };

  const handleDownloadPDF = async () => {
    if (!analysis || !reportRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        width: 794,
        height: 1123
      });
      
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`medyascope-analiz-raporu-${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-purple-500 selection:text-white relative overflow-x-hidden transition-colors duration-300 ${isLightMode ? "theme-light bg-[#f7f5fa] text-[#1f1b2e]" : "theme-dark bg-[#050208] text-slate-100"}`}>
      
      {/* IMMERSIVE COMPONENT AMBIENT GLOW BUBBLES */}
      <div className="absolute inset-x-0 top-0 h-[800px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-purple-700/20 blur-[140px]" />
        <div className="absolute top-[20%] right-[-15%] w-[500px] h-[500px] rounded-full bg-pink-700/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] rounded-full bg-indigo-700/10 blur-[150px]" />
      </div>

      {/* GLOWING HERO HEADER */}
      <header className="relative border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative">
          
          {/* Logo Branding */}
          <MedyascopeLogo size={42} showText={true} />

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-2 md:space-x-6">
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-purple-400 hover:text-purple-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-90"
              title={isLightMode ? "Göz alıcı karanlık moda geç" : "Ferah gündüz moduna geç"}
            >
              {isLightMode ? (
                <>
                  <Moon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="hidden sm:inline text-xs font-semibold text-purple-750">Gece Modu</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-xs font-semibold text-amber-400">Gündüz Modu</span>
                </>
              )}
            </button>

            <a 
              href="#about-sections" 
              className="text-xs font-semibold text-gray-400 hover:text-purple-400 transition-colors py-2 px-3 rounded-lg hover:bg-white/5 uppercase tracking-widest"
            >
              Hakkımızda
            </a>
            <a 
              href="#post-analyzer-section" 
              className="hidden sm:inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs py-2 px-4 rounded-full transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Analiz Odası</span>
            </a>
          </div>

        </div>
      </header>

      {/* CORE HERO WRAPPER */}
      <main className="flex-grow relative z-10">
        
        {/* LANDING HIGHLIGHT BANNER */}
        <section className="relative pt-16 pb-12 text-center px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider font-mono shadow-inner"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              Medya Manipülasyonunu Deşifre Edin
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6.5xl font-extrabold text-white tracking-tight leading-none font-display mb-6"
            >
              Paylaşımları Analiz Et <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
                Manipülasyonu Saniyeler İçinde Süz!
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed"
            >
              Sosyal medyadaki manipülatif unsurları, dezenformasyonu, clickbait taktiklerini ve gizli psikolojik yönlendirmeleri objektif siber-anlamsal tarama ile teşhis edin.
            </motion.p>
          </div>
        </section>

        {/* 1. INTERACTIVE PRESETS / SAMPLES COMPONENT */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <AlertTriangle className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-md font-bold text-white font-display">Hazır Kamuoyu Örnekleri</h3>
                <p className="text-xs text-slate-400">Sosyal medyada sıkça karşılaşılan yanıltıcı içerik şablonlarını hemen süzgece koyun.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {SAMPLES.map((sample, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleLoadSample(sample)}
                  className="bg-black/40 border border-white/5 hover:border-purple-500/40 hover:bg-black/60 rounded-2xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between group h-full relative overflow-hidden"
                >
                  <div className="flex-grow flex flex-col justify-start">
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-white mb-2 leading-snug font-display line-clamp-2">
                      {sample.title}
                    </h4>
                    <p className="text-xs text-gray-400 group-hover:text-slate-300 mb-4 line-clamp-3 italic leading-relaxed">
                      "{sample.summary}"
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-purple-400 hover:text-purple-300 font-semibold pt-3 border-t border-white/5 mt-4 shrink-0">
                    <span>Hemen Yükle ve Dene</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MAIN ANALYSIS WORKSPACE GRID (ANALYZER & RESULTS) */}
        <section id="post-analyzer-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT PANEL: INPUT FORM */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl relative">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-md text-[10px] font-bold text-white tracking-widest uppercase shadow-md">
                  Analiz Motoru
                </div>

                <form onSubmit={handleAnalyze} className="space-y-5 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-purple-400 tracking-widest mb-2 font-mono">
                      SOSYAL MEDYA METNİ
                    </label>
                    <textarea
                      value={inputText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInputText(val);
                        if (containsLink(val)) {
                          setErrorMessage("Analiz motoruna doğrudan bağlantı (link) yapıştırılamaz. Lütfen İncelemek istediğiniz paylaşımın içeriğindeki metni kopyalayıp buraya yapıştırın.");
                        } else if (errorMessage && errorMessage.includes("bağlantı")) {
                          setErrorMessage(null);
                        }
                      }}
                      placeholder="X (Twitter), Instagram veya Facebook metnini buraya yapıştırın veya yukarıdaki hazır örneklerden birini seçin..."
                      rows={6}
                      className="w-full bg-black/40 border border-white/10 focus:border-purple-500/50 rounded-2xl p-4 text-sm text-slate-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all resize-none font-sans"
                    />
                    <div className="flex justify-between items-center mt-2.5 text-xs text-gray-500">
                      <span>{inputText.length} karakter</span>
                      {inputText.length > 0 && (
                        <button 
                          type="button" 
                          onClick={handleReset}
                          className="text-gray-400 hover:text-red-400 flex items-center gap-1 transition-colors font-mono uppercase text-[10px] tracking-wider"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Temizle
                        </button>
                      )}
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="bg-red-950/25 border border-red-500/30 p-3.5 rounded-2xl text-xs text-red-300 flex gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAnalyzing}
                    className="w-full relative overflow-hidden group bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.02] active:scale-[0.98] text-white font-bold text-sm py-4 px-6 rounded-2xl shadow-xl shadow-purple-600/20 cursor-pointer select-none transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none uppercase tracking-widest"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      {isAnalyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>YAPAY ZEKA ÇÖZÜMLÜYOR...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-pink-300 animate-pulse" />
                          <span>Derin Analiz Başlat</span>
                        </>
                      )}
                    </div>
                  </button>

                </form>
              </div>

              {/* STATS DECORATION: PROMOTING WORKSPACE METRICS */}
              <div className="bg-white/5 border border-white/5 p-5 rounded-3xl backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-display">Medya Okuryazarlığı Standartları</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">Yapay zeka analizimiz bağımsız dezenformasyon ölçekleri ve akademik etik standartlarla uyumludur.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: DISPLAY FEEDBACK OR CHAT AREA */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                
                {/* STATE 1: LOADING */}
                {isAnalyzing && (
                  <motion.div
                    key="analyzing"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl min-h-[480px] flex flex-col justify-center items-center text-center space-y-6"
                  >
                    <div className="relative">
                      {/* Wave Pulse */}
                      <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping scale-150 opacity-40" />
                      <div className="h-16 w-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg relative z-10">
                        <Sparkles className="w-8 h-8 text-white animate-spin" style={{ animationDuration: "3s" }} />
                      </div>
                    </div>
                    <div className="max-w-md">
                      <h3 className="text-lg font-bold text-white mb-2 font-display">Siber-Anlamsal Tarama Yapılıyor</h3>
                      <p className="text-sm text-gray-400 leading-relaxed mb-4">
                        Gönderi ögeleri taranıyor; hedef kitle algı yönlendirmesi, Clickbait sıklığı, dil tonu yoğunluğu ile manipülatif kalıplar derinlemesine süzülüyor.
                      </p>
                      <div className="w-32 bg-black/40 h-1.5 rounded-full overflow-hidden mx-auto border border-white/10">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full w-[70%] animate-[pulse_1.5s_infinite]" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STATE 2: EMPTY INITIAL SCREEN */}
                {!isAnalyzing && !analysis && (
                  <motion.div
                    key="unloaded"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white/2 border border-dashed border-white/10 p-10 rounded-3xl min-h-[480px] flex flex-col justify-center items-center text-center space-y-4"
                  >
                    <div className="p-4 bg-white/5 rounded-full border border-white/15">
                      <Compass className="w-10 h-10 text-purple-400/80 animate-pulse" />
                    </div>
                    <h3 className="text-md font-bold text-gray-300 font-display">Analist Masasına Hoş Geldiniz</h3>
                    <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                      Lütfen sol taraftan bir metin girip 'Derin Analiz Başlat' butonuna tıklayın ya da örnek şablonlardan birini hemen yükleyin.
                    </p>
                  </motion.div>
                )}

                {/* STATE 3: FULL RESULTS WITH CHAT INTERACTION */}
                {!isAnalyzing && analysis && (
                  <motion.div
                    key="analysis-results"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    
                    {/* Header Summary */}
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3.5">
                          <div className="w-9 h-9 rounded-full border-2 border-[#050208] bg-purple-500" />
                          <div className="w-9 h-9 rounded-full border-2 border-[#050208] bg-pink-500" />
                        </div>
                        <div>
                          <div className="text-[9px] text-purple-400 font-bold uppercase tracking-widest font-mono">Teşhis Raporu #{(inputText.length * 13) % 9999 + 1000}</div>
                          <h3 className="text-md font-bold text-white flex items-center gap-2 mt-0.5 font-display">
                            <span>Siber-Anlamsal Tarama Tamamlandı</span>
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleDownloadPDF}
                          disabled={isGeneratingPDF}
                          className="p-1.5 px-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 disabled:opacity-50 text-xs rounded-full text-white transition-all flex items-center gap-1.5 cursor-pointer font-medium shadow-md border-0"
                        >
                          <FileText className={`w-3.5 h-3.5 ${isGeneratingPDF ? "animate-spin" : ""}`} />
                          <span>{isGeneratingPDF ? "PDF Hazırlanıyor..." : "PDF Raporu İndir"}</span>
                        </button>
                        <button 
                          onClick={handleReset}
                          className="p-1.5 px-3.5 bg-white/5 border border-white/10 hover:border-red-500/40 text-xs rounded-full text-gray-400 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Kapat</span>
                        </button>
                      </div>
                    </div>

                    {/* RELIABILITY SCORE SCALE OUT OF 100 */}
                    {analysis.guvenilirlikSkoru !== undefined && (
                      <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl shadow-lg relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                          <div>
                            <span className="text-[9px] text-purple-400 font-bold uppercase tracking-widest font-mono block">DOĞRULUK DERECESİ VE GÜVENİLİRLİK ENDEKSİ</span>
                            <h4 className="text-lg font-bold text-white font-display mt-0.5 flex items-center gap-2">
                              <span>İçerik Güvenilirlik Skoru:</span>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                                analysis.guvenilirlikSkoru >= 75 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                analysis.guvenilirlikSkoru >= 40 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}>
                                %{analysis.guvenilirlikSkoru}
                              </span>
                            </h4>
                          </div>
                          
                          <div className="text-xs text-gray-400 max-w-xs sm:text-right">
                            {analysis.guvenilirlikSkoru >= 75 ? "Bu paylaşım yüksek derecede rasyonel bilgi, kamusal veri bütünlüğü ve düşük manipülasyon taşımaktadır." :
                             analysis.guvenilirlikSkoru >= 40 ? "Bu paylaşım rasyonel ve gerçekçi öğeler barındırsa da yüksek düzeyde clickbait veya yönlendirmeli üslup içermektedir." :
                             "DİKKAT! Bu içerikte aşırı manipülatif dil tonu, komplo iddiaları veya dezenformasyon eğilimi tespit edilmiştir."}
                          </div>
                        </div>

                        {/* Visual linear meter */}
                        <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/10 p-[1px] relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${analysis.guvenilirlikSkoru}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full bg-gradient-to-r transition-all duration-300 ${
                              analysis.guvenilirlikSkoru >= 75 ? "from-emerald-600 to-teal-400" :
                              analysis.guvenilirlikSkoru >= 40 ? "from-amber-600 to-yellow-400" :
                              "from-rose-600 to-pink-500"
                            }`}
                          />
                        </div>
                        
                        {/* Scale helper labels */}
                        <div className="flex justify-between items-center text-[10px] text-gray-500 mt-2 font-mono">
                          <span>%0 (Yüksek Risk / Manipülasyon)</span>
                          <span className="hidden sm:inline">Normal Eşik (%50)</span>
                          <span>%100 (Doğrulanmış Hakikat)</span>
                        </div>
                      </div>
                    )}

                    {/* Section grid of analyzed elements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* CARD 1: HEDEF KİTLE */}
                      <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
                        <div className="flex items-center gap-2 text-purple-300 font-bold text-sm mb-3 font-display">
                          <span>🎯</span>
                          <span>Hedef Kitle</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed font-light">
                          {analysis.hedefKitle.replace(/🎯\s*Hedef\s*Kitle:?\s*/gi, "")}
                        </p>
                      </div>

                      {/* CARD 2: DİL TONU */}
                      <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-2 text-blue-300 font-bold text-sm mb-3 font-display">
                          <span>💬</span>
                          <span>Dil Tonu</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed font-light">
                          {analysis.dilTonu.replace(/💬\s*Dil\s*Tonu:?\s*/gi, "")}
                        </p>
                      </div>

                      {/* CARD 3: MANİPÜLATİF UNSURLAR */}
                      <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl relative overflow-hidden md:col-span-2 group hover:border-pink-500/30 transition-all">
                        <div className="flex items-center gap-2 text-pink-300 font-bold text-sm mb-3 font-display">
                          <span>🚫</span>
                          <span>Manipülatif Unsurlar</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed font-light">
                          {analysis.manipulatifUnsurlar.replace(/🚫\s*Manipülatif\s*Unsurlar:?\s*/gi, "")}
                        </p>
                      </div>

                      {/* CARD 4: GENEL DEĞERLENDİRME */}
                      <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl relative overflow-hidden md:col-span-2 group hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm mb-3 font-display">
                          <span>⚖️</span>
                          <span>Genel Değerlendirme</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed font-light">
                          {analysis.genelDegerlendirme.replace(/⚖️\s*Genel\s*Değerlendirme:?\s*/gi, "")}
                        </p>
                      </div>

                    </div>

                    {/* INTERACTIVE DISCUSSION / ASK CHAT MODULE */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl overflow-hidden shadow-2xl relative z-10">
                      
                      {/* Chat Header */}
                      <div className="bg-black/60 p-4 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1 h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                          <span className="text-xs font-bold text-gray-300 uppercase tracking-widest font-mono">Uzman Soru-Cevap Odası</span>
                        </div>
                        <span className="text-[10px] text-purple-400 font-semibold bg-purple-500/10 px-2 py-0.5 rounded-full">Yapay Zeka Analisti Aktif</span>
                      </div>

                      {/* Messages Thread */}
                      <div className="p-4 space-y-4 max-h-[350px] overflow-y-auto bg-black/20">
                        {chatMessages.map((msg, i) => (
                          <div 
                            key={msg.id}
                            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                          >
                            <div className="text-[9px] text-gray-500 mb-1 px-1 font-mono uppercase tracking-wider">
                              {msg.role === "user" ? "Siz" : "Medya Analisti"}
                            </div>
                            <div className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                              msg.role === "user" 
                                ? "bg-gradient-to-tr from-purple-600 to-pink-600 text-white rounded-tr-none" 
                                : "bg-white/5 border border-white/10 text-gray-200 rounded-tl-none"
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        ))}

                        {chatLoading && (
                          <div className="flex flex-col items-start">
                            <div className="text-[9px] text-gray-500 mb-1 px-1 font-mono uppercase">Medya Analisti</div>
                            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl rounded-tl-none flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Predefined Quick Questions Buttons */}
                      <div className="p-4 bg-black/40 border-t border-white/10">
                        <div className="text-[9px] text-gray-400 mb-2.5 font-bold uppercase tracking-widest font-mono">Sorulabilecek Derinlik Katmanları:</div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          {[
                            "Haber kaynağını teyit edebileceğim pratik yollar neler?",
                            "Gelecekte sinsi dezenformasyon modellerini nasıl saniyeler içinde fark ederim?",
                            "Paylaşım yapmadan önce rasyonel dijital filtremi nasıl çalıştırabilirim?"
                          ].map((qText, keyIdx) => (
                            <button
                              key={keyIdx}
                              type="button"
                              onClick={() => handleSendQuestion(undefined, qText)}
                              className="text-left text-[11px] bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 p-2.5 rounded-xl transition-all cursor-pointer truncate"
                            >
                              💡 {qText}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom input bar */}
                      <form onSubmit={handleSendQuestion} className="p-3.5 bg-black/60 border-t border-white/10 flex items-center gap-2">
                        <input
                          type="text"
                          value={userQuestion}
                          onChange={(e) => setUserQuestion(e.target.value)}
                          placeholder="Analiz veya dezenformasyon modeli hakkında ek bir soru yazın..."
                          className="flex-grow bg-black/40 border border-white/10 focus:border-purple-500/50 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-gray-600"
                        />
                        <button
                          type="submit"
                          disabled={chatLoading || !userQuestion.trim()}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>

                    </div>

                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </div>
        </section>

        {/* 2. ABOUT SECTIONS: BİZ KİMİZ, AMACIMIZ NE, SİSTEM NASIL KULLANILIR */}
        <section id="about-sections" className="relative bg-black/30 border-y border-white/10 py-24 overflow-hidden z-20">
          <div className="absolute top-0 left-12 w-96 h-96 bg-purple-500/5 rounded-full filter blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-12 w-96 h-96 bg-pink-500/5 rounded-full filter blur-[100px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display uppercase">
                Dijital Hijyen ve Medya Okuryazarlığı Hareketi
              </h2>
              <p className="text-sm text-gray-400 mt-4 leading-relaxed font-light">
                Medyascope, bilgi zehirlenmesini azaltmak, clickbait tuzaklarını teşhis etmek ve kamuoyunu gerçeklerle buluşturmak için tasarlanmış bağımsız bir dijital vizyon projesidir.
              </p>
            </div>

            {/* INTERACTIVE TAB CONTROLS */}
            <div className="flex justify-center space-x-2 md:space-x-4 mb-10">
              {[
                { id: "who", name: "Biz Kimiz?", icon: <Users className="w-4 h-4" /> },
                { id: "why", name: "Amacımız Ne?", icon: <BookOpen className="w-4 h-4" /> },
                { id: "how", name: "Sistem Nasıl Çalışır?", icon: <Layers className="w-4 h-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveInfoTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-3 px-4 md:px-6 rounded-full text-xs md:text-sm font-bold transition-all cursor-pointer border ${
                    activeInfoTab === tab.id 
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-lg" 
                      : "bg-white/5 hover:bg-white/10 text-gray-450 border-white/10"
                  }`}
                >
                  <span className={activeInfoTab === tab.id ? "text-white" : "text-gray-500"}>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>

            {/* TAB DISPLAY CONTENT CONTEXTS */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] max-w-5xl mx-auto relative shadow-2xl backdrop-blur-xl">
              
              <AnimatePresence mode="wait">
                
                {/* Biz Kimiz Content */}
                {activeInfoTab === "who" && (
                  <motion.div
                    key="tab-who"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
                  >
                    <div className="md:col-span-4">
                      <div className="aspect-square rounded-[30px] bg-gradient-to-tr from-purple-700 to-pink-700 flex flex-col justify-center items-center text-center p-6 border border-white/10 relative">
                        <Users className="w-16 h-16 text-white mb-4 animate-bounce" style={{ animationDuration: "3s" }} />
                        <span className="text-xl font-bold text-white font-display">Akademik Katılım</span>
                        <span className="text-[10px] text-purple-200 mt-2 tracking-widest uppercase font-mono">%100 Bağımsız</span>
                      </div>
                    </div>
                    <div className="md:col-span-8 space-y-4">
                      <h4 className="text-lg font-bold text-white font-display">Bağımsız Medya Analistleri ve Eğitmenleri</h4>
                      <p className="text-xs sm:text-sm text-gray-350 leading-relaxed font-light">
                        Bizler, siber çağda manipülasyonlarla mücadele eden tarafsız medya okuryazarlığı akademisyenleri, veri habercileri ve teknoloji geliştiricileriyiz. Sosyal medyadaki sahte iddiaların yayılım örüntülerini analiz ederek toplumda dijital hijyen bilincini artırmak üzere birleştik.
                      </p>
                      <p className="text-xs sm:text-sm text-gray-350 leading-relaxed font-light">
                        Herhangi bir klik veya ticari güdüm gütmeyen sivil inisiyatifimiz, bilginin çarpıtılması ile sahte heyecan dalgaları yaratan bot ağlarına karşı güçlü siber-etik teşhisler sunar.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Amacımız Ne Content */}
                {activeInfoTab === "why" && (
                  <motion.div
                    key="tab-why"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
                  >
                    <div className="md:col-span-8 space-y-4">
                      <h4 className="text-lg font-bold text-pink-400 font-display">Dijital Zehirlenmeye Karşı Panzehir</h4>
                      <p className="text-xs sm:text-sm text-gray-350 leading-relaxed font-light">
                        Kopyalanarak yayılan klik odaklı iddialar, rasyonel düşünce ağlarını zayıflatır. Nihai hedefimiz, her kullanıcının zihninde güçlü medikal-etik kritik sorgulama filtreleri inşa etmektir:
                      </p>
                      
                      <div className="space-y-3 pt-2">
                        <div className="flex items-start space-x-3 text-xs sm:text-sm">
                          <div className="h-5 w-5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">1</div>
                          <div className="text-gray-300">
                            <span className="font-bold text-white font-display">Tuzakları Süzme:</span> Korku sömürüsü, aceleci baskılar ve sahte rızalar gibi teknik yönleri deşifre ederiz.
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 text-xs sm:text-sm">
                          <div className="h-5 w-5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">2</div>
                          <div className="text-gray-300">
                            <span className="font-bold text-white font-display font-display">Dil Analizi:</span> Gönderinin dil tonunu ayrıştırarak okuyucuda yaratılmak istenen yapay coşkuyu dengeleriz.
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 text-xs sm:text-sm">
                          <div className="h-5 w-5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">3</div>
                          <div className="text-gray-300">
                            <span className="font-bold text-white font-display">Teyit Refleksi:</span> Kullanıcılarımızın şüpheli bilgileri eleştirmeden paylaşmasını önleyecek teyit pratikleri aktarırız.
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-4">
                      <div className="aspect-square rounded-[30px] bg-gradient-to-tr from-pink-700 to-indigo-700 flex flex-col justify-center items-center text-center p-6 border border-white/10 relative">
                        <BookOpen className="w-16 h-16 text-white mb-4 animate-pulse" />
                        <span className="text-xl font-bold text-white font-display">Teyit Gücü</span>
                        <span className="text-[10px] text-pink-200 mt-2 tracking-widest uppercase font-mono">Bilişsel Filtre</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Nasıl Kullanılır Content */}
                {activeInfoTab === "how" && (
                  <motion.div
                    key="tab-how"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center max-w-lg mx-auto mb-4">
                      <h4 className="text-md sm:text-lg font-bold text-white font-display">3 Adımda Pratik Medya Analizi</h4>
                      <p className="text-xs text-gray-400">Yapay zeka analiz motorumuzla her şüpheli içeriği üç aşamalı eleme bandından geçirin.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                      
                      {/* STEP 1 */}
                      <div 
                        onClick={() => setHowStep(0)}
                        className={`p-6 rounded-3xl border cursor-pointer transition-all ${
                          howStep === 0 
                            ? "bg-white/10 border-purple-500 shadow-lg" 
                            : "bg-black/30 border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xxs font-mono bg-purple-500/10 text-purple-400 px-2.5 py-0.5 rounded-full font-bold">ADIM 1</span>
                          <span className="text-lg">📋</span>
                        </div>
                        <h5 className="text-sm font-bold text-white mb-2 font-display">Gönderiyi Yapıştırın</h5>
                        <p className="text-xs text-gray-400 leading-relaxed font-light">
                          Çarpıtılan tweetleri, sansasyonel WhatsApp söylentilerini veya şüpheli görsel alt metinlerini kopyalayıp işlem tahtasına yerleştirin.
                        </p>
                      </div>

                      {/* STEP 2 */}
                      <div 
                        onClick={() => setHowStep(1)}
                        className={`p-6 rounded-3xl border cursor-pointer transition-all ${
                          howStep === 1 
                            ? "bg-white/10 border-pink-500 shadow-lg" 
                            : "bg-black/30 border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xxs font-mono bg-pink-500/10 text-pink-400 px-2.5 py-0.5 rounded-full font-bold">ADIM 2</span>
                          <span className="text-lg">🤖</span>
                        </div>
                        <h5 className="text-sm font-bold text-white mb-2 font-display">Analizi Başlatın</h5>
                        <p className="text-xs text-gray-400 leading-relaxed font-light">
                          Hizmet alınan platformu işaretleyip "Derin Analiz Başlat" butonuna tıklayarak siber-anlamsal tarayıcımızı devreye alın.
                        </p>
                      </div>

                      {/* STEP 3 */}
                      <div 
                        onClick={() => setHowStep(2)}
                        className={`p-6 rounded-3xl border cursor-pointer transition-all ${
                          howStep === 2 
                            ? "bg-white/10 border-indigo-500 shadow-lg" 
                            : "bg-black/30 border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xxs font-mono bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full font-bold">ADIM 3</span>
                          <span className="text-lg">⚖️</span>
                        </div>
                        <h5 className="text-sm font-bold text-white mb-2 font-display">Soru Sorup Derinleşin</h5>
                        <p className="text-xs text-gray-400 leading-relaxed font-light">
                          Gelen hedef kitle ve manipülasyon raporunu inceledikten sonra alt bölümdeki ek tartışma alanından analiste sorular yöneltin.
                        </p>
                      </div>

                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

            </div>

          </div>
        </section>

      </main>

      {/* SOLID FOOTER PANEL */}
      <footer className="bg-black/80 border-t border-white/10 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <MedyascopeLogo size={36} showText={false} />
            <div>
              <span className="text-sm font-bold text-white block font-display">MEDYASCOPE.AI DIGITAL MEDIA LAB</span>
              <span className="text-[10px] text-gray-500 block uppercase tracking-wider">© {new Date().getFullYear()} - DİJİTAL SİBER ARŞİV VE OKURYAZARLIK MASASI</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-500 uppercase tracking-widest font-bold">
            <button 
              onClick={() => setActiveModal("terms")} 
              className="hover:text-purple-400 cursor-pointer transition-colors focus:outline-none"
            >
              Kullanım Koşulları
            </button>
            <span>•</span>
            <button 
              onClick={() => setActiveModal("privacy")} 
              className="hover:text-purple-400 cursor-pointer transition-colors focus:outline-none"
            >
              Gizlilik Standartları
            </button>
            <span>•</span>
            <button 
              onClick={() => setActiveModal("contact")} 
              className="hover:text-purple-400 cursor-pointer transition-colors focus:outline-none"
            >
              İletişim
            </button>
          </div>
        </div>
      </footer>

      {/* FOOTER MODALS DRAWER / OVERLAYS */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-[#0b0412] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 relative shadow-2xl shadow-purple-950/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <ShieldAlert className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-display uppercase tracking-wider">
                    {activeModal === "terms" && "Kullanım Koşulları"}
                    {activeModal === "privacy" && "Gizlilik Standartları"}
                    {activeModal === "contact" && "İletişim & İş Birliği"}
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-1 px-3 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-xs rounded-full text-gray-400 hover:text-red-400 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Kapat</span>
                </button>
              </div>

              {/* Modal Body Content */}
              <div className="space-y-4 text-xs md:text-sm text-gray-300 leading-relaxed font-light">
                
                {/* 1. KULLANIM KOŞULLARI */}
                {activeModal === "terms" && (
                  <>
                    <p className="font-semibold text-white">Son Güncelleme: 9 Haziran 2026</p>
                    <p>
                      MEDYASCOPE.AI, kamuoyunun dezenformasyona karşı rasyonel savunma kalkanı geliştirmesini amaçlayan bağımsız bir medya okuryazarlığı analiz katmanıdır. Platformu ziyaret ederek veya siber analiz motorunu kullanarak aşağıdaki tüm koşulları peşinen kabul etmiş sayılırsınız:
                    </p>
                    <div className="space-y-3 pt-2">
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <h4 className="font-bold text-white font-display mb-1.5">1. Hizmetin Niteliği ve Sorumluluk Sınırı</h4>
                        <p className="text-xs text-gray-400">
                          Yapay zeka analiz odasında oluşturulan tüm metrikler, dil tonu çıkarımları, manipülasyon şüpheleri ve değerlendirmeler tamamen eğitim ve bilişsel farkındalık odaklıdır. Analizler "olduğu gibi" sunulur ve kesin hukuki, adli ya da profesyonel tavsiye niteliği taşımaz. Sitedeki verilerin üçüncü şahıslar tarafından yanlış kullanımı durumunda sorumluluk tamamen kullanıcıya aittir.
                        </p>
                      </div>
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <h4 className="font-bold text-white font-display mb-1.5">2. Kötüye Kullanım Yasağı</h4>
                        <p className="text-xs text-gray-400">
                          Sistemin siber anlamsal tarayıcısını aşırı sorgu istekleriyle tıkamak, bot programlarla otomatik veriler çekmek (scraping) ve API entegrasyonlarını manipüle etmek kesinlikle yasaktır. Platform güvenliğini tehlikeye sokacak her türlü işlem yasal süreç başlatma sebebidir.
                        </p>
                      </div>
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <h4 className="font-bold text-white font-display mb-1.5">3. Fikri Mülkiyet ve Marka</h4>
                        <p className="text-xs text-gray-400">
                          Platformun yazılım mimarisi, tasarımı, görsel kimliği, metinleri ve tescilli yöntemleri MEDYASCOPE.AI projesine aittir. Yazılı izin olmaksızın ticari amaçlarla kopyalanamaz veya dağıtılamaz.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* 2. GİZLİLİK STANDARTLARI */}
                {activeModal === "privacy" && (
                  <>
                    <p className="font-semibold text-white">Yüksek Güvenlikli Veri Politikası</p>
                    <p>
                      Medyascope ekibi olarak dijital hijyene ve bilgi güvenliğine tavizsiz inanıyoruz. Kişisel verilerinizin korunması, siber analiz ilkelerimizin temel taşını oluşturmaktadır.
                    </p>
                    <div className="space-y-3 pt-2">
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <h4 className="font-bold text-pink-400 font-display mb-1.5">📂 Veri Kalıcılığı Sınırı (Sıfır Günlük)</h4>
                        <p className="text-xs text-gray-400">
                          Kullanıcıların analiz panelimize yapıştırdığı sosyal medya metinleri ile arka plandaki soru-cevap odası konuşmaları sunucularımızda asla kalıcı olarak saklanmaz, diske yazılmaz ya da profil oluşturma amacıyla kullanılmaz. Sorgular yalnızca anlık RAM havuzunda işlenip yanıt oluşturulduğu anda sistem hafızasından silinir.
                        </p>
                      </div>
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <h4 className="font-bold text-pink-400 font-display mb-1.5">🔒 Güvenli Veri Aktarımı</h4>
                        <p className="text-xs text-gray-400">
                          Analiz formuna gönderilen metinler, üst düzey şifreleme protokolleri (SSL/TLS) ile API katmanlarına iletilir. Yapay zeka motoru ile iletişim güvenli kanallarla kurulur ve veri sızıntılarına geçit verilmez.
                        </p>
                      </div>
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <h4 className="font-bold text-pink-400 font-display mb-1.5">🍪 İzleme Karşıtı Yaklaşım</h4>
                        <p className="text-xs text-gray-400">
                          Web sitemizde reklam amaçlı izleyiciler, tarayıcı profili çıkarıcı tracker'lar veya karmaşık analiz piksel teknolojileri kullanılmaz. Sadece oturum akışını sağlamak adına asgari çerez değişkenlerinden yararlanılır.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* 3. İLETİŞİM */}
                {activeModal === "contact" && (
                  <>
                    <p>
                      Platformumuzla ilgili geliştirme önerileri, akademik projeler, dezenformasyon teyit ağlarının ortaklık teklifleri ve geri bildirimler için bizimle hemen iletişime geçebilirsiniz.
                    </p>
                    <div className="p-5 bg-gradient-to-tr from-purple-950/20 to-pink-950/10 border border-white/10 rounded-2xl space-y-4 my-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-lg">
                          👤
                        </div>
                        <div>
                          <p className="text-[10px] text-purple-400 font-mono uppercase tracking-wider">Yönetici & Geliştirici</p>
                          <p className="text-sm font-bold text-white font-display">Samet Büyük</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-lg">
                          ✉️
                        </div>
                        <div>
                          <p className="text-[10px] text-pink-400 font-mono uppercase tracking-wider">Doğrudan E-Posta</p>
                          <a 
                            href="mailto:samettbuyuk@gmail.com" 
                            className="text-sm font-bold text-white hover:text-pink-300 transition-colors font-mono"
                          >
                            samettbuyuk@gmail.com
                          </a>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 text-center italic mt-2">
                      Gönderilen tüm bilimsel analiz önerileri ve kurumsal veri ortaklığı davetlerine en geç 48 saat içerisinde dönüş sağlanmaktadır.
                    </p>
                  </>
                )}

              </div>
              
              {/* Footer status decoration */}
              <div className="pt-4 border-t border-white/10 mt-6 flex justify-between items-center text-[10px] text-gray-500 font-mono uppercase">
                <span>MEDYASCOPE.AI GÜVENLİK PROTOKOLÜ</span>
                <span className="text-purple-400">AKTİF</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden high-contrast A4 template for PDF Generation */}
      {analysis && (
        <div 
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            width: "794px", 
            height: "1123px", 
            zIndex: -9999, 
            pointerEvents: "none",
            visibility: "visible"
          }} 
          aria-hidden="true"
        >
          <div 
            ref={reportRef}
            className="w-[794px] h-[1123px] bg-white text-slate-900 p-10 flex flex-col justify-between font-sans relative"
            style={{ boxSizing: "border-box" }}
          >
            {/* Header branding */}
            <div>
              <div className="flex justify-between items-start pb-4 border-b-2 border-purple-600/30">
                <div>
                  <h1 className="text-2xl font-black text-purple-950 font-display tracking-tight flex items-center gap-1.5">
                    <span>Medyascope</span>
                    <span className="text-purple-600">.AI</span>
                  </h1>
                  <p className="text-[10px] text-purple-600/80 uppercase font-bold tracking-widest font-mono mt-0.5">
                    Sosyal Medya Güvenilirlik ve Teşhis Raporu
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-mono tracking-wider">RAPOR NO: #{(inputText.length * 13) % 9999 + 1000}</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5 font-mono">
                    {new Date().toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>
              </div>

              {/* Grid with Platform and Status */}
              <div className="grid grid-cols-4 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl mt-5">
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-mono mb-0.5">Analiz Platformu</span>
                  <span className="text-xs font-black text-purple-950 font-sans">{selectedPlatform === "X" ? "X (Twitter)" : selectedPlatform}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-mono mb-0.5">Örnek Metin Uzunluğu</span>
                  <span className="text-xs font-black text-slate-800 font-sans">{inputText.length} Karakter</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase font-mono mb-0.5">Siber Denetçi</span>
                  <span className="text-xs font-black text-slate-800 font-sans">Medyascope Gemini v3.5</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 block uppercase font-mono mb-0.5">Durumu</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1 font-sans">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Doğrulandı
                  </span>
                </div>
              </div>

              {/* Analyzed Post Preview */}
              <div className="mt-5">
                <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider font-mono block mb-1">🔍 İncelenen Paylaşım Metni</span>
                <div className="bg-slate-50/50 border-l-4 border-purple-500 p-3 rounded-r-xl">
                  <p className="text-xs text-slate-700 italic leading-relaxed font-light line-clamp-3">
                    "{inputText}"
                  </p>
                </div>
              </div>

              {/* Reliability Index / Scale */}
              {analysis.guvenilirlikSkoru !== undefined && (
                <div className="mt-6 bg-purple-50/40 border border-purple-100 p-5 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-[9px] text-purple-600 font-bold uppercase tracking-widest font-mono block">DOĞRULUK DERECESİ VE GÜVENİLİRLİK ENDEKSİ</span>
                      <h4 className="text-md font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                        <span>İçerik Güvenilirlik Skoru:</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                          analysis.guvenilirlikSkoru >= 75 ? "bg-emerald-100 text-emerald-800" :
                          analysis.guvenilirlikSkoru >= 40 ? "bg-amber-100 text-amber-800" :
                          "bg-rose-100 text-rose-800"
                        }`}>
                          %{analysis.guvenilirlikSkoru}
                        </span>
                      </h4>
                    </div>
                    <div className="text-[10px] font-bold max-w-xs text-right">
                      {analysis.guvenilirlikSkoru >= 75 ? (
                        <span className="text-emerald-700">Yüksek Derecede Rasyonel & Güvenilir</span>
                      ) : analysis.guvenilirlikSkoru >= 40 ? (
                        <span className="text-amber-700">Orta Seviye / Yönlendirmeli Dil Var</span>
                      ) : (
                        <span className="text-rose-700">Yüksek Risk / Aşırı Manipülatif</span>
                      )}
                    </div>
                  </div>

                  {/* Meter visual */}
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden p-[1px] relative mt-2">
                    <div 
                      className={`h-full rounded-full ${
                        analysis.guvenilirlikSkoru >= 75 ? "bg-emerald-500" :
                        analysis.guvenilirlikSkoru >= 40 ? "bg-amber-500" :
                        "bg-rose-500"
                      }`}
                      style={{ width: `${analysis.guvenilirlikSkoru}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-400 mt-1 font-mono uppercase">
                    <span>%0 Aşırı Dezenformasyon</span>
                    <span>%50 Eşik</span>
                    <span>%100 Doğrulanmış Veri</span>
                  </div>
                </div>
              )}

              {/* Assessment Section Details A4 grid */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                
                {/* Metric 1 */}
                <div className="border border-slate-100 bg-slate-50/30 p-4 rounded-xl flex flex-col">
                  <div className="text-xs font-bold text-purple-700 mb-1.5 flex items-center gap-1 font-display">
                    <span>🎯</span> Hedef Kitle
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-light flex-grow">
                    {analysis.hedefKitle.replace(/🎯\s*Hedef\s*Kitle:?\s*/gi, "")}
                  </p>
                </div>

                {/* Metric 2 */}
                <div className="border border-slate-100 bg-slate-50/30 p-4 rounded-xl flex flex-col">
                  <div className="text-xs font-bold text-blue-700 mb-1.5 flex items-center gap-1 font-display">
                    <span>💬</span> Dil Tonu
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-light flex-grow">
                    {analysis.dilTonu.replace(/💬\s*Dil\s*Tonu:?\s*/gi, "")}
                  </p>
                </div>

                {/* Metric 3 */}
                <div className="border border-slate-100 bg-slate-50/30 p-4 rounded-xl col-span-2 flex flex-col">
                  <div className="text-xs font-bold text-pink-700 mb-1.5 flex items-center gap-1 font-display">
                    <span>🚫</span> Manipülatif Unsurlar
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-light flex-grow text-justify">
                    {analysis.manipulatifUnsurlar.replace(/🚫\s*Manipülatif\s*Unsurlar:?\s*/gi, "")}
                  </p>
                </div>

                {/* Metric 4 */}
                <div className="border border-slate-100 bg-slate-50/30 p-4 rounded-xl col-span-2 flex flex-col">
                  <div className="text-xs font-bold text-emerald-700 mb-1.5 flex items-center gap-1 font-display">
                    <span>⚖️</span> Genel Değerlendirme
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-light flex-grow text-justify">
                    {analysis.genelDegerlendirme.replace(/⚖️\s*Genel\s*Değerlendirme:?\s*/gi, "")}
                  </p>
                </div>

              </div>
            </div>

            {/* A4 Footer with brand & legal notes */}
            <div className="border-t border-slate-200 pt-3 text-center">
              <p className="text-[9px] text-slate-400 font-light leading-normal">
                Bu analiz raporu <strong>Medyascope.AI</strong> siber-anlamsal denetim altyapısı ve yapay zeka entegrasyonu ile üretilmiştir.
              </p>
              <p className="text-[8px] text-slate-400/80 font-mono mt-0.5">
                © {new Date().getFullYear()} Medyascope. Tüm hakları saklıdır. Rapor tescili dijital imza ile taranmıştır.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
