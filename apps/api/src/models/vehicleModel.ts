import mongoose, { Schema, Document, Types, Query } from 'mongoose';

// --- Interfejs odpowiadający schematowi Pojazdu ---

export interface IVehicle extends Document {
    script_id: Types.ObjectId; // ID scenariusza, do którego należy pojazd
    name: string; // Nazwa/identyfikator pojazdu (np. "Ford Mustang GT Kasi", "Radiowóz #3")
    description?: string; // Opis pojazdu
    type?: string; // Typ pojazdu (np. "samochód osobowy", "motocykl", "ciężarówka", "rower")
    // Pola rozszerzone
    visual_characteristics?: string; // Charakterystyka wizualna (np. "czerwony, sportowy, zarysowany zderzak")
    availability_status?: 'available' | 'to_source' | 'rented' | 'unavailable' | null; // Status dostępności
    source_details?: string; // Szczegóły dotyczące źródła pozyskania
    action_props?: string; // Rekwizyty związane z akcją pojazdu (np. "ma być sprawny do pościgu", "ma eksplodować")
    scenes_ids?: Types.ObjectId[]; // Lista ID scen, w których występuje pojazd
    ai_notes?: string; // Dodatkowe notatki wygenerowane przez AI
    user_notes?: string; // Notatki dodane przez użytkownika
    metadata: {
        createdAt: Date;
        updatedAt: Date;
    };
}

// --- Schemat Mongoose dla Pojazdu ---

const VehicleSchema = new Schema<IVehicle>({
    script_id: { type: Schema.Types.ObjectId, ref: 'Script', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    type: { type: String },
    visual_characteristics: { type: String },
    availability_status: { type: String, enum: ['available', 'to_source', 'rented', 'unavailable', null] },
    source_details: { type: String },
    action_props: { type: String },
    scenes_ids: [{ type: Schema.Types.ObjectId, ref: 'Scene' }],
    ai_notes: { type: String },
    user_notes: { type: String },
    metadata: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    },
});

// Middleware do aktualizacji `updatedAt` przy zapisie
VehicleSchema.pre<IVehicle>('save', function(this: IVehicle, next: Function) {
    this.metadata.updatedAt = new Date();
    next();
});

// Middleware do aktualizacji `updatedAt` przy findOneAndUpdate
VehicleSchema.pre<Query<IVehicle, IVehicle>>('findOneAndUpdate', function(this: Query<IVehicle, IVehicle>, next: Function) {
    this.set({ 'metadata.updatedAt': new Date() });
    next();
});

// Indeksy dla często wyszukiwanych pól
VehicleSchema.index({ script_id: 1, name: 1 });

export const Vehicle = mongoose.model<IVehicle>('Vehicle', VehicleSchema); 