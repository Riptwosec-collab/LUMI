function scheduleProjectSave() {
  clearTimeout(saveTimer);
  if ($('#saveStatus')) $('#saveStatus').textContent = 'Saving…';
  saveTimer = setTimeout(saveCurrentProject, 500);
}

async function saveCurrentProject() {
  if (!state.projectId || !state.originalBlob || !state.db) return;
  const old = await getProject(state.projectId);
  await putProject({
    id: state.projectId,
    name: state.projectName,
    blob: state.originalBlob,
    params: state.params,
    maskStrokes: state.maskStrokes,
    thumb: old?.thumb || await makeThumbnail(state.originalBlob),
    createdAt: old?.createdAt || Date.now(),
    updatedAt: Date.now(),
    favorite: old?.favorite || false
  });
  if ($('#saveStatus')) $('#saveStatus').textContent = 'Saved locally';
  refreshProjects();
}

function isEditedProject(p){const prm={...deepCopy(DEFAULT_PARAMS),...(p.params||{})};return Object.keys(DEFAULT_PARAMS).some(k=>typeof DEFAULT_PARAMS[k]==='number'&&Math.abs((prm[k]||0)-(DEFAULT_PARAMS[k]||0))>.0001)||!!p.maskStrokes?.length||p.params?.cropRatio!=='original'||p.params?.rotation||p.params?.flipH||p.params?.flipV;}

function projectCard(p, full = false) {
  const card = document.createElement(full ? 'article' : 'button');
  card.className = full ? 'project-row' : 'project-card';
  const url = URL.createObjectURL(p.thumb);
  const img = document.createElement('img');
  img.alt = p.name;
  img.src = url;
  img.onload = () => setTimeout(() => URL.revokeObjectURL(url), 1000);

  if (!full) {
    card.appendChild(img);
    const label = document.createElement('span');
    label.textContent = p.name;
    card.appendChild(label);
    card.onclick = () => loadBlob(p.blob, p.name, p.id, p.params, p.maskStrokes);
    return card;
  }

  const meta = document.createElement('div');
  meta.className = 'project-row-meta';
  const date = new Date(p.updatedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  meta.innerHTML = `<strong>${p.favorite?'★ ':''}${escapeHtml(p.name)}</strong><span>${date}</span><small>${p.maskStrokes?.length || 0} mask stroke(s) · ${isEditedProject(p)?'Edited':'Original'}</small>`;
  const actions = document.createElement('div');
  actions.className = 'project-row-actions';
  const open = document.createElement('button');
  open.textContent = 'Open';
  open.onclick = () => loadBlob(p.blob, p.name, p.id, p.params, p.maskStrokes);
  const fav = document.createElement('button'); fav.textContent=p.favorite?'★':'☆'; fav.title='Favorite'; fav.onclick=async()=>{p.favorite=!p.favorite;p.updatedAt=Date.now();await putProject(p);refreshProjects();};
  const dup = document.createElement('button'); dup.textContent='Copy'; dup.onclick=async()=>{const copy={...p,id:crypto.randomUUID(),name:`${p.name} Copy`,createdAt:Date.now(),updatedAt:Date.now(),favorite:false};await putProject(copy);refreshProjects();toast('Project duplicated');};
  const rename = document.createElement('button'); rename.textContent='Rename'; rename.onclick=async()=>{const n=prompt('Project name',p.name);if(!n?.trim())return;p.name=n.trim();p.updatedAt=Date.now();await putProject(p);if(state.projectId===p.id){state.projectName=p.name;$('#projectTitle').textContent=p.name;}refreshProjects();};
  const del = document.createElement('button');
  del.textContent = 'Delete';
  del.className = 'danger-text';
  del.onclick = async () => {
    if (!confirm(`ลบโปรเจกต์ “${p.name}”?`)) return;
    await deleteProject(p.id);
    if (state.projectId === p.id) {
      state.projectId = null;
      state.image = null;
      state.originalBlob = null;
      $('#canvasEmpty').style.display = 'flex';
    }
    await refreshProjects();
    toast('Project deleted');
  };
  actions.append(open, fav, rename, dup, del);
  card.append(img, meta, actions);
  return card;
}

async function refreshProjects() {
  if (!state.db) return;
  const allList = await listProjects();
  const list = state.projectFilter === 'favorites' ? allList.filter(p => p.favorite) : allList;
  $('#projectCount').textContent = allList.length;
  $('#emptyProjects').style.display = allList.length ? 'none' : 'block';
  $('#allProjectsEmpty').style.display = list.length ? 'none' : 'block';
  if (state.projectFilter === 'favorites' && !list.length) $('#allProjectsEmpty').textContent = 'ยังไม่มี Favorite project';
  else $('#allProjectsEmpty').textContent = 'ยังไม่มีโปรเจกต์';

  const recent = $('#recentProjects');
  recent.innerHTML = '';
  allList.slice(0, 6).forEach(p => recent.appendChild(projectCard(p, false)));

  const all = $('#allProjects');
  all.innerHTML = '';
  list.forEach(p => all.appendChild(projectCard(p, true)));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}

function analyzeImage() {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(state.image, 0, 0, 96, 96);
  const d = ctx.getImageData(0, 0, 96, 96).data;
  const luminance = [];
  const saturation = [];
  let sum = 0, sumR=0, sumG=0, sumB=0;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] / 255, g = d[i+1] / 255, b = d[i+2] / 255;
    const l = .2126*r + .7152*g + .0722*b;
    const mx = Math.max(r,g,b), mn = Math.min(r,g,b);
    sum += l; sumR += r; sumG += g; sumB += b;
    luminance.push(l);
    saturation.push(mx === 0 ? 0 : (mx-mn)/mx);
  }
  luminance.sort((a,b) => a-b);
  const avg = sum / luminance.length;
  const p10 = luminance[Math.floor(luminance.length*.1)];
  const p90 = luminance[Math.floor(luminance.length*.9)];
  const range = p90 - p10;
  const avgSat = saturation.reduce((a,b) => a+b,0) / saturation.length;
  const ar=sumR/luminance.length, ag=sumG/luminance.length, ab=sumB/luminance.length;
  const warmth=clamp((ab-ar)*1.6,-.12,.12);
  const tintFix=clamp(((ar+ab)*.5-ag)*.8,-.08,.08);
  const suggested = {
    exposure: clamp((.50-avg)*1.05,-.45,.45),
    shadows: p10<.15 ? clamp((.16-p10)*1.8,0,.28) : 0,
    highlights: p90>.88 ? clamp(-((p90-.88)*1.8),-.28,0) : 0,
    contrast: range<.55 ? clamp((.55-range)*.42,0,.16) : 0,
    vibrance: avgSat<.34 ? clamp((.34-avgSat)*.65,0,.16) : 0,
    temperature: warmth,
    tint: tintFix
  };
  return { avg,p10,p90,range,avgSat,warmth,tintFix,suggested };
}

