function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  // Keep the control bar short on wide ranges: current page, its immediate
  // neighbors, and the first/last page, with ellipses for the gaps.
  const visiblePages = pageNumbers.filter(
    (page) =>
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1
  );

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-brand-surface disabled:opacity-40"
      >
        Prev
      </button>

      {visiblePages.map((page, index) => {
        const previous = visiblePages[index - 1];
        const showEllipsis = previous && page - previous > 1;
        return (
          <span key={page} className="flex items-center">
            {showEllipsis && <span className="px-2 text-gray-400">…</span>}
            <button
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`min-w-[2.25rem] rounded-md px-3 py-1.5 text-sm font-medium ${
                page === currentPage
                  ? "bg-brand text-white"
                  : "text-gray-600 hover:bg-brand-surface"
              }`}
            >
              {page}
            </button>
          </span>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-brand-surface disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}

export default Pagination;
