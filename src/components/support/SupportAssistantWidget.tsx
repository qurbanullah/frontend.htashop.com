import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChatPanel } from '@/components/support/ChatPanel'
import { useChatStore } from '@/stores/chat'

/**
 * The storefront support assistant.
 *
 * Mounted once in the root layout. It only renders after `/chat/config`
 * confirms the assistant is enabled, so the storefront never shows (or waits
 * on) a widget that is switched off.
 */
export function SupportAssistantWidget() {
  const { t } = useTranslation('chat')

  const configLoaded = useChatStore((s) => s.configLoaded)
  const config = useChatStore((s) => s.config)
  const isOpen = useChatStore((s) => s.isOpen)
  const toggle = useChatStore((s) => s.toggle)
  const loadConfig = useChatStore((s) => s.loadConfig)

  useEffect(() => {
    void loadConfig()
  }, [loadConfig])

  if (!configLoaded || !config?.enabled) return null

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="support-assistant-panel"
            role="dialog"
            aria-modal="true"
            aria-label={t('title')}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[60] flex h-[80vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-24 sm:h-[min(640px,80vh)] sm:w-[380px] sm:rounded-2xl dark:bg-gray-900"
          >
            <ChatPanel />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? t('close') : t('launcher_label')}
        aria-expanded={isOpen}
        title={isOpen ? t('close') : t('launcher_label')}
        className="fixed right-4 bottom-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 sm:right-6 sm:bottom-6"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="icon-close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="icon-open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </>
  )
}
