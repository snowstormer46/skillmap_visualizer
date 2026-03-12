import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISkill extends Document {
    userId: Types.ObjectId;
    name: string;
    level: string;
    category: string;
}

const SkillSchema = new Schema<ISkill>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    level: { type: String, default: 'Beginner' },
    category: { type: String, default: 'General' },
}, { timestamps: true });

export default mongoose.model<ISkill>('Skill', SkillSchema);
