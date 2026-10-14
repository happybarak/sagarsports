from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsPagination(PageNumberPagination):
    """
    Default pagination for all list endpoints (product listing, order
    history, admin tables, etc.). Clients can override page size per
    request with ?page_size=, capped at max_page_size so nobody can force
    the API to return the entire catalog in one call.
    """

    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(
            {
                "count": self.page.paginator.count,
                "total_pages": self.page.paginator.num_pages,
                "current_page": self.page.number,
                "page_size": self.get_page_size(self.request),
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )
