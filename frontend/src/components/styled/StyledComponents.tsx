import styled, { css } from 'styled-components';
import { lighten, darken, rgba, transparentize } from 'polished';

// Base styled components with automatic theming

// Typography Components
export const Heading = styled.h1<{
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  color?: string;
}>`
  font-family: ${props => props.theme.typography.fonts.heading};
  color: ${props => (props.color ? props.color : props.theme.colors.textHeading)};
  font-weight: ${props => props.theme.typography.weights.bold};
  line-height: ${props => props.theme.typography.lineHeights.tight};
  margin: 0 0 ${props => props.theme.spacing[4]} 0;

  ${props => {
    switch (props.level) {
      case 1:
        return css`
          font-size: ${props.theme.typography.sizes['4xl']};
        `;
      case 2:
        return css`
          font-size: ${props.theme.typography.sizes['3xl']};
        `;
      case 3:
        return css`
          font-size: ${props.theme.typography.sizes['2xl']};
        `;
      case 4:
        return css`
          font-size: ${props.theme.typography.sizes.xl};
        `;
      case 5:
        return css`
          font-size: ${props.theme.typography.sizes.lg};
        `;
      case 6:
        return css`
          font-size: ${props.theme.typography.sizes.base};
        `;
      default:
        return css`
          font-size: ${props.theme.typography.sizes['3xl']};
        `;
    }
  }}

  @media (min-width: ${props => props.theme.breakpoints.sm}) {
    ${props => {
      switch (props.level) {
        case 1:
          return css`
            font-size: calc(${props.theme.typography.sizes['4xl']} * 1.25);
          `;
        case 2:
          return css`
            font-size: calc(${props.theme.typography.sizes['3xl']} * 1.25);
          `;
        default:
          return '';
      }
    }}
  }
`;

export const Text = styled.p<{
  size?: string;
  color?: string;
  weight?: string;
}>`
  font-family: ${props => props.theme.typography.fonts.body};
  font-size: ${props => (props.size ? props.size : props.theme.typography.sizes.base)};
  color: ${props => (props.color ? props.color : props.theme.colors.textBody)};
  font-weight: ${props => (props.weight ? props.weight : props.theme.typography.weights.normal)};
  line-height: ${props => props.theme.typography.lineHeights.normal};
  margin: 0 0 ${props => props.theme.spacing[4]} 0;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const Link = styled.a`
  color: ${props => props.theme.colors.textLink};
  text-decoration: none;
  font-weight: ${props => props.theme.typography.weights.medium};
  transition: ${props => props.theme.transitions.fast};
  border-radius: ${props => props.theme.radii.sm};

  &:hover {
    color: ${props => props.theme.colors.textLinkHover};
    text-decoration: underline;
  }

  &:focus {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
  }
