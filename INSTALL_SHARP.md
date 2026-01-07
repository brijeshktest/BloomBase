# Installing Sharp Library

The image validation feature requires the `sharp` library. Please install it by running:

```bash
cd backend
npm install sharp
```

**Note:** Sharp uses native bindings and may require compilation. If you encounter issues:

### Windows
Make sure you have Visual Studio Build Tools or Node-gyp installed.

### Linux/Mac
Usually installs without issues via npm.

### Alternative
If sharp installation fails, you can temporarily disable image validation by modifying the upload routes, but validation is recommended for maintaining image quality standards.
