import mongoose, { Schema, Document, Types, Query } from 'mongoose';

// --- Interfejs odpowiadający schematowi Postaci ---

export interface ICharacter extends Document {
    script_id: Types.ObjectId; // ID scenariusza, do którego należy postać
    name: string; // Imię/nazwa postaci
    description?: string; // Ogólny opis postaci
    // Pola rozszerzone, które mogą być wypełniane przez AI lub użytkownika
    character_arc_notes?: string; // Notatki dotyczące rozwoju postaci, jej celów, motywacji
    relationships?: {
        character_id: Types.ObjectId; // ID innej postaci
        relationship_type: string; // np. "przyjaciel", "wróg", "matka", "syn"
        description?: string; // Krótki opis relacji
    }[];
    first_scene_id?: Types.ObjectId; // ID pierwszej sceny, w której pojawia się postać
    last_scene_id?: Types.ObjectId; // ID ostatniej sceny, w której pojawia się postać
    scenes_ids?: Types.ObjectId[]; // Lista ID scen, w których występuje postać
    ai_notes?: string; // Dodatkowe notatki wygenerowane przez AI
    user_notes?: string; // Notatki dodane przez użytkownika
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        // Można dodać inne metadane, np. ai_analysis_version
    };
    // Można dodać metody instancji lub statyczne w razie potrzeby
}

// --- Schemat Mongoose dla Postaci ---

const CharacterSchema = new Schema<ICharacter>({
    script_id: { type: Schema.Types.ObjectId, ref: 'Script', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    character_arc_notes: { type: String },
    relationships: [{
        character_id: { type: Schema.Types.ObjectId, ref: 'Character' },
        relationship_type: { type: String },
        description: { type: String },
        _id: false // Nie potrzebujemy osobnego _id dla zagnieżdżonych obiektów relacji
    }],
    first_scene_id: { type: Schema.Types.ObjectId, ref: 'Scene' },
    last_scene_id: { type: Schema.Types.ObjectId, ref: 'Scene' },
    scenes_ids: [{ type: Schema.Types.ObjectId, ref: 'Scene' }],
    ai_notes: { type: String },
    user_notes: { type: String },
    metadata: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
});

// Middleware do aktualizacji `updatedAt` przy zapisie
CharacterSchema.pre<ICharacter>('save', function(this: ICharacter, next: Function) {
    this.metadata.updatedAt = new Date();
    next();
});

// Middleware do aktualizacji `updatedAt` przy findOneAndUpdate
CharacterSchema.pre<Query<ICharacter, ICharacter>>('findOneAndUpdate', function(this: Query<ICharacter, ICharacter>, next: Function) {
    this.set({ 'metadata.updatedAt': new Date() });
    next();
});

// Indeksy dla często wyszukiwanych pól
CharacterSchema.index({ script_id: 1, name: 1 });

export const Character = mongoose.model<ICharacter>('Character', CharacterSchema); 