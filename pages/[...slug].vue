<template>
  <div name="component-page-slug">
    <pre>{{ story.name }}</pre>
    <pre>{{ story.content.test_value }}</pre>
  </div>
</template>
<script lang="ts" setup>
import type { ISbStoryData, ISbStoriesParams, StoryblokBridgeConfigV2 } from '@storyblok/vue'
const route = useRoute()
const config = useRuntimeConfig()
const storyPath = route?.params?.slug && route.params.slug.length > 0 ? (route.params.slug as string[]).join('/') : 'home'
// Which version of Storyblok content to render
const isInStoryblokEditMode = !!route.query?._storyblok
const versionFromConfig = (config.public.storyblokVersion as 'draft' | 'published') || 'draft'
const storyVersion = isInStoryblokEditMode ? 'draft' : versionFromConfig
const apiOptions: ISbStoriesParams = {
  version: storyVersion,
  resolve_links: 'story'
}
const bridgeOptions: StoryblokBridgeConfigV2 = {
  preventClicks: true,
  resolveLinks: 'story'
}
const story = await useAsyncStoryblok(
  storyPath,
  apiOptions, // API Options
  bridgeOptions // Bridge Options
)

if (story.value.status) {
  throw createError({
    statusCode: story.value.status,
    statusMessage: story.value.response
  })
}

onMounted(async () => {
  console.log({
    isInStoryblokEditMode,
    versionFromConfig,
    storyVersion
  })
  if (storyVersion === 'draft') {
    try {
      const storyblokApi = useStoryblokApi()
      const { data } = await storyblokApi.get(
        `cdn/stories/${ storyPath }`,
        apiOptions // API Options
      )
      if (data?.story?.content !== undefined) {
        console.log('Got a draft version from SB', data.story.content.test_value)
        story.value = ref(data.story)
      } else {
        console.log({ data })
        throw new Error('Could not find story on Storyblok')
      }
    } catch (err) {
      throw (err)
    }
  }
})
</script>
