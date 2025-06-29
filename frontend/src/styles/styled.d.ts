import 'styled-components';
import { StyledTheme } from './theme';

// Extend the styled-components theme interface
declare module 'styled-components' {
  export interface DefaultTheme extends StyledTheme {}
}
