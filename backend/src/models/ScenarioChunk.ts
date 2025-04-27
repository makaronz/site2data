import mongoose, { Document, Schema } from 'mongoose';

export interface IScenarioChunk extends Document {
  id: string;
  index: number;
  title: string;
  text: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  parsed: any;
}

const ScenarioChunkSchema = new Schema<IScenarioChunk>(
  {
    id: { type: String, required: true, unique: true },
    index: { type: Number, required: true },
    title: { type: String, required: true },
    text: { type: String, required: true },
    status: { type: String, enum: ['pending', 'processing', 'done', 'error'], default: 'pending' },
    errorMessage: { type: String },
    parsed: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const ScenarioChunkModel = mongoose.model<IScenarioChunk>('ScenarioChunk', ScenarioChunkSchema); 