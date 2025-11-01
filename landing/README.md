# Shop Well Landing Page

Official marketing website for the Shop Well Chrome extension - helping people with chronic conditions and allergies make safer shopping decisions.

## 📁 Project Structure

```
landing/
├── index.html          # Main landing page
├── about.html          # About page with Beau's story
├── styles.css          # Complete stylesheet with design system
├── script.js           # Interactive features (mobile menu, smooth scrolling)
├── netlify.toml        # Netlify deployment configuration
├── assets/
│   └── SHOP-WELL.png   # Logo and branding
└── README.md           # This file
```

## 🎨 Design System

The landing page uses Shop Well's nature-inspired wellness brand:

**Colors:**
- Primary Green: `#6BAF7A` (health, vitality)
- Sky Blue: `#65AEDD` (trust, clarity)
- Warm Terracotta: `#D38B6D` (grounding)
- Golden Honey: `#F2C94C` (attention)
- Soft Beige: `#E9DFC9` (warmth)

**Features:**
- Mobile-first responsive design
- WCAG AA accessibility compliance
- Smooth animations with reduced motion support
- Semantic HTML5
- SEO optimized

## 🚀 Deployment to Netlify

### Method 1: Drag & Drop (Easiest)

1. **Prepare the folder:**
   - Navigate to the `landing/` directory
   - Make sure all files are present (index.html, about.html, styles.css, script.js, assets/)

2. **Deploy to Netlify:**
   - Go to [Netlify Drop](https://app.netlify.com/drop)
   - Drag the entire `landing/` folder onto the drop zone
   - Netlify will deploy instantly and give you a URL

3. **Custom Domain (Optional):**
   - In Netlify dashboard, go to "Domain settings"
   - Add your custom domain (e.g., shopwell.app)
   - Follow DNS configuration instructions

### Method 2: GitHub Integration (Recommended for Updates)

1. **Create a new repository:**
   ```bash
   cd landing/
   git init
   git add .
   git commit -m "Initial commit: Shop Well landing page"
   ```

2. **Push to GitHub:**
   ```bash
   # Create a new repo on GitHub first, then:
   git remote add origin https://github.com/yourusername/shop-well-landing.git
   git branch -M main
   git push -u origin main
   ```

3. **Connect to Netlify:**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select your repository
   - Build settings:
     - **Base directory:** Leave empty or set to `landing/`
     - **Build command:** Leave empty (static site)
     - **Publish directory:** `.` (current directory)
   - Click "Deploy site"

4. **Auto-deploy on push:**
   - Any future commits to the main branch will auto-deploy
   - Perfect for continuous updates

### Method 3: Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Deploy from terminal:**
   ```bash
   cd landing/
   netlify deploy --prod
   ```

4. **Follow prompts:**
   - Choose "Create & configure a new site"
   - Select your team
   - Enter site name (e.g., shop-well)
   - Publish directory: `.`

## 🔧 Local Development

To test the landing page locally:

1. **Option 1: Python HTTP Server**
   ```bash
   cd landing/
   python3 -m http.server 8000
   # Visit http://localhost:8000
   ```

2. **Option 2: Node HTTP Server**
   ```bash
   cd landing/
   npx serve
   # Visit the URL shown in terminal
   ```

3. **Option 3: VS Code Live Server**
   - Install "Live Server" extension
   - Right-click `index.html`
   - Select "Open with Live Server"

## 📝 Updating Content

### Update Chrome Web Store Link

Once your extension is published, update the CTA button URL in both HTML files:

**index.html** (line ~263):
```html
<a href="YOUR_CHROME_WEB_STORE_URL" class="btn btn-large btn-cta" target="_blank" rel="noopener">
```

Also update other instances around lines ~61, ~90.

**about.html** (line ~170):
```html
<a href="index.html#install" class="btn btn-large btn-primary">
```

### Update Social Media Preview

When you share the URL, update Open Graph tags in `index.html` (lines ~12-16):
```html
<meta property="og:image" content="https://your-domain.com/assets/SHOP-WELL.png">
```

### Add Google Analytics (Optional)

Add before closing `</head>` tag in both HTML files:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-GA-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR-GA-ID');
</script>
```

## 🧪 Testing Checklist

Before deploying, test:

- [ ] All navigation links work
- [ ] Mobile menu opens/closes properly
- [ ] Smooth scrolling to sections
- [ ] All images load correctly
- [ ] Responsive design on mobile, tablet, desktop
- [ ] CTA buttons link to correct destinations
- [ ] Footer links are accurate
- [ ] No console errors in browser DevTools
- [ ] Accessibility: keyboard navigation works
- [ ] Accessibility: screen reader testing (optional)

## 🎯 SEO Optimization

The landing page includes:
- ✅ Semantic HTML5 structure
- ✅ Meta descriptions and keywords
- ✅ Open Graph tags for social sharing
- ✅ Alt text for images
- ✅ Mobile-responsive design
- ✅ Fast loading (no external dependencies)

### Future SEO Improvements:
- Add `robots.txt` file
- Add `sitemap.xml`
- Set up Google Search Console
- Add structured data (JSON-LD) for rich snippets

## 🔒 Security

The `netlify.toml` configuration includes:
- Security headers (X-Frame-Options, CSP, etc.)
- Asset caching rules
- HTTPS enforced by default

## 📊 Performance

The landing page is optimized for performance:
- **No external dependencies** (no jQuery, Bootstrap, etc.)
- **Inline CSS** option available if needed
- **Optimized images** (compress SHOP-WELL.png if needed)
- **Minimal JavaScript** (vanilla JS only)

To further optimize:
```bash
# Compress images (optional)
# Using ImageOptim, TinyPNG, or:
brew install imageoptim-cli
imageoptim -d assets/
```

## 🛠 Troubleshooting

**Issue: Mobile menu not working**
- Check browser console for JS errors
- Ensure `script.js` is loading correctly
- Clear browser cache

**Issue: Styles not applying**
- Check `styles.css` path in HTML
- Clear browser cache
- Verify CSS file uploaded to Netlify

**Issue: Images not loading**
- Check file paths are relative (e.g., `assets/SHOP-WELL.png`)
- Ensure images are in `assets/` folder
- Verify case-sensitive filenames on Netlify

**Issue: Netlify deploy failed**
- Check `netlify.toml` syntax
- Ensure all files are committed (for GitHub method)
- Check Netlify build logs for specific errors

## 📞 Support

For questions or issues:
- Open an issue on the main Shop Well repository
- Email: [your contact email]
- GitHub: [@beausterling](https://github.com/beausterling)

## 📄 License

MIT License - Same as the Shop Well Chrome extension

---

**Built with care for the chronic illness community** ❤️
