import { PostListView } from '@/components/posts/PostListView'
import { Seo } from '@/components/seo/Seo'

export default function BlogListPage() {
  return (
    <>
      <Seo
        title="Blog — HTAShop"
        description="Insights, guides, and stories from HTAShop — product updates, industry trends, and helpful how-tos."
        keywords={['HTAShop blog', 'e-commerce insights', 'buying guides', 'industry news']}
        canonical="/blogs"
        type="website"
      />
      <PostListView
        type="blog"
        title="Blog"
        subtitle="Insights, guides, and stories from the HTAShop team"
      />
    </>
  )
}
