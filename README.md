# Novaris — Full-Stack E-Commerce Platform

A full-stack e-commerce platform for a technology/product brand, built with
React + Vite + Redux Toolkit on the frontend and Django + Django REST
Framework + PostgreSQL on the backend. Navigation and product-discovery UX
are inspired by Decathlon; branding, design, and code are original.

> **Status:** Phase 16 Part 2 (Advanced Features — Search & Discovery)
> complete. Search autocomplete, synonym-aware search, real
> "frequently bought together" recommendations (from actual order data,
> not just category matching), and a rule-based description generator
> for the admin panel are all live. Coupons were explicitly descoped —
> see "What's in Phase 16 Part 2" below.

---

## Tech Stack

**Frontend:** React 18, Vite, React Router DOM, Tailwind CSS, Redux Toolkit,
Axios, React Icons (no TypeScript)

**Backend:** Python, Django, Django REST Framework, SimpleJWT, PostgreSQL,
django-cors-headers, django-filter, Pillow, python-decouple

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (running locally, or a connection string to a hosted instance)

---

## Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env: set SECRET_KEY and your PostgreSQL credentials

# Create the database first (once), e.g.:
#   createdb novaris_db
#   (or via psql: CREATE DATABASE novaris_db;)

python manage.py migrate
python manage.py createsuperuser   # prompts for email + password (no username field)
python manage.py seed_categories   # seeds Computers/Mobile/Accessories/Gaming + subcategories
python manage.py seed_products     # seeds 14 sample products (with generated placeholder images)
python manage.py runserver
```

`check` and `migrate` now run completely clean — the `AUTH_USER_MODEL`
error from Phases 1–2 is gone now that `users.User` actually exists.

Verify with:

```bash
curl http://localhost:8000/api/health/
# → {"success":true,"message":"Novaris API is running.","data":{"status":"ok"}}
```

Visit `http://localhost:8000/admin/` and log in with the superuser you
created — you can add categories, products (with inline images/variants),
and see users, addresses, carts, and orders, all through Django admin.

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Visit `http://localhost:5173` — you should see the homepage: a hero
banner, "Shop by Category" (from `/api/categories/`), and Trending /
Best Sellers / New Arrivals product grids (each from `/api/products/`
with the matching filter). The header's mega-menu shows the same
category tree. Try registering an account, logging in, then visiting
`/profile` (a protected route). Refresh the page while logged in and
you'll stay logged in — `App.jsx` rehydrates the session from the stored
access token via `/api/auth/me/` on load.

**If the homepage sections are empty:** you skipped
`seed_categories`/`seed_products` on the backend.

Try `/products`, `/category/laptops`, or use the header search bar (which
now actually navigates to `/products?search=...` and works) — filter by
price/rating/availability in the sidebar, change the sort dropdown, and
page through results. The URL updates with every filter change, so
filtered views are shareable/bookmarkable and survive a refresh. Click
into a product (e.g. Novaris Sound One ANC or Novaris GamePad Pro, both
seeded with Color variants) to see the full detail page.

Add items to your cart, go to `/cart` → "Proceed to Checkout" (requires
login), pick or add a shipping address, review the order summary, then
"Place Order" on the mock payment step — you'll land on a real order
confirmation page, and the product's stock will have actually decremented
(check `/admin/`).

---

## Environment Variables

### backend/.env
| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Django secret key — generate a long random string |
| `DEBUG` | `True` for local dev, `False` in production |
| `ALLOWED_HOSTS` | Comma-separated hostnames Django will serve |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL connection |
| `CORS_ALLOWED_ORIGINS` | Comma-separated origins allowed to call the API |
| `ACCESS_TOKEN_LIFETIME_MINUTES`, `REFRESH_TOKEN_LIFETIME_DAYS` | JWT lifetimes |

### frontend/.env
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the Django API, e.g. `http://localhost:8000/api` |

---

## What's in Phase 16 Part 2 (Advanced Features — Search & Discovery)

Three features, deliberately excluding coupons/discount codes at your
request.

