import React, { useCallback } from 'react';
import {
  Box,
  Divider,
  Heading,
  HStack,
  Icon,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { AiOutlineHome } from '@react-icons/all-files/ai/AiOutlineHome';
import { BsBookmarks } from '@react-icons/all-files/bs/BsBookmarks';
import { RiAddBoxFill } from '@react-icons/all-files/ri/RiAddBoxFill';
import RssIcon from '@heroicons/react/outline/RssIcon';
import type { ID, Preferences, User } from '@orpington-news/shared';
import { SidebarItem } from './SidebarItem';
import { Collections, CollectionsProps } from './Collections';
import { SidebarFooter } from './SidebarFooter';

export type MenuItem = 'home' | 'readingList' | 'addFeed' | 'settings';

export type SidebarContentProps = Omit<
  CollectionsProps,
  'activeCollectionId'
> & {
  activeCollectionId: ID | 'home';
  user: User;
  preferences: Preferences;
  onMenuItemClicked: (menuAction: MenuItem) => void;
};

export const SidebarContent: React.FC<SidebarContentProps> = (props) => {
  const { onMenuItemClicked, user, preferences, ...collectionsProps } = props;
  const { activeCollectionId } = collectionsProps;

  const handleClick = useCallback(
    (menuAction: MenuItem) => () => {
      onMenuItemClicked?.(menuAction);
    },
    [onMenuItemClicked]
  );

  const fg = useColorModeValue('purple.700', 'white');

  return (
    <VStack w="full" h="full" align="flex-start" overflowY="auto">
      <HStack py={6} px={4} spacing={2}>
        <Icon as={RssIcon} color={fg} w={8} h="auto" />
        <Heading
          fontWeight={700}
          color={fg}
          as="h1"
          fontSize="2xl"
          userSelect="none"
        >
          Orpington News
        </Heading>
      </HStack>

      <SidebarItem
        title="Home"
        icon={AiOutlineHome}
        isActive={activeCollectionId === 'home'}
        onClick={handleClick('home')}
      />

      {/*<SidebarItem
        title="Reading List"
        icon={BsBookmarks}
        isActive={activeCollectionId === 'readingList'}
        onClick={handleClick('readingList')}
      />*/}

      <SidebarItem
        title="Add Feed"
        icon={RiAddBoxFill}
        isActive={false}
        onClick={handleClick('addFeed')}
      />

      <Divider />

      {collectionsProps && (
        <Collections
          {...collectionsProps}
          activeCollectionId={
            typeof activeCollectionId === 'number'
              ? activeCollectionId
              : undefined
          }
        />
      )}
      <Box w="full" style={{ marginTop: 'auto' }}>
        <Divider mt={2} />
      </Box>

      <Box w="full" pt={2} pb={4} pl={6} pr={4}>
        <SidebarFooter user={user} preferences={preferences} />
      </Box>
    </VStack>
  );
};
