# 🖼️ Album Cover Images

## 📁 Folder Structure

Organize your album art to match your song folders:

```
images/
├── Happy Songs/       ← Cover art for happy songs
├── Sad Songs/         ← Cover art for sad songs
├── Angry Songs/       ← Cover art for angry songs
├── Neutral Songs/     ← Cover art for neutral songs
└── Best of KK/        ← Or match your custom folders
```

## 📐 Image Specifications

- **Format**: JPG or PNG
- **Recommended Size**: 500x500 pixels (square)
- **File Size**: Keep under 1MB for fast loading
- **Naming**: Use simple names (e.g., `song-name.jpg`)

## ✅ Best Practices

1. **Match folder structure**: Keep images in folders that match song folders
2. **Use square images**: 1:1 aspect ratio looks best
3. **Optimize file size**: Compress images for faster loading
4. **Descriptive names**: Name files to match song titles

## 📝 Example

For a song at `songs/Happy Songs/sunshine-day.mp3`:
- Place cover at `images/Happy Songs/sunshine-day.jpg`
- Reference in songs.json: `"cover": "images/Happy Songs/sunshine-day.jpg"`

---

**Tip**: If no cover is specified, the player will use a default placeholder!