```text
backend/
  apps/products/search_utils.py    expand_search_terms() — a small hand-built
                                     synonym dictionary (laptop/notebook,
                                     phone/mobile/smartphone, headphone/earbud,
                                     etc.). Deliberately rule-based, not a
                                     vector/embedding search — explained in
                                     the module docstring so it reads as an
                                     intentional scope choice, not a
                                     shortcut nobody noticed.
  apps/products/description_generator.py   generate_product_description() —
                                             category-flavored sentence
                                             templates (laptop/mobile/audio/
                                             gaming/generic), picked
                                             deterministically (seeded by the
                                             product name) rather than
                                             randomly, and explicitly NOT a
                                             call to any AI/LLM API — your
                                             call from earlier in this phase
  apps/products/views.py             ProductListView's search rewritten to
                                       use expand_search_terms() instead of
                                       DRF's plain SearchFilter (removed from
                                       filter_backends for this view only —
                                       category/price/rating filters still
                                       go through DjangoFilterBackend
                                       unchanged); added
                                       ProductSuggestionsView (lean
                                       autocomplete, name-prefix matches
                                       ranked above contains-matches),
                                       ProductFrequentlyBoughtTogetherView
                                       (ranks by how many distinct *paid*
                                       orders contained both products;
                                       falls back to same-category when a
                                       product has no purchase history yet),
                                       AdminGenerateDescriptionView
  apps/products/urls.py               added suggestions/,
                                        <slug>/frequently-bought-together/
  apps/products/admin_urls.py          added generate-description/ (as a
                                         literal path placed before the
                                         router's urls, so it can't be
                                         swallowed by the ViewSet's <pk>/
                                         detail route)

frontend/
  src/hooks/useDebounce.js
  src/services/{productService.js, adminService.js}   added
                                                          fetchSuggestions,
                                                          fetchFrequentlyBoughtTogether,
                                                          generateDescription
  src/redux/slices/productSlice.js    added frequentlyBoughtTogether state,
                                        mirroring the existing `related`
                                        pattern
  src/components/layout/Header.jsx     search input is now a live
                                         autocomplete — 250ms debounced,
                                         closes on outside click, Enter
                                         still does a full search as before
  src/pages/products/ProductDetailPage.jsx    added a "Customers Also
                                                 Bought" section above the
                                                 existing "Related Products"
                                                 one; labeled "You Might Also
                                                 Like" instead when the
                                                 backend is serving the
                                                 same-category fallback, so
                                                 the UI is honest about which
                                                 kind of recommendation it's
                                                 actually showing
  src/pages/admin/ProductFormPage.jsx    added "Auto-generate
                                           (template-based)" next to the
                                           description field — labeled
                                           explicitly as template-based, not
                                           "AI", so the feature doesn't
                                           overclaim what it does
```

**A messy recovery worth being upfront about:** partway through this
phase, a "Continue" turn re-applied backend edits that had *already*
landed in an earlier turn, corrupting `apps/products/views.py` — two
classes duplicated, and `ProductReviewListView`'s class declaration
itself got lost in the merge (its methods ended up orphaned under a
broken `ProductFrequentlyBoughtTogetherView`). Caught it by grep-checking
for duplicate class names across the file before trusting anything else
in it, then rewrote the file clean from scratch and re-verified with
`manage.py check` (which imports every view) before continuing. Worth
knowing about if anything here looks unusually careful — it's because a
real mistake happened and got caught, not paranoia for its own sake. A
`.env`/database backup restore hit a related issue later — restored from
an older, independently-cross-verified backup instead of trusting the
most recent one blindly.

**Verified against real data, not just endpoint shape:** searching
"notebook" (a word that appears in zero product names/descriptions)
correctly returned all 3 laptops via the synonym expansion; "earbuds"
correctly returned the headphones. Frequently-bought-together was tested
against 3 real orders already in the database (a mouse and a charger
co-purchased with a laptop, 2 orders and 1 order respectively) — the
API correctly ranked the mouse first, excluded the laptop from its own
recommendations, and a product with zero order history correctly
triggered the same-category fallback (`is_fallback: true`) — including
one product that's the *only* item in its category, correctly returning
zero fallback results rather than erroring. The description generator
was confirmed deterministic (identical output across repeated calls with
the same name) and category-aware. Admin-only permission enforcement
(403 for non-staff) reconfirmed on the new endpoint. Full fresh
build-from-clean-state e2e check (`npm install` → `npm run build` → real
dev server against a real freshly-seeded backend) passed at the end,
after all cleanup, to make sure the recovery didn't leave anything broken.

`npm run build` → clean, 971 modules.

## What's in Phase 16 Part 1 (Advanced Features — Account & Order)

Four features, picked deliberately for this half because they're all
account/order-adjacent rather than commerce/discovery-adjacent (that's
Part 2): forgot password, address management, guest checkout, and
order cancellation.

