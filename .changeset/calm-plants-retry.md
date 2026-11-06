---
"plantae": patch
---

Prevent Axios retries from re-entering Plantae hooks and let plugins inspect retry HTTP errors before applying the original status validator. Make the retry client optional.
