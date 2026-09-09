import { ref } from 'vue'

// set right before a tab-bar navigation so App.vue's route watcher skips the slide animation —
// switching tabs isn't a forward/back step in a flow, so a directional slide reads as noise
export const skipNextPageTransition = ref(false)
