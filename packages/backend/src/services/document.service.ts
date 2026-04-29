import DocumentModel from '../models/Document';
import User from '../models/User';

export class DocumentService {
  // Create document
  async create(userId: string, title: string, content: string = '') {
    const document = await DocumentModel.create({
      title,
      content,
      owner: userId,
      version: 1, // Start at version 1
      isFromUpload: false,
    });

    return {
      id: document._id.toString(),
      title: document.title,
      content: document.content,
      owner: document.owner.toString(),
      version: document.version,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  // Create document from file upload
  async createFromUpload(
    userId: string,
    title: string,
    content: string,
    originalFileName: string,
    fileType: string
  ) {
    console.log(`📄 Creating document from upload: ${title}`);
    console.log(`   File: ${originalFileName} (${fileType})`);
    console.log(`   Content length: ${content.length} bytes`);
    console.log(`   Content preview: ${content.substring(0, 200)}...`);

    const document = await DocumentModel.create({
      title,
      content,
      owner: userId,
      version: 1,
      isFromUpload: true,
      originalFileName,
      fileType,
      uploadedAt: new Date(),
    });

    return {
      id: document._id.toString(),
      _id: document._id.toString(), // Include _id for compatibility
      title: document.title,
      content: document.content,
      owner: document.owner.toString(),
      version: document.version,
      originalFileName: document.originalFileName,
      fileType: document.fileType,
      isFromUpload: document.isFromUpload,
      uploadedAt: document.uploadedAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  async shareDocument(
    documentId: string,
    email: string,
    role: 'editor' | 'viewer'
  ) {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new Error('User with this email not found');
    }

    const document = await DocumentModel.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Check if already shared
    const alreadyShared = document.sharedWith.some(
      (share) => share.userId.toString() === user._id.toString()
    );

    if (alreadyShared) {
      throw new Error('Document already shared with this user');
    }

    // Check if sharing with owner
    if (document.owner.toString() === user._id.toString()) {
      throw new Error('Cannot share document with yourself');
    }

    // Add to sharedWith
    document.sharedWith.push({
      userId: user._id,
      role,
      sharedAt: new Date(),
    });

    await document.save();

    return {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role,
      sharedAt: new Date(),
    };
  }

  /**
   * Remove user from shared list
   */
  async unshareDocument(documentId: string, userId: string) {
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    document.sharedWith = document.sharedWith.filter(
      (share) => share.userId.toString() !== userId
    );

    await document.save();
  }

  /**
   * Get all users document is shared with
   */
  async getSharedUsers(documentId: string) {
    const document = await DocumentModel.findById(documentId).populate(
      'sharedWith.userId',
      'name email'
    );

    if (!document) {
      throw new Error('Document not found');
    }

    return document.sharedWith.map((share: any) => ({
      userId: share.userId._id.toString(),
      name: share.userId.name,
      email: share.userId.email,
      role: share.role,
      sharedAt: share.sharedAt,
    }));
  }

  /**
   * Get user's access level to document
   */
  async getUserAccess(
    documentId: string,
    userId: string
  ): Promise<'owner' | 'editor' | 'viewer' | null> {
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      return null;
    }

    // Check if owner
    if (document.owner.toString() === userId) {
      return 'owner';
    }

    // Check if shared
    const share = document.sharedWith.find(
      (s) => s.userId.toString() === userId
    );

    return share ? share.role : null;
  }

  /**
   * Check if user has access to document
   */
  async hasAccess(documentId: string, userId: string): Promise<boolean> {
    const access = await this.getUserAccess(documentId, userId);
    return access !== null;
  }

  /**
   * Check if user can edit document
   */
  async canEdit(documentId: string, userId: string): Promise<boolean> {
    const access = await this.getUserAccess(documentId, userId);
    return access === 'owner' || access === 'editor';
  }

  /**
   * Get all documents accessible by user (owned + shared)
   */
  async getUserAccessibleDocuments(userId: string) {
    const ownedDocs = await DocumentModel.find({ owner: userId })
      .sort({ updatedAt: -1 })
      .lean();

    const sharedDocs = await DocumentModel.find({
      'sharedWith.userId': userId,
    })
      .sort({ updatedAt: -1 })
      .lean();

    const formatDoc = (doc: any, accessLevel: string) => ({
      id: doc._id.toString(),
      title: doc.title,
      content: doc.content,
      owner: doc.owner.toString(),
      version: doc.version,
      accessLevel,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });

    const owned = ownedDocs.map((doc) => formatDoc(doc, 'owner'));

    const shared = sharedDocs.map((doc) => {
      const share = doc.sharedWith.find(
        (s: any) => s.userId.toString() === userId
      );
      return formatDoc(doc, share?.role || 'viewer');
    });

    return {
      owned,
      shared,
      all: [...owned, ...shared],
    };
  }

  // Get all user's documents
  async findByOwner(userId: string) {
    const documents = await DocumentModel.find({ owner: userId })
      .sort({ updatedAt: -1 })
      .lean();

    return documents.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      content: doc.content,
      owner: doc.owner.toString(),
      version: doc.version,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }

  // Get single document
  async findById(documentId: string) {
    const document = await DocumentModel.findById(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    return {
      id: document._id.toString(),
      title: document.title,
      content: document.content,
      owner: document.owner.toString(),
      version: document.version,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  /**
   * Update document with version control
   * @param documentId - Document ID to update
   * @param title - New title (optional)
   * @param content - New content (optional)
   * @param currentVersion - Current version from client (must match to update)
   * @returns Updated document with new version
   * @throws Error if version mismatch (optimistic locking)
   */
  async update(
    documentId: string,
    title?: string,
    content?: string,
    currentVersion?: number
  ) {
    const document = await DocumentModel.findById(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    // Version control: Check if client version matches server version
    if (currentVersion !== undefined && document.version !== currentVersion) {
      throw new Error(
        `Version mismatch. Expected version ${document.version}, got ${currentVersion}. Document was modified by another user.`
      );
    }

    // Update fields
    if (title !== undefined) document.title = title;
    if (content !== undefined) document.content = content;

    // Increment version after successful update
    document.version += 1;

    await document.save();

    return {
      id: document._id.toString(),
      title: document.title,
      content: document.content,
      owner: document.owner.toString(),
      version: document.version,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  // Delete document
  async delete(documentId: string) {
    const result = await DocumentModel.findByIdAndDelete(documentId);

    if (!result) {
      throw new Error('Document not found');
    }
  }

  // Check ownership
  async isOwner(documentId: string, userId: string): Promise<boolean> {
    const document = await DocumentModel.findById(documentId);
    return document ? document.owner.toString() === userId : false;
  }
}

export default new DocumentService();