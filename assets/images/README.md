# Image Assets

This folder contains all the image assets for the Medpass app, downloaded from the Figma design.

## Files

- `logo.png` - Main app logo (49KB)
- `ellipse412.svg` - Circular background element (735B)
- `ellipse413.svg` - Circular background element (297B)
- `ellipse414.svg` - Circular background element (277B)
- `ellipse414-alt.svg` - Alternative circular background element (265B)
- `frame6.svg` - Slider frame element (447B)
- `line1.svg` - Line decoration element (285B)

## Usage

All images are exported through the `index.js` file for easy importing:

```javascript
import images from '../assets/images';

// Use in components
<Image source={images.logo} />
```

## Source

All images were downloaded from the Figma design via localhost URLs and are now stored locally in the project for better performance and offline access. 