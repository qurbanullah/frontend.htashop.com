import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toaster";
import { useAuth } from "@/hooks/auth/useAuth";
import { paths } from "@/routes/paths";
import { reviewsApi, type Review } from "@/api/reviews";
import { isApiError } from "@/lib/api-response";

function Stars({
  rating,
  onSelect,
  size = 16,
}: {
  rating: number;
  onSelect?: (value: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => {
        const filled = value <= Math.round(rating);
        const className = filled ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600";

        if (onSelect) {
          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              className="rounded p-0.5 transition-transform hover:scale-110"
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
            >
              <Star style={{ width: size, height: size }} className={className} />
            </button>
          );
        }

        return <Star key={value} style={{ width: size, height: size }} className={className} />;
      })}
    </div>
  );
}

function WriteReviewModal({
  isOpen,
  onClose,
  routeKey,
  onSubmitted,
}: {
  isOpen: boolean;
  onClose: () => void;
  routeKey: string;
  onSubmitted: () => void;
}) {
  const { success: showSuccess, error: showError } = useToast();
  const { isAuthenticated } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isRecommended, setIsRecommended] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!body.trim()) {
      showError("Please write a review.");
      return;
    }

    setSubmitting(true);
    try {
      await reviewsApi.create(routeKey, {
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
        is_recommended: isRecommended,
      });
      showSuccess("Review submitted");
      setRating(5);
      setTitle("");
      setBody("");
      setIsRecommended(true);
      onClose();
      onSubmitted();
    } catch (error) {
      showError(isApiError(error) ? error.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Write a review" maxWidth="lg">
      {!isAuthenticated ? (
        <div className="py-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Please sign in to write a review.</p>
          <Link to={paths.login} className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            Sign in
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Rating</span>
            <Stars rating={rating} onSelect={setRating} size={24} />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Title (optional)</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Review</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What did you like or dislike?"
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isRecommended}
              onChange={(e) => setIsRecommended(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            I recommend this product
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Submit
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function ProductReviews({ routeKey }: { routeKey: string }) {
  const { error: showError } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [writeOpen, setWriteOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: summary } = useQuery({
    queryKey: ["product-reviews-summary", routeKey],
    queryFn: () => reviewsApi.summary(routeKey),
  });

  const { data: list, isLoading } = useQuery({
    queryKey: ["product-reviews", routeKey, page],
    queryFn: () => reviewsApi.list(routeKey, page, 5),
  });

  const voteMutation = useMutation({
    mutationFn: ({ uuid, helpful }: { uuid: string; helpful: boolean }) =>
      reviewsApi.vote(uuid, helpful),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", routeKey] });
    },
    onError: (error) => {
      if (!isAuthenticated || (isApiError(error) && error.status === 401)) {
        showError("Please sign in to vote");
      } else {
        showError(isApiError(error) ? error.message : "Failed to record vote");
      }
    },
  });

  const invalidateReviews = () => {
    queryClient.invalidateQueries({ queryKey: ["product-reviews", routeKey] });
    queryClient.invalidateQueries({ queryKey: ["product-reviews-summary", routeKey] });
    setPage(1);
  };

  const reviewCount = summary?.count ?? 0;
  const average = summary?.average ?? 0;
  const distribution = summary?.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Customer reviews
        </h2>
        <Button onClick={() => setWriteOpen(true)}>Write a review</Button>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        {/* Summary */}
        <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">{average.toFixed(1)}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">/ 5</span>
          </div>
          <div className="mt-2">
            <Stars rating={average} size={18} />
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{reviewCount} review{reviewCount === 1 ? "" : "s"}</p>

          <div className="mt-4 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star] ?? 0;
              const percent = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="w-3">{star}</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews list */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
            </div>
          ) : list?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-800">
              <MessageSquare className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {list?.data.map((review) => (
                <ReviewCard
                  key={review.uuid}
                  review={review}
                  onVote={(helpful) => voteMutation.mutate({ uuid: review.uuid, helpful })}
                  voting={voteMutation.isPending}
                />
              ))}

              {list && list.meta.last_page > page && (
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="w-full rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Load more reviews
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <WriteReviewModal
        isOpen={writeOpen}
        onClose={() => setWriteOpen(false)}
        routeKey={routeKey}
        onSubmitted={invalidateReviews}
      />
    </section>
  );
}

function ReviewCard({
  review,
  onVote,
  voting,
}: {
  review: Review;
  onVote: (helpful: boolean) => void;
  voting: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Stars rating={review.rating} size={15} />
          <p className="mt-1.5 font-semibold text-gray-900 dark:text-white">{review.title || "Review"}</p>
        </div>
        {review.is_verified_purchase && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verified Purchase
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{review.body}</p>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">{review.user?.name ?? "Anonymous"}</span>
          {" · "}
          {new Date(review.created_at).toLocaleDateString()}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onVote(true)}
            disabled={voting}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-60 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            {review.helpful_count}
          </button>
          <button
            type="button"
            onClick={() => onVote(false)}
            disabled={voting}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-60 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            {review.not_helpful_count}
          </button>
        </div>
      </div>
    </div>
  );
}
