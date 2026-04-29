import VersionModel from '../models/Version';
import DocumentModel from '../models/Document';
import User from '../models/User';

export interface VersionResponse {
  id: string;
  documentId: string;
  content: string;
  title: string;
  createdBy: string;
  createdByName: string;
  versionNumber: number;
  createdAt: Date;
}

export class VersionService {
  /**
   * Create a new version snapshot
   */
  async createVersion(
    documentId: string,
    userId: string
  ): Promise<VersionResponse> {
    const document = await DocumentModel.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Get latest version number
    const latestVersion = await VersionModel.findOne({ documentId })
      .sort({ versionNumber: -1 })
      .limit(1);

    const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Create version
    const version = await VersionModel.create({
      documentId,
      content: document.content,
      title: document.title,
      createdBy: userId,
      versionNumber,
    });

    const user = await User.findById(userId);

    return {
      id: version._id.toString(),
      documentId: version.documentId.toString(),
      content: version.content,
      title: version.title,
      createdBy: version.createdBy.toString(),
      createdByName: user?.name || 'Unknown',
      versionNumber: version.versionNumber,
      createdAt: version.createdAt,
    };
  }

  /**
   * Get all versions for a document
   */
  async getDocumentVersions(documentId: string): Promise<VersionResponse[]> {
    const versions = await VersionModel.find({ documentId })
      .sort({ versionNumber: -1 })
      .lean();

    const userIds = [...new Set(versions.map((v) => v.createdBy.toString()))];
    const users = await User.find({ _id: { $in: userIds } });
    const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));

    return versions.map((v) => ({
      id: v._id.toString(),
      documentId: v.documentId.toString(),
      content: v.content,
      title: v.title,
      createdBy: v.createdBy.toString(),
      createdByName: userMap.get(v.createdBy.toString()) || 'Unknown',
      versionNumber: v.versionNumber,
      createdAt: v.createdAt,
    }));
  }

  /**
   * Get a specific version
   */
  async getVersion(versionId: string): Promise<VersionResponse> {
    const version = await VersionModel.findById(versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    const user = await User.findById(version.createdBy);

    return {
      id: version._id.toString(),
      documentId: version.documentId.toString(),
      content: version.content,
      title: version.title,
      createdBy: version.createdBy.toString(),
      createdByName: user?.name || 'Unknown',
      versionNumber: version.versionNumber,
      createdAt: version.createdAt,
    };
  }

  /**
   * Restore a version
   */
  async restoreVersion(
    versionId: string,
    userId: string
  ): Promise<{ document: any; newVersion: VersionResponse }> {
    const oldVersion = await VersionModel.findById(versionId);
    if (!oldVersion) {
      throw new Error('Version not found');
    }

    // Update document
    const document = await DocumentModel.findById(oldVersion.documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    document.content = oldVersion.content;
    document.title = oldVersion.title;
    await document.save();

    // Create new version from restore
    const newVersion = await this.createVersion(
      oldVersion.documentId.toString(),
      userId
    );

    return {
      document: {
        id: document._id.toString(),
        title: document.title,
        content: document.content,
        owner: document.owner.toString(),
        updatedAt: document.updatedAt,
      },
      newVersion,
    };
  }
}

export default new VersionService();