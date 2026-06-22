// ============================================================
// Script de seed: crea 55 perfiles falsos (28 chicas + 27 chicos)
// ubicados en La Palma, Santa Cruz de Tenerife (Canarias).
//
// Sube las fotos reales desde las carpetas locales indicadas en
// SEED_PHOTOS_CHICOS / SEED_PHOTOS_CHICAS (o las rutas por defecto
// de abajo) al bucket "avatars" de Supabase Storage.
//
// Requiere SUPABASE_SERVICE_ROLE_KEY en el .env (clave secreta,
// nunca debe usarse en el frontend).
//
// Uso: npm run seed
// ============================================================
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_PASSWORD = process.env.SEED_PASSWORD || 'Seed12345!';

const DIR_CHICOS = process.env.SEED_PHOTOS_CHICOS
  || 'C:\\Users\\olmoc\\OneDrive\\Escritorio\\tenis proyecto\\fotos perfiles\\chicos';
const DIR_CHICAS = process.env.SEED_PHOTOS_CHICAS
  || 'C:\\Users\\olmoc\\OneDrive\\Escritorio\\tenis proyecto\\fotos perfiles\\chicas';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const NOMBRES_F = [
  'Lucía', 'Martina', 'Paula', 'Sofía', 'Daniela', 'Valeria', 'Carla', 'Noa',
  'Alba', 'Claudia', 'Elena', 'Irene', 'Marta', 'Sara', 'Julia', 'Laura',
  'Andrea', 'Nerea', 'Aitana', 'Vega', 'Lara', 'Inés', 'Celia', 'Ainhoa',
  'Candela', 'Africa', 'Yaiza', 'Nayra',
];
const NOMBRES_M = [
  'Hugo', 'Mateo', 'Daniel', 'Pablo', 'Álvaro', 'Adrián', 'David', 'Diego',
  'Javier', 'Marcos', 'Izan', 'Bruno', 'Lucas', 'Iker', 'Rubén', 'Carlos',
  'Gonzalo', 'Eric', 'Saúl', 'Néstor', 'Yeray', 'Airam', 'Aythami', 'Jonay',
  'Aday', 'Erik', 'Mario',
];
const APELLIDOS = [
  'García', 'Martín', 'Hernández', 'Pérez', 'González', 'Rodríguez', 'Díaz',
  'López', 'Sánchez', 'Gómez', 'Cabrera', 'Morales', 'Rivero', 'Reyes',
  'Acosta', 'Delgado', 'Suárez', 'Hernandez', 'Padilla', 'Mendoza',
];

const DESCRIPCIONES = [
  'Me encanta el pádel y la buena vibra en la pista. ¡Reta y vamos!',
  'Tenis desde los 12 años. Busco rivales para mejorar mi juego.',
  'Nivel intermedio, juego sobre todo los fines de semana.',
  'Competitiva pero con buen ambiente. ¡Vamos a pelotear!',
  'Recién empezando, busco gente para aprender y pasarlo bien.',
  'Me apunté hace poco, ¡vengo con ganas de mejorar cada semana!',
  'Pádel los findes, tenis entre semana. Disponible casi siempre.',
  'Buscando rivales para torneos locales, nivel avanzado.',
  'Disfruto del deporte y de conocer gente nueva en la pista.',
  'Juego desde peque, me apasiona competir y mejorar.',
];

const PROVINCIAS_ISLAS = [
  { provincia: 'Santa Cruz de Tenerife', isla: 'La Palma' },
  { provincia: 'Santa Cruz de Tenerife', isla: 'Tenerife' },
];
const DEPORTES = ['Pádel', 'Tenis', 'Ambos'];
const NIVELES = ['Principiante', 'Intermedio', 'Avanzado', 'Competición'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function listarFotos(dir) {
  try {
    return fs.readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .map((f) => path.join(dir, f));
  } catch (e) {
    console.warn(`⚠️  No se pudo leer la carpeta ${dir}: ${e.message}`);
    return [];
  }
}

async function subirFoto(userId, filePath) {
  const ext = path.extname(filePath).replace('.', '') || 'jpg';
  const buffer = fs.readFileSync(filePath);
  const storagePath = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from('avatars').upload(storagePath, buffer, {
    contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    upsert: true,
  });
  if (error) {
    console.warn(`  ⚠️ No se pudo subir foto para ${userId}: ${error.message}`);
    return null;
  }
  const { data } = supabase.storage.from('avatars').getPublicUrl(storagePath);
  return data.publicUrl;
}

async function crearPerfilFalso({ nombre, apellido, genero, fotoPath }, index, total) {
  const email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}${index}@seed.meetraquet.app`
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { nombre },
  });

  if (createErr) {
    console.warn(`  ⚠️ Error creando usuario ${email}: ${createErr.message}`);
    return;
  }

  const userId = created.user.id;
  const avatarUrl = fotoPath ? await subirFoto(userId, fotoPath) : null;

  const { provincia, isla } = rand(PROVINCIAS_ISLAS);
  const partidos = randInt(0, 35);
  const victorias = randInt(0, partidos);
  const derrotas = partidos - victorias;
  const racha = Math.random() > 0.6 ? randInt(0, 5) : 0;
  const puntos = 150 + partidos * randInt(10, 40) + randInt(0, 800);

  const { error: updateErr } = await supabase.from('profiles').update({
    nombre: `${nombre} ${apellido}`,
    edad: randInt(18, 25),
    avatar_url: avatarUrl,
    deporte: rand(DEPORTES),
    nivel: rand(NIVELES),
    descripcion: rand(DESCRIPCIONES),
    provincia,
    isla,
    perfil_completo: true,
    puntos,
    partidos_jugados: partidos,
    victorias,
    derrotas,
    racha_actual: racha,
    desafios_enviados: randInt(0, 18),
    ubicaciones_cambiadas: Math.random() > 0.85 ? 1 : 0,
    ultimo_partido_en: partidos > 0 ? new Date(Date.now() - randInt(0, 20) * 86400000).toISOString() : null,
  }).eq('id', userId);

  if (updateErr) {
    console.warn(`  ⚠️ Error actualizando perfil ${email}: ${updateErr.message}`);
  } else {
    console.log(`  ✅ [${index}/${total}] ${nombre} ${apellido} (${genero}) — ${provincia} / ${isla}`);
  }
}

async function main() {
  console.log('🌱 Iniciando seed de MEETRAQUET...\n');

  const fotosChicas = listarFotos(DIR_CHICAS);
  const fotosChicos = listarFotos(DIR_CHICOS);
  console.log(`Fotos encontradas — chicas: ${fotosChicas.length}, chicos: ${fotosChicos.length}\n`);

  const perfilesF = NOMBRES_F.slice(0, 28).map((nombre, i) => ({
    nombre, apellido: rand(APELLIDOS), genero: 'F', fotoPath: fotosChicas[i] || null,
  }));
  const perfilesM = NOMBRES_M.slice(0, 27).map((nombre, i) => ({
    nombre, apellido: rand(APELLIDOS), genero: 'M', fotoPath: fotosChicos[i] || null,
  }));

  const todos = [...perfilesF, ...perfilesM];
  console.log(`Creando ${todos.length} perfiles (28 femeninos + 27 masculinos)...\n`);

  for (let i = 0; i < todos.length; i++) {
    await crearPerfilFalso(todos[i], i + 1, todos.length);
  }

  console.log('\n🎉 Seed completado.');
}

main().catch((e) => {
  console.error('Error fatal en el seed:', e);
  process.exit(1);
});
