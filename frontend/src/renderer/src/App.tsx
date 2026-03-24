import { useState, useEffect, useRef } from 'react'
import Hls from 'hls.js'
import { io } from 'socket.io-client'
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Media } from '@capacitor-community/media';

// --- 🌟 LIQUID GLASS & DARK PURPLE TEMA ---
const theme = {
  bgGradient: 'linear-gradient(135deg, #09090b 0%, #171026 100%)',
  glassBg: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBlur: '16px',
  primary: '#8b5cf6', 
  primaryHover: '#a855f7',
  danger: '#ef4444',
  textMain: '#f8fafc',
  textMuted: '#94a3b8'
};

const glassStyle = {
  backgroundColor: theme.glassBg,
  backdropFilter: `blur(${theme.glassBlur})`,
  WebkitBackdropFilter: `blur(${theme.glassBlur})`,
  border: `1px solid ${theme.glassBorder}`,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
};

// --- 🌟 SAF SVG İKON KÜTÜPHANESİ (Hatalar Giderildi) ---
const Icons = {
  Cloud: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>,
  Folder: () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>,
  File: () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Upload: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  Sync: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Refresh: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
  Back: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>,
  Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>,
  Edit: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>,
  Copy: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
  Cut: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" x2="8.12" y1="4" y2="13.88"/><line x1="14.47" x2="14.48" y1="14.48" y2="14.47"/><line x1="20" x2="8.12" y1="20" y2="10.12"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>,
  Move: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="19 9 22 12 19 15"/><polyline points="9 19 12 22 15 19"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/></svg>,
  Download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
  Zoom: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>,
  Play: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  FolderSmall: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
};

const VideoThumbnail = ({ hlsUrl }: { hlsUrl: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<string>('');
  const [thumbReady, setThumbReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    let hls: Hls;
    if (Hls.isSupported()) {
      // 🚀 HIZLANDIRILMIŞ HLS AYARLARI
      hls = new Hls({
        maxBufferLength: 10, // Sadece 10 saniyelik parçayı önbellekte tut
        maxMaxBufferLength: 20, // Önbelleği şişirme
        enableWorker: true, // İşlemleri arka plana at, UI donmasın
        lowLatencyMode: true // Düşük gecikme modu
      });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
    }
    return () => {
      if (hls) hls.destroy();
    };
  }, [hlsUrl]);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const secs = video.duration;
    if (!isNaN(secs) && secs !== Infinity) {
      const minutes = Math.floor(secs / 60);
      const seconds = Math.floor(secs % 60).toString().padStart(2, '0');
      setDuration(`${minutes}:${seconds}`);
      video.currentTime = Math.min(3, secs * 0.1);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000', overflow: 'hidden' }}>
      <video ref={videoRef} onLoadedMetadata={handleLoadedMetadata} onSeeked={() => setThumbReady(true)} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: thumbReady ? 1 : 0, transition: 'opacity 0.3s' }} />
      {!thumbReady && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '20px', height: '20px', border: `3px solid ${theme.glassBorder}`, borderTopColor: theme.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      )}
      {duration && <span style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', color: 'white', fontSize: '11px', padding: '3px 6px', borderRadius: '4px', fontWeight: '500', letterSpacing: '0.5px' }}>{duration}</span>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const SmartThumbnail = ({ isImage, isVideo, fileUrl, hlsUrl, thumbUrl }: any) => {
  const [error, setError] = useState(false);
  if (isVideo && error) return <VideoThumbnail hlsUrl={hlsUrl} />;
  return (
    <img
      src={error && isImage ? fileUrl : thumbUrl}
      onError={() => setError(true)}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
};

const CloudVideoPlayer = ({ url }: { url: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;
    if (Hls.isSupported()) {
      // 🚀 HIZLANDIRILMIŞ HLS AYARLARI (ANA OYNATICI)
      hls = new Hls({
        maxBufferLength: 15, 
        maxMaxBufferLength: 30,
        enableWorker: true,
        lowLatencyMode: true,
        startLevel: -1 // Otomatik kalite seçimi
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [url]);

  useEffect(() => {
    const handleFullscreen = () => {
      try {
        if (document.fullscreenElement) {
          if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
            (window.screen.orientation as any).lock('landscape').catch(() => {});
          }
        } else {
          if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
            window.screen.orientation.unlock();
          }
        }
      } catch (err) {}
    };

    document.addEventListener('fullscreenchange', handleFullscreen);
    return () => document.removeEventListener('fullscreenchange', handleFullscreen);
  }, []);

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      onClick={(e) => e.stopPropagation()}
      style={{ width: '100vw', height: '100vh', objectFit: 'contain', backgroundColor: 'black' }}
    />
  );
};

interface UploadItem {
  id: string; fileName: string; phase: 'uploading' | 'processing' | 'done' | 'error';
  uploadPercent: number; processPercent: number; isVideo: boolean;
}

const UploadProgressBar = ({ items, onDismiss }: { items: UploadItem[], onDismiss: (id: string) => void }) => {
  if (items.length === 0) return null;
  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 500, display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '340px', width: '100%' }}>
      {items.map(item => {
        const isDone = item.phase === 'done'; const isError = item.phase === 'error';
        const isProcessing = item.phase === 'processing'; const isUploading = item.phase === 'uploading';
        const barPercent = isUploading ? item.uploadPercent : item.processPercent;
        const barColor = isError ? theme.danger : isDone ? '#10b981' : isProcessing ? '#f59e0b' : theme.primary;
        const statusText = isError ? 'Hata Oluştu' : isDone ? 'Tamamlandı' : isProcessing ? `İşleniyor %${item.processPercent}` : `Yükleniyor %${item.uploadPercent}`;
        
        return (
          <div key={item.id} style={{ ...glassStyle, borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: theme.textMain, fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{item.fileName}</span>
              <button onClick={() => onDismiss(item.id)} style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 0 }}><Icons.Close /></button>
            </div>
            <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', width: `${barPercent}%`, backgroundColor: barColor, transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ fontSize: '12px', color: barColor, fontWeight: '500' }}>{statusText}</div>
          </div>
        );
      })}
    </div>
  );
};

