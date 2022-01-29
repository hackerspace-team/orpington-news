import React, { useCallback } from 'react';
import {
  Box,
  Icon,
  Divider,
  Heading,
  HStack,
  IconButton,
  Text,
  Link,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { CollectionItemDetails } from '@orpington-news/shared';
import { HiOutlineExternalLink } from '@react-icons/all-files/hi/HiOutlineExternalLink';
import { BsBookmarkDash } from '@react-icons/all-files/bs/BsBookmarkDash';
import { BsBookmarkPlus } from '@react-icons/all-files/bs/BsBookmarkPlus';
import { BsThreeDotsVertical } from '@react-icons/all-files/bs/BsThreeDotsVertical';
import { CgCalendar } from '@react-icons/all-files/cg/CgCalendar';
import { CgTime } from '@react-icons/all-files/cg/CgTime';
import { IoReturnUpBack } from '@react-icons/all-files/io5/IoReturnUpBack';
import { IoCheckmarkDone } from '@react-icons/all-files/io5/IoCheckmarkDone';
import { format, fromUnixTime } from 'date-fns';

export type ArticleMenuAction = 'markAsUnread';

export interface ArticleHeaderProps {
  article: CollectionItemDetails;

  onGoBackClicked?: () => void;
  onReadingListToggle?: () => void;
  onMenuItemClicked?: (action: ArticleMenuAction) => void;
}

export const ArticleHeader: React.FC<ArticleHeaderProps> = (props) => {
  const {
    article: {
      title,
      link,
      datePublished,
      dateRead,
      readingTime,
      onReadingList,
    },

    onGoBackClicked,
    onReadingListToggle,
    onMenuItemClicked,
  } = props;

  const handleMenuItemClick = useCallback(
    (action: ArticleMenuAction) => () => {
      onMenuItemClicked?.(action);
    },
    [onMenuItemClicked]
  );

  return (
    <>
      <HStack w="full" justify="flex-end">
        <IconButton
          icon={<IoReturnUpBack />}
          aria-label="Go back to collection"
          variant="ghost"
          mr="auto"
          onClick={onGoBackClicked}
          display={['inline-flex', 'none']}
        />

        <IconButton
          icon={<HiOutlineExternalLink />}
          as={Link}
          isExternal
          href={link}
          aria-label="Open external link"
          variant="ghost"
        />
        <IconButton
          icon={onReadingList ? <BsBookmarkDash /> : <BsBookmarkPlus />}
          aria-label={
            onReadingList ? 'Remove from reading list' : 'Add to reading list'
          }
          variant="ghost"
          onClick={onReadingListToggle}
        />

        <Box>
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Menu"
              icon={<BsThreeDotsVertical />}
              variant="ghost"
              tabIndex={0}
            />
            <MenuList>
              <MenuItem
                icon={<IoCheckmarkDone />}
                onClick={handleMenuItemClick('markAsUnread')}
                isDisabled={!dateRead}
              >
                Mark as unread
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </HStack>

      <VStack w="full" align="flex-start" spacing={1} px={4}>
        <Heading>{title}</Heading>
        <Box>
          <Text color="gray.500" as={HStack}>
            <Icon as={CgCalendar} mr={1} />
            <>
              published on{' '}
              {format(fromUnixTime(datePublished), 'dd/MM/yyyy (EEE)')}
            </>
          </Text>
          <Text color="gray.500" as={HStack}>
            <Icon as={CgTime} mr={1} />
            <>estimated reading time {Math.ceil(readingTime)} minutes</>
          </Text>
        </Box>

        <Divider pt={3} />
      </VStack>
    </>
  );
};