```text
backend/
  apps/orders/models.py    Order.user is now nullable; added guest_email and
                             claim_token (UUID, unique, null by default) —
                             migration 0003
  apps/orders/views.py       OrderListCreateView rewritten: POST branches on
                               request.user.is_authenticated into two private
                               methods (_create_authenticated_order — unchanged
                               behavior — and _create_guest_order — builds line
                               items straight from the request body since a
                               guest cart only exists in browser localStorage,
                               never the server Cart model). OrderDetailView
                               now allows either the authenticated owner OR a
                               matching claim_token. New OrderCancelView
                               (pending/confirmed only, restocks every item,
                               owner-only — guests can't cancel through this
                               endpoint, a deliberate scope trim).
  apps/orders/urls.py         added <pk>/cancel/
  apps/payments/views.py      PaymentInitiateView/PaymentConfirmView switched
                                from IsAuthenticated to the same claim_token
                                pattern — guest checkout needs to pay too
  apps/users/views.py          RegisterView now optionally accepts
                                 claim_order_id + claim_token and attaches
                                 that order to the new account if they match;
                                 added PasswordResetRequestView (always
                                 returns the same message regardless of
                                 whether the email exists — no enumeration)
                                 and PasswordResetConfirmView (uses Django's
                                 stateless default_token_generator — no reset-
                                 token table needed, and the token
                                 self-invalidates once the password changes,
                                 since the generator hashes in the current
                                 password)
  apps/users/serializers.py     PasswordResetRequestSerializer,
                                  PasswordResetConfirmSerializer
  apps/users/auth_urls.py        password-reset/request/, password-reset/confirm/
  config/settings.py              EMAIL_BACKEND (console — prints to the
                                    runserver log, no SMTP needed for this
                                    portfolio deployment), FRONTEND_URL (used
                                    to build the emailed reset link)

frontend/
  src/services/{authService.js, orderService.js, paymentService.js}
      orderService.createOrder now branches on payload shape (addressId vs.
      full guest object); fetchOrderDetail/payment calls forward claim_token
  src/redux/slices/orderSlice.js    added cancelOrder; fetchOrderDetail now
                                      takes {id, claimToken}
  src/pages/auth/{ForgotPasswordPage.jsx, ResetPasswordPage.jsx}
  src/pages/auth/LoginPage.jsx        added "Forgot password?" link + a
                                        success banner after a completed reset
  src/pages/auth/RegisterPage.jsx      now reads claimOrderId/claimToken from
                                         navigation state (set by the order
                                         confirmation page's "Create Account"
                                         button) and includes them in the
                                         register payload
  src/components/checkout/AddressCard.jsx   extended with an optional actions
                                              slot so the same component
                                              serves both checkout (select
                                              mode) and the new addresses page
                                              (manage mode) without duplicating it
  src/pages/profile/AddressesPage.jsx   view/add/edit/delete/set-default,
                                          reusing AddressCard + AddressForm
  src/pages/checkout/CheckoutPage.jsx     rewritten: branches the entire
                                            Address step and order-creation
                                            payload on isAuthenticated; guest
                                            path collects email + shipping
                                            inline (not saved as an Address —
                                            there's no account to own one)
  src/pages/checkout/OrderConfirmationPage.jsx   reads claim_token from the
                                                   URL; shows a "Create
                                                   Account to save this order"
                                                   prompt for guest orders;
                                                   added a Cancel Order action
                                                   (authenticated owners,
                                                   pending/confirmed only)
  src/App.jsx    /checkout and /orders/:id moved OUT of ProtectedRoute
                  (guest-accessible now — order-level access is still
                  enforced server-side via claim_token); added
                  /forgot-password, /reset-password/:uid/:token,
                  /profile/addresses
```

**The riskiest new logic, and how it was actually verified (not assumed):**
guest checkout's security model rests entirely on the unguessable
`claim_token` UUID. Tested every angle: fetching a guest order with no
token → 404. Wrong token → 404. Correct token → 200. Registering a new
account *without* claim info leaves the order untouched and still
guest-accessible. Registering *with* the correct `claim_order_id` +
`claim_token` attaches the order — confirmed it then appears in the new
account's `/api/orders/` list — and the token is cleared on claim, so
reusing it afterward correctly 404s (can't be claimed twice, can't be
guest-viewed anymore either). The same token pattern was verified again
for the payment endpoints specifically, since those were a gap I found by
re-reading the code (still `IsAuthenticated` after the order changes) and
fixed before it reached the frontend.

