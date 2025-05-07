import mongoose, { Schema, Document, Types, Query } from 'mongoose';

// --- Interfejs odpowiadający schematowi Broni ---

export interface IWeapon extends Document {
    script_id: Types.ObjectId; // ID scenariusza, do którego należy broń
    name: string; // Nazwa/identyfikator broni (np. "Glock 19 Janka", "Miecz ceremonialny")
    description?: string; // Opis broni
    type?: string; // Główny typ broni (np. "broń palna", "broń biała", "miotająca", "materiał wybuchowy")
    category?: string; // Dokładniejsza kategoria (np. "pistolet", "karabin szturmowy", "nóż", "łuk", "granat")
    // Pola rozszerzone
    caliber?: string; // Kaliber (jeśli dotyczy broni palnej)
    source_details?: string; // Szczegóły dotyczące źródła pozyskania (np. zbrojownia filmowa, atrapa)
    safety_notes?: string; // BARDZO WAŻNE: Notatki dotyczące bezpieczeństwa użytkowania na planie
    visual_references?: string[]; // Tablica URL-i do referencji wizualnych
    scenes_ids?: Types.ObjectId[]; // Lista ID scen, w których występuje broń
    ai_notes?: string; // Dodatkowe notatki wygenerowane przez AI
    user_notes?: string; // Notatki dodane przez użytkownika
    metadata: {
        createdAt: Date;
        updatedAt: Date;
    };
}

// --- Schemat Mongoose dla Broni ---

const WeaponSchema = new Schema<IWeapon>({
    script_id: { type: Schema.Types.ObjectId, ref: 'Script', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    type: { type: String },
    category: { type: String },
    caliber: { type: String },
    source_details: { type: String },
    safety_notes: { type: String },
    visual_references: [{ type: String }],
    scenes_ids: [{ type: Schema.Types.ObjectId, ref: 'Scene' }],
    ai_notes: { type: String },
    user_notes: { type: String },
    metadata: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
});

// Middleware do aktualizacji `updatedAt` przy zapisie
WeaponSchema.pre<IWeapon>('save', function(this: IWeapon, next: Function) {
    this.metadata.updatedAt = new Date();
    next();
});

// Middleware do aktualizacji `updatedAt` przy findOneAndUpdate
WeaponSchema.pre<Query<IWeapon, IWeapon>>('findOneAndUpdate', function(this: Query<IWeapon, IWeapon>, next: Function) {
    this.set({ 'metadata.updatedAt': new Date() });
    next();
});

// Indeksy dla często wyszukiwanych pól
WeaponSchema.index({ script_id: 1, name: 1 });

export const Weapon = mongoose.model<IWeapon>('Weapon', WeaponSchema); 