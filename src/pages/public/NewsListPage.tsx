import { PostListView } from '@/components/posts/PostListView'
import { Seo } from '@/components/seo/Seo'

export default function NewsListPage() {
  return (
    <>
      <Seo
        title="News — HTAShop"
        description="Latest announcements and news from HTAShop — product launches, partnerships, and company updates."
        keywords={['HTAShop news', 'company updates', 'announcements', 'press release']}
        canonical="/news"
        type="website"
      />
      <PostListView
        type="news"
        title="News"
        subtitle="Announcements, launches, and company updates"
      />
    </>
  )
}