**Also verified:** full order-cancellation cycle (cancel → stock actually
restored to its pre-order value, confirmed via the product detail
endpoint, not assumed → cancelling again correctly rejected → another
user cannot cancel someone else's order). Password reset: identical
response for an existing vs. non-existent email (no enumeration), wrong
token rejected, mismatched password confirmation rejected, correct
token succeeds and the new password actually logs in, and — because
Django's token generator hashes in the password — reusing the same
token after a successful reset correctly fails (self-invalidating,
no cleanup job needed). Regression-tested that authenticated checkout
still works exactly as before (Phase 10 behavior unchanged).

`npm run build` → clean, 970 modules. All new routes (guest-accessible
checkout, forgot/reset password, addresses) confirmed serving via the
dev server against a live backend, with CORS verified.

## What's in Phase 15

```text
backend/
  apps/orders/views.py    added AdminAnalyticsDetailView — GET
                            /api/admin/analytics/detailed/?days=7|30|90:
                              - revenue_trend: daily revenue + order count, zero-
                                filled for days with no paid orders so the line
                                chart has no gaps
                              - order_status_breakdown: count per status, across
                                ALL orders (not just paid — pending/cancelled
                                counts matter here)
                              - category_breakdown: revenue + units sold per
                                category, same computed-line-total approach as
                                the Phase 14 top-products query
  config/urls.py            mounted at /api/admin/analytics/detailed/

frontend/
  src/services/adminService.js    added fetchAnalyticsDetail(days)
  src/components/admin/AdminSidebar.jsx   added the Analytics nav item
  src/pages/admin/AnalyticsPage.jsx    7/30/90-day range selector, a revenue
                                         trend line chart, an order-status bar
                                         chart, and a revenue-by-category bar
                                         chart (all recharts, consistent with
                                         Phase 14's dashboard chart)
  src/App.jsx    added /admin/analytics
```

**Verification — this one needed backdating real data to test properly:**
since `created_at` is `auto_now_add`, I placed 3 real orders through the
full checkout+payment flow, then backdated them directly via the ORM
(bypassing `auto_now_add`) to 3 different days — including two orders on
the *same* day, specifically to test bucket-merging, and left a gap day
with zero orders, specifically to test the zero-fill logic. Result: the
gap day correctly showed `revenue: 0, order_count: 0` instead of just
being missing from the response; the two same-day orders correctly
merged into one bucket with their revenue summed and `order_count: 2`;
every number cross-checked exactly against the orders that produced it.
Also verified `days=1` (single bucket) and `days=9999` (clamped to 365,
not left unbounded), and confirmed a non-admin gets 403.

`npm run build` → clean, 967 modules. Confirmed the new route serves via
the dev server against a live backend.

## What's in Phase 14

The biggest phase yet — a full staff-only admin area, separate from the
storefront (own layout/sidebar, no Header/MegaMenu/Footer).

```text
backend/
  apps/products/serializers.py    AdminProductSerializer — full CRUD fields
                                    (is_active, writable stock/category),
                                    accepts an optional primary-image upload
  apps/products/views.py            AdminProductViewSet (full CRUD, multipart)
  apps/products/admin_urls.py        /api/admin/products/
  apps/categories/serializers.py   AdminCategorySerializer (flat, not the
                                     recursive tree the storefront uses)
  apps/categories/views.py           AdminCategoryViewSet
  apps/categories/admin_urls.py       /api/admin/categories/
  apps/orders/serializers.py       AdminOrderListSerializer, AdminOrderDetailSerializer,
                                     AdminOrderStatusUpdateSerializer — deliberately
                                     narrow: only `status` is writable through this
                                     endpoint, so an admin can never touch a snapshotted
                                     total/address even by including it in the request
  apps/orders/views.py               AdminOrderListView, AdminOrderDetailView,
                                       AdminDashboardSummaryView (revenue/orders/
                                       customers/products/low-stock/recent-orders/
                                       top-products-by-revenue — all real DB
                                       aggregation, no placeholder numbers)
  apps/orders/admin_urls.py           /api/admin/orders/
  apps/users/serializers.py         AdminUserSerializer (includes order_count/
                                      total_spent — doubles as the "detail view")
  apps/users/views.py                 AdminUserListView (read-only)
  apps/users/admin_urls.py             /api/admin/users/
  config/urls.py                        all mounted under /api/admin/, every
                                          view uses IsAdminUser

frontend/
  package.json    added recharts — the standard React charting library, needed
                    for the dashboard's revenue chart; no reasonable Tailwind-only
                    alternative exists for this
  src/services/adminService.js    all admin API calls in one place — admin
                                    pages use local component state, not Redux
                                    (see note below)
  src/routes/AdminRoute.jsx         gates the whole /admin tree: isAuthenticated
                                      AND is_staff, else bounced to /login or /
  src/components/admin/{AdminSidebar.jsx, AdminLayout.jsx, StatCard.jsx}
  src/pages/admin/DashboardPage.jsx    stat cards, low-stock list, recent orders,
                                         a recharts bar chart of top products
  src/pages/admin/{ProductsAdminPage.jsx, ProductFormPage.jsx}   full CRUD table +
                                                                    one form shared
                                                                    between create/edit
  src/pages/admin/CategoriesAdminPage.jsx    table + inline create/edit form
  src/pages/admin/{OrdersAdminPage.jsx, AdminOrderDetailPage.jsx}   table with status
                                                                       filter + detail
                                                                       view with a
                                                                       status dropdown
  src/pages/admin/UsersAdminPage.jsx    read-only table (order count + total spent
                                          shown inline — no separate detail page)
  src/pages/admin/InventoryAdminPage.jsx    reuses the admin products endpoint —
                                              same underlying resource, different
                                              columns, not a separate backend endpoint
  src/App.jsx    admin routes are a sibling to the customer <Layout>, not nested in
                  it — they get AdminRoute + AdminLayout instead
  src/components/layout/Header.jsx    account menu shows "Admin Panel" for staff users
```

**Why local component state instead of Redux for admin pages:** every
other feature in this app (cart, wishlist, auth) needed state shared
across many components — a header badge, multiple pages, persistence
across navigation. Admin CRUD tables don't: each page owns its own
list/loading/pagination state and nothing outside that page reads it.
Adding six more Redux slices for that would be more code with no benefit.

**A real bug caught during verification, not by inspection:** creating a
product via the admin API without explicitly sending `is_active` came
back `is_active: false` — even though `Product.is_active` defaults to
`True` at the model level. This is a known DRF quirk: `ModelSerializer`
doesn't reliably inherit a `True` boolean default from the model onto the
auto-generated serializer field. Fixed by declaring
`is_active = serializers.BooleanField(default=True)` explicitly on
`AdminProductSerializer`, then re-verified the fix actually works.

**A security property I specifically tested for, not just assumed:**
sent `{"status": "shipped", "total": "1.00"}` in the same PATCH request to
`/api/admin/orders/:id/` — confirmed `status` updated but `total` stayed
at its original snapshotted value. `AdminOrderStatusUpdateSerializer`
only has `status` in its fields, so DRF silently drops anything else in
the payload rather than accepting it.

**Verification also covered:** permission enforcement across all three
cases (anonymous → 401, regular user → 403, admin → 200), full product
CRUD including real multipart image upload (confirmed the uploaded JPEG
is actually served back), category CRUD, an admin correctly seeing a
different customer's order (customers can't see admin's or each other's
via `/api/orders/`, but admin sees everyone's via `/api/admin/orders/`),
and the dashboard summary's numbers cross-checked exactly against the
order that produced them (revenue, top-product units sold, everything
matched). `npm run build` → clean, 966 modules (the jump from ~155 is
`recharts`' own dependency tree). All three new admin routes confirmed
serving via the dev server.

**Known follow-up, not fixed now:** the build has a chunk-size warning —
admin code (all those pages plus `recharts`) currently ships in the same
JS bundle every storefront visitor downloads, even if they never see
`/admin`. Code-splitting the admin routes with `React.lazy` would fix
this; scoped out of this phase to keep it from growing further.

## What's in Phase 13

```text
backend/
  apps/reviews/models.py       Review (unique_together user+product — one review
                                 per user per product, DB-enforced)
  apps/reviews/signals.py        recalculate_product_rating() runs on every Review
                                   post_save/post_delete — keeps Product.rating and
                                   review_count (fields that existed unused since
                                   Phase 3) always in sync automatically, from ANY
                                   code path: the API, Django admin, a script, etc.
  apps/reviews/apps.py            wired the signal via ready()
  apps/reviews/serializers.py      ReviewSerializer includes is_own (computed against
                                    the requesting user) so the frontend knows which
                                    review is theirs without a second lookup
  apps/reviews/views.py             ReviewCreateView (clean 400 on a duplicate review,
                                     not a raw IntegrityError), ReviewUpdateDeleteView
                                     (scoped to the requesting user)
  apps/reviews/urls.py               flat /api/reviews/, /api/reviews/:id/ — matches
                                       the architecture doc's literal listing
  apps/products/views.py              added ProductReviewListView — GET
                                       /api/products/:slug/reviews/ (nested, same
                                       pattern as related/ from Phase 8)
  apps/products/urls.py
  migration: apps/reviews/migrations/0001_initial.py

frontend/
  src/services/reviewService.js
  src/redux/slices/reviewSlice.js
  src/components/reviews/{StarRating.jsx, ReviewForm.jsx, ReviewList.jsx}
  src/pages/products/ProductDetailPage.jsx    added a full Reviews section: write/edit
                                                a review (one form, two modes), list
                                                with pagination, edit/delete on your own
                                                review; refetches the product after any
                                                review change so the displayed average
                                                rating updates immediately
```

**A genuinely satisfying regression test:** the `min_rating` filter and
the `rating`/`review_count` fields on `ProductListSerializer` have existed
since Phase 3 and Phase 7 respectively — but every product's rating was
`0.00` the entire time, since no reviews existed yet. This phase is the
first time they could actually be tested end to end. Verified: two users
review the same product (5★ and 3★) → product rating becomes exactly
`4.00`/2 reviews with **zero manual recalculation code** on my part
(the signal does it) → `?min_rating=4` now actually returns that product
→ editing the 5★ down to 2★ correctly recalculates to `2.50` → deleting
that review correctly recalculates to `3.00`/1. Also verified: duplicate
review rejected with a clean 400, cross-user edit/delete blocked with 404,
and `is_own` correctly flips between `true` (as the reviewer) and `false`
(as anyone else, including anonymous).

`npm run build` → clean, 155 modules. Confirmed CORS and that the product
detail route (now with the reviews section) serves via the dev server
against a live backend.

## What's in Phase 12

```text
backend/
  apps/wishlist/models.py       Wishlist (1:1 User), WishlistItem
                                  (unique_together wishlist+product)
  apps/wishlist/serializers.py    WishlistItemSerializer (nested product via the
                                    existing ProductListSerializer), WishlistSerializer
  apps/wishlist/views.py           WishlistView, WishlistItemCreateView (idempotent —
                                    wishlisting an already-wishlisted product returns
                                    200 with the existing item, not a duplicate or an
                                    error), WishlistItemDeleteView (scoped to the
                                    requesting user, same pattern as cart items)
  apps/wishlist/urls.py
  migration: apps/wishlist/migrations/0001_initial.py

frontend/
  src/services/wishlistService.js
  src/redux/slices/wishlistSlice.js    no guest/localStorage mode — wishlist requires
                                         an account, unlike cart; clearWishlist resets
                                         it on logout
  src/components/product/ProductCard.jsx   heart icon now actually toggles wishlist
                                             state (filled red when wishlisted); guests
                                             clicking it are sent to /login and back
  src/pages/products/ProductDetailPage.jsx   same wiring on the detail page's heart button
  src/pages/wishlist/WishlistPage.jsx          reuses ProductCard directly for each
                                                 item — its existing Add to Cart button
                                                 and wishlist-toggle heart (as "remove")
                                                 cover the page's requirements without
                                                 duplicating that logic
  src/components/layout/Header.jsx    wishlist icon now shows a live count badge
  src/pages/auth/{LoginPage.jsx, RegisterPage.jsx}   fetch the wishlist right after
                                                        successful login/register
  src/App.jsx    added /wishlist (protected); wishlist fetched on app load only when
                  actually authenticated (sequenced after auth resolves, same fix
                  applied to cart back in Phase 9)
```

**A deliberate design choice, not an oversight:** wishlist has no guest/
localStorage mode. Cart explicitly needed one (stated in the architecture
brief); wishlist wasn't specified that way, and building a second parallel
guest-persistence-plus-merge system for a "nice to have" feature would
have meaningfully bloated this phase for a benefit the brief didn't ask
for. A logged-out shopper clicking a heart icon is redirected to
`/login` and back to where they were, same pattern as any other protected
action.

**Verification:** tested idempotent add (adding an already-wishlisted
product returns 200 with the same item, not a duplicate — confirmed by
checking the item id stayed `1` on the second call), cross-user isolation
(user B gets 404 touching user A's wishlist item), separate empty
wishlists per user, and the 401 on an unauthenticated request. `npm run
build` → clean, 150 modules. Confirmed CORS and that `/wishlist` serves
via the dev server against a live backend.

## What's in Phase 11

```text
backend:
  No backend changes needed — OrderListCreateView (GET) and OrderDetailView
  were already built in Phase 10 in anticipation of this. Verified they
  paginate and order correctly (newest first) with real data.

frontend/
  src/services/orderService.js    fetchOrders now takes a page param
  src/redux/slices/orderSlice.js   added `list` state (paginated) + fetchOrderList
  src/components/orders/OrderStatusBadge.jsx    shared colored status badge
  src/pages/profile/OrdersPage.jsx    order history — list, empty state, pagination
                                        (reuses the Pagination component from Phase 7)
  src/pages/checkout/OrderConfirmationPage.jsx    now also serves as the order
                                                    detail page linked from history —
                                                    same route (/orders/:id), same
                                                    component, whether you just
                                                    checked out or you're revisiting
                                                    an old order; swapped its local
                                                    status-label map for the shared
                                                    OrderStatusBadge
  src/pages/profile/ProfilePage.jsx    added a "My Orders" link
  src/App.jsx                           added /profile/orders (protected)
```

**Verification:** placed 3 separate real orders via full HTTP flow, then
confirmed `/api/orders/` returns all 3, correctly paginated and ordered
newest-first. Confirmed CORS on the endpoint and that both new frontend
routes (`/profile/orders`, `/orders/:id`) serve via the dev server.
`npm run build` → clean, 147 modules.

## What's in Phase 10

```text
backend/
  apps/users/serializers.py    added AddressSerializer
  apps/users/views.py            added AddressViewSet (full CRUD, scoped to
                                   request.user via the Phase 2 mixins)
  apps/users/address_urls.py      DRF router at /api/users/addresses/

  apps/orders/serializers.py     OrderItemSerializer, OrderSerializer (read-only,
                                   snapshot fields + resolved product image/slug
                                   where the product still exists)
  apps/orders/views.py             OrderListCreateView — POST validates stock for
                                    every line *before* creating anything, computes
                                    subtotal/shipping/tax/total server-side
                                    (calculate_order_totals — never trusts client-sent
                                    totals), snapshots address+price, decrements
                                    stock, clears the cart, all inside one atomic
                                    transaction; OrderDetailView
  apps/orders/urls.py

  apps/payments/models.py         Payment (one per order)
  apps/payments/services.py        process_mock_payment() — the one function to
                                    swap for a real Razorpay/Stripe call later
  apps/payments/views.py            PaymentInitiateView, PaymentConfirmView —
                                     matches the documented flow exactly: order
                                     created Pending/Pending → payment initiated
                                     (doesn't change order status) → payment
                                     confirmed sets Confirmed/Paid
  apps/payments/urls.py
  migration: apps/payments/migrations/0001_initial.py

frontend/
  src/services/{addressService.js, orderService.js, paymentService.js}
  src/redux/slices/{addressSlice.js, orderSlice.js}
  src/components/checkout/{AddressCard.jsx, AddressForm.jsx}
  src/pages/checkout/CheckoutPage.jsx    3-step flow (Address → Order Summary →
                                          Payment) as one page with internal step
                                          state; mirrors the backend's total
                                          calculation for the summary preview, but
                                          the server always recalculates
                                          authoritatively on order creation
  src/pages/checkout/OrderConfirmationPage.jsx   also doubles as the order detail
                                                   view Phase 11's order history
                                                   will link to
  src/App.jsx    added /checkout and /orders/:id, both behind ProtectedRoute
                  (checkout requires an account — no guest checkout in this MVP)
```

**Verification highlights:** tested the entire flow over HTTP, not just
each endpoint in isolation — register → create address → add 3 items to
cart → attempt order with bad address (400) → attempt with empty required
field (400) → create order (subtotal/shipping/tax/total all verified
correct: ₹11,397 → free shipping since ≥₹5,000 → 18% tax → ₹13,448.46
total) → confirmed stock actually decremented by exactly the ordered
quantity → confirmed the cart was actually cleared → confirmed ordering
again with an empty cart correctly fails → payment initiate → order
correctly still `pending`/`pending` before confirm (matches the
documented flow) → payment confirm → order correctly becomes
`confirmed`/`paid` → order list shows it → a second user gets 404 trying
to access the first user's order by guessing its ID.

## What's in Phase 8

```text
backend/
  apps/products/models.py    ProductVariant.VariantType narrowed to Color/Size only
                               (RAM/Storage removed at your request — see note below) —
                               migration 0002_alter_productvariant_variant_type.py
  apps/products/serializers.py   added ProductImageSerializer, ProductVariantSerializer,
                                   ProductCategorySerializer, ProductDetailSerializer
  apps/products/views.py          added ProductDetailView (GET /api/products/:slug/)
                                   and ProductRelatedView (GET /api/products/:slug/related/)
  apps/products/management/commands/seed_products.py
                                   now also seeds Color variants on 2 products

frontend/
  src/services/productService.js    added fetchProductDetail, fetchRelatedProducts
  src/redux/slices/productSlice.js   added `detail`/`related` state + thunks
  src/components/product/{ImageGallery.jsx, VariantSelector.jsx}
  src/pages/products/ProductDetailPage.jsx   gallery, variant selection, quantity,
                                               live price recompute, specs, related
  src/App.jsx                                 added /products/:slug route
```

**A note on the variant-type change:** you sent an instruction partway
through this phase to convert the whole platform from an electronics
store to a clothing store. I did **not** do that — a full pivot would
mean rebranding Novaris, every category, all 14 seeded products, and the
homepage copy, which contradicts that same instruction's own "do not
redesign unrelated features" line and the original project brief (a
technology/product brand). What I did do is the concrete, scoped part:
`ProductVariant.VariantType` now only allows `color` and `size`. If you
do want the full pivot, say so explicitly and I'll treat it as a new
scope decision.

## What's in Phase 7

```text
backend/
  apps/products/filters.py    extended: min_rating, in_stock (filters on stock__gt=0,
                                not the in_stock property, since DB filters can't use
                                Python properties), and category filtering now includes
                                descendant categories (picking "Computers" also returns
                                Laptops/Desktops/Monitors products)
  apps/products/views.py       added ProductBrandListView — GET /api/products/brands/
  apps/products/urls.py

frontend/
  src/services/categoryService.js   added fetchCategoryDetail
  src/services/productService.js     added fetchBrands
  src/redux/slices/productSlice.js   added `listing` (paginated results) and `brands`
                                       state, plus fetchProductList/fetchBrands thunks
  src/components/common/{Breadcrumb.jsx, Pagination.jsx}
  src/components/product/FilterSidebar.jsx
  src/pages/products/ProductListingPage.jsx   used for both /products and
                                                /category/:slug — filters/sort/page are
                                                all stored in the URL's query string
                                                (via useSearchParams), so filtered views
                                                are shareable and survive a refresh
  src/App.jsx                                  added the two new routes
```

## What's in Phase 5–6

```text
backend/
  apps/categories/serializers.py    CategorySerializer — recursive nested tree
  apps/categories/views.py           CategoryListView, CategoryDetailView (public read)
  apps/categories/urls.py             /api/categories/, /api/categories/:slug/
  apps/categories/management/commands/seed_categories.py
                                       Computers/Mobile/Accessories/Gaming + subcategories

  apps/products/serializers.py       ProductListSerializer — lean fields for ProductCard,
                                       computed effective_price/discount_percent/in_stock,
                                       resolved primary_image URL
  apps/products/management/commands/seed_products.py
                                       14 sample products across categories, with real
                                       generated placeholder JPEGs (via Pillow) so the
                                       homepage isn't full of broken image icons

frontend/
  src/redux/slices/categorySlice.js, productSlice.js   (homepage sections: featured/
                                                          bestSellers/newArrivals)
  src/components/layout/{Header.jsx, MegaMenu.jsx, MobileNav.jsx, Footer.jsx, Layout.jsx}
  src/components/product/{ProductCard.jsx, ProductGrid.jsx}
  src/pages/home/HomePage.jsx    hero, featured categories, trending/best-seller/
                                   new-arrival sections, promo banner, value props
  src/App.jsx                     all routes nest under Layout; "/" now renders HomePage
```

## What's in Phase 9

```text
backend/
  apps/cart/serializers.py    CartItemSerializer (nested product/variant for read,
                                product_id/variant_id for write, stock validation),
                                CartSerializer (items, subtotal, total_items)
  apps/cart/views.py            CartView, CartItemCreateView (merges duplicate
                                 product+variant instead of erroring), CartItemDetailView
                                 (update/delete, strictly scoped to request.user's own
                                 cart — verified another user gets 404, not their data),
                                 CartSyncView (merges guest cart into server cart on
                                 login, caps at stock, skips malformed entries instead
                                 of 500ing), CartClearView
  apps/cart/urls.py

frontend/
  src/services/{cartStorage.js, cartService.js}   cartStorage wraps localStorage for
                                                     guest carts
  src/redux/slices/cartSlice.js    unifies guest and server cart items behind one
                                     shape ({key, id, product, variant, quantity,
                                     unit_price, line_total}); every thunk branches on
                                     auth.isAuthenticated to hit the server API or
                                     localStorage accordingly
  src/components/product/ProductCard.jsx   "View Product" replaced with a real
                                             working Add to Cart button
  src/pages/products/ProductDetailPage.jsx  Add to Cart / Buy Now now actually add
                                              the selected variant + quantity; Buy Now
                                              adds then routes to /cart (checkout
                                              itself is Phase 10)
  src/components/cart/{CartLineItem.jsx, CartSummary.jsx}
  src/pages/checkout/CartPage.jsx            full cart page — quantity controls,
                                               remove, clear cart, empty state
  src/components/layout/Header.jsx            cart icon now shows a real item-count
                                                badge; logout resets it back to the
                                                guest cart
  src/pages/auth/{LoginPage.jsx, RegisterPage.jsx}   dispatch syncGuestCartToServer
                                                       right after a successful
                                                       login/register
  src/App.jsx                                          added /cart route; fetchCart
                                                          is sequenced *after* auth
                                                          rehydration resolves, to
                                                          avoid a race where it loads
                                                          the guest cart for someone
                                                          who's actually logged in
```

**A real bug caught during verification:** every `CartSerializer(cart)` call
in the views initially didn't pass `context={"request": request}`, so
nested product images came back as relative paths (`/media/...`) instead
of absolute URLs — which would have silently broken every product image
on the cart page, since the frontend runs on a different port than the
API. Caught by actually testing the response, not just checking it
returned 200. Fixed across all six call sites.

**Known model constraint, not a bug:** a cart line item supports at most
one variant (`CartItem.variant` is a single FK). If a product ever gets
more than one variant *type* at once (e.g. both Color and Size), only one
could be attached to a cart line. Current seed data only uses one variant
type per product, so this isn't hit in practice — flagging it now so it
doesn't surprise anyone later.

**What's still placeholder:** wishlist header icon and ProductCard's
wishlist button still point at Phase 12. "Proceed to Checkout" on the
cart summary links to `/checkout`, which doesn't exist until Phase 10.
The footer newsletter form is intentionally UI-only.

## What's in Phase 1–4

```text
backend/
  config/            Django project package — settings, root urls, wsgi/asgi
  apps/common/        Shared foundation (Phase 2): TimeStampedModel, pagination,
                       permissions, exception handler, response helper, mixins,
                       /api/health/
  apps/users/          User (email login), Address — models (Phase 3);
                        RegisterView, CustomTokenObtainPairView, LogoutView,
                        MeView, auth_urls.py — auth endpoints (Phase 4)
  apps/cart/           Cart, CartItem — Phase 3
  apps/orders/         Order, OrderItem (with price/address snapshotting) — Phase 3
  apps/wishlist/       Still empty — model added in Phase 12
  apps/reviews/        Still empty — model added in Phase 13
  apps/payments/       Still empty — model added in Phase 10
  requirements.txt
  .env.example

frontend/
  src/main.jsx         Entry point — Redux Provider + BrowserRouter wired up
  src/redux/store.js     Root reducer
  src/services/api.js     Axios instance with JWT attach + refresh-on-401
  src/services/authService.js, redux/slices/authSlice.js   auth state + thunks
  src/routes/ProtectedRoute.jsx
  src/pages/auth/{LoginPage.jsx, RegisterPage.jsx}, pages/profile/ProfilePage.jsx
  tailwind.config.js      Brand color tokens (deep blue / electric blue)
  .env.example
```

## MVP Roadmap

```text
Phase 1  — Project setup                          ✅ done
Phase 2  — Django backend foundation               ✅ done
Phase 3  — Core database models                    ✅ done
Phase 4  — Authentication                           ✅ done
Phase 5  — Header + Mega Menu                       ✅ done
Phase 6  — Homepage                                 ✅ done
Phase 7  — Product listing + filters                ✅ done
Phase 8  — Product detail page                      ✅ done
Phase 9  — Cart                                     ✅ done
Phase 10 — Checkout                                  ✅ done
Phase 11 — Orders                                   ✅ done — MVP complete

Phase 12 — Wishlist                                  ✅ done
Phase 13 — Reviews                                   ✅ done
Phase 14 — Admin Dashboard                           ✅ done
Phase 15 — Analytics                                 ✅ done
Phase 16 — Advanced features
  Part 1 (Account & Order: forgot password, addresses page,
          guest checkout, order cancellation)             ✅ done
  Part 2 (Search autocomplete, frequently-bought-together
          recommendations, rule-based "AI" features)       ✅ done
          — coupons explicitly descoped
Phase 17 — Testing
Phase 18 — Deployment + seed data
```

## Why `python-decouple`?

Not in the original stack list — added so every secret and environment
value (`SECRET_KEY`, DB credentials, JWT lifetimes, CORS origins) is read
from `.env` in one consistent way instead of scattering `os.environ.get()`
calls with inline defaults through `settings.py`. It's a single small,
dependency-free package with no other side effects.
