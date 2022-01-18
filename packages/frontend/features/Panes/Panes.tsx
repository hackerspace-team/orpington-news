import { useCallback } from 'react';
import { useLocalStorage } from 'beautiful-react-hooks';
import { useRouter } from 'next/router';
import { Panes as PanesComponent } from '@components/panes';
import { MenuItem } from '@components/sidebar';
import { Collection, ID } from '@orpington-news/shared';
import { ActiveCollection } from '@components/collection/types';
import { Article } from '@features/Article';
import { useCollectionsTree, useCollectionItems } from './queries';
import { getNumber, getString } from '@utils/router';

export const Panes: React.FC = ({ children }) => {
  const router = useRouter();
  const collectionId = getNumber(router.query?.collectionId);
  const itemSlug = getString(router.query?.itemSlug);

  const { activeCollection, handleCollectionClicked, setActiveCollection } =
    useActiveCollection();
  const { expandedCollectionIDs, handleCollectionChevronClicked } =
    useExpandedCollections();

  const handleMenuItemClicked = useCallback(
    (item: MenuItem) => {
      if (item === 'home') {
        setActiveCollection({ id: 'home', title: 'Home' });
      }
    },
    [setActiveCollection]
  );

  const { data: collections, isError: collectionsError } = useCollectionsTree();

  const {
    fetchNextPage,
    isFetchingNextPage,
    isLoading: collectionItemsLoading,
    hasNextPage,
    allItems,
  } = useCollectionItems(activeCollection.id);

  const handleGoBack = useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <>
      <PanesComponent
        flexGrow={1}
        sidebarProps={{
          isError: collectionsError,
          collections: collections ?? [],
          onCollectionClicked: handleCollectionClicked,
          onChevronClicked: handleCollectionChevronClicked,
          onMenuItemClicked: handleMenuItemClicked,
          activeCollectionId: activeCollection.id,
          expandedCollectionIDs: expandedCollectionIDs,
        }}
        activeCollection={activeCollection}
        collectionItems={allItems}
        collectionListProps={{
          isFetchingMoreItems: collectionItemsLoading || isFetchingNextPage,
          onFetchMoreItems: fetchNextPage,
          canFetchMoreItems: hasNextPage,
        }}
        mainContent={
          itemSlug &&
          collectionId && (
            <Article
              collectionId={collectionId}
              itemSlug={itemSlug}
              onGoBackClicked={handleGoBack}
            />
          )
        }
      />
      {children}
    </>
  );
};

const useActiveCollection = () => {
  const [activeCollection, setActiveCollection] =
    useLocalStorage<ActiveCollection>('activeCollection', {
      id: 'home',
      title: 'Home',
    });

  const handleCollectionClicked = useCallback(
    (collection: Collection) => {
      setActiveCollection({ id: collection.id, title: collection.title });
    },
    [setActiveCollection]
  );

  return { activeCollection, handleCollectionClicked, setActiveCollection };
};

const useExpandedCollections = () => {
  const [expandedCollectionIDs, setExpandedCollectionIDs] = useLocalStorage<
    Array<ID>
  >('expandedCollectionIDs', []);

  const handleCollectionChevronClicked = useCallback(
    (collection: Collection) => {
      setExpandedCollectionIDs((collections) => {
        const idx = collections.findIndex((id) => id === collection.id);
        return idx !== -1
          ? [...collections.slice(0, idx), ...collections.slice(idx + 1)]
          : [...collections, collection.id];
      });
    },
    [setExpandedCollectionIDs]
  );

  return {
    expandedCollectionIDs,
    handleCollectionChevronClicked,
    setExpandedCollectionIDs,
  };
};
