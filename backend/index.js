const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const http = require('http');
const { Server } = require("socket.io");
const sharp = require('sharp'); //resim küçültücü

const app = express();
const PORT = 3000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type"] }
});

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

const STORAGE_DIR = path.join(__dirname, 'storage');
const HLS_DIR = path.join(__dirname, 'hls');
const CHUNKS_DIR = path.join(__dirname, 'chunks_tmp');
const HIDDEN_FILE = path.join(__dirname, 'hidden.json');
const THUMBS_DIR = path.join(__dirname, 'thumbnails'); // ?? YENÝ: Thumbnail klasörü

if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR);
if (!fs.existsSync(HLS_DIR)) fs.mkdirSync(HLS_DIR);
if (!fs.existsSync(CHUNKS_DIR)) fs.mkdirSync(CHUNKS_DIR);
if (!fs.existsSync(THUMBS_DIR)) fs.mkdirSync(THUMBS_DIR);
if (!fs.existsSync(HIDDEN_FILE)) fs.writeFileSync(HIDDEN_FILE, JSON.stringify([]));

app.use('/storage', express.static(STORAGE_DIR));
app.use('/stream', express.static(HLS_DIR));
app.use('/thumbnails', express.static(THUMBS_DIR)); // ?? YENÝ: Dýþarýya açýyoruz

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folderPath = req.body.currentPath || '';
        const uploadPath = path.join(STORAGE_DIR, folderPath);
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Buffer.from(file.originalname, 'latin1').toString('utf8'));
    }
});
const upload = multer({ storage });
const chunkUpload = multer({ storage: multer.memoryStorage() });

function getHiddenItems() { try { return JSON.parse(fs.readFileSync(HIDDEN_FILE, 'utf8')); } catch { return []; } }
function saveHiddenItems(items) { fs.writeFileSync(HIDDEN_FILE, JSON.stringify(items)); }

// ?? YENÝ: Thumbnail Üretici Fonksiyonlar
async function generateThumbnail(filePath, fileName, folderPath) {
    const ext = path.extname(fileName).toLowerCase();
    const destDir = path.join(THUMBS_DIR, folderPath);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        // Resimler için Sharp ile 300px webp (Aþýrý hýzlý ve küçük)
        const thumbPath = path.join(destDir, fileName + '.webp');
        try { await sharp(filePath).resize({ width: 300, withoutEnlargement: true }).webp({ quality: 60 }).toFile(thumbPath); } 
        catch (err) { console.error("Resim thumbnail hatasý:", err); }
    } 
    else if (['.mp4', '.mkv', '.avi', '.mov'].includes(ext)) {
        // Videolar için FFMPEG ile 1. saniyeden kare al
        ffmpeg(filePath).screenshots({
            timestamps: ['00:00:01.000'],
            filename: fileName + '.jpg',
            folder: destDir,
            size: '320x?'
        }).on('error', (err) => console.error("Video thumbnail hatasý:", err.message));
    }
}

app.get('/api/files', (req, res) => {
    const folderPath = req.query.folder || '';
    const showHidden = req.query.showHidden === 'true';
    const targetPath = path.join(STORAGE_DIR, folderPath);
    if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'Klasör yok' });
    
    const hiddenItems = getHiddenItems();
    const items = fs.readdirSync(targetPath, { withFileTypes: true });
    
    res.json(items
        .filter(item => {
            const itemKey = folderPath ? `${folderPath}/${item.name}` : item.name;
            if (!showHidden && hiddenItems.includes(itemKey)) return false;
            return true;
        })
        .map(item => {
            const itemPath = path.join(targetPath, item.name);
            let stats = { size: 0, mtimeMs: 0 };
            try { stats = fs.statSync(itemPath); } catch(e) {}
            return {
                name: item.name, isDirectory: item.isDirectory(),
                extension: item.isDirectory() ? null : path.extname(item.name).toLowerCase(),
                isHidden: hiddenItems.includes(folderPath ? `${folderPath}/${item.name}` : item.name),
                size: stats.size, date: stats.mtimeMs
            };
        })
    );
});

