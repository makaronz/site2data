import mongoose, { Schema, Document, Types, Query } from 'mongoose';

// --- Interfejs odpowiadający schematowi Rekwizytu ---

export interface IProp extends Document {
    script_id: Types.ObjectId; // ID scenariusza, do którego należy rekwizyt
    name: string; // Nazwa rekwizytu
    description?: string; // Opis rekwizytu
    category?: string; // Kategoria rekwizytu (np. "mebel", "elektronika", "dekoracja")
    quantity?: number; // Wymagana ilość
    // Pola rozszerzone
    availability_status?: 'available' | 'to_source' | 'in_making' | 'problematic' | null; // Status dostępności
    source_details?: string; // Szczegóły dotyczące źródła pozyskania (np. wypożyczalnia X, sklep Y, zrobić)
    visual_references?: string[]; // Tablica URL-i do referencji wizualnych
    placement_notes?: string; // Notatki dotyczące umiejscowienia rekwizytu w scenie/lokacji
    scenes_ids?: Types.ObjectId[]; // Lista ID scen, w których występuje rekwizyt
    ai_notes?: string; // Dodatkowe notatki wygenerowane przez AI
    user_notes?: string; // Notatki dodane przez użytkownika
    metadata: {
        createdAt: Date;
        updatedAt: Date;
    };
}

// --- Schemat Mongoose dla Rekwizytu ---

const PropSchema = new Schema<IProp>({
    script_id: { type: Schema.Types.ObjectId, ref: 'Script', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String },
    quantity: { type: Number, default: 1 },
    availability_status: { type: String, enum: ['available', 'to_source', 'in_making', 'problematic', null] },
    source_details: { type: String },
    visual_references: [{ type: String }],
    placement_notes: { type: String },
    scenes_ids: [{ type: Schema.Types.ObjectId, ref: 'Scene' }],
    ai_notes: { type: String },
    user_notes: { type: String },
    metadata: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
});

// Middleware do aktualizacji `updatedAt` przy zapisie
PropSchema.pre<IProp>('save', function(this: IProp, next: Function) {
    this.metadata.updatedAt = new Date();
    next();
});

// Middleware do aktualizacji `updatedAt` przy findOneAndUpdate
PropSchema.pre<Query<IProp, IProp>>('findOneAndUpdate', function(this: Query<IProp, IProp>, next: Function) {
    this.set({ 'metadata.updatedAt': new Date() });
    next();
});

// Indeksy dla często wyszukiwanych pól
PropSchema.index({ script_id: 1, name: 1 });

export const Prop = mongoose.model<IProp>('Prop', PropSchema); 