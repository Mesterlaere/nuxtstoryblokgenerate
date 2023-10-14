// https://nuxt.com/docs/api/configuration/nuxt-config


const generateConcurrency = Number(process.env.GENERATE_CONCURRENCY || 30)

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@storyblok/nuxt'
  ],
  storyblok: {
    accessToken: process.env.STORYBLOK_TOKEN,
    bridge: process.env.ENVIRONMENT !== 'production',
    devtools: process.env.ENVIRONMENT !== 'production'
  },
  ssr: true,
  nitro: {
    prerender: {
      // If you need to debug, set concurrency to 1, to get a more helpful console logging
      concurrency: generateConcurrency, // Max 30 concurrent requests...
      interval: 1000, // 0, // ... per second - Because Storyblok has rate limit of 50 requests per second: https://www.storyblok.com/docs/api/content-delivery/v2#topics/rate-limit
      crawlLinks: false,
      routes: []
      // ignore: [undefined]
    }
  },
  hooks: {
    async 'nitro:config' (nitroConfig) {
      if (!nitroConfig || nitroConfig.dev) {
        return
      }
      const token = process.env.STORYBLOK_TOKEN || ''
      const version = process.env.STORYBLOK_VERSION as 'draft' | 'published' || 'published'

      let cacheVersion = 0

      // other routes that are not in Storyblok with their slug.
      const routes: string[] = []
      try {
        const result = await fetch(`https://api.storyblok.com/v2/cdn/spaces/me?token=${ token }`)

        if (!result.ok) {
          throw new Error('Could not fetch Storyblok data')
        }
        // timestamp of latest publish
        const space = await result.json()
        cacheVersion = space.space.version

        // Recursively fetch all routes and set them to the routes array
        await fetchStories(
          token,
          version,
          routes,
          cacheVersion
        )
        nitroConfig!.prerender!.routes!.push(...routes)
        console.log('GOT ROUTES for nitroConfig.prerender.routes', routes.length)
      } catch (error) {
        console.error('FAILED AT GETTING ROUTES for nitroConfig.prerender.routes', error)
      }
    }
  }
})

async function fetchStories (
  token: string,
  version: 'draft' | 'published',
  routes: string[],
  cacheVersion: number,
  page: number = 1
) {
  const PER_PAGE = 60
  const GENERATE_IGNORE_COMPONENTS = ['GlobalSettingsInternational']
  const GENERATE_IGNORE_SLUGS_STARTING_WITH: (string | undefined)[] = ['undefined', undefined, 'archive/']

  try {
    const response = await fetch(
      `https://api.storyblok.com/v2/cdn/stories?token=${ token }&version=${ version }&per_page=${ PER_PAGE }&page=${ page }&cv=${ cacheVersion }`
    )
    const data = await response.json()

    // Add routes to the array
    Object.values(data.stories).forEach((story: any) => {
      if (
        GENERATE_IGNORE_COMPONENTS.includes(story.content.component) === false ||
        GENERATE_IGNORE_SLUGS_STARTING_WITH.find(ignoreSlug => story.full_slug.startsWith(ignoreSlug)) !== undefined
      ) {
        let path = story.full_slug
        // Remove trailing slash because of this issue in Nitro's Vercel Generate script: https://github.com/unjs/nitro/issues/1394
        if (path.endsWith('/')) {
          path = path.slice(0, -1)
        }
        routes.push('/' + path)
      }
    })

    // Check if there are more pages with links

    const total = Number(response.headers.get('total'))
    const maxPage = Math.ceil(total / PER_PAGE)

    if (maxPage > page) {
      await fetchStories(
        token,
        version,
        routes,
        cacheVersion,
        ++page
      )
    }
  } catch (error) {
    console.error(error)
  }
}
