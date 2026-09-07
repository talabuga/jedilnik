import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAm_iXo27uK0ASguOJK7x43WLbE8LscI0Y",
  authDomain: "baza-receptov.firebaseapp.com",
  projectId: "baza-receptov",
  storageBucket: "baza-receptov.firebasestorage.app",
  messagingSenderId: "1066144103715",
  appId: "1:1066144103715:web:9d2c585525c9bc1b24e096"
};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const categories = [
  ['zajtrk','Zajtrk'], ['kosilo','Kosilo'], ['vecerja','Večerja'], ['malica','Sladice']
];

function parseCaption(raw){
  const lines = String(raw || '').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const norm = x => x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const clean = x => x.replace(/^[•*·\-–—]\s*/, '').trim();
  const ing = lines.findIndex(x=>/^(sestavine|ingredients?)\s*:?\s*$/i.test(norm(x)));
  const method = lines.findIndex(x=>/^(priprava|postopek|navodila|instructions?)\s*:?\s*$/i.test(norm(x)));
  const name = (lines[0] || '').replace(/^#+\s*/, '').replace(/\s+#\S+/g,'').slice(0,120);
  const ingredients = ing >= 0 ? lines.slice(ing + 1, method > ing ? method : lines.length).map(clean) : [];
  const recipe = method >= 0 ? lines.slice(method + 1).join('\n') : lines.slice(1).join('\n');
  return { name, ingredients, recipe };
}

function showImporter(){
  if(document.getElementById('captionImportBackdrop')) return;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'captionImportBackdrop';
  backdrop.innerHTML = `
    <div class="modal-box narrow">
      <div class="modal-head">
        <h2>Uvozi recept iz opisa objave</h2>
        <button class="modal-close" id="captionImportClose">✕</button>
      </div>
      <p class="sub">V aplikaciji z objavo izberi <strong>Kopiraj napis</strong> in prilepi besedilo spodaj.</p>
      <label class="field-label">Kategorija</label>
      <select id="captionImportCategory" class="cat-select" style="margin-bottom:14px">
        ${categories.map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}
      </select>
      <label class="field-label">Opis objave</label>
      <textarea id="captionImportText" class="io-box" style="min-height:240px" placeholder="Čokoladni mafini
Sestavine:
2 jajci
200 g moke
Priprava:
Zmešaj sestavine in peci 20 minut."></textarea>
      <label class="field-label" style="margin-top:14px">Povezava do objave (neobvezno)</label>
      <input id="captionImportUrl" type="url" placeholder="Povezava do izvorne objave" style="width:100%;font:14px 'IBM Plex Sans',sans-serif;padding:9px 10px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--ink)">
      <div class="modal-actions">
        <span class="save-note">Recept se doda v tvojo bazo.</span>
        <button class="db-open-btn generate-btn" id="captionImportSave">Dodaj recept</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  const close = () => backdrop.remove();
  document.getElementById('captionImportClose').onclick = close;
  backdrop.onclick = e => { if(e.target === backdrop) close(); };
  document.getElementById('captionImportText').focus();
  document.getElementById('captionImportSave').onclick = async () => {
    const parsed = parseCaption(document.getElementById('captionImportText').value);
    if(!parsed.name){ alert('Prilepi opis objave. Prva vrstica naj bo ime recepta.'); return; }
    const id = 'm' + Date.now() + Math.floor(Math.random() * 10000);
    const meal = {
      name: parsed.name,
      category: document.getElementById('captionImportCategory').value,
      ingredients: parsed.ingredients,
      recipe: parsed.recipe,
      kcal:'', carbs:'', protein:'', fat:'', image:'',
      sourceUrl: document.getElementById('captionImportUrl').value.trim(),
      lastCooked:'', rating:0, prepTime:'', servings:''
    };
    try{
      await setDoc(doc(db, 'meals', id), meal);
      close();
      location.reload();
    }catch(e){
      console.error(e);
      alert('Recepta ni bilo mogoče shraniti.');
    }
  };
}

function mount(){
  const toolbar = document.querySelector('.toolbar');
  if(!toolbar){ requestAnimationFrame(mount); return; }
  if(document.getElementById('captionImportBtn')) return;
  const button = document.createElement('button');
  button.className = 'db-open-btn';
  button.id = 'captionImportBtn';
  button.textContent = '📥 Uvozi iz opisa';
  button.onclick = showImporter;
  toolbar.insertBefore(button, toolbar.firstElementChild);
}
mount();