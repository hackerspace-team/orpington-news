import { colors } from './colors';
import {
  extendTheme,
  withDefaultColorScheme,
  withDefaultSize,
} from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';
import 'focus-visible/dist/focus-visible';
import { textStyles } from './textStyles';
import { fonts } from './fonts';
import { Button, Menu } from './components';

const styles = {
  global: (props: any) => ({
    '*': {
      scrollbarWidth: 'thin',
    },
    '*::-webkit-scrollbar': {
      width: 2,
      height: 2,
    },
    '*::-webkit-scrollbar-track': {
      borderRadius: 'md',
      bgColor: mode('gray.200', 'gray.700')(props),
    },
    '*::-webkit-scrollbar-thumb': {
      borderRadius: 'md',
      bgColor: mode('gray.300', 'gray.500')(props),
    },
    '*::-webkit-scrollbar-button': {
      display: 'none',
    },
  }),
};

const fontSizes = {
  '2xs': '8px',
};

const space = {
  22: '5.5rem',
};

export const theme = extendTheme(
  {
    useSystemColorMode: false,
    initialColorMode: 'dark',
    fonts,
    colors,
    styles,
    space,
    sizes: { ...space },
    fontSizes,
    textStyles,
    components: {
      Menu,
      Button,
    },
  },
  withDefaultColorScheme({ colorScheme: 'purple' }),
  withDefaultSize({
    size: 'lg',
    components: ['Button'],
  } as any)
);
