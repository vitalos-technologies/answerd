---
pulse: status/1
project: answerd
name: Answerd
repo: vitalos-technologies/answerd
visibility: public
stage: Built – activation pending
health: amber
progress: 80
updated: 2026-11-17
updated_by: session_01Cr6fhcy2Ch1rivzTMCj8ek (engineering); seeded from the Pulse record of 14 Nov 2026, next session to verify
---

# Answerd: status

## Summary
Answerd is Vitalos's UK local-services app: customers find, call, message and book local trades, and businesses get an AI front desk. This repository holds the clickable prototype and the public website, both live on Cloudflare; the backend, mobile app and production infrastructure live in the workforce repository as a module on the Workforce platform. It runs against a staging API; production, real phone sign-in and store builds wait on owner steps.

## Now

## Next
- Fix the failing staging journeys (workforce#405, #406)
- Publish the privacy notice and terms on answerd.vitalos.co.uk
- Install @vitalos/answerd-client and replace hand-written clients (PR #4, issue #2)
- Store accounts, then TestFlight and Play internal builds

## Needs Temitope
- Tracked privately on Pulse (this repository is public).

## Blockers
- Staging journeys J1-J10 failing since 13 Nov (workforce#405, #406)
- This repository cannot install the private answerd-client package (issue #2)
- Tracked privately on Pulse (this repository is public).

## Links
- Website: https://answerd.vitalos.co.uk
- Prototype: https://answerd-demo.vitalos.co.uk
