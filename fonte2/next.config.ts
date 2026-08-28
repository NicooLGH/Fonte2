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
}

export default nextConfig
