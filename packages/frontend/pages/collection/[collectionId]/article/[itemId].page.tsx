import React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { dehydrate, QueryClient } from 'react-query';
import { api, getCollections, getItemDetails } from '@api';
import { getSessionIdFromRequest, isLoginDisabled } from '@utils';
import { collectionKeys } from '@features/queryKeys';
import { getNumber } from '@utils/router';
import { useArticleDetails } from '@features/Article/queries';

const ItemPage: NextPage = () => {
  const router = useRouter();
  const collectionId = getNumber(router.query?.collectionId);
  const itemId = getNumber(router.query?.itemId);
  const { data: { title } = {} } = useArticleDetails(collectionId!, itemId!);

  return (
    <>
      <Head>
        <title>{title ? `${title} | Orpington News` : 'Orpington News'}</title>
      </Head>
    </>
  );
};

export default ItemPage;

export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
}) => {
  const cookies = req.headers.cookie ?? '';

  if (!isLoginDisabled()) {
    if (!req.cookies['sessionId']) {
      return {
        props: {
          cookies,
        },
        redirect: {
          destination: '/login',
        },
      };
    }
  }

  const collectionId = getNumber(query?.collectionId);
  const itemId = getNumber(query?.itemId);
  if (collectionId === undefined || itemId === undefined) {
    return { props: { cookies } };
  }

  const queryClient = new QueryClient();
  await Promise.all([
    queryClient.prefetchQuery(collectionKeys.tree, () =>
      getCollections(api.headers(getSessionIdFromRequest(req)))
    ),
    queryClient.prefetchQuery(collectionKeys.detail(collectionId, itemId), () =>
      getItemDetails(
        api.headers(getSessionIdFromRequest(req)),
        collectionId,
        itemId
      )
    ),
  ]);

  return {
    props: {
      cookies,
      dehydratedState: dehydrate(queryClient),
    },
  };
};
