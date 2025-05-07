import mongoose, { Schema, Document, Types, Query } from 'mongoose';

// --- Interfejs odpowiadający schematowi Lokacji ---

export interface ILocation extends Document {
    script_id: Types.ObjectId; // ID scenariusza, do którego należy lokacja
    name: string; // Nazwa lokacji (np. "Mieszkanie Janka", "Las Kabacki")
    description?: string; // Opis lokacji
    type?: 'interior' | 'exterior' | 'interior_exterior' | 'other' | null; // Typ lokacji
    address_details?: string; // Szczegóły adresu, jeśli dotyczy
    // Pola rozszerzone
    technical_requirements?: string; // Wymagania techniczne dotyczące filmowania w tej lokacji
    logistic_notes?: string; // Notatki logistyczne (np. dostęp, parking, pozwolenia)
    scenes_ids?: Types.ObjectId[]; // Lista ID scen, które dzieją się w tej lokacji
    ai_notes?: string; // Dodatkowe notatki wygenerowane przez AI
    user_notes?: string; // Notatki dodane przez użytkownika
    metadata: {
        createdAt: Date;
        updatedAt: Date;
    };
}

// --- Schemat Mongoose dla Lokacji ---

const LocationSchema = new Schema<ILocation>({
    script_id: { type: Schema.Types.ObjectId, ref: 'Script', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    type: { type: String, enum: ['interior', 'exterior', 'interior_exterior', 'other', null] },
    address_details: { type: String },
    technical_requirements: { type: String },
    logistic_notes: { type: String },
    scenes_ids: [{ type: Schema.Types.ObjectId, ref: 'Scene' }],
    ai_notes: { type: String },
    user_notes: { type: String },
    metadata: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
});

// Middleware do aktualizacji `updatedAt` przy zapisie
LocationSchema.pre<ILocation>('save', function(this: ILocation, next: Function) {
    this.metadata.updatedAt = new Date();
    next();
});

// Middleware do aktualizacji `updatedAt` przy findOneAndUpdate
LocationSchema.pre<Query<ILocation, ILocation>>('findOneAndUpdate', function(this: Query<ILocation, ILocation>, next: Function) {
    this.set({ 'metadata.updatedAt': new Date() });
    next();
});

// Indeksy dla często wyszukiwanych pól
LocationSchema.index({ script_id: 1, name: 1 });

export const Location = mongoose.model<ILocation>('Location', LocationSchema); 