const CONFIG={whatsappNumber:'+212775709283',apiEndpoint:'/api/devis',instagramUrl:'https://www.instagram.com/library_domicile_?igsh=MW96MWo4ems4NHQ4Yw==',whatsappUrl:'#',facebookUrl:'#'};
function openWA(){const p=document.getElementById('prenom')?.value?.trim()||'';const n=document.getElementById('nom')?.value?.trim()||'';const t=document.getElementById('tel')?.value?.trim()||'';const m=document.getElementById('message')?.value?.trim()||'';const text=`Bonjour, je souhaite passer commande/obtenir un devis.%0A%0ANom: ${p} ${n}%0ATéléphone: ${t}%0A${m?`Message: ${encodeURIComponent(m)}%0A`:''}Je joins ma liste en pièce jointe.`;const url=`https://wa.me/${CONFIG.whatsappNumber.replace(/[^0-9]/g,'')}?text=${text}`;window.open(url,'_blank','noopener');}
document.getElementById('cta-wa')?.addEventListener('click',openWA);document.getElementById('sendWhatsApp')?.addEventListener('click',openWA);document.getElementById('footer-whatsapp')?.addEventListener('click',e=>{e.preventDefault();openWA();});document.getElementById('promo-wa')?.addEventListener('click',openWA);
// ---- Config (laisse comme tu as) ----
// const CONFIG = { ... }

// Valide un numéro marocain
function isValidMarocPhone(v){
  v = (v||'').replace(/\s|-/g,'');
  return /(^\+212[67]|^0[67])\d{8}$/.test(v);
}

const form = document.getElementById('devisForm');
const statusEl = document.getElementById('formStatus');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.hidden = true;

  const data = new FormData(form);

  // ✅ Validation SANS la case à cocher
  let ok = true;
  if (!data.get('prenom')) ok = false;
  if (!data.get('nom')) ok = false;
  if (!isValidMarocPhone(String(data.get('tel')||''))) ok = false;
  const file = data.get('fichier');
  if (!file || !file.size) ok = false;

  if (!ok) {
    statusEl.textContent = 'Vérifiez les champs requis (Prénom, Nom, Téléphone valide, Fichier).';
    statusEl.hidden = false;
    return;
  }

  try {
    const res = await fetch(CONFIG.apiEndpoint, { method: 'POST', body: data });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || 'Erreur');

    statusEl.textContent = 'Merci ! Votre demande a bien été envoyée.';
    statusEl.hidden = false;
    form.reset();
  } catch (err) {
    statusEl.textContent = 'Problème d’envoi. Essayez via WhatsApp.';
    statusEl.hidden = false;
    // Pour debug (optionnel) :
    // console.error(err);
  }
});
