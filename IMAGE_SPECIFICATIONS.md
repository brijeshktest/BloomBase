# Image Specifications for SellLocal Online

This document outlines the recommended dimensions and restrictions for all images used in the SellLocal Online application.

## Recommended Dimensions

### 1. Logo (Business Logo)
- **Optimal Size**: 512x512 pixels
- **Aspect Ratio**: 1:1 (Square)
- **File Size**: Maximum 2MB
- **Format**: PNG, JPG, JPEG, WebP
- **Use Case**: Displayed in store header and settings

### 2. Banner (Store Banner)
- **Optimal Size**: 1920x400 pixels
- **Aspect Ratio**: 4.8:1 (Landscape)
- **File Size**: Maximum 5MB
- **Format**: PNG, JPG, JPEG, WebP
- **Use Case**: Displayed as header banner on store microsite

### 3. Product Images
- **Optimal Size**: 1200x1200 pixels
- **Aspect Ratio**: 1:1 (Square)
- **File Size**: Maximum 5MB per image
- **Format**: PNG, JPG, JPEG, WebP
- **Use Case**: Product listings, product detail pages
- **Multiple Images**: Up to 10 images per product

## Validation Rules

### Backend Validation
- **Logo**: Minimum 256x256px, Maximum 2048x2048px, Square aspect ratio
- **Banner**: Minimum 1200x250px, Maximum 3840x800px, Aspect ratio between 4:1 and 6:1
- **Product Images**: Minimum 400x400px, Maximum 2400x2400px, Aspect ratio between 0.9:1 and 1.1:1 (near square)

### Frontend Display
All images are displayed at **full resolution** to ensure maximum quality:
- Logo: Displayed at original size (no scaling down)
- Banner: Responsive but maintains aspect ratio
- Product Images: Full resolution on detail pages, optimized thumbnails in listings

## Image Quality Guidelines

1. **Use High-Quality Source Images**: Start with the highest resolution possible
2. **Proper Compression**: Use appropriate compression to balance quality and file size
3. **Consistent Format**: Use PNG for logos with transparency, JPG for photos
4. **Optimize Before Upload**: Compress images appropriately before uploading

## Browser Support

- All modern browsers support the specified formats
- Images are served with appropriate Content-Type headers
- Responsive images adapt to different screen sizes while maintaining quality
