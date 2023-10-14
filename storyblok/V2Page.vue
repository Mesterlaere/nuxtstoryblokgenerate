<template>
  <ul
    v-editable="blok"
  >
    <li
      v-for="item in (blok.blocks || [])"
      :key="item._uid"
    >
      <pre>{{ {item} }}</pre>
    </li>
  </ul>
</template>

<script setup lang="ts">

interface Props {
  blok: any
}

defineProps<Props>()
</script>
