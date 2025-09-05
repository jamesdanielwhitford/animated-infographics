# Figma Animated Diagrams Project

## Project Overview
Building a comprehensive Figma workflow for creating animated technical diagrams as an alternative to the buggy Excalidraw-claymate solution.

**Goal:** Enable writers (non-designers) to create professional animated technical diagrams using standardized components and export as animated SVGs.

## Current Progress

### ✅ Completed Components
1. **File Structure Set Up:**
   - "🎨 Design System" page - colors and text variables
   - "📦 Components" page - master components
   - "🎬 Animation Templates" page - prototype templates (pending)
   - "📚 Usage Guide" page - examples for writers (pending)

2. **Variables Created:**
   - **Color Variables:** Primary Text (#000000), Secondary Text (#666666), Background (#FFFFFF), Accent Red (#FF6B6B), Accent Blue (#4ECDC4), Accent Teal (#45B7D1), Accent Green (#96CEB4)
   - **Text Variables:** Header Size (24), Body Size (16), Label Size (14), Caption Size (12), Header Weight (Bold), Body Weight (Regular), Label Weight (Medium)

3. **Components Built:**
   - ✅ **"Person with Label"** - Material Symbols person icon + text label in auto layout
   - ✅ **"Arrow - Straight"** - Created with Shift+L arrow tool
   - ✅ **"Text Box"** - Rectangular container with text, auto layout, 12px padding
   - ✅ **"Header Box"** - Larger text box for headers, 16px padding
   - ✅ **"Title Box"** - Wide container for diagram titles, 20px padding

### 🚧 Currently Working On
**Component Properties for "Person with Label":**
- ✅ "Label Text" property (Text type) - working
- 🚧 Icon color customization method (deciding between boolean conditional or instance swap)

## Next Steps
1. **Complete Person with Label properties** - Add icon color customization
2. **Add properties to other components** - Text boxes, arrows
3. **Create animation prototype templates** - Frame-by-frame animation workflows  
4. **Build usage guide** - Examples showing how to recreate diagrams like the MCP example
5. **Export workflow** - Animated SVG or screen recording process

## Key Decisions Made
- Using Material Symbols for icons (consistent, professional)
- Using Figma variables (not just styles) for full customization
- Using auto layout for responsive components
- Using component properties to let writers customize without breaking design
- Writers will use pen tool for custom arrows (maximum flexibility)

## Example Reference
Working toward recreating animated version of this style: "Now they are asking for MCP. How hard can it be?" diagram with person icons, arrows, and labeled boxes.

## Technical Notes
- All components use variables for colors/text to maintain consistency
- Auto layout ensures components adapt to content changes
- Component properties enable customization while preserving design standards
- Figma prototyping will handle frame-by-frame animations

## Current Status
User has Figma open, working in the "📦 Components" page, successfully created "Person with Label" component with working "Label Text" property. Next: deciding on icon color customization method (instance swap vs boolean conditional).