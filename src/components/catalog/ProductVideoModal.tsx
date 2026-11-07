import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/modal'

interface ProductVideoModalProps {
  isOpen: boolean
  onClose: () => void
  src: string | null
  poster?: string | null
  title?: string
}

/** Plays a product video in a lightbox, leaving the page layout untouched. */
export function ProductVideoModal({ isOpen, onClose, src, poster, title }: ProductVideoModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title ?? t('product.videos')}
      maxWidth="5xl"
      noPadding
    >
      {src ? (
        // biome-ignore lint/a11y/useMediaCaption: seller-supplied demo clips carry no dialogue track to caption
        <video
          src={src}
          poster={poster ?? undefined}
          controls
          autoPlay
          playsInline
          className="max-h-[75vh] w-full bg-black"
        />
      ) : (
        <div className="h-64 bg-black" />
      )}
    </Modal>
  )
}
