import { useState } from "react";

import Pagination from "../common/Pagination";
import ReviewForm from "./ReviewForm";
import StarRating from "./StarRating";

function ReviewList({ reviews, currentPage, totalPages, onPageChange, onStartEdit, onSubmitEdit, onDelete, editingId, onCancelEdit, isMutating }) {
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

  if (reviews.length === 0) {
    return <p className="text-sm text-gray-500">No reviews yet — be the first to write one.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-100 pb-4">
          {editingId === review.id ? (
            <ReviewForm
              initialReview={review}
              isSubmitting={isMutating}
              onCancel={onCancelEdit}
              onSubmit={(payload) => onSubmitEdit(review.id, payload)}
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating} readOnly size={14} />
                  <span className="text-sm font-medium text-gray-800">
                    {review.title || "—"}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{review.comment}</p>
              <p className="mt-1 text-xs text-gray-400">by {review.user_name}</p>

              {review.is_own && (
                <div className="mt-2 flex gap-3 text-xs">
                  <button
                    onClick={() => onStartEdit(review.id)}
                    className="font-medium text-brand-accent hover:underline"
                  >
                    Edit
                  </button>
                  {confirmingDeleteId === review.id ? (
                    <>
                      <button
                        onClick={() => onDelete(review.id)}
                        className="font-medium text-red-500 hover:underline"
                      >
                        Confirm delete
                      </button>
                      <button
                        onClick={() => setConfirmingDeleteId(null)}
                        className="font-medium text-gray-400 hover:underline"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmingDeleteId(review.id)}
                      className="font-medium text-gray-400 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}

export default ReviewList;
