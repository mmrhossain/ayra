# Slider API examples

Base URL: `/api/v1`

Admin routes require an authenticated ADMIN session cookie (same as other dashboard routes).

## List active sliders (public)

```bash
curl -X GET "$API/api/v1/sliders"
```

Alias:

```bash
curl -X GET "$API/api/v1/sliders/active"
```

Response `data` contains only active sliders whose desktop image upload is `READY` and whose start/end window includes now.

## Create slider (admin)

`orderId`-style URL fields are optional. Image is required. Upload is processed in the background; the created slider starts with `imageStatus: PENDING`.

```bash
curl -X POST "$API/api/v1/admin/sliders" \
  -H "Cookie: rangalay.session_token=..." \
  -F "title=Summer sale" \
  -F "redirectUrl=https://example.com/sale" \
  -F "priority=10" \
  -F "isActive=true" \
  -F "image=@./hero.jpg;type=image/jpeg" \
  -F "mobileImage=@./hero-mobile.webp;type=image/webp"
```

Accepted image types: `jpg`, `jpeg`, `png`, `webp`. Max size: 2MB.

## Update slider (admin)

Metadata-only:

```bash
curl -X PATCH "$API/api/v1/admin/sliders/{id}" \
  -H "Cookie: rangalay.session_token=..." \
  -F "title=Updated title" \
  -F "isActive=false"
```

Replace images (re-queued for Cloudinary):

```bash
curl -X PATCH "$API/api/v1/admin/sliders/{id}" \
  -H "Cookie: rangalay.session_token=..." \
  -F "image=@./hero-v2.png;type=image/png"
```

## Delete slider (admin)

```bash
curl -X DELETE "$API/api/v1/admin/sliders/{id}" \
  -H "Cookie: rangalay.session_token=..."
```

Deletes the row, queued jobs, local temp files, and Cloudinary assets (`public_id`).

## Admin list

```bash
curl -X GET "$API/api/v1/admin/sliders?page=1&limit=20" \
  -H "Cookie: rangalay.session_token=..."
```
