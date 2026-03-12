import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    provider?: string;
    providerId?: string;
    targetRole: string;
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    provider: { type: String },
    providerId: { type: String },
    targetRole: { type: String, default: 'Backend Developer' },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
