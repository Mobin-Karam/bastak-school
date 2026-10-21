---
description: Design or add a CMB module without coupling the reusable platform to Bastak School product policy.
---

# Bastak School: design or add a CMB module

Design the requested backend capability as a CMB-compatible module.

Before coding:

1. Query Graphify for existing related services/modules and dependency paths.
2. Decide whether the capability belongs to kernel, reusable platform, infrastructure adapter, or Bastak School product domain.
3. Reuse an existing module when the responsibility already exists.
4. Define public contracts, required/provided capabilities, configuration, persistence ownership, events, security rules, and health behavior.
5. Identify migrations and API compatibility impact.
6. Define tests before implementation.

Reject designs that push Bastak School-specific education concepts or product branding into the reusable CMB kernel. Preserve `/api/v2` compatibility unless an approved breaking change says otherwise.
