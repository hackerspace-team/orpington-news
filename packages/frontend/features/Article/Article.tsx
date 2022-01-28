import React, { useCallback, useEffect, useRef } from 'react';
import {
  Box,
  CircularProgress,
  Heading,
  Icon,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { getUnixTime } from 'date-fns';
import { BiMessageAltError } from '@react-icons/all-files/bi/BiMessageAltError';
import {
  ArticleContent,
  ArticleHeader,
  ArticleMenuAction,
} from '@components/article';
import { useArticleDateReadMutation, useArticleDetails } from './queries';
import { ID } from '@orpington-news/shared';

export interface ArticleProps {
  collectionId: ID;
  itemSerialId: ID;

  onGoBackClicked?: () => void;
}

export const Article: React.FC<ArticleProps> = (props) => {
  const { collectionId, itemSerialId, onGoBackClicked } = props;

  const toast = useToast();

  const { mutate: mutateDateRead } = useArticleDateReadMutation(
    collectionId,
    itemSerialId
  );

  const query = useArticleDetails(collectionId, itemSerialId);

  useEffect(() => {
    if (query.data?.serialId) {
      mutateDateRead({
        id: query.data.serialId,
        dateRead: getUnixTime(new Date()),
      });
    }
  }, [query.data?.serialId, mutateDateRead]);

  const handleMenuItemClicked = useCallback(
    (action: ArticleMenuAction) => {
      if (action === 'markAsUnread') {
        if (query.data?.serialId) {
          mutateDateRead(
            {
              id: query.data.serialId,
              dateRead: null,
            },
            {
              onSuccess: () => {
                toast({
                  status: 'success',
                  description: 'Article marked as unread!',
                });
              },
            }
          );
        }
      }
    },
    [mutateDateRead, query.data?.serialId, toast]
  );

  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [query.data?.fullText]);

  if (query.status === 'error') {
    const status: number | undefined = query.error?.status;
    return (
      <VStack spacing={6} h="full" w="full" justify="center">
        <Icon as={BiMessageAltError} w={16} h="auto" />
        <Heading>
          {status === 404 ? 'Article not found.' : 'Unexpected error'}
        </Heading>
      </VStack>
    );
  }

  return query.status === 'loading' ? (
    <CircularProgress isIndeterminate />
  ) : query.status === 'success' ? (
    <VStack maxH="100vh" overflowY="auto" w="full" spacing={1} ref={ref}>
      <ArticleHeader
        article={query.data}
        onGoBackClicked={onGoBackClicked}
        onMenuItemClicked={handleMenuItemClicked}
      />
      <Box w="full" px={4} py={4}>
        <ArticleContent html={query.data.fullText} />
      </Box>
    </VStack>
  ) : null;
};
