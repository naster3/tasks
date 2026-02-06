from flask import url_for


def build_links(page, total_pages, limit, query, status, sort, order, date_from, date_to):
    def make_url(target_page):
        params = {"page": target_page, "limit": limit, "sort": sort, "order": order}
        if query:
            params["query"] = query
        if status:
            params["status"] = status
        if date_from:
            params["date_from"] = date_from
        if date_to:
            params["date_to"] = date_to
        return url_for("api.list_tasks", _external=True, **params)

    return {
        "first": make_url(1),
        "last": make_url(total_pages),
        "next": make_url(page + 1) if page < total_pages else None,
        "prev": make_url(page - 1) if page > 1 else None,
    }
