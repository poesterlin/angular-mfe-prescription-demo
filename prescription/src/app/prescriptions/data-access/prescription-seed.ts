import type { Prescription } from '../model/prescription';

const FIRST_NAMES = [
  'Anna',
  'Ben',
  'Clara',
  'David',
  'Elena',
  'Felix',
  'Greta',
  'Hannes',
  'Ida',
  'Jonas',
  'Katja',
  'Lukas',
  'Mara',
  'Nils',
  'Olga',
  'Paul',
  'Rita',
  'Sven',
  'Tina',
  'Uwe',
];
const LAST_NAMES = [
  'Becker',
  'Fischer',
  'Hoffmann',
  'Keller',
  'Lehmann',
  'Meyer',
  'Neumann',
  'Richter',
  'Schmidt',
  'Schulz',
  'Vogel',
  'Wagner',
  'Weber',
  'Winter',
  'Zimmer',
];
const MEDICATIONS = [
  'Amoxicillin 500 mg',
  'Atorvastatin 20 mg',
  'Bisoprolol 5 mg',
  'Cetirizine 10 mg',
  'Citalopram 20 mg',
  'Clopidogrel 75 mg',
  'Diclofenac 50 mg',
  'Escitalopram 10 mg',
  'Furosemide 40 mg',
  'Gabapentin 300 mg',
  'Hydrochlorothiazide 25 mg',
  'Ibuprofen 400 mg',
  'Insulin glargine 100 U/ml',
  'Lisinopril 10 mg',
  'Loratadine 10 mg',
  'Losartan 50 mg',
  'Metformin 850 mg',
  'Metoprolol 50 mg',
  'Montelukast 10 mg',
  'Omeprazole 20 mg',
  'Pantoprazole 40 mg',
  'Paracetamol 500 mg',
  'Prednisolone 20 mg',
  'Ramipril 5 mg',
  'Salbutamol 100 mcg',
  'Sertraline 50 mg',
  'Simvastatin 20 mg',
  'Tamsulosin 0.4 mg',
  'Torasemide 10 mg',
  'Venlafaxine 75 mg',
];

const PRESCRIPTION_COUNT = 1000;
const INSURANT_COUNT = 200;
const SEED = 20240611;
const DAY_MS = 86_400_000;
const FIRST_DAY = Date.UTC(2024, 0, 1);
const PRESCRIPTION_DAYS = 731; // 2024-01-01 to 2025-12-31
const BIRTH_FIRST_DAY = Date.UTC(1940, 0, 1);
const BIRTH_DAYS = 22_000;

interface Insurant {
  readonly name: string;
  readonly birthDate: string;
  readonly id: string;
}

/** Small deterministic PRNG, so every page load shows the same rows (AC-D3). */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoDay(firstDay: number, offset: number): string {
  return new Date(firstDay + offset * DAY_MS).toISOString().slice(0, 10);
}

function createInsurants(random: () => number): Insurant[] {
  const pick = (list: readonly string[]): string => list[Math.floor(random() * list.length)];
  const ids = new Set<string>();
  const insurants: Insurant[] = [];
  while (insurants.length < INSURANT_COUNT) {
    const letter = String.fromCharCode(65 + Math.floor(random() * 26));
    const digits = String(Math.floor(random() * 1e9)).padStart(9, '0');
    const id = `${letter}${digits}`;
    if (!ids.has(id)) {
      ids.add(id);
      insurants.push({
        id,
        name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        birthDate: isoDay(BIRTH_FIRST_DAY, Math.floor(random() * BIRTH_DAYS)),
      });
    }
  }
  return insurants;
}

/** 1,000 Prescriptions, newest first, then by id (AC-F3, AC-D3). */
export function createPrescriptions(): readonly Prescription[] {
  const random = mulberry32(SEED);
  const insurants = createInsurants(random);
  const rows: Prescription[] = [];
  for (let id = 1; id <= PRESCRIPTION_COUNT; id++) {
    const insurant = insurants[Math.floor(random() * insurants.length)];
    rows.push({
      id,
      medication: MEDICATIONS[Math.floor(random() * MEDICATIONS.length)],
      insurantName: insurant.name,
      insurantBirthDate: insurant.birthDate,
      insurantId: insurant.id,
      prescribedOn: isoDay(FIRST_DAY, Math.floor(random() * PRESCRIPTION_DAYS)),
    });
  }
  return rows.sort((a, b) => b.prescribedOn.localeCompare(a.prescribedOn) || a.id - b.id);
}
