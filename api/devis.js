import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'fs';
import { randomUUID } from 'crypto';

export const config = { api: { bodyParser: false } };

function parseForm(req) {
  const form = formidable({
    multiples: false,
    maxFileSize: 10 * 1024 * 1024, // 10 Mo
    allowEmptyFiles: false
  });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  }

  try {
    const { fields, files } = await parseForm(req);

    const prenom = (fields.prenom || '').toString().trim();
    const nom    = (fields.nom || '').toString().trim();
    const tel    = (fields.tel || '').toString().trim();
    if (!prenom || !nom || !tel) {
      return res.status(400).json({ ok:false, error:'Champs requis manquants (prenom, nom, tel)' });
    }

    // 1) Essaye d’abord "fichier"
    let f = files?.fichier;

    // 2) Si c’est un tableau, prends le 1er
    if (Array.isArray(f)) f = f[0];

    // 3) Sinon, prends le premier fichier quel que soit son nom
    if (!f) {
      const first = Object.values(files || {})[0];
      f = Array.isArray(first) ? first[0] : first;
    }

    // 4) Vérifie la présence du chemin temporaire
    if (!f || !f.filepath) {
      return res.status(400).json({
        ok: false,
        error: 'Aucun fichier reçu (le champ doit s’appeler "fichier")',
        receivedFileFields: Object.keys(files || {})
      });
    }

    // Lecture et upload vers Vercel Blob
    const buf = fs.readFileSync(f.filepath);
    const original = (f.originalFilename || 'liste.bin').toString();
    const ext = original.includes('.') ? original.split('.').pop() : 'bin';
    const key = `listes/liste-${Date.now()}-${randomUUID()}.${ext}`;

    const blob = await put(key, buf, {
      access: 'private', // 'public' si tu veux une URL directe
      contentType: f.mimetype || 'application/octet-stream'
    });

    return res.status(200).json({
      ok: true,
      id: randomUUID(),
      blob: { url: blob.url, pathname: blob.pathname }
    });

  } catch (e) {
    const msg = String(e?.message || 'Erreur');
    const code = msg.includes('maxFileSize') ? 413 : 500;
    return res.status(code).json({ ok:false, error: msg });
  }
}
