import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import { DataIntegrityError, NotFoundError } from 'slonik';
import { getUnixTime } from 'date-fns';
import { pool } from '@db';
import {
  addCollection,
  DBCollection,
  deleteCollection,
  getCollectionChildrenIds,
  getCollectionOwner,
  getCollections,
  getCollectionsFromRootId,
  getCollectionsWithUrl,
  hasCollectionWithUrl,
  markCollectionAsRead,
  moveCollections,
  recalculateCollectionsOrder,
  setCollectionLayout,
  updateCollection,
} from '@db/collections';
import {
  DBCollectionItem,
  getAllCollectionItems,
  getCollectionItems,
  getItemDetails,
  setItemDateRead,
} from '@db/collectionItems';
import {
  getPreferences,
  pruneExpandedCollections,
  setHomeCollectionLayout,
} from '@db/preferences';
import { addPagination, PaginationParams, PaginationSchema } from '@db/common';
import {
  FlatCollection,
  CollectionIcons,
  CollectionItem,
  CollectionLayouts,
  defaultCollectionLayout,
} from '@orpington-news/shared';
import { disableCoercionAjv, normalizeUrl } from '@utils';
import { logger } from '@utils/logger';
import { timestampMsToSeconds } from '@utils/time';
import { fetchRSSJob, parser, updateCollections } from '@tasks/fetchRSS';

const PostCollection = Type.Object({
  title: Type.String(),
  icon: Type.Union(CollectionIcons.map((icon) => Type.Literal(icon))),
  parentId: Type.Optional(Type.Integer()),
  description: Type.Optional(Type.String()),
  url: Type.Optional(Type.String()),
  refreshInterval: Type.Integer(),
});

type PostCollectionType = Static<typeof PostCollection>;

const PutCollection = Type.Intersect([
  PostCollection,
  Type.Object({
    id: Type.Integer(),
  }),
]);
type PutCollectionType = Static<typeof PutCollection>;

const CollectionId = Type.Object({
  id: Type.Union([Type.Integer(), Type.Literal('home')]),
});
type CollectionIdType = Static<typeof CollectionId>;

const MoveCollection = Type.Object({
  collectionId: Type.Integer(),
  newParentId: Type.Union([Type.Integer(), Type.Null()]),
  newOrder: Type.Integer(),
});
type MoveCollectionType = Static<typeof MoveCollection>;

const ItemDetailsParams = Type.Object({
  id: Type.Integer(),
  itemId: Type.Number(),
});
type ItemDetailsType = Static<typeof ItemDetailsParams>;

const mapDBCollection = (collection: DBCollection): FlatCollection => {
  const { date_updated, refresh_interval, unread_count, layout, ...rest } =
    collection;

  return {
    ...rest,
    dateUpdated: date_updated,
    refreshInterval: refresh_interval,
    unreadCount: unread_count ?? 0,
    layout: layout ?? defaultCollectionLayout,
  };
};

const verifyCollectionOwner = async (
  request: FastifyRequest<{ Params: CollectionIdType }>,
  reply: FastifyReply
) => {
  const {
    params: { id },
    session: { userId },
  } = request;

  if (typeof id === 'number') {
    const owner = await pool.maybeOne(getCollectionOwner(id));
    if (owner !== null && owner.userId !== userId) {
      reply.status(403).send({ errorCode: 403, message: 'Access forbidden.' });
    }
  }
};

