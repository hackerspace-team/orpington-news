import React, { useCallback, useRef } from 'react';
import {
  Badge,
  Box,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  Spinner,
  Text,
  useColorModeValue,
  useDisclosure,
  useOutsideClick,
  VStack,
} from '@chakra-ui/react';
import { BsThreeDotsVertical } from '@react-icons/all-files/bs/BsThreeDotsVertical';
import { Chevron } from './Chevron';

export interface SidebarItemProps {
  isActive: boolean;
  icon?: React.FC;
  title: string;
  counter?: number;
  chevron?: 'top' | 'bottom';
  menuItems?: JSX.Element;
  isLoading?: boolean;

  onClick: () => void;
  onChevronClick?: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = (props) => {
  const {
    isActive,
    icon,
    title,
    counter,
    chevron,
    menuItems,
    isLoading,
    onClick,
    onChevronClick,
  } = props;

  const fg = useColorModeValue('purple.700', 'white');
  const bg = useColorModeValue('purple.50', 'gray.700');
  const hoverBg = useColorModeValue('purple.10', 'gray.600');

  const { isOpen, onToggle, onClose, onOpen } = useDisclosure();

  const handleMenuClick: React.MouseEventHandler = useCallback(
    (event) => {
      event.stopPropagation();
      onToggle();
    },
    [onToggle]
  );

  const handleClick: React.MouseEventHandler = useCallback(
    (event) => {
      if (isOpen) {
        onClose();
      } else {
        onClick();
      }
    },
    [isOpen, onClick, onClose]
  );

  const ref = useRef<HTMLDivElement | null>(null);
  useOutsideClick({
    ref,
    handler: useCallback(
      (e) => {
        onClose();
      },
      [onClose]
    ),
  });

  const handleKeyDown: React.KeyboardEventHandler = useCallback(
    (event) => {
      const { key } = event;
      if (key === 'Escape') {
        onClose();
      } else if (key === 'Enter') {
        onClick();
      }
    },
    [onClick, onClose]
  );

  const handleChevronClick = useCallback(() => {
    if (isOpen) {
      onClose();
    } else {
      onChevronClick?.();
    }
  }, [isOpen, onChevronClick, onClose]);

  const handleChevronKeyDown: React.KeyboardEventHandler = useCallback(
    (event) => {
      const { key } = event;

      if (key === ' ') {
        handleChevronClick();
        event.preventDefault();
      }
    },
    [handleChevronClick]
  );

  return (
    <HStack
      ref={ref}
      w="full"
      spacing={4}
      pr={2}
      pl={chevron ? 0 : 6}
      minH={10}
      align="center"
      _hover={{
        cursor: 'pointer',
        bgColor: hoverBg,
      }}
      _focus={{
        bgColor: hoverBg,
        outline: 'none',
      }}
      bgColor={isActive ? bg : 'inherit'}
      transition="background-color 0.2s"
      userSelect="none"
      role="group"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {chevron && (
        <IconButton
          variant="ghost"
          ml={1}
          mr={-3}
          size="2xs"
          aria-label={chevron === 'top' ? 'Collapse menu' : 'Expand menu'}
          icon={<Chevron pointTo={chevron} onClick={handleChevronClick} />}
          onKeyDown={handleChevronKeyDown}
        />
      )}
      {icon && <Icon as={icon} w={6} h={6} fill={fg} />}
      <Text flexGrow={1} color={fg} fontWeight={isActive ? 700 : 400} py={2}>
        {title}
      </Text>

      <VStack align="flex-end" spacing={0}>
        {isLoading && <Spinner />}
        {!isLoading && counter && !isOpen && (
          <Badge
            _groupHover={{
              display: menuItems ? 'none' : '',
            }}
          >
            {counter > 999 ? '999+' : counter}
          </Badge>
        )}
        {!isLoading && menuItems && (
          <Box
            display={isOpen ? 'block' : 'none'}
            _groupHover={{
              display: 'block',
            }}
          >
            <Menu isOpen={isOpen} onOpen={onOpen}>
              <MenuButton
                onClick={handleMenuClick}
                as={IconButton}
                aria-label="Menu"
                icon={<BsThreeDotsVertical />}
                variant="ghost"
                size="sm"
                tabIndex={0}
              />
              <MenuList>{menuItems}</MenuList>
            </Menu>
          </Box>
        )}
      </VStack>
    </HStack>
  );
};
