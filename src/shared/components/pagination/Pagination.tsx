import { Button } from "@platform/design-system";

interface PaginationProps {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  page,
  per_page,
  total,
  total_pages,
  onPageChange,
}: PaginationProps) => {
  if (total_pages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (total_pages <= maxVisible) {
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(total_pages);
      } else if (page >= total_pages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = total_pages - 3; i <= total_pages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(total_pages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Página anterior"
      >
        Anterior
      </Button>

      {pageNumbers.map((pageNum, index) => {
        if (pageNum === "...") {
          return (
            <span key={`ellipsis-${index}`} style={{ padding: "0 0.5rem", color: "#737373" }}>
              ...
            </span>
          );
        }

        const pageNumber = pageNum as number;
        const isActive = pageNumber === page;

        return (
          <Button
            key={pageNumber}
            type="button"
            variant={isActive ? "primary" : "ghost"}
            size="sm"
            onClick={() => onPageChange(pageNumber)}
            style={{
              minWidth: "2.5rem",
              backgroundColor: isActive ? undefined : "transparent",
            }}
            aria-label={`Página ${pageNumber}`}
            aria-current={isActive ? "page" : undefined}
          >
            {pageNumber}
          </Button>
        );
      })}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === total_pages}
        aria-label="Próxima página"
      >
        Próxima
      </Button>

      <span style={{ marginLeft: "1rem", fontSize: "0.875rem", color: "#737373" }}>
        {((page - 1) * per_page + 1)}-{Math.min(page * per_page, total)} de {total}
      </span>
    </div>
  );
};

export default Pagination;