export const collections: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  fastify.addHook('preHandler', fastify.auth([fastify.verifySession]));

  fastify.get<{ Reply: Array<FlatCollection> }>(
    '/',
    {
      schema: {
        tags: ['Collections'],
      },
    },
    async (request, reply) => {
      const userId = request.session.userId;
      const collections = await pool.any(getCollections(userId));
      return collections.map(mapDBCollection);
    }
  );

  fastify.post<{ Body: PostCollectionType; Reply: boolean }>(
    '/',
    {
      schema: {
        body: PostCollection,
        tags: ['Collections'],
      },
    },
    async (request, reply) => {
      const {
        body,
        session: { userId },
      } = request;
      const preferences = await pool.one(getPreferences(userId));
      await pool.transaction(async (conn) => {
        await conn.any(
          addCollection(
            {
              ...body,
              layout: preferences.defaultCollectionLayout,
            },
            userId
          )
        );
        await conn.any(recalculateCollectionsOrder());
      });
      fetchRSSJob.start();
      return true;
    }
  );

  fastify.post<{ Body: MoveCollectionType; Reply: Array<FlatCollection> }>(
    '/move',
    {
      schema: {
        body: MoveCollection,
        tags: ['Collections'],
      },
      config: {
        schemaValidators: {
          body: disableCoercionAjv,
        },
      },
    },
    async (request, reply) => {
      const {
        body: { collectionId, newParentId, newOrder },
        session: { userId },
      } = request;

      await pool.any(moveCollections(collectionId, newParentId, newOrder));
      await pool.query(pruneExpandedCollections());
      const collections = await pool.any(getCollections(userId));
      return collections.map(mapDBCollection);
    }
  );

  fastify.put<{ Body: PutCollectionType; Reply: boolean }>(
    '/',
    {
      schema: {
        body: PutCollection,
        tags: ['Collections'],
      },
    },
    async (request, reply) => {
      const { body } = request;
      await pool.any(updateCollection(body));
      return true;
    }
  );

  fastify.delete<{ Params: CollectionIdType }>(
    '/:id',
    {
      schema: {
        params: CollectionId,
        tags: ['Collections'],
      },
      preHandler: verifyCollectionOwner,
    },
    async (request, reply) => {
      const {
        params: { id },
      } = request;
      if (id === 'home') {
        reply.status(500);
        return { errorCode: 500, message: 'Cannot DELETE home collection' };
      }

      const deletedIds = await pool.transaction(async (conn) => {
        const deletedIds = await conn.any(deleteCollection(id));
        await conn.any(recalculateCollectionsOrder());
        await conn.query(pruneExpandedCollections());
        return deletedIds;
      });

      return { ids: deletedIds.map(({ id }) => id) };
    }
  );

  fastify.post<{ Params: CollectionIdType }>(
    '/:id/markAsRead',
    {
      schema: {
        params: CollectionId,
        tags: ['Collections'],
      },
      preHandler: verifyCollectionOwner,
    },
    async (request, reply) => {
      const {
        params: { id },
      } = request;
      if (id === 'home') {
        reply.status(500);
        return {
          errorCode: 500,
          message: 'Cannot mark home collection as read',
        };
      }

      await pool.any(markCollectionAsRead(id, getUnixTime(new Date())));
      const children = await pool.any(getCollectionChildrenIds(id));
      return { ids: children.map(({ children_id }) => children_id) };
    }
  );

  fastify.get<{
    Params: CollectionIdType;
    Querystring: PaginationParams;
    Reply: readonly Omit<CollectionItem, 'fullText'>[];
  }>(
    '/:id/items',
    {
      schema: {
        params: CollectionId,
        querystring: PaginationSchema,
        tags: ['Collections'],
      },
      preHandler: verifyCollectionOwner,
    },
    async (request, reply) => {
      const {
        params: { id },
        query: pagination,
        session: { userId },
      } = request;
      const itemsQuery =
        id === 'home' ? getAllCollectionItems(userId) : getCollectionItems(id);
      const items = await pool.any<Omit<DBCollectionItem, 'full_text'>>(
        addPagination(pagination, itemsQuery)
      );

      return items.map((dbItem) => ({
        id: dbItem.id,
        url: dbItem.url,
        title: dbItem.title,
        summary: dbItem.summary,
        thumbnailUrl: dbItem.thumbnail_url ?? undefined,
        datePublished: dbItem.date_published,
        dateUpdated: dbItem.date_updated,
        dateRead: dbItem.date_read ?? undefined,
        categories: dbItem.categories ?? undefined,
        comments: dbItem.comments ?? undefined,
        readingTime: dbItem.reading_time,
        collection: {
          id: dbItem.collection_id,
          title: dbItem.collection_title,
          icon: dbItem.collection_icon,
        },
        onReadingList: false, // TODO
      }));
    }
  );

  fastify.get<{
    Params: ItemDetailsType;
  }>(
    '/:id/item/:itemId',
    {
      schema: {
        params: ItemDetailsParams,
        tags: ['Collections'],
      },
      preHandler: verifyCollectionOwner,
    },
    async (request, reply) => {
      const { params } = request;
      const { id, itemId } = params;

      try {
        const details = await pool.one(getItemDetails(id, itemId));
        const {
          full_text,
          date_published,
          date_read,
          date_updated,
          thumbnail_url,
          reading_time,
          collection_id,
          ...rest
        } = details;

        return {
          ...rest,
          fullText: full_text,
          datePublished: timestampMsToSeconds(date_published),
          dateRead: timestampMsToSeconds(date_read),
          dateUpdated: timestampMsToSeconds(date_updated),
          thumbnailUrl: thumbnail_url,
          readingTime: reading_time,
        };
      } catch (error) {
        if (error instanceof NotFoundError) {
          logger.error(
            `Items details for collection '${id}' and item '${itemId}' not found.`
          );
          reply
            .status(404)
            .send({ errorCode: 404, message: 'Item not found.' });
        } else if (error instanceof DataIntegrityError) {
          logger.error(
            'There is more than one row matching the select criteria.'
          );
          reply.status(500).send({ errorCode: 500, message: 'Server error.' });
        }
      }
    }
  );

  const DateReadBody = Type.Object({
    dateRead: Type.Union([Type.Null(), Type.Number()]),
  });
  fastify.put<{
    Params: ItemDetailsType;
    Body: Static<typeof DateReadBody>;
  }>(
    '/:id/item/:itemId/dateRead',
    {
      schema: {
        params: ItemDetailsParams,
        body: DateReadBody,
        tags: ['Collections'],
      },
      preHandler: verifyCollectionOwner,
    },
    async (request, reply) => {
      const {
        params: { id, itemId },
        body: { dateRead },
      } = request;

      await pool.any(setItemDateRead(id, itemId, dateRead));
      return true;
    }
  );

  fastify.post<{ Params: Static<typeof CollectionId> }>(
    '/:id/refresh',
    {
      schema: {
        params: CollectionId,
        tags: ['Collections'],
      },
      preHandler: verifyCollectionOwner,
    },
    async (request, reply) => {
      const {
        params: { id },
      } = request;

      const collections = await pool.any(
        id === 'home' ? getCollectionsWithUrl() : getCollectionsFromRootId(id)
      );
      const result = await updateCollections(collections);

      if (result) {
        if (id === 'home') {
          const children = await pool.any(getCollectionsWithUrl());
          return { ids: children.map(({ id }) => id) };
        } else {
          const children = await pool.any(getCollectionChildrenIds(id));
          return { ids: children.map(({ children_id }) => children_id) };
        }
      } else {
        const noun = collections.length > 1 ? 'Feeds' : 'Feed';
        reply
          .status(500)
          .send({ errorCode: 500, message: `${noun} failed to refresh.` });
      }
    }
  );

  const LayoutBody = Type.Object({
    layout: Type.Union(CollectionLayouts.map((layout) => Type.Literal(layout))),
  });

  fastify.put<{
    Params: Static<typeof CollectionId>;
    Body: Static<typeof LayoutBody>;
  }>(
    '/:id/layout',
    {
      schema: {
        params: CollectionId,
        body: LayoutBody,
        tags: ['Collections'],
      },
      preHandler: verifyCollectionOwner,
    },
    async (request, reply) => {
      const {
        body: { layout },
        params: { id },
        session: { userId },
      } = request;

      if (typeof id === 'number') {
        await pool.query(setCollectionLayout(id, layout));
      } else if (id === 'home') {
        await pool.query(setHomeCollectionLayout(layout, userId));
      }

      return true;
    }
  );

  const VerifyURLParams = Type.Object({
    url: Type.String(),
  });

  fastify.post<{
    Body: Static<typeof VerifyURLParams>;
  }>(
    '/verifyUrl',
    {
      schema: {
        body: VerifyURLParams,
        tags: ['Collections'],
      },
    },
    async (request, reply) => {
      const {
        body: { url },
        session: { userId },
      } = request;

      const normalizedUrl = normalizeUrl(url);

      const isUrlAlreadyUsed = await pool.exists(
        hasCollectionWithUrl(normalizedUrl, userId)
      );
      if (isUrlAlreadyUsed) {
        return reply
          .status(418)
          .send({ errorCode: 418, message: 'Duplicate feed URL.' });
      }

      try {
        const feed = await parser.parseURL(normalizedUrl);
        reply.status(200).send({
          title: feed.title,
          description: feed.description || feed.subtitle,
        });
      } catch (err) {
        reply
          .status(418)
          .send({ errorCode: 418, message: 'Invalid RSS/Atom feed.' });
      }
    }
  );
};