app.post('/api/rename', (req, res) => {
    const { currentPath, oldName, newName } = req.body;
    const oldPath = path.join(STORAGE_DIR, currentPath || '', oldName);
    const newPath = path.join(STORAGE_DIR, currentPath || '', newName);
    if (!fs.existsSync(oldPath)) return res.status(404).json({ error: 'Dosya bulunamadý' });
    try {
        fs.renameSync(oldPath, newPath);
        
        // Thumbnail Yeniden Adlandýrma
        const ext = path.extname(oldName).toLowerCase();
        const isImg = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
        const isVid = ['.mp4', '.mkv', '.avi', '.mov'].includes(ext);
        const oldThumb = path.join(THUMBS_DIR, currentPath || '', oldName + (isImg ? '.webp' : '.jpg'));
        const newThumb = path.join(THUMBS_DIR, currentPath || '', newName + (isImg ? '.webp' : '.jpg'));
        if (fs.existsSync(oldThumb)) fs.renameSync(oldThumb, newThumb);

        if (isVid) {
            const oldSafeHls = path.basename(oldName, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const newSafeHls = path.basename(newName, path.extname(newName).toLowerCase()).replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const hlsOldPath = path.join(HLS_DIR, currentPath || '', oldSafeHls);
            const hlsNewPath = path.join(HLS_DIR, currentPath || '', newSafeHls);
            if (fs.existsSync(hlsOldPath)) fs.renameSync(hlsOldPath, hlsNewPath);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/paste', (req, res) => {
    const { action, sourcePath, targetPath, fileName } = req.body;
    const src = path.join(STORAGE_DIR, sourcePath || '', fileName);
    const dest = path.join(STORAGE_DIR, targetPath || '', fileName);
    
    if (!fs.existsSync(src)) return res.status(404).json({ error: 'Kaynak bulunamadý' });
    try {
        if (action === 'cut') fs.renameSync(src, dest);
        else fs.cpSync(src, dest, { recursive: true });
        
        // Thumbnail Taþýma/Kopyalama
        const ext = path.extname(fileName).toLowerCase();
        const isImg = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
        const isVid = ['.mp4', '.mkv', '.avi', '.mov'].includes(ext);
        const srcThumb = path.join(THUMBS_DIR, sourcePath || '', fileName + (isImg ? '.webp' : '.jpg'));
        const destThumbDir = path.join(THUMBS_DIR, targetPath || '');
        const destThumb = path.join(destThumbDir, fileName + (isImg ? '.webp' : '.jpg'));
        
        if (fs.existsSync(srcThumb)) {
            if (!fs.existsSync(destThumbDir)) fs.mkdirSync(destThumbDir, { recursive: true });
            if (action === 'cut') fs.renameSync(srcThumb, destThumb);
            else fs.cpSync(srcThumb, destThumb);
        }

        if (isVid) {
            const safeHlsName = path.basename(fileName, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const hlsSrc = path.join(HLS_DIR, sourcePath || '', safeHlsName);
            const hlsDest = path.join(HLS_DIR, targetPath || '', safeHlsName);
            if (fs.existsSync(hlsSrc)) {
                if (action === 'cut') fs.renameSync(hlsSrc, hlsDest);
                else fs.cpSync(hlsSrc, hlsDest, { recursive: true });
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/upload', (req, res) => {
    req.setTimeout(0); res.setTimeout(0);
    upload.array('files')(req, res, function (err) {
        if (err) return res.status(500).json({ error: 'Yükleme hatasý' });
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Dosya yok' });
        const folderPath = req.body.currentPath || '';
        req.files.forEach(file => {
            const ext = path.extname(file.filename).toLowerCase();
            generateThumbnail(file.path, file.filename, folderPath); // ?? YENÝ: Thumbnail üret
            if (['.mp4', '.mkv', '.avi', '.mov'].includes(ext)) {
                startHLSConversion(file.path, file.filename, folderPath);
            }
        });
        res.json({ success: true });
    });
});

app.post('/api/upload-chunk', chunkUpload.single('chunk'), (req, res) => {
    req.setTimeout(0); res.setTimeout(0);
    const { fileName, chunkIndex, totalChunks, currentPath } = req.body;
    const safeFileName = Buffer.from(fileName, 'latin1').toString('utf8');
    const folderPath = currentPath || '';
    const chunkKey = safeFileName.replace(/[^a-z0-9.]/gi, '_');
    const chunkDir = path.join(CHUNKS_DIR, chunkKey);
    if (!fs.existsSync(chunkDir)) fs.mkdirSync(chunkDir, { recursive: true });
    fs.writeFileSync(path.join(chunkDir, `chunk_${chunkIndex}`), req.file.buffer);
    const received = fs.readdirSync(chunkDir).length;
    
    if (received === parseInt(totalChunks)) {
        const targetDir = path.join(STORAGE_DIR, folderPath);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        const finalPath = path.join(targetDir, safeFileName);
        const writeStream = fs.createWriteStream(finalPath);
        for (let i = 0; i < parseInt(totalChunks); i++) {
            writeStream.write(fs.readFileSync(path.join(chunkDir, `chunk_${i}`)));
        }
        writeStream.end();
        writeStream.on('finish', () => {
            fs.rmSync(chunkDir, { recursive: true, force: true });
            generateThumbnail(finalPath, safeFileName, folderPath); // ?? YENÝ: Chunk birleþince thumbnail üret
            const ext = path.extname(safeFileName).toLowerCase();
            if (['.mp4', '.mkv', '.avi', '.mov'].includes(ext)) {
                startHLSConversion(finalPath, safeFileName, folderPath);
            }
            res.json({ done: true });
        });
    } else {
        res.json({ received: chunkIndex });
    }
});

app.post('/api/move', (req, res) => {
    // Paste mantýðý ile ayný çalýþacak þekilde güncelledim
    const { currentPath, fileName, targetFolder } = req.body;
    req.body.action = 'cut';
    req.body.sourcePath = currentPath;
    req.body.targetPath = path.join(currentPath || '', targetFolder);
    app._router.handle(req, res); // Üstteki paste rotasýna yönlendirir (Kod tekrarýný önler)
});

app.post('/api/hide', (req, res) => {
    const { currentPath, name } = req.body;
    const itemKey = currentPath ? `${currentPath}/${name}` : name;
    const hidden = getHiddenItems();
    if (!hidden.includes(itemKey)) hidden.push(itemKey);
    saveHiddenItems(hidden);
    res.json({ success: true });
});

app.post('/api/unhide', (req, res) => {
    const { currentPath, name } = req.body;
    const itemKey = currentPath ? `${currentPath}/${name}` : name;
    const hidden = getHiddenItems().filter(i => i !== itemKey);
    saveHiddenItems(hidden);
    res.json({ success: true });
});

function startHLSConversion(filePath, safeName, folderPath) {
    const ext = path.extname(safeName).toLowerCase();
    const safeHlsName = path.basename(safeName, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const hlsFolderPath = path.join(HLS_DIR, folderPath, safeHlsName);
    
    if (!fs.existsSync(hlsFolderPath)) fs.mkdirSync(hlsFolderPath, { recursive: true });
    io.emit('conversion-progress', { fileName: safeName, percent: 0 });
    
    ffmpeg(filePath)
        .outputOptions([
            '-profile:v baseline', 
            '-level 3.0',
            '-start_number 0',
            '-hls_time 2',         
            '-hls_list_size 0',    
            '-f hls',              
            '-c:v libx264',        
            '-preset veryfast',     // Daha iyi sýkýþtýrma için veryfast
            '-vf scale=-2:720',     // Tüm yeni videolarý 720p yap
            '-maxrate 2000k',       // Boyutu þiþirmemesi için veri limiti
            '-bufsize 4000k',       // Tampon bellek limiti
            '-tune zerolatency',   
            '-crf 28',             
            '-threads 0'           
        ])
        .output(path.join(hlsFolderPath, 'index.m3u8'))
        .on('progress', (progress) => {
            if (progress.percent) {
                io.emit('conversion-progress', { fileName: safeName, percent: Math.round(progress.percent) });
            }
        })
        .on('error', (err) => {
            console.error("FFMPEG Hatasý:", err);
            io.emit('conversion-progress', { fileName: safeName, percent: -1 });
        })
        .on('end', () => {
            io.emit('conversion-progress', { fileName: safeName, percent: 100 });
            setTimeout(() => io.emit('refresh-list', { finishedFile: safeName }), 2000);
        })
        .run();
}
app.post('/api/folders', (req, res) => {
    const { currentPath, folderName } = req.body;
    const newPath = path.join(STORAGE_DIR, currentPath || '', folderName);
    if (!fs.existsSync(newPath)) fs.mkdirSync(newPath, { recursive: true });
    res.json({ success: true });
});

app.delete('/api/files', (req, res) => {
    const { currentPath, name } = req.body;
    const storagePath = path.join(STORAGE_DIR, currentPath || '', name);
    if (fs.existsSync(storagePath)) fs.rmSync(storagePath, { recursive: true, force: true });
    
    // Thumbnail Silme
    const ext = path.extname(name).toLowerCase();
    const isImg = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    const thumbPath = path.join(THUMBS_DIR, currentPath || '', name + (isImg ? '.webp' : '.jpg'));
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);

    if (['.mp4', '.mkv', '.avi', '.mov'].includes(ext)) {
        const safeHlsName = path.basename(name, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const hlsPath = path.join(HLS_DIR, currentPath || '', safeHlsName);
        if (fs.existsSync(hlsPath)) fs.rmSync(hlsPath, { recursive: true, force: true });
    }
    res.json({ success: true });
});
const rebuildHLSQueue = async (dir = STORAGE_DIR, currentFolder = '') => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
        try {
            if (file.isDirectory()) {
                const newFolderPath = path.join(currentFolder, file.name);
                await rebuildHLSQueue(path.join(dir, file.name), newFolderPath);
            } else {
                const ext = path.extname(file.name).toLowerCase();
                if (['.mp4', '.mkv', '.avi', '.mov'].includes(ext)) {
                    const filePath = path.join(dir, file.name);
                    const safeHlsName = path.basename(file.name, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    const hlsFolderPath = path.join(HLS_DIR, currentFolder, safeHlsName);
                    
                    if (fs.existsSync(path.join(hlsFolderPath, 'index.m3u8'))) {
                        console.log(`? Atlandý (Zaten var): ${file.name}`);
                        continue; 
                    }

                    console.log(`?? Ýþleniyor (720p Web): ${file.name}`);
                    
                    await new Promise((resolve) => {
                        if (!fs.existsSync(hlsFolderPath)) fs.mkdirSync(hlsFolderPath, { recursive: true });
                        
                        ffmpeg(filePath)
                            .outputOptions([
                                '-profile:v baseline', '-level 3.0', '-start_number 0',
                                '-hls_time 2', '-hls_list_size 0', '-f hls',
                                '-c:v libx264', '-preset veryfast', 
                                '-vf scale=-2:720', '-maxrate 2000k', '-bufsize 4000k', // ?? Büyü burada!
                                '-tune zerolatency', '-crf 28', '-threads 0'
                            ])
                            .output(path.join(hlsFolderPath, 'index.m3u8'))
                            .on('end', () => {
                                console.log(`? Tamamlandý: ${file.name}`);
                                resolve();
                            })
                            .on('error', (err) => {
                                console.error(`?? FFmpeg Hatasý (${file.name}):`, err.message);
                                resolve();
                            })
                            .run();
                    });
                }
            }
        } catch (err) {
            console.error(`? Beklenmedik dosya hatasý (${file.name}):`, err.message);
            continue; 
        }
    }
};

// ?? MOTORU ATEÞLEYEN KISIM BURASI (Eðer // varsa çalýþmaz, o yüzden temizledik)
console.log("??? Güvenli 720p video dönüþtürme kuyruðu baþlatýldý...");
rebuildHLSQueue().then(() => {
    console.log("?? Tüm eski videolar baþarýyla 720p HLS sistemine geçirildi!");
});

// STANDART SUNUCU AYARLARI
const DIST_DIR = path.join(__dirname, 'dist');
app.use(express.static(DIST_DIR));
app.get(/.*/, (req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')));

server.listen(PORT, '0.0.0.0', () => console.log(`?? Sunucu aktif! Port: ${PORT}`));
