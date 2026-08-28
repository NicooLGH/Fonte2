import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Inter, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

/*
 * next/font télécharge les polices au moment de la compilation et
 * les sert depuis notre propre domaine. Deux conséquences : pas
 * d'appel à Google au chargement, et pas de saut de texte quand
 * la police arrive.
 */
const display = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--police-display',
  display: 'swap',
})

const corps = Inter({
  subsets: ['latin'],
  variable: '--police-corps',
  display: 'swap',
})

const mono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--police-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FONTE — Carnet de performance',
  description:
    'Ton carnet de musculation : séances, mensurations et progression, synchronisés et privés.',
}

export const viewport: Viewport = {
  themeColor: '#0e0f11',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="fr"
      className={`${display.variable} ${corps.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
