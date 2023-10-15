<template>
  <div name="component-page-slug">
    <pre>{{ story.name }}</pre>
    <pre>{{ story.content.test_value }}</pre>
    <pre>{{ apiResponse }}</pre>
    <NuxtLink to="/da/page-1">/da/page-1</NuxtLink>
    <NuxtLink to="/da/page-2">/da/page-2</NuxtLink>
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

// Test hydration behaviour
const myApiEndpoint = 'https://europe-west1-mesterlaere-app.cloudfunctions.net/api-app-getVersion'
const slugRelatedUniqueKey = storyPath
/*
// This will fetch again on hydration
const { data } = await useFetch(myApiEndpoint)
const externalData = ref(data)
*/
// How about this?
const { data: apiResponse } = await useAsyncData(slugRelatedUniqueKey, async () => {
  const myApiEndpointResponse = await $fetch(myApiEndpoint)
  return myApiEndpointResponse
})

console.log({ myApiEndpoint, slugRelatedUniqueKey }, apiResponse.value)

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
    const storyblokApi = useStoryblokApi()
    const { data } = await storyblokApi.get(
      `cdn/stories/${ storyPath }`,
      apiOptions // API Options
    )
    if (data?.story?.content !== undefined) {
      story.value = ref(data.story)
    } else {
      console.log({ data })
      throw new Error('Could not find draft story to hydrate in Editor on Storyblok')
    }
  }
})
</script>
