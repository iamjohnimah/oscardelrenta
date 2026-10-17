# Oscar associate demo · release 2.0.0

The associate workspace is rebuilt around a visit: open a client, capture their brief, assemble an edit, review previews and sizes, prepare the fitting or message, and record the next action. In-store and VIC modes retain the same client and edit. The public online storefront is unchanged. Visit tools keeps client brief, comparison, status and End session accessible on phone layouts.

## The ten platform features

Source: https://spreeai.com/product/ (verified 2026-10-17).

| Feature | Associate use | Current readiness |
|---|---|---|
| Virtual try-on | Present the chosen outfit on a client photo or Twin | Live API; Twin front try-on verified |
| Size recommendation & fit | Review guidance, then explicitly confirm the chosen size | Live sizing verified; detailed fit service is not deployed here |
| Side-by-side comparison | Compare saved looks or supported size previews | Both interfaces connected; see QA evidence below |
| Twins | Begin without uploading a shopper photo | Live searchable catalogue; Yuna verified |
| Back try-on | Review the matching back silhouette | Blocked: none of the 49 Oscar catalogue variants has verified back_flat input |
| Video try-on | Explore the same look turning | Blocked by matching back inputs; no substitute sample is shown |
| Stylist | Shortlist pieces by occasion, palette, exclusions and budget | Deterministic catalogue-based suggestions; no external conversational AI service connected |
| Outfit builder | Assemble up to five matching pieces; build around a selected piece | Connected to the actual Oscar catalogue and outfit try-on |
| Saved looks | Resume, compare, archive and restore client edits | Device-local IndexedDB; 30 active looks per client plus archives |
| Pose selection | Explore front, three-quarter and side views | Live API; full three-piece alternate poses verified in local browser |

## Associate operating flow

1. Open a prepared demonstration client, a saved client, or a guest. For a real client, obtain permission before choosing and uploading their photo. A Twin is an illustrative stand-in.
2. Save the occasion, date, budget, colours, exclusions, existing wardrobe and fitting preferences in Client brief.
3. Search the 49-piece Oscar collection, or use Stylist to create a shortlist. Build a look of up to five pieces. Nothing is sent to the client automatically.
4. Generate the complete front preview. Show the personal edit full screen to hide contact details and private notes. Compare alternatives and confirm sizes deliberately; opening comparison does not select size 00.
5. In-store: mark pieces prepared after checking their sizes; copy or download the fitting brief. Confirm stock, reservations, final pricing and checkout in the retailer's own systems.
6. VIC: review the draft message, download/share the personal preview using the device share flow, or copy a product-only collection link. That link contains public product identifiers only. The client can save favourites on their device and send a fitting request manually.
7. Record a fitting, follow-up, or associate-reported outcome. Download a calendar invitation when useful. Plans are not confirmed store bookings, and outcomes are not verified sales transactions.
8. End session to clear the active API identity. Saved client profiles remain on the current device. Use Client book to manage retained records.

## QA evidence and limits

- TypeScript compile: passed.
- 12 behavioral tests: passed. Coverage includes private-data exclusion from links, untrusted link payloads, legacy look updates, active capacity, reversible archiving, correct message formatting, explicit/unknown sizes, budget/currency filters, exclusions and consistent catalogue environments.
- Live development API: guest session, 49 Oscar products, 52 Twins, front generation, sizing SUCCESS with size 2, and three-quarter generation verified.
- Actual three-piece outfit: front, three-quarter and side outputs completed in local browser. Generated outfit input is scoped to the same session, identity and completed front request.
- Size comparison: both generated size 2 and size 4 images completed and loaded at 896px; opening and closing comparison left the selected garment size empty. This tests image delivery, not measured fit accuracy.
- Saved-look archive and restore verified in browser; legacy client-book database retained.
- Mobile 390px overflow corrected and verified in the preceding QA pass. Desktop layout inspected visually. Final release checks are recorded in the pull request.
- Photo consent and upload flow preserved in source; no actual shopper photo was used during QA. Do not infer successful real-customer upload coverage from Twin testing.
- No claim that generated size differences predict measured fit; visual fidelity requires retailer review.
- No live CRM, shared multi-device records, retailer inventory, reservation, POS, message delivery or verified attribution connection. Client data is device-local; BroadcastChannel coordinates tabs on the same origin only.
- API failures retain the sanitized Oscar catalogue snapshot. Generated personal previews require live services.

## Remaining release gates for a store pilot

| Priority | Action | Owner or dependency | Acceptance |
|---|---|---|---|
| P0 | Verify and tag matching back photographs | Authenticated SPREEAI catalogue operator + Oscar product assets | Same-person back output for each pilot garment; matching front/back turn video |
| P0 | Exercise consented real-client photo, expired session, offline and storage-full paths | Pilot QA on target store devices | No cross-client preview, clear recovery, retained edits after recoverable failures |
| P0 | Validate sizing and generated garment fidelity against approved pilot pieces | Oscar merchandising/fit team | Documented acceptance per garment and size range |
| P1 | Connect authenticated clienteling storage and device access policies | Retailer CRM/backend integration | Authorized cross-device continuation, retention and deletion behavior |
| P1 | Connect inventory, reservations and handoff | Retailer commerce systems | Verified stock/size/location, reservation state, fitting completion |
| P1 | Add consented messaging and attribution | Retailer-approved channels/CRM | Explicit delivery events and sale attribution; no inferred delivery |
| P1 | Integrate a conversational stylist if required | Approved SPREEAI stylist service contract | Actual multi-turn preference changes, grounded products, transparent failures |
| P1 | Measure pilot service flow | Retailer analytics | Time to first preview, time to fitting brief, generation success, fitting conversion; no fabricated baseline |

See oscar-back-input-readiness.json for all 49 affected garment identifiers. Correct source photography must be verified before tagging; do not label guessed images or another garment as the missing back input.
