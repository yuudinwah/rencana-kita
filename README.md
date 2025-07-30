# 🗺️ Rencana Kita - Interactive Map Explorer

**Rencana Kita** adalah aplikasi web interaktif yang menggunakan AI untuk membantu Anda merencanakan perjalanan dan mengeksplorasi lokasi di seluruh dunia. Dengan dukungan Google Maps dan Google Gemini AI, aplikasi ini memberikan pengalaman visual yang kaya untuk perencanaan perjalanan.

![Vue.js](https://img.shields.io/badge/Vue.js-3.5.18-4FC08D?style=flat&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?style=flat&logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat&logo=vercel&logoColor=white)

## 🌐 Live Demo

**🚀 [Try Rencana Kita Live](https://rencana-kita.vercel.app/)**

> Experience the full power of AI-powered travel planning in your browser!

### 📸 Screenshots

| Explorer Mode | Day Planner Mode |
|---------------|------------------|
| ![Explorer Mode](https://via.placeholder.com/400x250/4FC08D/white?text=Explorer+Mode) | ![Day Planner](https://via.placeholder.com/400x250/3178C6/white?text=Day+Planner) |

*Screenshots will be updated with actual app interface*

## ✨ Fitur Utama

### 🌍 **Dual Mode Experience**
- **Explorer Mode**: Eksplorasi umum lokasi berdasarkan query
- **Day Planner Mode**: Perencanaan itinerary harian yang terstruktur

### 🤖 **AI-Powered Intelligence**
- Integrasi **Google Gemini 2.5 Flash** untuk analisis query
- **Structured function calling** untuk data lokasi dan rute
- **Real-time streaming** response dari AI

### 🗺️ **Interactive Maps**
- **Google Maps JavaScript API** dengan Advanced Markers
- **Custom popups** dengan informasi detail lokasi
- **Polylines dan routes** antar lokasi
- **Dynamic map bounds** adjustment

### ⏰ **Smart Timeline**
- **Visual timeline** untuk day planning
- **Travel time estimation** antar lokasi
- **Transport mode indicators** (walking, driving, transit, dll)
- **Interactive timeline items** dengan map synchronization

### 📱 **Responsive Design**
- **Mobile-friendly** dengan overlay system
- **Adaptive sidebar** yang dapat diperlebar
- **Touch-optimized** carousel controls

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 atau lebih baru)
- **Google Cloud Platform account** untuk API keys
- **Modern web browser** dengan JavaScript enabled

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/rencana-kita.git
   cd rencana-kita
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` dan tambahkan API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:5173/
   ```

### 🎮 Try Without Installation

Want to test the app immediately? **[Visit the live demo](https://rencana-kita.vercel.app/)** - no setup required!

## 🔧 Setup API Keys

### Google Gemini API
1. Buka [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Buat API key baru
3. Copy ke `GEMINI_API_KEY` di `.env.local`

### Google Maps API
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Maps JavaScript API**
3. Buat credentials (API Key)
4. Konfigurasi restrictions:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: `http://localhost:5173/*`
5. Copy ke `VITE_GOOGLE_MAPS_API_KEY` di `.env.local`

## 🎯 Cara Penggunaan

### Explorer Mode (Default)
1. Masukkan query apapun terkait lokasi
2. Contoh: "Jakarta tourism spots", "Historical places in Rome"
3. Lihat hasil di map dengan markers dan informasi detail

### Day Planner Mode
1. **Toggle "Day Planner Mode"** di atas search bar
2. Masukkan query perencanaan hari
3. Contoh: "Plan a day in Paris", "One day exploring Central Park"
4. Lihat **timeline sidebar** dengan jadwal terstruktur
5. **Export plan** ke file teks

### Fitur Timeline
- **Click timeline items** untuk navigate ke lokasi di map
- **Scroll timeline** untuk melihat seluruh jadwal
- **Travel time indicators** menunjukkan estimasi perjalanan
- **Transport icons** untuk jenis transportasi

## 🏗️ Arsitektur Project

```
src/
├── App.vue                 # Main Vue component
├── main.ts                 # Application entry point
├── style.css              # Global styles
├── types.ts               # TypeScript type definitions
├── composables/
│   └── useMapExplorer.ts  # Map logic & AI integration
└── utils/
    └── googleMaps.ts      # Google Maps API loader
```

### Tech Stack
- **Frontend**: Vue 3 Composition API + TypeScript
- **Build Tool**: Vite
- **Maps**: Google Maps JavaScript API
- **AI**: Google Gemini 2.5 Flash
- **Styling**: Vanilla CSS dengan responsive design

## 🎨 Kustomisasi

### Menambah Transport Icons
Edit function `getTransportIconClass` di `App.vue`:
```typescript
const getTransportIconClass = (transport?: string) => {
  const type = transport.toLowerCase()
  if (type.includes('scooter')) return 'fas fa-motorcycle'
  // Tambah logic lainnya...
}
```

### Mengubah AI System Instructions
Edit `systemInstructions` di `useMapExplorer.ts` untuk mengubah behavior AI.

### Custom Map Styling
Update `mapId` di `initializeMap()` untuk menggunakan custom map style dari Google Cloud Console.

## 🚧 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Code Style
- **TypeScript Strict Mode** enabled
- **Vue 3 Composition API** patterns
- **ES2020** target dengan modern syntax
- **Responsive design** first approach

## 🔜 Roadmap

- [ ] **User Authentication** sistem
- [ ] **Save & Share Plans** functionality  
- [ ] **Offline Support** dengan PWA
- [ ] **Multi-language** support
- [ ] **Custom Map Themes**
- [ ] **Integration dengan booking platforms**
- [ ] **Social sharing** features
- [ ] **Review & Rating** sistem

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Acknowledgments

- **Google Maps Platform** untuk mapping capabilities
- **Google AI** untuk Gemini API
- **Vue.js Team** untuk amazing framework
- **Vite Team** untuk blazing fast build tool

---

**⭐ Star this repo if you find it helpful!**

Dibuat dengan ❤️ untuk memudahkan perencanaan perjalanan Anda.