import { useState } from "react";

import StarRating from "./StarRating";

function ReviewForm({ initialReview, onSubmit, onCancel, isSubmitting }) {
  const [rating, setRating] = useState(initialReview?.rating || 0);
  const [title, setTitle] = useState(initialReview?.title || "");
  const [comment, setComment] = useState(initialReview?.comment || "");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (rating < 1) {
      setError("Please select a star rating.");
      return;
    }
    setError("");
    onSubmit({ rating, title, comment });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Your rating</label>
        <StarRating value={rating} onChange={setRating} size={22} />
      </div>

      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
      />

      <textarea
        placeholder="Share your thoughts about this product..."
        required
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : initialReview ? "Update Review" : "Submit Review"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default ReviewForm;
