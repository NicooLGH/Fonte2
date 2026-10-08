import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /*
   * Deux fichiers `package-lock.json` coexistent : celui du
   * projet et un autre resté à la racine du dépôt. Next.js ne
   * sait pas lequel choisir et prend le mauvais.
   *
   * On lui indique explicitement où se trouve le projet.
   */
  turbopack: {
    root: __dirname,
  },

  /*
   * Navigation instantanée : une page déjà visitée ou préchargée
   * est gardée 60 s côté navigateur et réaffichée sans attendre le
   * serveur. Une action (séance, réaction…) la rafraîchit de toute
   * façon aussitôt.
   */
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
}

export default nextConfig
