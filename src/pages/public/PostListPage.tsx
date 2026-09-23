import { useTranslation } from 'react-i18next'
import { PostListView } from '@/components/posts/PostListView'
import { Seo } from '@/components/seo/Seo'
import type { PostSection } from '@/lib/post-sections'

/**
 * Generic list page for a content section (blog, news, events, announcements, …).
 * The section is supplied by the router from POST_SECTIONS, so adding a new
 * content type needs no new page component.
 */
export default function PostListPage({ section }: { section: PostSection }) {
  const { t } = useTranslation()
  const title = t(section.titleKey)

  return (
    <>
      <Seo
        title={title}
        description={t(section.descriptionKey)}
        keywords={section.keywords}
        canonical={section.path}
        type="website"
      />
      <PostListView type={section.type} title={title} subtitle={t(section.subtitleKey)} />
    </>
  )
}
