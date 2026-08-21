(() => {
  'use strict';

  const STORAGE_KEY = 'lumi.language';
  const supported = new Set(['th','en']);
  const initial = (() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (supported.has(saved)) return saved;
    return (navigator.language || '').toLowerCase().startsWith('th') ? 'th' : 'en';
  })();
  let current = initial;
  let muting = false;

  const enToTh = new Map(Object.entries({
    'AI Photo Editor & Studio':'โปรแกรมแต่งรูปและสตูดิโอ AI',
    'Create. Enhance. Transform.':'สร้าง · เพิ่มคุณภาพ · เปลี่ยนภาพ',
    'LOCAL-FIRST EDITING':'ประมวลผลในเครื่องเป็นหลัก',
    'Edit Photo':'แต่งรูป',
    'EDIT PHOTO':'แต่งรูป',
    'Choose Photo':'เลือกรูป',
    'QUICK EDIT':'แต่งด่วน',
    'PROFESSIONAL':'มืออาชีพ',
    'ON-DEVICE':'บนอุปกรณ์',
    'AI STUDIO':'สตูดิโอ AI',
    'AI Studio':'สตูดิโอ AI',
    'Needs API':'ต้องเชื่อม API',
    'NEEDS API':'ต้องเชื่อม API',
    'LOCAL':'ในเครื่อง',
    'MODEL':'ต้องใช้โมเดล',
    'API':'API',
    'NATIVE':'แอป iOS',
    'PARTIAL':'บางส่วน',
    'LIMITED':'จำกัด',
    'WORKING':'ใช้งานได้',
    'Recent Projects':'โปรเจกต์ล่าสุด',
    'RECENT PROJECTS':'โปรเจกต์ล่าสุด',
    'View all':'ดูทั้งหมด',
    'Projects':'โปรเจกต์',
    'PROJECTS':'โปรเจกต์',
    'New Project':'โปรเจกต์ใหม่',
    'Favorites':'รายการโปรด',
    'All Projects':'ทุกโปรเจกต์',
    'Clear All':'ล้างทั้งหมด',
    'Open':'เปิด',
    'Rename':'เปลี่ยนชื่อ',
    'Copy':'ทำสำเนา',
    'Delete':'ลบ',
    'Favorite':'รายการโปรด',
    'Original':'ต้นฉบับ',
    'Edited':'แก้ไขแล้ว',
    'Home':'หน้าหลัก',
    'Edit':'แต่ง',
    'Tools':'เครื่องมือ',
    'All Tools':'เครื่องมือทั้งหมด',
    'Me':'ฉัน',
    'My LUMI':'LUMI ของฉัน',
    'Settings':'การตั้งค่า',
    'Language':'ภาษา',
    'Thai':'ไทย',
    'English':'อังกฤษ',
    'Auto':'อัตโนมัติ',
    'Auto Enhance':'ปรับอัตโนมัติ',
    'Smart Auto':'ออโต้อัจฉริยะ',
    'SMART ANALYSIS':'วิเคราะห์อัจฉริยะ',
    'Adaptive':'ปรับตามภาพ',
    'Natural':'ธรรมชาติ',
    'Balanced':'สมดุล',
    'Strong':'เข้ม',
    'Beauty':'บิวตี้',
    'LOCAL BEAUTY':'บิวตี้ในเครื่อง',
    'Skin-aware Beauty':'บิวตี้ตรวจโทนผิว',
    'Presets':'พรีเซ็ต',
    'Looks':'ลุค',
    'LOOKS':'ลุค',
    'Light':'แสง',
    'Color':'สี',
    'Detail':'รายละเอียด',
    'Effects':'เอฟเฟกต์',
    'HSL':'HSL',
    'HSL Mixer':'มิกซ์สี HSL',
    'Tone Curve':'โทนเคิร์ฟ',
    'Curve':'เคิร์ฟ',
    'Mask':'มาสก์',
    'Manual Mask':'มาสก์แบบระบาย',
    'SELECTIVE EDIT':'ปรับเฉพาะจุด',
    'Crop':'ครอป',
    'Crop & Rotate':'ครอปและหมุน',
    'Geometry':'เรขาคณิต',
    'GEOMETRY':'เรขาคณิต',
    'Rotate':'หมุน',
    'Flip H':'กลับซ้าย-ขวา',
    'Flip V':'กลับบน-ล่าง',
    'Before':'ก่อน',
    'After':'หลัง',
    'BEFORE':'ก่อน',
    'AFTER':'หลัง',
    'Undo':'ย้อนกลับ',
    'Redo':'ทำซ้ำ',
    'Export':'ส่งออก',
    'Export Photo':'ส่งออกรูป',
    'FULL QUALITY':'คุณภาพเต็ม',
    'File type':'ชนิดไฟล์',
    'Quality':'คุณภาพ',
    'Resolution':'ความละเอียด',
    'Original resolution':'ความละเอียดต้นฉบับ',
    'Render & Save':'เรนเดอร์และบันทึก',
    'Save':'บันทึก',
    'Share':'แชร์',
    'Retry':'ลองใหม่',
    'Edit More':'แต่งต่อ',
    'Apply':'ใช้',
    'Close':'ปิด',
    'Done':'เสร็จ',
    'Reset':'รีเซ็ต',
    'Search tools':'ค้นหาเครื่องมือ',
    'Search all tools':'ค้นหาเครื่องมือทั้งหมด',
    'Recommended AI Tools':'เครื่องมือ AI แนะนำ',
    'Try these styles':'ลองสไตล์เหล่านี้',
    'AI Model Guide':'คู่มือสี AI',
    'Model Guide':'คู่มือโมเดล',
    'Remove':'ลบ',
    'Enhance':'เพิ่มคุณภาพ',
    'Select':'เลือก',
    'Generate':'สร้างภาพ',
    'Fill / Replace':'เติม / แทนที่',
    'Remove Background':'ลบพื้นหลัง',
    'Product Cut':'ตัดสินค้า',
    'Transparent PNG':'PNG พื้นหลังโปร่งใส',
    'Generative Remove':'ลบวัตถุด้วย AI',
    'AI Enhance':'เพิ่มคุณภาพด้วย AI',
    'Upscale 2×':'ขยาย 2×',
    'Upscale 4×':'ขยาย 4×',
    'Restore Detail':'กู้รายละเอียด',
    'Smart Select':'เลือกอัจฉริยะ',
    'Person Mask':'มาสก์บุคคล',
    'Face / Skin Mask':'มาสก์ใบหน้า / ผิว',
    'Sky / Background Mask':'มาสก์ท้องฟ้า / พื้นหลัง',
    'AI Generate':'สร้างภาพด้วย AI',
    'AI Portrait':'พอร์ตเทรต AI',
    'Avatar Studio':'สตูดิโออวตาร',
    'Style Transfer':'เปลี่ยนสไตล์',
    'Generative Fill':'เติมพื้นที่ด้วย AI',
    'AI Replace':'แทนที่ด้วย AI',
    'AI Background':'พื้นหลัง AI',
    'Generative Expand':'ขยายภาพด้วย AI',
    'Img2Img':'แปลงภาพด้วยภาพ',
    'AI Outfit':'เปลี่ยนชุดด้วย AI',
    'AI Hair':'ทรงผม AI',
    'AI Harmonize':'ปรับภาพให้กลมกลืนด้วย AI',
    'AI Remove':'ลบด้วย AI',
    'Background':'พื้นหลัง',
    'Expand':'ขยายภาพ',
    'Portrait':'พอร์ตเทรต',
    'Hair':'ผม',
    'Outfit':'เสื้อผ้า',
    'Smart':'อัจฉริยะ',
    'Pro Photo':'โปรโฟโต้',
    'Selective':'เลือกเฉพาะจุด',
    'Retouch':'รีทัช',
    'Workflow':'เวิร์กโฟลว์',
    'Creator':'ครีเอเตอร์',
    'Auto Analyze 2.0':'วิเคราะห์ภาพอัตโนมัติ 2.0',
    'Auto Light':'ปรับแสงอัตโนมัติ',
    'Auto Color':'ปรับสีอัตโนมัติ',
    'Auto Detail':'ปรับรายละเอียดอัตโนมัติ',
    'Auto Geometry':'จัดแนวอัตโนมัติ',
    'Fix Dark Face':'แก้หน้ามืด',
    'Recover Sky':'กู้รายละเอียดท้องฟ้า',
    'Match Look':'จับคู่ลุค',
    'Skin Retouch Pro':'รีทัชผิว Pro',
    'Brush Concealer':'แปรงปกปิดรอย',
    'Skin Tone Lab':'ห้องปรับสีผิว',
    'Multi-Person Beauty':'บิวตี้หลายบุคคล',
    'Face Sculpt Pro':'ปรับรูปหน้า Pro',
    'Eyes Studio':'สตูดิโอดวงตา',
    'Nose Studio':'สตูดิโอจมูก',
    'Lip & Smile Studio':'สตูดิโอปากและรอยยิ้ม',
    'Makeup Studio 2.0':'สตูดิโอเมคอัพ 2.0',
    'Hair Studio 2.0':'สตูดิโอผม 2.0',
    'Body Studio 2.0':'สตูดิโอรูปร่าง 2.0',
    'AI Nails':'เล็บ AI',
    'AI Style Advisor':'ผู้ช่วยแนะนำสไตล์ AI',
    'Light Pro':'แสง Pro',
    'Tonal Contrast':'คอนทราสต์ตามช่วงแสง',
    'Histogram Pro':'ฮิสโตแกรม Pro',
    'White Balance':'สมดุลแสงขาว',
    'Replace Color':'แทนที่สี',
    'Levels':'Levels',
    'Color Balance':'สมดุลสี',
    'RGB Channel Mixer':'มิกซ์ช่องสี RGB',
    'Color Grading':'เกรดสี',
    'Detail Pro':'รายละเอียด Pro',
    'AI Denoise':'ลดนอยส์ด้วย AI',
    'Smart Deband':'แก้แถบสีอัจฉริยะ',
    'Optics Pro':'ออปติก Pro',
    'Geometry Pro':'เรขาคณิต Pro',
    'RAW / ProRAW':'RAW / ProRAW',
    'HDR / EDR':'HDR / EDR',
    'Subject Mask':'มาสก์ตัวแบบ',
    'Background Mask':'มาสก์พื้นหลัง',
    'Person / Face / Skin':'บุคคล / ใบหน้า / ผิว',
    'Hair / Clothes Mask':'มาสก์ผม / เสื้อผ้า',
    'Object Select':'เลือกวัตถุ',
    'Linear / Radial Gradient':'ไล่ระดับเส้น / วงกลม',
    'Color / Luminance Range':'ช่วงสี / ความสว่าง',
    'Control Point':'จุดควบคุม',
    'Spot Heal':'ฮีลจุด',
    'Clone / Patch':'โคลน / แพตช์',
    'Remove Extra People':'ลบคนส่วนเกิน',
    'Glare / Reflection Removal':'ลบแสงสะท้อน',
    'Layers & Blend Modes':'เลเยอร์และโหมดผสม',
    'Double Exposure':'ซ้อนภาพ',
    'Lens Blur':'เบลอเลนส์',
    'AI Depth Blur':'เบลอระยะชัดด้วย AI',
    'Film Lab 2.0':'ห้องฟิล์ม 2.0',
    'CCD / Digicam Lab':'ห้อง CCD / กล้องดิจิทัล',
    'Adaptive Presets':'พรีเซ็ตปรับตามภาพ',
    'LUT Import / Export':'นำเข้า / ส่งออก LUT',
    'Ask LUMI 2.0':'ถาม LUMI 2.0',
    'AI Edit Status':'สถานะการแต่งด้วย AI',
    'Batch Editor':'แต่งหลายรูป',
    'Projects Pro':'โปรเจกต์ Pro',
    'Edit History Pro':'ประวัติการแต่ง Pro',
    'Project Versions':'เวอร์ชันโปรเจกต์',
    'Export Pro':'ส่งออก Pro',
    'Social Export':'ส่งออกโซเชียล',
    'Storage Manager':'จัดการพื้นที่จัดเก็บ',
    'Privacy Center':'ศูนย์ความเป็นส่วนตัว',
    'AI Model Manager':'จัดการโมเดล AI',
    'Collage Studio':'สตูดิโอคอลลาจ',
    'Creator Studio':'สตูดิโอครีเอเตอร์',
    'Camera Capture':'ถ่ายภาพจากกล้อง',
    'Pro Camera':'กล้อง Pro',
    'Live Photo':'Live Photo',
    'Video Editor':'ตัดต่อวิดีโอ',
    'AI Camera':'กล้อง AI',
    'Pro Info Panel':'ข้อมูลภาพ Pro',
    'Exposure':'การรับแสง',
    'Brightness':'ความสว่าง',
    'Contrast':'คอนทราสต์',
    'Highlights':'ไฮไลต์',
    'Shadows':'เงา',
    'Whites':'สีขาว',
    'Blacks':'สีดำ',
    'Temperature':'อุณหภูมิสี',
    'Tint':'ทินต์',
    'Vibrance':'ความสดแบบรักษาสีผิว',
    'Saturation':'ความอิ่มสี',
    'Sharpness':'ความคม',
    'Clarity':'ความชัด',
    'Dehaze':'ลดหมอก',
    'Vignette':'ขอบมืด',
    'Grain':'เกรน',
    'Bloom':'โกลว์',
    'Skin Smooth':'ผิวเนียน',
    'Skin Glow':'ผิวโกลว์',
    'Skin Warmth':'โทนผิวอุ่น',
    'Redness':'ความแดง',
    'Skin Brighten':'ผิวสว่าง',
    'Tone Evenness':'ปรับสีผิวสม่ำเสมอ',
    'Texture Restore':'คืนรายละเอียดผิว',
    'Mask Exposure':'แสงในมาสก์',
    'Mask Saturation':'ความอิ่มสีในมาสก์',
    'Mask Temperature':'อุณหภูมิสีในมาสก์',
    'Mask Contrast':'คอนทราสต์ในมาสก์',
    'Mask Brightness':'ความสว่างในมาสก์',
    'Midtones':'โทนกลาง',
    'Black Input':'อินพุตดำ',
    'Midtone Gamma':'แกมมาโทนกลาง',
    'White Input':'อินพุตขาว',
    'Black Output':'เอาต์พุตดำ',
    'White Output':'เอาต์พุตขาว',
    'Shadow Warmth':'ความอุ่นของเงา',
    'Shadow Tint':'ทินต์ของเงา',
    'Midtone Warmth':'ความอุ่นโทนกลาง',
    'Midtone Tint':'ทินต์โทนกลาง',
    'Highlight Warmth':'ความอุ่นไฮไลต์',
    'Highlight Tint':'ทินต์ไฮไลต์',
    'Gamma':'แกมมา',
    'Shadow Contrast':'คอนทราสต์เงา',
    'Midtone Contrast':'คอนทราสต์โทนกลาง',
    'Highlight Contrast':'คอนทราสต์ไฮไลต์',
    'Target Hue':'สีเป้าหมาย',
    'Range':'ช่วง',
    'Hue Shift':'เลื่อนเฉดสี',
    'Luminance':'ความสว่างสี',
    'Lens Vignette':'ขอบมืดเลนส์',
    'Chromatic Fringe':'ขอบสีคลาด',
    'Fade':'เฟด',
    'Halation':'ฮาเลชัน',
    'Highlight Boost':'เพิ่มประกายไฮไลต์',
    'Edge Focus':'โฟกัสขอบ',
    'Paint':'ระบาย',
    'Erase':'ลบ',
    'Brush Size':'ขนาดแปรง',
    'Feather':'ความฟุ้ง',
    'Invert':'กลับมาสก์',
    'Stroke':'สโตรก',
    'Add to Home Screen':'เพิ่มไปยังหน้าจอโฮม',
    'INSTALL PWA':'ติดตั้ง PWA',
    'App mode':'โหมดแอป',
    'Offline cache':'แคชออฟไลน์',
    'Renderer':'ตัวเรนเดอร์',
    'Cloud AI':'AI บนคลาวด์',
    'Not configured':'ยังไม่ตั้งค่า',
    'Browser':'เบราว์เซอร์',
    'Online only':'ออนไลน์เท่านั้น',
    'Saved locally':'บันทึกในเครื่องแล้ว',
    'Saving…':'กำลังบันทึก…',
    'Loading photo…':'กำลังโหลดรูป…',
    'Rendering…':'กำลังเรนเดอร์…',
    'Rendering full quality…':'กำลังเรนเดอร์คุณภาพเต็ม…',
    'Export complete':'ส่งออกสำเร็จ',
    'Project duplicated':'ทำสำเนาโปรเจกต์แล้ว',
    'Project deleted':'ลบโปรเจกต์แล้ว',
    'Projects cleared':'ล้างโปรเจกต์แล้ว',
    'Auto Enhance applied':'ใช้การปรับอัตโนมัติแล้ว',
    'Reference color matched':'จับคู่สีอ้างอิงแล้ว',
    'Version saved':'บันทึกเวอร์ชันแล้ว',
    'Feature Status':'สถานะฟีเจอร์',
    'Privacy First':'ความเป็นส่วนตัวมาก่อน'
  }));
  const thToEn = new Map([...enToTh].map(([en,th]) => [th,en]));

  const phrasePairs = [
    ['ยังไม่มีโปรเจกต์','No projects yet'],
    ['ยังไม่มี Favorite project','No favorite projects yet'],
    ['เลือกรูปเพื่อเริ่มแต่ง','Choose a photo to start editing'],
    ['เลือกรูปก่อน','Choose a photo first'],
    ['เปิดรูปไม่สำเร็จ','Could not open photo'],
    ['เปิด Local Projects ไม่สำเร็จ','Could not open local projects'],
    ['อุปกรณ์นี้ไม่รองรับ WebGL2','This device does not support WebGL2'],
    ['ระบาย Mask ก่อน Invert','Paint a mask before inverting'],
    ['ยังไม่มี Mask stroke','No mask strokes yet'],
    ['ลบ Projects ที่เก็บในเครื่องทั้งหมด?','Delete all locally stored projects?'],
    ['ลบโปรเจกต์','Delete project'],
    ['กำลังคำนวณ','Calculating'],
    ['เลือกหลายรูป','Select multiple photos'],
    ['เลือกภาพอ้างอิง','Choose a reference photo'],
    ['เลือกรูปเพื่อดูข้อมูล','Choose a photo to inspect it'],
    ['พร้อมวิเคราะห์รูป','Ready to analyze photo'],
    ['ข้อมูลถูกเก็บในเครื่อง','Data is stored locally'],
    ['ประมวลผลในเครื่อง','Processed locally'],
    ['ต้องใช้ backend จริง','Requires a real backend'],
    ['ยังไม่อัปโหลดรูป','No photo has been uploaded'],
    ['ไม่สร้างผลลัพธ์ปลอม','No fake results are generated'],
    ['ใช้บนเครื่อง','Local processing'],
    ['ต้องเชื่อมโมเดล','Model integration required'],
    ['จำกัดโดยเบราว์เซอร์','Browser limited']
  ];

  function normalizeEnglish(text) {
    let out = String(text ?? '');
    const trim = out.trim();
    if (thToEn.has(trim)) return out.replace(trim, thToEn.get(trim));
    for (const [th,en] of phrasePairs) out = out.split(th).join(en);
    return out;
  }

  function translateEnglish(text) {
    let out = String(text ?? '');
    const trim = out.trim();
    if (enToTh.has(trim)) return out.replace(trim, enToTh.get(trim));
    const pairs = [...enToTh.entries()].sort((a,b) => b[0].length - a[0].length);
    for (const [en,th] of pairs) {
      if (out.includes(en)) out = out.split(en).join(th);
    }
    return out;
  }

  function translateText(text, lang=current) {
    const english = normalizeEnglish(text);
    return lang === 'th' ? translateEnglish(english) : english;
  }

  function addSwitch(parent, variant='normal') {
    if (!parent || parent.querySelector(`.lumi-lang-switch[data-variant="${variant}"]`)) return;
    const box = document.createElement('div');
    box.className = 'lumi-lang-switch';
    box.dataset.variant = variant;
    box.innerHTML = '<button type="button" data-lumi-lang="th">ไทย</button><button type="button" data-lumi-lang="en">EN</button>';
    box.addEventListener('click', e => {
      const btn = e.target.closest('[data-lumi-lang]');
      if (btn) setLanguage(btn.dataset.lumiLang);
    });
    if (variant === 'home') {
      const install = parent.querySelector('#installBtn');
      install ? parent.insertBefore(box, install) : parent.appendChild(box);
    } else if (variant === 'editor') {
      const actions = parent.querySelector('.editor-actions');
      actions ? parent.insertBefore(box, actions) : parent.appendChild(box);
    } else parent.appendChild(box);
  }

  function installSwitches() {
    addSwitch(document.querySelector('#homeTopbar'), 'home');
    addSwitch(document.querySelector('.editor-topbar'), 'editor');
    const meHeading = document.querySelector('#mePage .page-heading');
    addSwitch(meHeading, 'settings');
    const settings = document.querySelector('#mePage .settings-list');
    if (settings && !document.querySelector('#lumiLanguageSetting')) {
      const row = document.createElement('article');
      row.id = 'lumiLanguageSetting';
      row.innerHTML = '<span data-lang-label>Language</span><strong data-lang-value>ไทย / English</strong>';
      settings.prepend(row);
    }
  }

  function installStyles() {
    if (document.querySelector('#lumiI18nStyles')) return;
    const style = document.createElement('style');
    style.id = 'lumiI18nStyles';
    style.textContent = `
      .lumi-lang-switch{display:inline-flex;gap:2px;padding:3px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.055);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-radius:12px;box-shadow:inset 0 1px rgba(255,255,255,.05)}
      .lumi-lang-switch button{min-width:35px;height:30px;padding:0 8px;border:0;border-radius:9px;background:transparent;color:#8f9ab8;font-size:10px;font-weight:800;letter-spacing:.02em}
      .lumi-lang-switch button.active{color:#fff;background:linear-gradient(135deg,rgba(56,189,248,.3),rgba(139,92,246,.38),rgba(251,113,133,.3));box-shadow:0 4px 16px rgba(99,102,241,.22)}
      .editor-topbar .lumi-lang-switch{flex:0 0 auto}.editor-topbar .lumi-lang-switch button{min-width:29px;height:28px;padding:0 5px;font-size:9px}
      #mePage .page-heading .lumi-lang-switch{margin-top:10px}
      @media(max-width:390px){.home-topbar .lumi-lang-switch button{min-width:31px;padding:0 5px}.editor-topbar .lumi-lang-switch{transform:scale(.92)}}
    `;
    document.head.appendChild(style);
  }

  function translateAttributes(root=document) {
    root.querySelectorAll?.('[placeholder],[title],[aria-label]').forEach(el => {
      for (const attr of ['placeholder','title','aria-label']) {
        if (!el.hasAttribute(attr)) continue;
        const marker = `lumiI18n${attr}`;
        if (!el.dataset[marker]) el.dataset[marker] = normalizeEnglish(el.getAttribute(attr));
        el.setAttribute(attr, translateText(el.dataset[marker]));
      }
    });
  }

  function translateTextNodes(root=document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        if (!p || ['SCRIPT','STYLE','TEXTAREA','CANVAS','PRE','CODE'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
        return node.nodeValue?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (!node.__lumiEnglish) node.__lumiEnglish = normalizeEnglish(node.nodeValue);
      const translated = translateText(node.__lumiEnglish);
      if (node.nodeValue !== translated) node.nodeValue = translated;
    });
  }

  function translateDataModels() {
    try {
      if (typeof SLIDERS !== 'undefined') {
        Object.values(SLIDERS).flat().forEach(spec => {
          if (!spec.__lumiEnglish) spec.__lumiEnglish = normalizeEnglish(spec[1]);
          spec[1] = translateText(spec.__lumiEnglish);
        });
      }
      if (typeof HSL_COLORS !== 'undefined') {
        HSL_COLORS.forEach(spec => {
          if (!spec.__lumiEnglish) spec.__lumiEnglish = normalizeEnglish(spec[1]);
          spec[1] = translateText(spec.__lumiEnglish);
        });
      }
      if (typeof V3_PANEL_SPECS !== 'undefined') {
        Object.values(V3_PANEL_SPECS).forEach(item => {
          item.__lumiEnglishLabel ||= normalizeEnglish(item.label);
          item.__lumiEnglishSmall ||= normalizeEnglish(item.small);
          item.label = translateText(item.__lumiEnglishLabel);
          item.small = translateText(item.__lumiEnglishSmall);
        });
      }
      if (typeof AI_MODELS !== 'undefined') {
        Object.values(AI_MODELS).forEach(item => {
          item.__lumiEnglishLabel ||= normalizeEnglish(item.label);
          item.__lumiEnglishDescription ||= normalizeEnglish(item.description);
          item.label = translateText(item.__lumiEnglishLabel);
          item.description = translateText(item.__lumiEnglishDescription);
        });
      }
      if (typeof AI_TOOLS_V3 !== 'undefined') {
        AI_TOOLS_V3.forEach(item => {
          item.__lumiEnglishTitle ||= normalizeEnglish(item.title);
          item.__lumiEnglishDesc ||= normalizeEnglish(item.desc);
          item.title = translateText(item.__lumiEnglishTitle);
          item.desc = translateText(item.__lumiEnglishDesc);
          if (Array.isArray(item.options)) {
            item.__lumiEnglishOptions ||= item.options.map(normalizeEnglish);
            item.options = item.__lumiEnglishOptions.map(x => translateText(x));
          }
        });
      }
      if (typeof TOOL_CATALOG_V3 !== 'undefined') {
        TOOL_CATALOG_V3.forEach(item => {
          item.__lumiEnglishTitle ||= normalizeEnglish(item.title);
          item.__lumiEnglishDesc ||= normalizeEnglish(item.desc);
          item.__lumiEnglishCategory ||= normalizeEnglish(item.category);
          item.title = translateText(item.__lumiEnglishTitle);
          item.desc = translateText(item.__lumiEnglishDesc);
          item.category = translateText(item.__lumiEnglishCategory);
        });
      }
    } catch (e) { console.warn('LUMI i18n model translation:', e); }
  }

  function rebuildDynamicUI() {
    try { typeof buildControls === 'function' && buildControls(); } catch {}
    try { typeof buildModelLegend === 'function' && buildModelLegend(); } catch {}
    try { typeof buildRecommendedAI === 'function' && buildRecommendedAI(); } catch {}
    try { typeof buildStyleIdeas === 'function' && buildStyleIdeas(); } catch {}
    try { typeof buildAIStudio === 'function' && buildAIStudio(); } catch {}
    try { typeof buildToolCategoryChips === 'function' && buildToolCategoryChips(); } catch {}
    try { typeof buildMegaToolCatalog === 'function' && buildMegaToolCatalog(); } catch {}
    try { typeof renderLayerList === 'function' && renderLayerList(); } catch {}
    try { typeof syncUI === 'function' && syncUI(); } catch {}
  }

  function updateSwitchState() {
    document.querySelectorAll('[data-lumi-lang]').forEach(btn => btn.classList.toggle('active', btn.dataset.lumiLang === current));
    document.documentElement.lang = current === 'th' ? 'th' : 'en';
    document.title = current === 'th' ? 'LUMI AI — สตูดิโอแต่งรูป AI' : 'LUMI AI — Premium AI Photo Studio';
    const label = document.querySelector('[data-lang-label]');
    if (label) label.textContent = current === 'th' ? 'ภาษา' : 'Language';
    const value = document.querySelector('[data-lang-value]');
    if (value) value.textContent = current === 'th' ? 'ไทย' : 'English';
  }

  function applyLanguage({rebuild=false}={}) {
    muting = true;
    translateDataModels();
    if (rebuild) rebuildDynamicUI();
    installSwitches();
    translateTextNodes();
    translateAttributes();
    updateSwitchState();
    requestAnimationFrame(() => { muting = false; });
  }

  function setLanguage(lang) {
    if (!supported.has(lang) || lang === current) return;
    current = lang;
    localStorage.setItem(STORAGE_KEY, current);
    applyLanguage({rebuild:true});
    try { typeof toast === 'function' && toast(current === 'th' ? 'เปลี่ยนภาษาเป็นไทยแล้ว' : 'Language changed to English'); } catch {}
    window.dispatchEvent(new CustomEvent('lumi:languagechange', {detail:{language:current}}));
  }

  window.LUMI_I18N = {
    get language(){ return current; },
    setLanguage,
    t: translateText,
    apply: () => applyLanguage({rebuild:true})
  };

  function boot() {
    installStyles();
    installSwitches();
    applyLanguage({rebuild:true});
    const observer = new MutationObserver(records => {
      if (muting) return;
      let relevant = false;
      for (const r of records) {
        if (r.type === 'childList' && r.addedNodes.length) { relevant = true; break; }
        if (r.type === 'characterData') {
          r.target.__lumiEnglish = normalizeEnglish(r.target.nodeValue);
          relevant = true; break;
        }
      }
      if (relevant) requestAnimationFrame(() => applyLanguage({rebuild:false}));
    });
    observer.observe(document.body, {subtree:true, childList:true, characterData:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