`;

// Button Components
const ButtonBase = css<{
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${props => props.theme.typography.fonts.body};
  font-weight: ${props => props.theme.typography.weights.medium};
  border-radius: ${props => props.theme.radii.md};
  border: 2px solid transparent;
  cursor: pointer;
  transition: ${props => props.theme.transitions.normal};
  text-decoration: none;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${props =>
    props.fullWidth &&
    css`
      width: 100%;
    `}

  ${props => {
    switch (props.size) {
      case 'sm':
        return css`
          padding: ${props.theme.spacing[2]} ${props.theme.spacing[3]};
          font-size: ${props.theme.typography.sizes.sm};
        `;
      case 'lg':
        return css`
          padding: ${props.theme.spacing[4]} ${props.theme.spacing[8]};
          font-size: ${props.theme.typography.sizes.lg};
        `;
      default:
        return css`
          padding: ${props.theme.spacing[3]} ${props.theme.spacing[6]};
          font-size: ${props.theme.typography.sizes.base};
        `;
    }
  }}

  &:focus {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const Button = styled.button<{
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}>`
  ${ButtonBase}

  ${props => {
    const { theme, variant = 'primary' } = props;

    switch (variant) {
      case 'primary':
        return css`
          background: ${theme.colors.primary};
          color: ${theme.colors.white};
          border-color: ${theme.colors.primary};

          &:hover:not(:disabled) {
            background: ${lighten(0.1, theme.colors.primary)};
            border-color: ${lighten(0.1, theme.colors.primary)};
            transform: translateY(-1px);
            box-shadow: 0 4px 12px ${rgba(theme.colors.primary, 0.3)};
          }

          &:active:not(:disabled) {
            background: ${darken(0.1, theme.colors.primary)};
            border-color: ${darken(0.1, theme.colors.primary)};
            transform: translateY(0);
          }
        `;

      case 'secondary':
        return css`
          background: ${theme.colors.secondary};
          color: ${theme.colors.white};
          border-color: ${theme.colors.secondary};

          &:hover:not(:disabled) {
            background: ${lighten(0.1, theme.colors.secondary)};
            border-color: ${lighten(0.1, theme.colors.secondary)};
            transform: translateY(-1px);
            box-shadow: 0 4px 12px ${rgba(theme.colors.secondary, 0.3)};
          }

          &:active:not(:disabled) {
            background: ${darken(0.1, theme.colors.secondary)};
            border-color: ${darken(0.1, theme.colors.secondary)};
            transform: translateY(0);
          }
        `;

      case 'accent':
        return css`
          background: ${theme.colors.accent};
          color: ${theme.colors.white};
          border-color: ${theme.colors.accent};

          &:hover:not(:disabled) {
            background: ${lighten(0.1, theme.colors.accent)};
            border-color: ${lighten(0.1, theme.colors.accent)};
            transform: translateY(-1px);
            box-shadow: 0 4px 12px ${rgba(theme.colors.accent, 0.3)};
          }

          &:active:not(:disabled) {
            background: ${darken(0.1, theme.colors.accent)};
            border-color: ${darken(0.1, theme.colors.accent)};
            transform: translateY(0);
          }
        `;

      case 'outline':
        return css`
          background: transparent;
          color: ${theme.colors.primary};
          border-color: ${theme.colors.primary};

          &:hover:not(:disabled) {
            background: ${theme.colors.primary};
            color: ${theme.colors.white};
            transform: translateY(-1px);
            box-shadow: 0 4px 12px ${rgba(theme.colors.primary, 0.3)};
          }

          &:active:not(:disabled) {
            background: ${darken(0.1, theme.colors.primary)};
            border-color: ${darken(0.1, theme.colors.primary)};
            transform: translateY(0);
          }
        `;

      case 'ghost':
        return css`
          background: transparent;
          color: ${theme.colors.primary};
          border-color: transparent;

          &:hover:not(:disabled) {
            background: ${transparentize(0.9, theme.colors.primary)};
            color: ${darken(0.1, theme.colors.primary)};
          }

          &:active:not(:disabled) {
            background: ${transparentize(0.8, theme.colors.primary)};
          }
        `;

      default:
        return '';
    }
  }}
`;

// Layout Components
export const Container = styled.div<{
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
}>`
  width: 100%;
  margin: 0 auto;

  ${props =>
    props.padding !== false &&
    css`
      padding-left: ${props.theme.spacing[4]};
      padding-right: ${props.theme.spacing[4]};

      @media (min-width: ${props.theme.breakpoints.sm}) {
        padding-left: ${props.theme.spacing[6]};
        padding-right: ${props.theme.spacing[6]};
      }

      @media (min-width: ${props.theme.breakpoints.lg}) {
        padding-left: ${props.theme.spacing[8]};
        padding-right: ${props.theme.spacing[8]};
      }
    `}

  ${props => {
    switch (props.maxWidth) {
      case 'sm':
        return css`
          max-width: ${props.theme.breakpoints.sm};
        `;
      case 'md':
        return css`
          max-width: ${props.theme.breakpoints.md};
        `;
      case 'lg':
        return css`
          max-width: ${props.theme.breakpoints.lg};
        `;
      case 'xl':
        return css`
          max-width: ${props.theme.breakpoints.xl};
        `;
      case '2xl':
        return css`
          max-width: ${props.theme.breakpoints['2xl']};
        `;
      case 'full':
        return css`
          max-width: none;
        `;
      default:
        return css`
          max-width: 1280px;
        `; // xl by default
    }
  }}
