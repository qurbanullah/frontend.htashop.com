import { PostListView } from '@/components/posts/PostListView'
import { Seo } from '@/components/seo/Seo'

export default function EventsListPage() {
  return (
    <>
      <Seo
        title="Events — HTAShop"
        description="Upcoming events, webinars, and exhibitions hosted by HTAShop and our partners."
        keywords={['HTAShop events', 'webinars', 'exhibitions', 'trade shows']}
        canonical="/events"
        type="website"
      />
      <PostListView
        type="event"
        title="Events"
        subtitle="Webinars, exhibitions, and community events"
      />
    </>
  )
}
