# Typography System Reference

## Base Font Sizes (Default)

- **xs**: 12px → 14px
- **sm**: 14px → 16px
- **base**: 16px → 18px (body text)
- **lg**: 18px → 20px
- **xl**: 20px → 24px
- **2xl**: 24px → 30px
- **3xl**: 30px → 36px
- **4xl**: 36px → 48px (h2)
- **5xl**: 48px → 64px (h1)
- **6xl**: 60px → 80px

## Screen Size Breakpoints

### Galaxy Z Fold 5 & Very Narrow (< 360px)

- Base text: 18px → 20px
- Slightly larger to ensure readability on very narrow screens

### Small Phones (360px - 389px)

- Base text: 17px → 18px
- Standard iPhone SE size

### Standard Phones (390px - 430px)

- Base text: 17px
- iPhone 12/13/14 standard size

### Large Phones (431px - 767px)

- Base text: 16px → 18px (using default clamp)

### Tablets (768px - 1023px)

- Base text: 16px → 18px (using default clamp)
- iPad Mini, iPad standard

### Small Laptops (1024px - 1279px)

- Base text: 17px → 18px (using default clamp)
- iPad Pro, small laptops

### Desktop (1280px+)

- Base text: 18px (max from clamp)
- Full desktop experience

## Component-Specific Sizes

### Buttons

- Small: text-sm (14-16px)
- Medium: text-base (16-18px)
- Large: text-lg (18-20px)

### Navigation

- Desktop nav: text-base (16-18px)
- Mobile nav: text-lg (18-20px)
- Mobile nav buttons: text-base (16-18px)

### Footer

- Headings: text-base sm:text-lg (16-18px)
- Links: text-sm sm:text-base (14-16px)
- Copyright: text-sm sm:text-base (14-16px)

## Accessibility Notes

- Minimum body text: 16px (WCAG AA)
- Minimum touch target: 44px x 44px
- Line height: 1.5-1.8 for body text
- Contrast ratio: 4.5:1 minimum for normal text