`;

export const Card = styled.div<{
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: string;
}>`
  background: ${props => props.theme.colors.backgroundCard};
  border-radius: ${props => props.theme.radii.lg};
  padding: ${props => (props.padding ? props.padding : props.theme.spacing[6])};

  ${props => {
    switch (props.variant) {
      case 'outlined':
        return css`
          border: 1px solid ${transparentize(0.8, props.theme.colors.secondary)};
        `;
      case 'elevated':
        return css`
          box-shadow: ${props.theme.shadows.lg};
        `;
      default:
        return css`
          box-shadow: ${props.theme.shadows.base};
        `;
    }
  }}

  transition: ${props => props.theme.transitions.normal};

  &:hover {
    box-shadow: ${props => props.theme.shadows.lg};
    transform: translateY(-2px);
  }
`;

export const Section = styled.section<{
  variant?: 'default' | 'accent';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}>`
  width: 100%;

  ${props => {
    switch (props.variant) {
      case 'accent':
        return css`
          background: ${props.theme.colors.backgroundSection};
        `;
      default:
        return css`
          background: ${props.theme.colors.background};
        `;
    }
  }}

  ${props => {
    switch (props.padding) {
      case 'sm':
        return css`
          padding: ${props.theme.spacing[8]} 0;
        `;
      case 'md':
        return css`
          padding: ${props.theme.spacing[12]} 0;
        `;
      case 'lg':
        return css`
          padding: ${props.theme.spacing[16]} 0;
        `;
      case 'xl':
        return css`
          padding: ${props.theme.spacing[20]} 0;
        `;
      default:
        return css`
          padding: ${props.theme.spacing[16]} 0;
        `;
    }
  }}
`;

// Form Components
export const Input = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing[3]};
  font-family: ${props => props.theme.typography.fonts.body};
  font-size: ${props => props.theme.typography.sizes.base};
  border: 2px solid ${props => transparentize(0.8, props.theme.colors.secondary)};
  border-radius: ${props => props.theme.radii.md};
  background: ${props => props.theme.colors.backgroundCard};
  color: ${props => props.theme.colors.textBody};
  transition: ${props => props.theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => rgba(props.theme.colors.primary, 0.1)};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textMuted};
  }

  &:disabled {
    background: ${props => props.theme.colors.gray[0]};
    cursor: not-allowed;
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: ${props => props.theme.spacing[3]};
  font-family: ${props => props.theme.typography.fonts.body};
  font-size: ${props => props.theme.typography.sizes.base};
  border: 2px solid ${props => transparentize(0.8, props.theme.colors.secondary)};
  border-radius: ${props => props.theme.radii.md};
  background: ${props => props.theme.colors.backgroundCard};
  color: ${props => props.theme.colors.textBody};
  transition: ${props => props.theme.transitions.fast};
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => rgba(props.theme.colors.primary, 0.1)};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textMuted};
  }
`;

// Alert Component
export const Alert = styled.div<{
  variant?: 'info' | 'success' | 'warning' | 'error';
}>`
  padding: ${props => props.theme.spacing[4]};
  border-radius: ${props => props.theme.radii.md};
  border-left: 4px solid;
  font-family: ${props => props.theme.typography.fonts.body};

  ${props => {
    switch (props.variant) {
      case 'success':
        return css`
          background: ${transparentize(0.9, props.theme.colors.success)};
          border-color: ${props.theme.colors.success};
          color: ${darken(0.2, props.theme.colors.success)};
        `;
      case 'warning':
        return css`
          background: ${transparentize(0.9, props.theme.colors.warning)};
          border-color: ${props.theme.colors.warning};
          color: ${darken(0.2, props.theme.colors.warning)};
        `;
      case 'error':
        return css`
          background: ${transparentize(0.9, props.theme.colors.error)};
          border-color: ${props.theme.colors.error};
          color: ${darken(0.2, props.theme.colors.error)};
        `;
      default:
        return css`
          background: ${transparentize(0.9, props.theme.colors.info)};
          border-color: ${props.theme.colors.info};
          color: ${darken(0.2, props.theme.colors.info)};
        `;
    }
  }}
`;
