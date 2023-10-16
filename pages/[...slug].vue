<template>
  <div name="component-page-slug">
    <nav>
      <ul>
        <li v-for="navLink in (global?.content?.navigation || [])">
          <NuxtLink :to="'/' + navLink.link.story.full_slug">{{ navLink.label }}</NuxtLink>
        </li>
      </ul>
      </nav>
    <pre>Global Name: {{ global?.name }}</pre>
    <pre>Story name: {{ story.name }}</pre>
    <pre>Some story value: {{ story.content.test_value }}</pre>
  </div>
</template>
<script lang="ts" setup>
import type { ISbStoriesParams, StoryblokBridgeConfigV2 } from '@storyblok/vue'
const route = useRoute()
const config = useRuntimeConfig()
const storyblokApi = useStoryblokApi()

const matchedLocale = config.public.enabledLocales.find(locale => locale === (route?.params?.slug || [])[0])
const locale = matchedLocale || config.public.enabledLocales[0]
const globalPath = `${ locale }/global-settings`
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
const { data: story } = await useAsyncData(storyPath, async () => {
  const { data } = await storyblokApi.get(
      `cdn/stories/${ storyPath }`,
      apiOptions
    )
    return data.story
})
const { data: global } = await useAsyncData(globalPath, async () => {
  const { data } = await storyblokApi.get(
      `cdn/stories/${ globalPath }`,
      apiOptions
    )
    return data.story
})

if (story.value.status) {
  throw createError({
    statusCode: story.value.status,
    statusMessage: story.value.response
  })
}

onMounted(async () => {
  if (isInStoryblokEditMode) {
    console.log(
      'Rehydrate for in isInStoryblokEditMode mode',
      {
        storyPath,
        isInStoryblokEditMode,
        versionFromConfig,
        storyVersion
      })
      useStoryblokBridge(
        story.value.id,
        (storyForEdit) => (story.value = storyForEdit),
        bridgeOptions
      )
  }
})
</script>