const CHUNK_SIZE = 5 * 1024 * 1024;
const formatSize = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

function App() {
  const [files, setFiles] = useState<any[]>([])
  const [currentPath, setCurrentPath] = useState<string>('')
  const [activeMedia, setActiveMedia] = useState<any>(null)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [processingVideos, setProcessingVideos] = useState<any>({})
  const [contextMenu, setContextMenu] = useState<{ type: 'bg' | 'file', x: number, y: number, file?: any } | null>(null)
  const [folderModal, setFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const SECRET_PASSWORD = "[password]";

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-desc');
  
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [clipboard, setClipboard] = useState<{ action: 'copy' | 'cut', path: string, files: any[] } | null>(null);
  const isSelectionMode = selectedItems.size > 0; 
  
  const [moveModal, setMoveModal] = useState<{ show: boolean, files: any[] }>({ show: false, files: [] });
  const [moveModalPath, setMoveModalPath] = useState('');
  const [moveModalFolders, setMoveModalFolders] = useState<any[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const [draggingFile, setDraggingFile] = useState<any>(null)
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null)
  const serverUrl = 'http://zk0o4gog8k0koco8cgsckg00.164.68.113.20.sslip.io';
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncStats, setSyncStats] = useState({ total: 0, current: 0, success: 0, fail: 0 });
  const [syncLogs, setSyncLogs] = useState<{name: string, status: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [uiVisible, setUiVisible] = useState(true);
  
  const [imgScale, setImgScale] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const lastPinchDist = useRef<number>(0);
  const imgPos = useRef({ x: 0, y: 0 });
  const [imgTranslate, setImgTranslate] = useState({ x: 0, y: 0 });

  useEffect(() => {
  // Şifre falan sorma, direkt içeri al!
  setIsAuthenticated(true);
}, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === SECRET_PASSWORD) {
      localStorage.setItem('cloudAuth', 'true'); setIsAuthenticated(true);
    } else {
      setLoginError(true); setPasswordInput('');
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const initGallery = async () => {
      try {
        const media = Media as any;
        if (media.checkPermissions) {
          const perms = await media.checkPermissions();
          if (perms?.publicStorage !== 'granted' && perms?.gallery !== 'granted') await media.requestPermissions();
        }
        await Media.getAlbums();
      } catch (err) { console.error("Galeri izni hatası:", err); }
    };
    initGallery();
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeMedia) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [activeMedia]);

  const startGallerySync = async () => {
    try {
      setShowSyncModal(true); setSyncMessage("Sistem taranıyor...");
      setSyncStats({ total: 0, current: 0, success: 0, fail: 0 }); setSyncLogs([]);
      
      const scanRecursive = async (folderPath: string, currentDepth: number, maxDepth: number): Promise<any[]> => {
        let foundImages: any[] = [];
        if (currentDepth > maxDepth) return foundImages;
        if (folderPath.toLowerCase().includes('.thumbnails') || folderPath.toLowerCase().includes('.trash')) return foundImages;
        try {
          const result = await Filesystem.readdir({ path: folderPath, directory: Directory.ExternalStorage });
          for (const f of result.files) {
            if (f.type === 'directory') {
              const subImages = await scanRecursive(`${folderPath}/${f.name}`, currentDepth + 1, maxDepth);
              foundImages = [...foundImages, ...subImages];
            } else if (f.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/)) {
              foundImages.push({ ...f, sourceFolder: folderPath });
            }
          }
        } catch (e) {}
        return foundImages;
      };

      let allImageFiles: any[] = [];
      const roots = ['DCIM', 'Pictures', 'Download']; 
      
      for (const root of roots) {
        setSyncMessage(`Taranıyor: ${root}...`);
        const images = await scanRecursive(root, 0, 3);
        allImageFiles = [...allImageFiles, ...images];
      }
      
      setSyncMessage("WhatsApp klasörleri taranıyor...");
      const waImages1 = await scanRecursive('Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Images', 0, 1);
      const waImages2 = await scanRecursive('WhatsApp/Media/WhatsApp Images', 0, 1);
      allImageFiles = [...allImageFiles, ...waImages1, ...waImages2];
      
      if (allImageFiles.length === 0) { setSyncMessage("Medya bulunamadı."); return; }
      
      setSyncMessage("Sunucu eşleşmesi yapılıyor...");
      const uniqueFolders = Array.from(new Set(allImageFiles.map(f => f.sourceFolder)));
      let alreadyUploadedNames: string[] = [];
      
      for (const folder of uniqueFolders) {
        try {
          const checkRes = await fetch(`${serverUrl}/api/files?folder=Telefon_Yedekleri/${folder}&t=${Date.now()}`, { cache: 'no-store' });
          if (checkRes.ok) {
            const data = await checkRes.json();
            const fileList = Array.isArray(data) ? data : (data.files || []);
            const names = fileList.map((d: any) => d.name ? d.name.toLowerCase() : "");
            alreadyUploadedNames.push(...names);
          }
        } catch (e) {}
      }

      const recentLocalFiles = allImageFiles.reverse();
      const filesToUpload = recentLocalFiles.filter(file => !alreadyUploadedNames.includes(file.name.toLowerCase()));

      if (filesToUpload.length === 0) {
        setSyncMessage("Tüm dosyalar güncel.");
        setSyncStats({ total: 0, current: 0, success: 0, fail: 0 });
        setTimeout(() => setShowSyncModal(false), 3000);
        return;
      }
      
      setSyncStats(prev => ({ ...prev, total: filesToUpload.length }));
      setSyncMessage(`${filesToUpload.length} dosya yükleniyor...`);
      let successCount = 0; let failCount = 0;

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setSyncStats(prev => ({ ...prev, current: i + 1 }));
        setSyncLogs(prev => [{ name: file.name, status: 'Yükleniyor...' }, ...prev]);
        try {
          const webSafeUrl = Capacitor.convertFileSrc(file.uri);
          const response = await fetch(webSafeUrl);
          const blob = await response.blob();
          const formData = new FormData();
          
          formData.append('currentPath', `Telefon_Yedekleri/${file.sourceFolder}`);
          formData.append('files', blob, file.name);
          
          const uploadRes = await fetch(`${serverUrl}/api/upload`, { method: 'POST', body: formData });
          if (uploadRes.ok) {
            successCount++; setSyncLogs(prev => { const newLogs = [...prev]; newLogs[0].status = 'Başarılı'; return newLogs; });
          } else {
            failCount++; setSyncLogs(prev => { const newLogs = [...prev]; newLogs[0].status = 'Hata'; return newLogs; });
          }
        } catch (e) { failCount++; setSyncLogs(prev => { const newLogs = [...prev]; newLogs[0].status = 'Ağ Hatası'; return newLogs; }); }
        setSyncStats(prev => ({ ...prev, success: successCount, fail: failCount }));
      }
      setSyncMessage(`İşlem bitti! Başarılı: ${successCount}, Hatalı: ${failCount}`);
      await fetchFiles();
    } catch (err) { setSyncMessage("Kritik sistem hatası!"); }
  };

  const getDisplayedFiles = () => {
    let result = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'date-new') return (b.date || 0) - (a.date || 0);
      if (sortBy === 'date-old') return (a.date || 0) - (b.date || 0);
      if (sortBy === 'size-big') return (b.size || 0) - (a.size || 0);
      if (sortBy === 'size-small') return (a.size || 0) - (b.size || 0);
      return 0;
    });
    return result;
  };

  const displayedFiles = getDisplayedFiles();
  const mediaFiles = displayedFiles.filter(f => ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mkv', '.mov', '.avi'].includes(f.extension) && !f.isDirectory);

  const getFileUrl = (file: any) => `${serverUrl}/storage/${(currentPath ? `${currentPath}/${file.name}` : file.name).split('/').map(encodeURIComponent).join('/')}`;
  const getHlsUrl = (file: any) => {
    const safeHlsName = file.name.substring(0, file.name.lastIndexOf('.')).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `${serverUrl}/stream/${(currentPath ? `${currentPath}/${safeHlsName}` : safeHlsName).split('/').map(encodeURIComponent).join('/')}/index.m3u8`;
  };
  const getThumbUrl = (file: any, isImage: boolean) => {
    const thumbName = file.name + (isImage ? '.webp' : '.jpg');
    return `${serverUrl}/thumbnails/${(currentPath ? `${currentPath}/${thumbName}` : thumbName).split('/').map(encodeURIComponent).join('/')}`;
  };

  const openMedia = (file: any, index: number) => {
    const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(file.extension);
    const isVideo = ['.mp4', '.mkv', '.mov', '.avi'].includes(file.extension);
    const status = processingVideos[file.name];
    if (isVideo && status !== undefined && status !== -1) { alert("Video henüz işleniyor."); return; }
    if (isVideo && status === -1) { alert("Video dönüştürme hatası."); return; }
    setActiveIndex(index); setUiVisible(true); setImgScale(1); setImgTranslate({ x: 0, y: 0 }); imgPos.current = { x: 0, y: 0 };
    if (isImage) setActiveMedia({ type: 'image', url: getFileUrl(file) });
    else if (isVideo) setActiveMedia({ type: 'hls', url: getHlsUrl(file) });
  };

  const navigateMedia = (dir: 1 | -1) => {
    const newIndex = activeIndex + dir;
    if (newIndex < 0 || newIndex >= mediaFiles.length) return;
    setImgScale(1); setImgTranslate({ x: 0, y: 0 }); imgPos.current = { x: 0, y: 0 };
    openMedia(mediaFiles[newIndex], newIndex);
  };

  const handleDownloadMedia = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeMedia) return;
    try {
      alert("İndirme başlatılıyor...");
      const currentFile = mediaFiles[activeIndex];
      const response = await fetch(activeMedia.url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        await Filesystem.writeFile({
          path: `Download/${currentFile.name}`,
          data: base64data,
          directory: Directory.ExternalStorage
        });
        alert(`İndirme başarılı!`);
      };
    } catch (err) {
      alert("İndirme başarısız oldu: " + err);
    }
  };

  const getPinchDist = (touches: React.TouchList) =>
    Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

  const handleMediaTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastPinchDist.current = getPinchDist(e.touches);
    } else if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setTouchEnd({ x: 0, y: 0 });
    }
  };

  const handleMediaTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getPinchDist(e.touches);
      const delta = dist / lastPinchDist.current;
      lastPinchDist.current = dist;
      setImgScale(prev => Math.min(Math.max(prev * delta, 1), 5));
    } else if (e.touches.length === 1 && imgScale > 1) {
      const dx = e.touches[0].clientX - touchStart.x;
      const dy = e.touches[0].clientY - touchStart.y;
      setImgTranslate({ x: imgPos.current.x + dx, y: imgPos.current.y + dy });
    } else if (e.touches.length === 1) {
      setTouchEnd({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleMediaTouchEnd = () => {
    if (imgScale > 1) {
      imgPos.current = imgTranslate;
      return; 
    }

    if (!touchStart.x || !touchEnd.x) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;

    if (distanceY < -80 && Math.abs(distanceY) > Math.abs(distanceX)) {
      setActiveMedia(null); setImgScale(1); setImgTranslate({ x: 0, y: 0 }); imgPos.current = { x: 0, y: 0 };
      setTouchStart({ x: 0, y: 0 }); setTouchEnd({ x: 0, y: 0 });
      return;
    }

    const isLeftSwipe = distanceX > 50;
    const isRightSwipe = distanceX < -50;
    if (isLeftSwipe && activeIndex < mediaFiles.length - 1) navigateMedia(1);
    if (isRightSwipe && activeIndex > 0) navigateMedia(-1);
    
    setTouchStart({ x: 0, y: 0 }); setTouchEnd({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (!activeMedia) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigateMedia(1);
      if (e.key === 'ArrowLeft') navigateMedia(-1);
      if (e.key === 'Escape') { setActiveMedia(null); setImgScale(1); setImgTranslate({ x: 0, y: 0 }); imgPos.current = { x: 0, y: 0 }; }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeMedia, activeIndex, mediaFiles]);

  useEffect(() => {
    const socket = io(serverUrl);
    socket.on('conversion-progress', (data) => {
      setProcessingVideos((prev: any) => ({ ...prev, [data.fileName]: data.percent }));
      setUploadItems(prev => prev.map(item => item.fileName === data.fileName ? { ...item, phase: 'processing', processPercent: data.percent } : item));
    });
    socket.on('refresh-list', (data) => {
      setProcessingVideos((prev: any) => { const s = { ...prev }; delete s[data.finishedFile]; return s; });
      setUploadItems(prev => prev.map(item => item.fileName === data.finishedFile ? { ...item, phase: 'done', processPercent: 100 } : item));
      setTimeout(() => { setUploadItems(prev => prev.filter(item => item.fileName !== data.finishedFile)); }, 3000);
      fetchFiles();
    });
    return () => { socket.disconnect(); };
  }, [serverUrl]);

  useEffect(() => { fetchFiles(); }, [currentPath, showHidden]);

  useEffect(() => {
    if (moveModal.show) {
      setIsModalLoading(true);
      fetch(`${serverUrl}/api/files?folder=${moveModalPath}&showHidden=true`)
        .then(res => res.json())
        .then(data => { 
          if (!data.error) setMoveModalFolders(data.filter((f: any) => f.isDirectory)); 
          setIsModalLoading(false);
        }).catch(() => setIsModalLoading(false));
    }
  }, [moveModal.show, moveModalPath, serverUrl]);

  const fetchFiles = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/files?folder=${currentPath}&showHidden=${showHidden}`);
      const data = await res.json();
      if (!data.error) setFiles(data);
    } catch (err) { console.error('Hata:', err); }
  };

  const handleFileUpload = async (e: any) => {
    const selectedFiles: File[] = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    const videoExts = ['.mp4', '.mkv', '.avi', '.mov'];
    const newItems: UploadItem[] = selectedFiles.map(f => {
      const ext = '.' + f.name.split('.').pop()!.toLowerCase();
      return { id: `${f.name}-${Date.now()}`, fileName: f.name, phase: 'uploading' as const, uploadPercent: 0, processPercent: 0, isVideo: videoExts.includes(ext) };
    });
    setUploadItems(prev => [...prev, ...newItems]);
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]; const item = newItems[i];
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      try {
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const chunk = file.slice(chunkIndex * CHUNK_SIZE, Math.min((chunkIndex + 1) * CHUNK_SIZE, file.size));
          await new Promise<void>((resolve, reject) => {
            const formData = new FormData();
            formData.append('currentPath', currentPath); formData.append('chunk', chunk);
            formData.append('fileName', file.name); formData.append('chunkIndex', String(chunkIndex)); formData.append('totalChunks', String(totalChunks));
            const xhr = new XMLHttpRequest();
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const totalPercent = Math.round(((chunkIndex + event.loaded / event.total) / totalChunks) * 100);
                setUploadItems(prev => prev.map(it => it.id === item.id ? { ...it, uploadPercent: totalPercent } : it));
              }
            };
            xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`));
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.open('POST', `${serverUrl}/api/upload-chunk`); xhr.send(formData);
          });
        }
        if (!item.isVideo) {
          setUploadItems(prev => prev.map(it => it.id === item.id ? { ...it, phase: 'done', uploadPercent: 100 } : it));
          setTimeout(() => { setUploadItems(prev => prev.filter(it => it.id !== item.id)); }, 2000);
        } else {
          setUploadItems(prev => prev.map(it => it.id === item.id ? { ...it, phase: 'processing', uploadPercent: 100 } : it));
        }
      } catch (err) { setUploadItems(prev => prev.map(it => it.id === item.id ? { ...it, phase: 'error' } : it)); }
    }
    fetchFiles(); if (e.target.value !== undefined) e.target.value = '';
  };

  const handleMoveFile = (fileName: string, targetFolder: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName)); 
    fetch(`${serverUrl}/api/move`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPath, fileName, targetFolder }) }).then(() => fetchFiles()); 
  };

  const toggleSelection = (fileName: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(fileName)) newSelected.delete(fileName); else newSelected.add(fileName);
    setSelectedItems(newSelected);
  };

  const handleItemClick = (e: React.MouseEvent, file: any) => {
    e.stopPropagation();
    if (isSelectionMode) { toggleSelection(file.name); return; }
    
    const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(file.extension);
    const isVideo = ['.mp4', '.mkv', '.mov', '.avi'].includes(file.extension);
    
    if (file.isDirectory) {
      setSelectedItems(new Set()); setCurrentPath(currentPath ? `${currentPath}/${file.name}` : file.name);
    } else if (isImage || isVideo) {
      const mediaIndex = mediaFiles.findIndex(f => f.name === file.name);
      openMedia(file, mediaIndex); setSelectedItems(new Set());
    }
  };

  const handleBgContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.file-item')) return;
    e.preventDefault(); 
    setContextMenu({ type: 'bg', x: e.clientX, y: e.clientY });
  };

  const handleFileContextMenu = (e: React.MouseEvent, file: any) => {
    e.preventDefault(); e.stopPropagation();
    if (!selectedItems.has(file.name)) setSelectedItems(new Set([file.name]));
    setContextMenu({ type: 'file', x: e.clientX, y: e.clientY, file });
  };

  const handleRename = async (file: any) => {
    const newName = window.prompt("Yeni ismi girin:", file.name);
    if (!newName || newName === file.name) return;
    await fetch(`${serverUrl}/api/rename`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPath, oldName: file.name, newName }) });
    fetchFiles();
  };

  const handleBulkCopyCut = (action: 'copy' | 'cut') => {
    const filesToCopy = displayedFiles.filter(f => selectedItems.has(f.name));
    setClipboard({ action, path: currentPath, files: filesToCopy }); setSelectedItems(new Set());
  };

  const handleBulkPaste = () => {
    if (!clipboard) return;
    const filesToPaste = clipboard.files;
    if (clipboard.action === 'cut') setClipboard(null);
    Promise.all(filesToPaste.map(file => fetch(`${serverUrl}/api/paste`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: clipboard.action, sourcePath: clipboard.path, targetPath: currentPath, fileName: file.name }) }))).then(() => fetchFiles());
  };

  const handleBulkDelete = () => {
    if (!window.confirm(`Dikkat! ${selectedItems.size} öğe kalıcı olarak silinecek. Emin misiniz?`)) return;
    const itemsToDelete = Array.from(selectedItems);
    setFiles(prev => prev.filter(f => !itemsToDelete.includes(f.name))); setSelectedItems(new Set());
    Promise.all(itemsToDelete.map(name => fetch(`${serverUrl}/api/files`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPath, name }) }))).then(() => fetchFiles());
  };

  const executeBulkMove = () => {
    const filesToMove = moveModal.files; const targetPath = moveModalPath;
    setMoveModal({ show: false, files: [] }); setSelectedItems(new Set());
    setFiles(prev => prev.filter(f => !filesToMove.some(m => m.name === f.name)));
    Promise.all(filesToMove.map(file => fetch(`${serverUrl}/api/paste`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cut', sourcePath: currentPath, targetPath: targetPath, fileName: file.name }) }))).then(() => fetchFiles());
  };

  const handleHide = (file: any) => {
    setFiles(prev => prev.map(f => f.name === file.name ? { ...f, isHidden: true } : f));
    fetch(`${serverUrl}/api/hide`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPath, name: file.name }) }).then(() => fetchFiles());
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await fetch(`${serverUrl}/api/folders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPath, folderName: newFolderName }) });
    setFolderModal(false); setNewFolderName(''); fetchFiles();
  };

  const goBack = () => { const parts = currentPath.split('/').filter(Boolean); parts.pop(); setCurrentPath(parts.join('/')); };
  
  // --- 🌟 RENDER ALANLARI ---

  if (!isAuthenticated) {
  return (
      <div style={{ background: theme.bgGradient, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ ...glassStyle, padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '360px', aspectRatio: '1/1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', boxSizing: 'border-box' }}>
          <div style={{ color: theme.primary, marginBottom: '16px' }}><Icons.Cloud /></div>
          <h2 style={{ margin: '0 0 24px 0', color: theme.textMain, fontSize: '24px', fontWeight: '600' }}>Sisteme Giriş</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <input type="password" placeholder="Şifrenizi Girin" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} autoFocus style={{ padding: '14px', border: `1px solid ${theme.glassBorder}`, backgroundColor: 'rgba(0,0,0,0.2)', color: theme.textMain, fontSize: '15px', outline: 'none', textAlign: 'center', borderRadius: '12px', transition: 'border-color 0.3s' }} />
            <button type="submit" style={{ padding: '14px', border: 'none', backgroundColor: theme.primary, color: 'white', fontSize: '15px', fontWeight: '600', cursor: 'pointer', borderRadius: '12px', transition: 'background-color 0.3s, transform 0.1s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = theme.primaryHover} onMouseOut={e => e.currentTarget.style.backgroundColor = theme.primary} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>Giriş Yap</button>
          </form>
          {loginError && <div style={{ color: theme.danger, fontSize: '13px', marginTop: '16px', fontWeight: '500' }}>Yetkisiz Erişim!</div>}
        </div>
      </div>
    );
  }

  return (
    <div
      onContextMenu={handleBgContextMenu}
      onDragOver={(e) => { e.preventDefault(); if (!draggingFile) setIsDragOver(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false); }}
      onDrop={async (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
        if (draggingFile) return; const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length === 0) return; await handleFileUpload({ target: { files: droppedFiles } });
      }}
      style={{ padding: '24px', paddingBottom: '150px', background: theme.bgGradient, color: theme.textMain, minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', border: isDragOver ? `2px dashed ${theme.primary}` : '2px dashed transparent', boxSizing: 'border-box', position: 'relative' }}
    >
      <input type="file" multiple onChange={handleFileUpload} ref={fileInputRef} style={{ display: 'none' }} />
      <UploadProgressBar items={uploadItems} onDismiss={(id) => setUploadItems(prev => prev.filter(i => i.id !== id))} />

      {/* 🌟 GLASSMORPHISM CONTEXT MENU */}
      {contextMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setContextMenu(null)} onTouchStart={() => setContextMenu(null)} />
          <div 
            className="modal-content" 
            style={{ 
              position: 'fixed', top: Math.min(contextMenu.y, window.innerHeight - 300), left: Math.min(contextMenu.x, window.innerWidth - 220), 
              ...glassStyle, borderRadius: '16px', zIndex: 300, padding: '8px', minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '4px'
            }}
          >
            {contextMenu.type === 'bg' ? (
              <>
                <div onClick={() => { setFolderModal(true); setContextMenu(null); }} className="glass-menu-item"><Icons.Folder /> <span style={{marginLeft: '8px'}}>Yeni Klasör</span></div>
                <div onClick={() => { fileInputRef.current?.click(); setContextMenu(null); }} className="glass-menu-item"><Icons.Upload /> <span style={{marginLeft: '8px'}}>Dosya Yükle</span></div>
                {clipboard && <div onClick={() => { handleBulkPaste(); setContextMenu(null); }} className="glass-menu-item" style={{color: theme.primary}}><Icons.Copy /> <span style={{marginLeft: '8px'}}>Yapıştır ({clipboard.files.length})</span></div>}
                <div onClick={() => { setShowHidden(prev => !prev); setContextMenu(null); }} className="glass-menu-item" style={{color: showHidden ? theme.primary : theme.textMuted}}>{showHidden ? <Icons.EyeOff /> : <Icons.Eye />} <span style={{marginLeft: '8px'}}>{showHidden ? 'Gizlileri Kapat' : 'Gizlileri Göster'}</span></div>
              </>
            ) : (
              <>
                <div style={{ padding: '8px 12px', fontSize: '12px', color: theme.textMuted, borderBottom: `1px solid ${theme.glassBorder}`, marginBottom: '4px', fontWeight: '500' }}>{selectedItems.size} Öğe Seçili</div>
                {selectedItems.size === 1 && <div onClick={() => { handleRename(contextMenu.file); setContextMenu(null); }} className="glass-menu-item"><Icons.Edit /> <span style={{marginLeft: '8px'}}>Yeniden Adlandır</span></div>}
                <div onClick={() => { handleBulkCopyCut('copy'); setContextMenu(null); }} className="glass-menu-item"><Icons.Copy /> <span style={{marginLeft: '8px'}}>Kopyala</span></div>
                <div onClick={() => { handleBulkCopyCut('cut'); setContextMenu(null); }} className="glass-menu-item"><Icons.Cut /> <span style={{marginLeft: '8px'}}>Kes</span></div>
                <div onClick={() => { setMoveModal({ show: true, files: displayedFiles.filter(f => selectedItems.has(f.name)) }); setMoveModalPath(''); setContextMenu(null); }} className="glass-menu-item"><Icons.Move /> <span style={{marginLeft: '8px'}}>Taşı...</span></div>
                {contextMenu.file?.isDirectory && selectedItems.size === 1 && <div onClick={() => { handleHide(contextMenu.file); setContextMenu(null); }} className="glass-menu-item" style={{color: '#f59e0b'}}><Icons.EyeOff /> <span style={{marginLeft: '8px'}}>Gizle</span></div>}
                <div onClick={() => { handleBulkDelete(); setContextMenu(null); }} className="glass-menu-item" style={{color: theme.danger}}><Icons.Trash /> <span style={{marginLeft: '8px'}}>Sil</span></div>
              </>
            )}
            <style>{`.glass-menu-item { display: flex; alignItems: center; padding: 10px 12px; border-radius: 8px; cursor: pointer; color: ${theme.textMain}; font-size: 14px; transition: background 0.2s; } .glass-menu-item:hover { background-color: rgba(255,255,255,0.1); }`}</style>
          </div>
        </>
      )}

      {/* 🌟 SWIPE, PINCH-ZOOM & TAM EKRAN GALLERY */}
      {activeMedia && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, touchAction: imgScale > 1 ? 'none' : 'pan-y' }} onTouchStart={handleMediaTouchStart} onTouchMove={handleMediaTouchMove} onTouchEnd={handleMediaTouchEnd}>
          {uiVisible && (
            <>
              <div style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', gap: '12px', zIndex: 1010 }}>
                <button onClick={handleDownloadMedia} style={{ ...glassStyle, padding: '10px 16px', borderRadius: '12px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', border: 'none' }}><Icons.Download /> İndir</button>
                {activeMedia.type === 'image' && (
                  <button onClick={(e) => { e.stopPropagation(); if (imgScale > 1) { setImgScale(1); setImgTranslate({ x: 0, y: 0 }); imgPos.current = { x: 0, y: 0 }; } else { setImgScale(2.5); } }} style={{ ...glassStyle, padding: '10px 16px', borderRadius: '12px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', backgroundColor: imgScale > 1 ? theme.primary : theme.glassBg }}><Icons.Zoom /> {imgScale > 1 ? 'Sıfırla' : 'Yakınlaş'}</button>
                )}
              </div>
              <button onClick={() => { setActiveMedia(null); setImgScale(1); setImgTranslate({ x: 0, y: 0 }); imgPos.current = { x: 0, y: 0 }; }} style={{ position: 'absolute', top: '24px', right: '24px', ...glassStyle, padding: '10px', borderRadius: '50%', cursor: 'pointer', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Close /></button>
              <button onClick={(e) => { e.stopPropagation(); navigateMedia(-1); }} disabled={activeIndex <= 0 || imgScale > 1} style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', ...glassStyle, padding: '16px', borderRadius: '50%', cursor: activeIndex <= 0 || imgScale > 1 ? 'not-allowed' : 'pointer', color: 'white', opacity: activeIndex <= 0 || imgScale > 1 ? 0 : 1, transition: 'opacity 0.2s', border: 'none' }}><Icons.Back /></button>
              <button onClick={(e) => { e.stopPropagation(); navigateMedia(1); }} disabled={activeIndex >= mediaFiles.length - 1 || imgScale > 1} style={{ position: 'absolute', right: '24px', top: '50%', ...glassStyle, padding: '16px', borderRadius: '50%', cursor: activeIndex >= mediaFiles.length - 1 || imgScale > 1 ? 'not-allowed' : 'pointer', color: 'white', opacity: activeIndex >= mediaFiles.length - 1 || imgScale > 1 ? 0 : 1, transition: 'opacity 0.2s', border: 'none', transform: 'translateY(-50%) scaleX(-1)' }}><Icons.Back /></button>
              <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', ...glassStyle, color: 'white', fontSize: '14px', padding: '8px 20px', borderRadius: '20px', fontWeight: '500', border: 'none' }}>{activeIndex + 1} / {mediaFiles.length}</div>
            </>
          )}
          <div onClick={() => setUiVisible(!uiVisible)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            {activeMedia.type === 'image' ? (
              <img ref={imgRef} src={activeMedia.url} onDoubleClick={(e) => { e.stopPropagation(); if (imgScale > 1) { setImgScale(1); setImgTranslate({ x: 0, y: 0 }); imgPos.current = { x: 0, y: 0 }; } else { setImgScale(2.5); } }} style={{ width: '100vw', height: '100vh', objectFit: 'contain', transform: `scale(${imgScale}) translate(${imgTranslate.x / imgScale}px, ${imgTranslate.y / imgScale}px)`, transition: imgScale === 1 ? 'transform 0.2s ease' : 'none', transformOrigin: 'center center', userSelect: 'none', WebkitUserSelect: 'none' }} />
            ) : (
              <CloudVideoPlayer url={activeMedia.url} />
            )}
          </div>
        </div>
      )}

      {/* 🌟 ÜST PANEL (GLASSMORPHISM) */}
      <div style={{ ...glassStyle, display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '20px 24px', borderRadius: '24px' }}>
        <h1 style={{ margin: 0, color: theme.textMain, fontSize: '24px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{color: theme.primary}}><Icons.Cloud /></div> My Cloud</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isSelectionMode && <button onClick={() => setSelectedItems(new Set())} style={{ background: theme.danger, color: 'white', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: '500', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><Icons.Close /> İptal ({selectedItems.size})</button>}
          <div style={{ position: 'relative' }}>
             <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }}><Icons.Search /></div>
             <input type="text" placeholder="Ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '10px 12px 10px 38px', backgroundColor: 'rgba(0,0,0,0.2)', border: `1px solid ${theme.glassBorder}`, borderRadius: '12px', color: theme.textMain, outline: 'none', width: '200px' }} />
          </div>
          
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '10px 14px', backgroundColor: 'rgba(0,0,0,0.2)', border: `1px solid ${theme.glassBorder}`, borderRadius: '12px', color: theme.textMain, outline: 'none', cursor: 'pointer' }}>
            <optgroup label="Kamera Tarihi">
              <option value="name-desc">Çekilme (En Yeni)</option>
              <option value="name-asc">Çekilme (En Eski)</option>
            </optgroup>
            <optgroup label="Bulut Tarihi">
              <option value="date-new">Yüklenme (En Yeni)</option>
              <option value="date-old">Yüklenme (En Eski)</option>
            </optgroup>
            <optgroup label="Boyut">
              <option value="size-big">En Büyük</option>
              <option value="size-small">En Küçük</option>
            </optgroup>
          </select>

          <button onClick={() => fileInputRef.current?.click()} style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: theme.textMain, padding: '10px 20px', border: `1px solid ${theme.glassBorder}`, borderRadius: '12px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.1)'} onMouseOut={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.05)'}><Icons.Upload /> Yükle</button>
          <button onClick={startGallerySync} style={{ backgroundColor: theme.primary, color: 'white', padding: '10px 20px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor=theme.primaryHover} onMouseOut={e=>e.currentTarget.style.backgroundColor=theme.primary}><Icons.Sync /> Yedekle</button>
        </div>
      </div>

      <div style={{ marginBottom: '24px', fontSize: '14px', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '12px', ...glassStyle, padding: '12px 20px', borderRadius: '16px' }}>
        <button onClick={goBack} disabled={!currentPath} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: currentPath ? theme.textMain : theme.textMuted, border: `1px solid ${theme.glassBorder}`, borderRadius: '8px', cursor: currentPath ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px' }}><Icons.Back /> Geri</button>
        <span style={{ flex: 1, fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{color:theme.primary}}><Icons.FolderSmall /></div> Kök / {currentPath ? currentPath.replace(/\//g, ' / ') : ''}</span>
        <button onClick={fetchFiles} style={{ padding: '8px 16px', backgroundColor: 'transparent', color: theme.textMain, border: `1px solid ${theme.glassBorder}`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Icons.Refresh /> Yenile</button>
      </div>

      {/* DOSYA LİSTESİ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }}>
        {displayedFiles.length === 0 && <div style={{ color: theme.textMuted, gridColumn: '1 / -1', textAlign: 'center', marginTop: '80px', fontSize: '16px' }}>Bu klasör boş.</div>}

        {displayedFiles.map((file: any, idx: number) => {
          const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(file.extension);
          const isVideo = ['.mp4', '.mkv', '.mov', '.avi'].includes(file.extension);
          const fileUrl = getFileUrl(file); const hlsUrl = getHlsUrl(file);
          const status = processingVideos[file.name];
          const isProcessing = status !== undefined && status !== -1;
          const isError = status === -1;
          const isDragTarget = dragOverFolder === file.name && file.isDirectory;
          const isSelected = selectedItems.has(file.name);

          return (
            <div
              key={idx}
              className="file-item"
              draggable={!file.isDirectory}
              onDragStart={(e) => { setDraggingFile(file); e.dataTransfer.effectAllowed = 'move'; }}
              onDragEnd={() => { setDraggingFile(null); setDragOverFolder(null); }}
              onDragOver={(e) => {
                if (file.isDirectory && draggingFile && draggingFile.name !== file.name) {
                  e.preventDefault(); e.stopPropagation(); setDragOverFolder(file.name);
                }
              }}
              onDragLeave={() => setDragOverFolder(null)}
              onDrop={(e) => {
                e.preventDefault(); e.stopPropagation();
                if (file.isDirectory && draggingFile) {
                  if (selectedItems.has(draggingFile.name)) {
                    Array.from(selectedItems).forEach(name => handleMoveFile(name, file.name));
                    setSelectedItems(new Set());
                  } else { handleMoveFile(draggingFile.name, file.name); }
                  setDraggingFile(null); setDragOverFolder(null);
                }
              }}
              onContextMenu={(e) => handleFileContextMenu(e, file)}
              onClick={(e) => handleItemClick(e, file)}
              style={{
                padding: '12px', textAlign: 'center', cursor: 'pointer', position: 'relative',
                ...glassStyle, borderRadius: '20px',
                borderColor: isDragTarget ? theme.primary : isSelected ? theme.primary : theme.glassBorder,
                backgroundColor: isDragTarget ? 'rgba(139,92,246,0.1)' : isSelected ? 'rgba(139,92,246,0.15)' : theme.glassBg,
                filter: file.isHidden ? 'opacity(0.4)' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.2s ease'
              }}
              onMouseOver={e=> { if(!isSelected && !isDragTarget) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)' }}
              onMouseOut={e=> { if(!isSelected && !isDragTarget) e.currentTarget.style.backgroundColor = theme.glassBg }}
            >
              {isSelected && <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: theme.primary, color: 'white', padding: '4px', borderRadius: '50%', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Check /></div>}

              <div style={{ width: '100%', height: '110px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '12px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
                {file.isDirectory && <div style={{ transform: 'scale(1.2)' }}><Icons.Folder /></div>}
                
                {(isImage || (isVideo && !isProcessing && !isError)) && (
                  <SmartThumbnail file={file} isImage={isImage} isVideo={isVideo} fileUrl={fileUrl} hlsUrl={hlsUrl} thumbUrl={getThumbUrl(file, isImage)} />
                )}
                
                {isVideo && !isProcessing && !isError && (
                   <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                     <Icons.Play />
                   </div>
                )}

                {isVideo && isProcessing && (
                  <div style={{ color: theme.primary, fontSize: '13px', fontWeight: '500', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap:'8px' }}>
                    <div style={{animation: 'spin 2s linear infinite'}}><Icons.Sync /></div>
                    {status}%
                  </div>
                )}
                {isVideo && isError && (
                  <div style={{ color: theme.danger }}><Icons.Close /></div>
                )}
                {!file.isDirectory && !isImage && !isVideo && <div><Icons.File /></div>}
              </div>
              
              <div style={{ width: '100%', fontSize: '13px', fontWeight: '500', color: theme.textMain, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 4px', boxSizing: 'border-box' }}>
                {file.name}
              </div>

              {!file.isDirectory && (
                <div style={{ display: 'flex', justifyContent: 'center', fontSize: '11px', color: theme.textMuted }}>
                  <span>{formatSize(file.size)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 🌟 YEDEKLEME MODALI (GLASSMORPHISM) */}
      {showSyncModal && (
        <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '420px', ...glassStyle, borderRadius: '24px', padding: '20px', color: theme.textMain, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.glassBorder}`, paddingBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{color: theme.primary}}><Icons.Cloud /></div> Senkronizasyon</h3>
            <button onClick={() => setShowSyncModal(false)} style={{ background: 'transparent', border: 'none', color: theme.textMuted, cursor: 'pointer' }}><Icons.Close /></button>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: theme.textMuted }}>{syncMessage}</p>
          {syncStats.total > 0 && (
            <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', backgroundColor: theme.primary, width: `${(syncStats.current / syncStats.total) * 100}%`, transition: 'width 0.3s' }} />
            </div>
          )}
          <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '12px', maxHeight: '140px', overflowY: 'auto', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {syncLogs.map((log, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid rgba(255,255,255,0.05)`, paddingBottom: '6px' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{log.name}</span>
                <span style={{ color: log.status.includes('Başarılı') ? '#10b981' : log.status.includes('Hata') ? theme.danger : theme.primary }}>{log.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KLASÖR MODALI */}
      {folderModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 }}>
          <div className="modal-content" style={{ ...glassStyle, padding: '24px', borderRadius: '24px', width: '320px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 20px 0', color: theme.textMain, fontWeight: '600' }}>Yeni Klasör</h3>
            <input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()} placeholder="Klasör Adı" style={{ padding: '12px', width: '100%', boxSizing: 'border-box', marginBottom: '24px', border: `1px solid ${theme.glassBorder}`, borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.2)', color: theme.textMain, outline: 'none' }} />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setFolderModal(false)} style={{ padding: '10px 20px', backgroundColor: 'transparent', color: theme.textMuted, border: 'none', cursor: 'pointer', fontWeight: '500' }}>İptal</button>
              <button onClick={handleCreateFolder} style={{ padding: '10px 20px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '500' }}>Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {/* TAŞIMA MODALI */}
      {moveModal.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 400 }}>
          <div className="modal-content" style={{ ...glassStyle, padding: '24px', borderRadius: '24px', width: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: theme.textMain, fontWeight: '600' }}>Şuraya Taşı...</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px' }}>
              <button onClick={() => { const p = moveModalPath.split('/').filter(Boolean); p.pop(); setMoveModalPath(p.join('/')); }} disabled={!moveModalPath || isModalLoading} style={{ padding: '8px', backgroundColor: 'transparent', color: theme.primary, border: `1px solid ${theme.primary}`, borderRadius: '8px', cursor: moveModalPath && !isModalLoading ? 'pointer' : 'not-allowed', opacity: moveModalPath && !isModalLoading ? 1 : 0.5 }}><Icons.Back /></button>
              <span style={{ fontSize: '14px', color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Kök / {moveModalPath.replace(/\//g, ' / ')}</span>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '8px', minHeight: '200px' }}>
              {isModalLoading ? (
                <div style={{ color: theme.textMuted, textAlign: 'center', padding: '20px' }}>Yükleniyor...</div>
              ) : moveModalFolders.length === 0 ? (
                <div style={{ color: theme.textMuted, textAlign: 'center', padding: '20px' }}>Klasör bulunamadı.</div>
              ) : (
                moveModalFolders.map(folder => (
                  <div key={folder.name} onClick={() => { if (!isModalLoading) setMoveModalPath(moveModalPath ? `${moveModalPath}/${folder.name}` : folder.name); }} style={{ padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', color: theme.textMain, borderRadius: '8px', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.05)'} onMouseOut={e=>e.currentTarget.style.backgroundColor='transparent'}>
                    <div style={{color: theme.primary}}><Icons.Folder /></div><span>{folder.name}</span>
                  </div>
                ))
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setMoveModal({ show: false, files: [] })} style={{ padding: '10px 20px', backgroundColor: 'transparent', color: theme.textMuted, border: 'none', cursor: 'pointer', fontWeight: '500' }}>İptal</button>
              <button onClick={executeBulkMove} disabled={isModalLoading} style={{ padding: '10px 20px', backgroundColor: theme.primary, color: 'white', border: 'none', borderRadius: '12px', cursor: isModalLoading ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: isModalLoading ? 0.5 : 1 }}>Buraya Taşı ({moveModal.files.length})</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
