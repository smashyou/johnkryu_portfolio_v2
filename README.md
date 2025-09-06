# John K. Ryu Portfolio

A modern, responsive portfolio website built with Next.js 14, TypeScript, and Tailwind CSS. Features smooth animations, dark theme, and a contact form integration.

**Live Demo**: [https://johnkryu.vercel.app](https://johnkryu.vercel.app)

## ✨ Features

- **Modern Tech Stack**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Responsive Design**: Fully responsive across all devices
- **Smooth Animations**: Powered by Framer Motion for engaging user experience
- **Dark Theme**: Elegant dark mode design with custom color palette
- **Contact Form**: Integrated with EmailJS for direct email communication
- **Resume Modal**: Interactive resume viewer with PDF download
- **SEO Optimized**: Meta tags and static export for better search visibility
- **Performance**: Optimized for fast loading and smooth interactions

## 🚀 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Forms**: [React Hook Form](https://react-hook-form.com/)
- **Email**: [EmailJS](https://www.emailjs.com/)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/) & [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/smashyou/johnkryu_portfolio_v2.git
cd johnkryu_portfolio_v2
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your EmailJS credentials:

```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production (static export)
npm start         # Start production server
npm run lint      # Run ESLint
```

## 📁 Project Structure

```
├── app/
│   ├── components/           # React components
│   │   ├── Header.tsx       # Hero section with animations
│   │   ├── Nav.tsx          # Navigation bar
│   │   ├── About.tsx        # About section
│   │   ├── Experience.tsx   # Work experience timeline
│   │   ├── Services.tsx     # Skills and services
│   │   ├── Portfolio.tsx    # Project showcase
│   │   ├── Contact.tsx      # Contact form
│   │   ├── ResumeModal.tsx  # Resume viewer
│   │   └── Footer.tsx       # Footer section
│   ├── fonts/               # Custom fonts
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── public/                  # Static assets
│   ├── images/              # Images and media
│   └── John_K_Ryu_Resume.pdf # Resume PDF
├── .env.local               # Environment variables (create this)
├── .gitignore               # Git ignore file
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies
```

## 🎨 Customization

### Colors

The color palette can be customized in `tailwind.config.js`:

- Primary colors (blue theme)
- Dark mode colors
- Accent colors

### Content

Update your personal information in the respective component files:

- `Header.tsx` - Hero section content
- `About.tsx` - About me information
- `Experience.tsx` - Work experience
- `Portfolio.tsx` - Project details
- `Contact.tsx` - Contact information

### Resume

Replace `public/John_K_Ryu_Resume.pdf` with your own resume file.

## 📧 EmailJS Setup

1. Sign up at [EmailJS](https://www.emailjs.com/)
2. Create an email service
3. Create an email template with these variables:
   - `name` - Sender's name
   - `email` - Sender's email
   - `message` - Message content
   - `to_email` - Your email address
4. Get your credentials from the dashboard
5. Add them to `.env.local`

## 🚀 Deployment

### Vercel (Recommended)

1. Import this repository on [Vercel](https://vercel.com)
2. Add environment variables in Vercel dashboard
3. Deploy

### Static Export

The project is configured for static export:

```bash
npm run build
```

The static files will be in the `out` directory.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**John K. Ryu**

- Email: johnminryu@gmail.com
- GitHub: [@smashyou](https://github.com/smashyou)
- Website: [johnminryu.vercel.app](https://johnminryu.vercel.app)

## 🙏 Acknowledgments

- Design inspiration from modern portfolio trends
- Next.js team for the amazing framework
- All open-source contributors

---

Built with ❤️ by John K. Ryu
