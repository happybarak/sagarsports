from rest_framework.response import Response


def success_response(data=None, message="Success", status_code=200):
    """
    Mirrors custom_exception_handler's error shape so every response —
    success or failure — has the same top-level keys:

        { "success": true, "message": "...", "data": <payload> }

    Use for APIViews where you want an explicit message (e.g. "Product
    added to cart", "Order placed successfully"). Plain ModelViewSet
    list/retrieve responses can skip this and return serializer.data
    directly — pagination already wraps those consistently via
    StandardResultsPagination.
    """
    return Response(
        {
            "success": True,
            "message": message,
            "data": data,
        },
        status=status_code,
    )
