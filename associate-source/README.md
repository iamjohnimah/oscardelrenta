# Oscar associate atelier

Editable source for the in-store, VIC and shared client edit demos in iamjohnimah/oscardelrenta.

Requires Node 22.18+ and npm. Install with npm install. Run npm run check, npm test, then npm run build. The build writes ../associate, leaving the online storefront untouched. OSCAR_OUTPUT_DIR and ESBUILD_MODULE may override the output folder and esbuild module for a local preview.

See docs/oscar-atelier-2.0.0.md for associate operation, feature readiness and QA. Back and video try-on need verified back_flat photography; current Oscar inputs are listed in docs/oscar-back-input-readiness.json. Device-local client records are not a retailer CRM.

Do not commit client records, uploaded photos, access tokens or raw catalogue exports. The bundled catalogue snapshot includes public product fields only.
