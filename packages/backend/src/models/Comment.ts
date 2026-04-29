import mongoose, { Document as MongooseDocument, Schema, Model } from 'mongoose';

export interface IComment extends MongooseDocument {
  _id: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  parentId: mongoose.Types.ObjectId | null; // null = top-level, otherwise = reply
  isResolved: boolean;
  deletedAt: Date | null; // soft delete timestamp
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
commentSchema.index({ documentId: 1, createdAt: -1 });
commentSchema.index({ parentId: 1, createdAt: 1 });

const CommentModel: Model<IComment> = mongoose.model<IComment>(
  'Comment',
  commentSchema
);

export default CommentModel;