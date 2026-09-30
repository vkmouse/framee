<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useNotice } from '../composables/useNotice'

const { notice, closeNotice } = useNotice()
const actionsEl = ref<HTMLElement | null>(null)

function runAction() {
  const action = notice.current?.action
  closeNotice()
  action?.run()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeNotice()
}

// Move focus into the sheet so screen readers announce it and Esc works.
watch(
  () => notice.current,
  async (n) => {
    if (!n) return
    await nextTick()
    actionsEl.value?.querySelector<HTMLButtonElement>('button')?.focus()
  },
)
</script>

<template>
  <Transition name="notice" :duration="320">
    <div v-if="notice.current" class="notice" @keydown="onKeydown">
      <div class="notice__scrim" @click="closeNotice"></div>

      <section
        class="notice__sheet"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="notice-title"
        aria-describedby="notice-message"
      >
        <div class="notice__handle"></div>

        <div class="notice__head">
          <span class="notice__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M12 6.5v7" />
              <path d="M12 17.4v.1" />
            </svg>
          </span>
          <h2 id="notice-title" class="notice__title">{{ notice.current.title }}</h2>
        </div>

        <p id="notice-message" class="notice__message">{{ notice.current.message }}</p>
        <p v-if="notice.current.detail" class="notice__detail">{{ notice.current.detail }}</p>

        <div ref="actionsEl" class="notice__actions">
          <button
            v-if="notice.current.action"
            class="notice__btn notice__btn--primary"
            type="button"
            @click="runAction"
          >
            {{ notice.current.action.label }}
          </button>
          <button
            class="notice__btn"
            :class="{ 'notice__btn--primary': !notice.current.action }"
            type="button"
            @click="closeNotice"
          >
            {{ notice.current.action ? '先不要' : '知道了' }}
          </button>
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.notice {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.notice__scrim {
  position: absolute;
  inset: 0;
  background: rgba(26, 26, 26, 0.42);
}

.notice__sheet {
  position: relative;
  width: 100%;
  max-width: 500px;
  padding: 14px var(--spacing-lg) calc(var(--spacing-lg) + env(safe-area-inset-bottom, 0px));
  background: var(--color-surface);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -1px 0 rgba(0, 0, 0, 0.06);
}

.notice__handle {
  width: 36px;
  height: 3px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.15);
  margin: 0 auto 18px;
}

.notice__head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.notice__mark {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fbe9e7;
  color: #b3372b;
}

.notice__title {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.2px;
  line-height: 1.3;
  color: var(--color-text-main);
}

.notice__message {
  font-size: 14px;
  line-height: 1.65;
  color: var(--color-text-main);
  /* Chinese copy: keep lines readable, avoid one orphan character on the last line. */
  text-wrap: pretty;
}

.notice__detail {
  margin-top: 12px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: #f4f4f2;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-muted);
  word-break: break-all;
  user-select: text;
  -webkit-user-select: text;
}

.notice__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
}

.notice__btn {
  height: 46px;
  border-radius: 23px;
  border: 0.5px solid var(--color-border-em);
  background: transparent;
  color: var(--color-text-main);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s;
}

.notice__btn:active {
  transform: scale(0.97);
}

.notice__btn--primary {
  background: var(--color-action);
  border-color: var(--color-action);
  color: var(--color-action-text);
}

.notice__btn:focus-visible {
  outline: 2px solid var(--color-action);
  outline-offset: 2px;
}

/* Open / close motion answers a tap, so it stays. */
.notice-enter-active .notice__scrim,
.notice-leave-active .notice__scrim {
  transition: opacity 240ms ease;
}
.notice-enter-active .notice__sheet {
  transition: transform var(--drawer-anim-open);
}
.notice-leave-active .notice__sheet {
  transition: transform var(--drawer-anim-close);
}
.notice-enter-from .notice__scrim,
.notice-leave-to .notice__scrim {
  opacity: 0;
}
.notice-enter-from .notice__sheet,
.notice-leave-to .notice__sheet {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .notice-enter-active .notice__sheet,
  .notice-leave-active .notice__sheet {
    transition: none;
  }
  .notice-enter-from .notice__sheet,
  .notice-leave-to .notice__sheet {
    transform: none;
  }
}
</style>
