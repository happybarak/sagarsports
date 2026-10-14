import { useState } from "react";

function ImageGallery({ images, productName }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-brand-surface text-sm text-gray-400">
        No image available
      </div>
    );
  }

  const activeImage = images[activeIndex] || images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-brand-surface">
        <img
          src={activeImage.image}
          alt={activeImage.alt_text || productName}
          className="h-full w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${
                index === activeIndex ? "border-brand-accent" : "border-transparent"
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <img
                src={image.image}
                alt={image.alt_text || productName}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
