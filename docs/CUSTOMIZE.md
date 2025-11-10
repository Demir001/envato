# ClinicAdmin - Customization Guide

This guide explains how to customize the most common parts of the ClinicAdmin application, such as the logo, theme colors, and languages.

---

### Prerequisites

For most customizations, you will need:
* A code editor (like VS Code).
* Basic knowledge of TypeScript/React and CSS.
* Node.js and npm installed (if running in a non-Docker environment).

All frontend files are located in the `/client` directory.

---

### 1. How to Change the Logo

The logo is displayed in two places: the main Sidebar (desktop) and the Mobile Sidebar.

1.  **Prepare Your Logo:** You will need a light version (for dark mode) and a dark version (for light mode). SVG or PNG is recommended.
2.  **Location:** Go to `/client/src/components/layout/`.
3.  **Replace Files:**
    * **Sidebar (Desktop):** Open `sidebar.tsx`. Find the `<Link>` component at the top and replace the `<Stethoscope ... />` icon with your `<img>` tag.
    * **Mobile Sidebar:** Open `mobile-sidebar.tsx`. Find the `<Link>` component in the `<SheetHeader>` and replace the `<Stethoscope ... />` icon.
    * **Login Page:** Open `auth-layout.tsx`. Replace the `<Stethoscope ... />` icon in the left panel.

**Example (using `<img>`):**

```tsx
// Before (in sidebar.tsx):
<Stethoscope className="h-6 w-6 text-primary" />
<span className="text-lg">ClinicAdmin</span>

// After (using your logo):
<img src="/logo-dark.png" alt="My Clinic Logo" className="h-8 w-auto" />
// (Make sure to add your logo.png to the /client/public/ directory)


2. How to Change Colors & Theme
The application uses a TailwindCSS + CSS Variables system, similar to Shadcn/ui. All colors are defined in one central file.

Open the CSS file: /client/src/styles/globals.css (Step 63)

Find the :root section: This defines the Light Mode (default) colors.

Find the .dark section: This defines the Dark Mode colors.

To change the primary brand color (default is Purple):

Find this section in :root and .dark and change the HSL values.

/* In :root (Light Mode) */
:root {
    --primary: 262.1 83.3% 57.8%; /* Purple */
    --primary-foreground: 210 40% 98%; /* White text on Purple */
    
    --ring: 262.1 83.3% 57.8%; /* Focus color (matches primary) */
}

/* Example: Change to a Blue color
    --primary: 221.2 83.2% 53.3%; (Blue)
    --ring: 221.2 83.2% 53.3%; (Blue)
*/

Rebuild (if not running npm run dev): If you are running npm run dev, Tailwind will hot-reload the changes. If you are using Docker, you may need to rebuild the client image: docker-compose up -d --build client

Anladım, kopyala-yapıştır için en sade (düz metin) formatı istiyorsunuz.

İşte /docs/CUSTOMIZE.md dosyasının düz metin içeriği:

Plaintext

# ClinicAdmin - Customization Guide

This guide explains how to customize the most common parts of the ClinicAdmin application, such as the logo, theme colors, and languages.

---

### Prerequisites

For most customizations, you will need:
* A code editor (like VS Code).
* Basic knowledge of TypeScript/React and CSS.
* Node.js and npm installed (if running in a non-Docker environment).

All frontend files are located in the `/client` directory.

---

### 1. How to Change the Logo

The logo is displayed in two places: the main Sidebar (desktop) and the Mobile Sidebar.

1.  **Prepare Your Logo:** You will need a light version (for dark mode) and a dark version (for light mode). SVG or PNG is recommended.
2.  **Location:** Go to `/client/src/components/layout/`.
3.  **Replace Files:**
    * **Sidebar (Desktop):** Open `sidebar.tsx` (Step 106). Find the `<Link>` component at the top and replace the `<Stethoscope ... />` icon with your `<img>` tag.
    * **Mobile Sidebar:** Open `mobile-sidebar.tsx` (Step 110). Find the `<Link>` component in the `<SheetHeader>` and replace the `<Stethoscope ... />` icon.
    * **Login Page:** Open `auth-layout.tsx` (Step 111). Replace the `<Stethoscope ... />` icon in the left panel.

**Example (using `<img>`):**

// Before (in sidebar.tsx):
<Stethoscope className="h-6 w-6 text-primary" />
<span className="text-lg">ClinicAdmin</span>

// After (using your logo):
<img src="/logo-dark.png" alt="My Clinic Logo" className="h-8 w-auto" />
// (Make sure to add your logo.png to the /client/public/ directory)
2. How to Change Colors & Theme
The application uses a TailwindCSS + CSS Variables system, similar to Shadcn/ui. All colors are defined in one central file.

Open the CSS file: /client/src/styles/globals.css (Step 63)

Find the :root section: This defines the Light Mode (default) colors.

Find the .dark section: This defines the Dark Mode colors.

To change the primary brand color (default is Purple):

Find this section in :root and .dark and change the HSL values.

CSS

/* In :root (Light Mode) */
:root {
    --primary: 262.1 83.3% 57.8%; /* Purple */
    --primary-foreground: 210 40% 98%; /* White text on Purple */
    
    --ring: 262.1 83.3% 57.8%; /* Focus color (matches primary) */
}

/* Example: Change to a Blue color
    --primary: 221.2 83.2% 53.3%; (Blue)
    --ring: 221.2 83.2% 53.3%; (Blue)
*/
Rebuild (if not running npm run dev): If you are running npm run dev, Tailwind will hot-reload the changes. If you are using Docker, you may need to rebuild the client image: docker-compose up -d --build client

3. How to Add a New Language (i18n)
The app uses i18next and supports English (en) and Turkish (tr).

To add a new language (e.g., Spanish - es):

Create the JSON file:

Go to /client/src/locales/.

Copy en.json (Step 67) and rename it to es.json.

Translate the file:

Open es.json and translate all the JSON values (not the keys) into Spanish.

JSON

{
  "sidebar": {
    "dashboard": "Tablero", // (Translated from "Dashboard")
    "calendar": "Calendario"
    // ... etc.
  }
}
Register the new language:

Open /client/src/locales/i18n.ts (Step 69).

Import your new es.json file.

Add it to the resources object.

TypeScript

import enTranslations from './en.json';
import trTranslations from './tr.json';
import esTranslations from './es.json'; // 1. Import

const resources = {
  en: {
    translation: enTranslations,
  },
  tr: {
    translation: trTranslations,
  },
  es: { // 2. Add to resources
    translation: esTranslations,
  },
};

i18n
  // ... (rest of the file)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'tr', 'es'], // 3. Add to supportedLngs
    // ...
  });
The i18next-browser-languagedetector will now automatically detect and use Spanish (es) if the user's browser is set to that language.