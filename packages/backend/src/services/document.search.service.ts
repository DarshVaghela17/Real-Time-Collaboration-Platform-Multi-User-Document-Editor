import DocumentModel from '../models/Document';

export class DocumentSearchService {
  /**
   * Search documents by text (title and content)
   * Uses MongoDB full-text search index
   *
   * @param query - Search query text
   * @param userId - User ID to filter by (owner or shared access)
   * @param limit - Max results (default 20)
   * @param skip - Offset for pagination (default 0)
   * @returns Array of matching documents
   */
  async searchDocuments(
    query: string,
    userId: string,
    limit: number = 20,
    skip: number = 0
  ) {
    try {
      if (!query || query.trim().length === 0) {
        throw new Error('Search query cannot be empty');
      }

      // Validate and limit parameters
      const validLimit = Math.min(Math.max(1, limit), 100); // 1-100
      const validSkip = Math.max(0, skip);

      // MongoDB text search query
      const results = await DocumentModel.find(
        {
          // Full-text search
          $text: { $search: query },
          // Filter by ownership or shared access
          $or: [
            { owner: userId },
            { 'sharedWith.userId': userId },
          ],
        },
        {
          // Include text search score for relevance sorting
          score: { $meta: 'textScore' },
        }
      )
        .sort({ score: { $meta: 'textScore' }, updatedAt: -1 })
        .limit(validLimit)
        .skip(validSkip)
        .lean();

      // Get total count for pagination
      const total = await DocumentModel.countDocuments({
        $text: { $search: query },
        $or: [
          { owner: userId },
          { 'sharedWith.userId': userId },
        ],
      });

      // Format results
      const formattedResults = results.map((doc: any) => ({
        id: doc._id.toString(),
        title: doc.title,
        content: doc.content,
        owner: doc.owner.toString(),
        version: doc.version,
        relevanceScore: doc.score, // Text search relevance score
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));

      return {
        results: formattedResults,
        total,
        limit: validLimit,
        skip: validSkip,
        hasMore: validSkip + validLimit < total,
      };
    } catch (error: any) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Search with advanced filters
   * @param query - Search text
   * @param userId - User ID
   * @param filters - Additional filters (owner, createdAfter, etc.)
   */
  async searchWithFilters(
    query: string,
    userId: string,
    filters?: {
      ownerOnly?: boolean;
      createdAfter?: Date;
      createdBefore?: Date;
      updatedAfter?: Date;
      updatedBefore?: Date;
      minLength?: number;
      maxLength?: number;
    },
    limit: number = 20,
    skip: number = 0
  ) {
    try {
      if (!query || query.trim().length === 0) {
        throw new Error('Search query cannot be empty');
      }

      // Build filter query
      const filterQuery: any = {
        $text: { $search: query },
      };

      // Access filter
      if (filters?.ownerOnly) {
        filterQuery.owner = userId;
      } else {
        filterQuery.$or = [
          { owner: userId },
          { 'sharedWith.userId': userId },
        ];
      }

      // Date filters
      if (filters?.createdAfter || filters?.createdBefore) {
        filterQuery.createdAt = {};
        if (filters.createdAfter) {
          filterQuery.createdAt.$gte = filters.createdAfter;
        }
        if (filters.createdBefore) {
          filterQuery.createdAt.$lte = filters.createdBefore;
        }
      }

      if (filters?.updatedAfter || filters?.updatedBefore) {
        filterQuery.updatedAt = {};
        if (filters.updatedAfter) {
          filterQuery.updatedAt.$gte = filters.updatedAfter;
        }
        if (filters.updatedBefore) {
          filterQuery.updatedAt.$lte = filters.updatedBefore;
        }
      }

      // Content length filters
      if (filters?.minLength || filters?.maxLength) {
        // Note: MongoDB doesn't have direct string length filtering, so we do post-processing
        // For better performance, consider denormalizing content length
      }

      const validLimit = Math.min(Math.max(1, limit), 100);
      const validSkip = Math.max(0, skip);

      // Execute search
      const results = await DocumentModel.find(filterQuery, {
        score: { $meta: 'textScore' },
      })
        .sort({ score: { $meta: 'textScore' }, updatedAt: -1 })
        .limit(validLimit)
        .skip(validSkip)
        .lean();

      // Apply length filters if specified
      let filtered = results;
      if (filters?.minLength || filters?.maxLength) {
        filtered = results.filter((doc: any) => {
          const contentLength = doc.content?.length || 0;
          if (filters.minLength && contentLength < filters.minLength) return false;
          if (filters.maxLength && contentLength > filters.maxLength) return false;
          return true;
        });
      }

      const total = await DocumentModel.countDocuments(filterQuery);

      const formattedResults = filtered.map((doc: any) => ({
        id: doc._id.toString(),
        title: doc.title,
        content: doc.content.substring(0, 200) + '...', // Preview
        owner: doc.owner.toString(),
        version: doc.version,
        relevanceScore: doc.score,
        contentLength: doc.content?.length || 0,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));

      return {
        results: formattedResults,
        total,
        limit: validLimit,
        skip: validSkip,
        hasMore: validSkip + validLimit < total,
      };
    } catch (error: any) {
      throw new Error(`Advanced search failed: ${error.message}`);
    }
  }

  /**
   * Get search suggestions (auto-complete)
   * Returns unique document titles that match partial query
   */
  async getSearchSuggestions(query: string, userId: string, limit: number = 10) {
    try {
      if (!query || query.trim().length === 0) {
        return { suggestions: [] };
      }

      // Use regex for prefix matching (more efficient for suggestions)
      const regex = new RegExp(`^${query.trim()}`, 'i');

      const suggestions = await DocumentModel.find(
        {
          title: regex,
          $or: [
            { owner: userId },
            { 'sharedWith.userId': userId },
          ],
        }
      )
        .select('title')
        .limit(limit)
        .lean()
        .exec();

      const uniqueTitles = [...new Set(suggestions.map((doc: any) => doc.title))];

      return { suggestions: uniqueTitles };
    } catch (error: any) {
      throw new Error(`Failed to get suggestions: ${error.message}`);
    }
  }

  /**
   * Get similar documents based on content
   * Uses MongoDB text search with partial relevance
   */
  async getSimilarDocuments(documentId: string, userId: string, limit: number = 5) {
    try {
      // Get the original document
      const originalDoc = await DocumentModel.findById(documentId);

      if (!originalDoc) {
        throw new Error('Document not found');
      }

      // Check access
      const hasAccess =
        originalDoc.owner.toString() === userId ||
        originalDoc.sharedWith.some((s: any) => s.userId.toString() === userId);

      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Search by content keywords
      const keywords = originalDoc.title.split(' ').slice(0, 5).join(' ');

      const similar = await DocumentModel.find(
        {
          _id: { $ne: documentId },
          $text: { $search: keywords },
          $or: [
            { owner: userId },
            { 'sharedWith.userId': userId },
          ],
        },
        {
          score: { $meta: 'textScore' },
        }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean();

      return similar.map((doc: any) => ({
        id: doc._id.toString(),
        title: doc.title,
        owner: doc.owner.toString(),
        relevanceScore: doc.score,
        updatedAt: doc.updatedAt,
      }));
    } catch (error: any) {
      throw new Error(`Failed to get similar documents: ${error.message}`);
    }
  }
}

export default new DocumentSearchService();
