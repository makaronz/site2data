import mongoose, { Schema, Document, Types, Query } from 'mongoose';

// --- Interfejsy odpowiadające schematowi ---

export interface LightingInfo {
    variant?: 'day_natural' | 'evening_natural' | 'night_natural' | 'artificial' | 'mixed' | null;
    needs_extra_sources?: boolean;
    extra_sources_details?: string;
    emotional_note?: string;
}

export interface ProductionChecklist {
    has_risk?: boolean;
    has_children?: boolean;
    needs_permit?: boolean; // Zmienione z needs_permit_hint na bardziej konkretne pole
    has_animals?: boolean;
    is_night_scene?: boolean;
}

type SceneTag = 'dramatic' | 'animals' | 'technical_effect' | 'stunt' | 'vfx' | string;
type RiskTag = 'child' | 'animal' | 'weapon' | 'effect' | 'stunt' | string;

export interface IScene extends Document {
    script_id: Types.ObjectId;
    scene_number?: string | number;
    title?: string;
    content: string;
    description?: string;
    page_number?: number;
    int_ext: 'INT' | 'EXT' | null;
    location_id?: Types.ObjectId;
    day_time: 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN' | 'OTHER' | null;
    characters_ids?: Types.ObjectId[];
    props_ids?: Types.ObjectId[];
    vehicles_ids?: Types.ObjectId[];
    weapons_ids?: Types.ObjectId[];
    estimated_length_tag: 'short' | 'medium' | 'long' | null;
    scene_tags?: SceneTag[];
    lighting_info?: LightingInfo;
    risk_tags?: RiskTag[];
    production_checklist?: ProductionChecklist;
    mood?: string;
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        // Można dodać inne metadane, np. ai_analysis_version
    };
    // Można dodać metody instancji lub statyczne w razie potrzeby
}

// --- Schemat Mongoose ---

const LightingInfoSchema = new Schema<LightingInfo>({
    variant: { type: String, enum: ['day_natural', 'evening_natural', 'night_natural', 'artificial', 'mixed', null] },
    needs_extra_sources: { type: Boolean },
    extra_sources_details: { type: String },
    emotional_note: { type: String },
}, { _id: false }); // _id: false, bo to sub-dokument

const ProductionChecklistSchema = new Schema<ProductionChecklist>({
    has_risk: { type: Boolean },
    has_children: { type: Boolean },
    needs_permit: { type: Boolean }, // Pole do edycji przez użytkownika
    has_animals: { type: Boolean },
    is_night_scene: { type: Boolean },
}, { _id: false });

const SceneSchema = new Schema<IScene>({
    script_id: { type: Schema.Types.ObjectId, ref: 'Script', required: true, index: true }, // Zakładając, że istnieje model 'Script'
    scene_number: { type: Schema.Types.Mixed }, // Może być stringiem "1A" lub liczbą
    title: { type: String },
    content: { type: String, required: true },
    description: { type: String },
    page_number: { type: Number },
    int_ext: { type: String, enum: ['INT', 'EXT', null] },
    location_id: { type: Schema.Types.ObjectId, ref: 'Location' }, // Referencja do modelu Location
    day_time: { type: String, enum: ['DAY', 'NIGHT', 'DUSK', 'DAWN', 'OTHER', null] },
    characters_ids: [{ type: Schema.Types.ObjectId, ref: 'Character' }], // Referencje do modelu Character
    props_ids: [{ type: Schema.Types.ObjectId, ref: 'Prop' }],
    vehicles_ids: [{ type: Schema.Types.ObjectId, ref: 'Vehicle' }],
    weapons_ids: [{ type: Schema.Types.ObjectId, ref: 'Weapon' }],
    estimated_length_tag: { type: String, enum: ['short', 'medium', 'long', null] },
    scene_tags: [{ type: String }],
    lighting_info: LightingInfoSchema,
    risk_tags: [{ type: String }],
    production_checklist: ProductionChecklistSchema,
    mood: { type: String },
    metadata: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
});

// Middleware do aktualizacji `updatedAt` przy zapisie
SceneSchema.pre<IScene>('save', function(this: IScene, next: Function) {
    this.metadata.updatedAt = new Date();
    next();
});

// Middleware do aktualizacji `updatedAt` przy findByIdAndUpdate
// Uwaga: findByIdAndUpdate omija middleware 'save', potrzebny jest hook dla 'findOneAndUpdate'
SceneSchema.pre<Query<IScene, IScene>>('findOneAndUpdate', function(this: Query<IScene, IScene>, next: Function) {
    this.set({ 'metadata.updatedAt': new Date() });
    next();
});


// Indeksy dla często wyszukiwanych pól
SceneSchema.index({ script_id: 1, scene_number: 1 });

export const Scene = mongoose.model<IScene>('Scene', SceneSchema); 