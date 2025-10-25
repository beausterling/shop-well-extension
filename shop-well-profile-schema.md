
# Shop‑Well — User Health Profile Schema (Local Storage)

**Purpose**: Developer‑friendly spec and a suggested JSON schema for storing user health preferences **locally** (Chrome `chrome.storage.local` or `chrome.storage.sync`) to power product filters and personalized recommendations in the Shop‑Well Chrome project.

Keep the schema minimal, extensible, and privacy‑first. Obtain explicit consent, allow export/delete, and prefer client‑side encryption when feasible.

---

## 1. Data model overview

Two groups:
- `allergies_sensitivities` — allergies, contact sensitivities, fragrance/chemical, sensory needs.
- `chronic_conditions` — long‑running conditions affecting purchasing and product use.

Common entry shape: `id`, `name`, `severity` (`low|medium|high`), `seek_tags[]`, `avoid_tags[]`, optional `notes`, `last_updated`.

---

## 2. Suggested JSON schema (compact)

```json
{
  "user_id": "string",
  "consent_given": true,
  "profile_version": "1.0",
  "allergies_sensitivities": [
    {
      "id": "peanut_allergy",
      "name": "Peanut allergy",
      "severity": "high",
      "seek_tags": ["allergen_free", "peanut_free", "dedicated_facility"],
      "avoid_tags": ["may_contain_peanut", "shared_line"],
      "notes": "Carries EpiPen",
      "last_updated": "2025-10-24T16:00:00Z"
    }
  ],
  "chronic_conditions": [
    {
      "id": "type2_diabetes",
      "name": "Type 2 Diabetes",
      "severity": "medium",
      "seek_tags": ["low_glycemic", "nutrition_labeling", "portion_control"],
      "avoid_tags": ["hidden_sugar", "large_portions"],
      "notes": "Prefers sugar substitutes; tracks carbs",
      "last_updated": "2025-10-24T16:00:00Z"
    }
  ],
  "preferences": {
    "fragrance_free": true,
    "latex_free": false,
    "preferred_fabrics": ["cotton", "modal", "tencel"],
    "delivery_preference": "contactless"
  }
}
```

---

## 3. Canonical tag vocabulary (examples)

- **Allergen tags**: `peanut_free`, `tree_nut_free`, `shellfish_free`, `milk_free`, `egg_free`, `soy_free`, `wheat_free`, `sesame_free`, `gluten_free`.
- **Ingredient/food**: `low_sugar`, `no_added_sugar`, `low_sodium`, `low_purine`, `low_phosphorus`, `low_potassium`, `low_fodmap`.
- **Manufacturing**: `dedicated_facility`, `shared_line`, `may_contain`, `cross_contact_risk`.
- **Materials**: `latex_free`, `nickel_free`, `wool_free`, `tagless`, `seamless`.
- **Fragrance/chemical**: `fragrance_free`, `unscented`, `low_voc`, `no_aerosols`.
- **Accessibility/function**: `easy_open`, `ergonomic`, `non_slip`, `cpap_compatible`, `hepa_filtered`, `flicker_free`.

---

## 4. Organized lists (source-of-truth for tag mapping)

### Allergies & Sensitivities
- Food allergies: peanut, tree_nut, shellfish, milk, egg, soy, wheat, sesame.
- Food intolerances: lactose, gluten (celiac), fructose intolerance, histamine sensitivity.
- Contact/textile: latex allergy, nickel allergy, wool sensitivity, dye sensitivity.
- Skin: eczema, psoriasis, dermatographia.
- Fragrance/chemical: fragrance sensitivity, multiple chemical sensitivity, low‑VOC needs.
- Sensory processing: autism/ADHD sensory needs → `sensory_friendly`.
- Photosensitivity: photosensitive epilepsy → `flicker_free`.

### Chronic Conditions
- Diabetes (T1/T2): `low_glycemic`, `carb_count`, `nutrition_labeling`.
- Hypertension/cardiovascular: `low_sodium`, `heart_healthy`.
- Chronic kidney disease: `low_potassium`, `low_phosphorus`, `phosphate_free`.
- Gout/hyperuricemia: `low_purine`.
- Asthma/COPD/allergic rhinitis: `fragrance_free`, `low_voc`, `hepa_filtered`.
- Mobility/arthritis/chronic pain: `easy_open`, `ergonomic`, `lightweight`, `delivery_option`.
- Fall risk/balance/osteoporosis: `non_slip`, `grab_bar_ready`, `night_lighting`.
- ME/CFS/POTS/dysautonomia: `electrolyte_support`, `compression_garments`, `low_intensity`.
- Sleep disorders/sleep apnea: `cpap_compatible`, `blackout_curtains`, `noise_control`.
- Incontinence: `high_absorbency`, `odor_control`, `discreet`.
- Dysphagia: `IDDSI_level_4`, `thickened_fluids`, `pureed_foods`.
- Celiac disease: `certified_gluten_free`, `dedicated_facility`.

---

## 5. Chrome extension implementation notes

- **Local storage**: Prefer `chrome.storage.local`; offer import/export to JSON; optional `chrome.storage.sync` for cross‑device if within quota.
- **Consent**: Onboarding checkbox + short explainer. Store timestamp.
- **Security**: Optional client‑side encrypt (Web Crypto AES‑GCM) using user passphrase; keys in memory only.
- **Performance**: Precompute risk flags at scrape; cache per domain; debounce recompute on profile edits.

---

## 6. Minimal matching helper (JS)

```js
const isProductSafe = (productTags, userProfile) => {
  const avoid = new Set([
    ...userProfile.allergies_sensitivities.flatMap(a => a.avoid_tags),
    ...userProfile.chronic_conditions.flatMap(c => c.avoid_tags)
  ]);
  const seek = new Set([
    ...userProfile.allergies_sensitivities.flatMap(a => a.seek_tags),
    ...userProfile.chronic_conditions.flatMap(c => c.seek_tags)
  ]);
  const matchedAvoid = productTags.filter(t => avoid.has(t));
  const matchedSeek = productTags.filter(t => seek.has(t));
  return { safe: matchedAvoid.length === 0, matchedAvoid, matchedSeek };
};
```

---

*Generated: 2025-10-24T23:57:10.292527*
