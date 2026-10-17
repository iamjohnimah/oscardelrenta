# Oscar associate workspace

This source builds the in-store, VIC and client edit experiences in iamjohnimah/oscardelrenta. It is isolated from the online storefront.

Build: `node build.mjs` with esbuild installed. Set ESBUILD_MODULE to an installed esbuild entry when using the shared local dependencies.

The app uses SPREEAI guest sessions and the 49-piece Oscar development catalogue. API tokens remain in session storage. Client profiles and fitting records remain in IndexedDB on the device; no retailer CRM, inventory, reservations or POS is implied. Share links contain public product identifiers only, never client names, photos, contact details, notes or generated personal image URLs.

Back and turn-video generation require a catalogue variant tagged with back_flat. Do not substitute a front image, another garment or a recorded model example. Unavailable inputs are surfaced with an actionable reason.
