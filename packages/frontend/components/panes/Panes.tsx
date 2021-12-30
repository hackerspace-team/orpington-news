import React, { useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  HStack,
  IconButton,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { Resizable, ResizeCallback } from 're-resizable';
import { IoReturnUpBack } from 'react-icons/io5';
import { FeedHeader } from '@components/feed/header';
import { Collection, CollectionItem } from '@components/feed/types';
import {
  CollectionList,
  CollectionListProps,
} from '@components/feed/collection';
import { EmptyMain } from './EmptyMain';

export interface PanesProps {
  sidebar: JSX.Element;

  collectionItems: CollectionItem[];
  activeCollection: Collection;
  collectionListProps: Pick<
    CollectionListProps,
    'isFetchingMoreItems' | 'canFetchMoreItems' | 'onFetchMoreItems'
  >;

  mainContent?: JSX.Element;

  sidebarWidth?: number;
  onSidebarWidthChanged?: (width: number) => void;

  collectionItemsWidth?: number;
  onCollectionItemsWidthChanged?: (width: number) => void;

  onGoBackClicked?: () => void;
}

export const Panes: React.FC<PanesProps> = (props) => {
  const {
    sidebar,
    collectionItems,
    activeCollection,
    collectionListProps = {},

    mainContent,

    sidebarWidth,
    onSidebarWidthChanged,

    collectionItemsWidth,
    onCollectionItemsWidthChanged,

    onGoBackClicked,
  } = props;

  const { isOpen, onClose, onToggle } = useDisclosure();
  const drawerButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleSidebarResize: ResizeCallback = useCallback(
    (e, dir, elementRef, d) => {
      onSidebarWidthChanged?.(elementRef.clientWidth);
    },
    [onSidebarWidthChanged]
  );
  const handleCollectionItemsResize: ResizeCallback = useCallback(
    (e, dir, elementRef, d) => {
      onCollectionItemsWidthChanged?.(elementRef.clientWidth);
    },
    [onCollectionItemsWidthChanged]
  );

  const items = useMemo(
    () => (
      <CollectionList
        layout="magazine"
        items={collectionItems}
        px={3}
        mt={3}
        flex="1 1 0"
        h="full"
        {...collectionListProps}
      />
    ),
    [collectionItems, collectionListProps]
  );

  return (
    <>
      <Drawer isOpen={isOpen} placement="left" size="full" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerBody p={0}>{sidebar}</DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Desktop view */}
      <HStack
        alignItems="stretch"
        h="full"
        display={{ base: 'none', lg: 'flex' }}
      >
        <Resizable
          enable={{ right: true }}
          minWidth={260}
          defaultSize={
            sidebarWidth
              ? { width: sidebarWidth, height: 'auto' }
              : { width: 300, height: 'auto' }
          }
          onResizeStop={handleSidebarResize}
        >
          {sidebar}
        </Resizable>

        <Divider orientation="vertical" />

        <Resizable
          enable={{ right: true }}
          minWidth={400}
          defaultSize={
            collectionItemsWidth
              ? { width: collectionItemsWidth, height: 'auto' }
              : { width: 400, height: 'auto' }
          }
          onResizeStop={handleCollectionItemsResize}
        >
          <VStack spacing={0} h="full" w="full">
            <FeedHeader
              collection={activeCollection}
              hideMenuButton
              menuButtonRef={drawerButtonRef}
              onMenuClicked={onToggle}
            />

            {items}
          </VStack>
        </Resizable>

        <Divider orientation="vertical" />

        <Box flexGrow={1}>{mainContent ?? <EmptyMain />}</Box>
      </HStack>

      {/* Mobile view */}
      <Box display={{ base: 'flex', lg: 'none' }}>
        {mainContent ? (
          <VStack h="full" w="full">
            <IconButton
              icon={<IoReturnUpBack />}
              aria-label="Go back to collection"
              variant="ghost"
              mr="auto"
              onClick={onGoBackClicked}
            />
            {mainContent}
          </VStack>
        ) : (
          <VStack spacing={0} h="full" w="full">
            <FeedHeader
              collection={activeCollection}
              menuButtonRef={drawerButtonRef}
              onMenuClicked={onToggle}
            />

            {items}
          </VStack>
        )}
      </Box>
    </>
  );
};
