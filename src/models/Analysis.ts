import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAnalysis extends Document {
    userId: Types.ObjectId;
    targetRole: string;
    matchScore: number;
    date: string;
    extractedSkills: string[];
    missingSkills: string[];
    recommendedProjects: any[];
    isArchived: boolean;
}

const AnalysisSchema = new Schema<IAnalysis>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetRole: { type: String, required: true },
    matchScore: { type: Number, default: 0 },
    date: { type: String, default: () => new Date().toISOString() },
    extractedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    recommendedProjects: { type: [], default: [] },
    isArchived: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IAnalysis>('Analysis', AnalysisSchema);
