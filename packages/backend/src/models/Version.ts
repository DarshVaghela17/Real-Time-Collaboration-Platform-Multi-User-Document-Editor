import mongoose, { Document as MongooseDocument, Schema, Model } from 'mongoose';

export interface IVersion extends MongooseDocument {
  _id: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  content: string;
  title: string;
  createdBy: mongoose.Types.ObjectId;
  versionNumber: number;
  createdAt: Date;
}

const versionSchema = new Schema<IVersion>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

versionSchema.index({ documentId: 1, versionNumber: -1 });

const VersionModel: Model<IVersion> = mongoose.model<IVersion>(
  'Version',
  versionSchema
);

export default VersionModel;