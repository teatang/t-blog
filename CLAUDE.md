# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Hexo blog using the Butterfly theme. The blog is written in Chinese and contains technical articles about programming, networking, security, and other technology topics.

## Common Commands

### Development Commands
- `npm run dev` or `npm run server` - Start the local development server with hot reloading
- `npm run build` - Generate the static site files in the `public` directory
- `npm run clean` - Clean the cache and generated files
- `npm run deploy` - Deploy the site (currently configured for Git deployment)

### Docker Deployment
The project includes a Dockerfile for containerized deployment:
- Build: `docker build -t blog .`
- Run: `docker run -p 8080:80 blog`

## Code Architecture and Structure

### Directory Structure
- `source/_posts/` - Blog posts organized by year
- `source/_data/` - Data files (links, shuoshuo)
- `source/img/` - Images used in posts and site
- `source/self/` - Custom JavaScript and CSS files
- `themes/butterfly/` - Butterfly theme files (installed via npm)
- `_config.yml` - Main Hexo configuration
- `_config.butterfly.yml` - Butterfly theme configuration

### Configuration Files
1. `_config.yml` - Main Hexo configuration including site metadata, URL settings, and theme selection
2. `_config.butterfly.yml` - Butterfly theme specific configuration including navigation, UI elements, comments, and analytics

### Key Features
- Butterfly theme with custom styling
- Local search functionality
- Disqus comments with DisqusJS fallback
- Multiple analytics providers (Umami, Baidu, Google)
- Responsive design with dark mode support
- Custom JavaScript enhancements in `source/self/` directory
- CDN optimization with jsDelivr

### Content Organization
- Posts are organized in `source/_posts/` by year
- Each post follows the naming convention: `YYYY-MM-DD_Title.md`
- Posts include front-matter with title, date, tags, and categories
- Images are stored in `source/img/post/YYYY/MM/` directories

### Deployment
- The site is designed for static deployment
- Dockerfile provided for containerized deployment
- Git deployment configured (can be enabled in `_config.yml`)

## Working with Content

### Adding New Posts
1. Create a new markdown file in `source/_posts/` with the naming convention `YYYY-MM-DD_Title.md`
2. Add front-matter with title, date, tags, and categories
3. Write content in markdown format

### Modifying Theme
- Theme configuration is in `_config.butterfly.yml`
- Custom CSS is in `source/self/btf.css`
- Custom JavaScript is in `source/self/btf.js`

### Adding Images
- Place images in appropriate subdirectories under `source/img/`
- Reference images in posts using relative paths