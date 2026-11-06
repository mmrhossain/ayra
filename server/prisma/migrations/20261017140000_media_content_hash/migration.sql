-- Content hash lets a retried upload reuse the same pending asset instead of
-- creating another Cloudinary object and MediaAsset row.
ALTER TABLE "media_asset" ADD COLUMN "contentHash" TEXT;

CREATE INDEX "media_asset_ownerUserId_type_contentHash_status_idx"
  ON "media_asset"("ownerUserId", "type", "contentHash", "status");
