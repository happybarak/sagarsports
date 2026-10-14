import { FiStar } from "react-icons/fi";

function StarRating({ value, onChange, size = 16, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        const Star = (
          <FiStar
            key={star}
            size={size}
            className={filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
          />
        );

        if (readOnly) {
          return <span key={star}>{Star}</span>;
        }

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
          >
            {Star}
          </button>
        );
      })}
    </div>
  );
}

export default StarRating;
