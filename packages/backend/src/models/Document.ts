import mongoose, { Document as MongooseDocument, Schema, Model } from 'mongoose';

export interface ISharedUser {
  userId: mongoose.Types.ObjectId;
  role: 'editor' | 'viewer';
  sharedAt: Date;
}

export interface IDocument extends MongooseDocument {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  owner: mongoose.Types.ObjectId;
  version: number; // Version control for optimistic locking
  sharedWith: ISharedUser[];
  originalFileName?: string; // Original filename if uploaded
  fileType?: string; // File type (pdf, docx, xlsx, etc.)
  isFromUpload: boolean; // Whether document was created from file upload
  uploadedAt?: Date; // When the file was uploaded
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sharedWith: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['editor', 'viewer'],
          required: true,
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    originalFileName: {
      type: String,
      default: null,
    },
    fileType: {
      type: String,
      default: null,
    },
    isFromUpload: {
      type: Boolean,
      default: false,
    },
    uploadedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ owner: 1, updatedAt: -1 });
documentSchema.index({ 'sharedWith.userId': 1 });
// Text index for full-text search on title and content
documentSchema.index({ title: 'text', content: 'text' }, { default_language: 'english' });

const DocumentModel: Model<IDocument> = mongoose.model<IDocument>(
  'Document',
  documentSchema
);

export default DocumentModel;