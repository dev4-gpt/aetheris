# OCI Always Free pilot

This is a small, unclassified public-data pilot. The software has authentication, persistent records, source status, and a backup path; the free host has **no uptime SLA**. Do not use it for CUI, classified data, engagement decisions, or an availability-critical workflow.

## Provision

1. Create an OCI account in a region with an Always Free Ampere A1 VM. Select an Always Free shape of **at most 2 OCPUs and 12 GB RAM**, plus storage within the 200 GB free block-volume allowance. OCI may report no free capacity or reclaim idle instances. Do not upgrade to paid resources to work around either condition.
2. Install Docker Engine and Compose on the VM. Point an existing or free DNS hostname at its public IP. Open inbound TCP 80 and 443 only; restrict SSH to administrator IPs. Keep the database volume private to the VM.
3. Copy `deploy/oci/.env.example` to repo-root `.env`, set the hostname, and replace the password with a unique 14+ character secret. Keep `.env` private; it is ignored by Git and Docker build context.
4. From the repo root, run `docker compose build --pull` and `docker compose up -d`. Caddy issues the HTTPS certificate. Visit the configured hostname and sign in as `admin`.
5. Create separate `operator` and `viewer` accounts through the protected `/api/v1/admin/users` route. The bootstrap password is used only when creating the first `admin` row; changing the environment value later does not rotate that account.

The image uses Node 24.14, `npm ci`, a non-root process, no external font or model API, and a 1 MiB HTTP body limit. The only application outbound sources are defined in `apps/gateway/src/feeds.js` and `apps/gateway/src/scenes.js`: USGS, NASA EONET, NWS, CelesTrak, Fintraffic, GDELT, and USGS EPQS. NWS point discovery may return a forecast URL; the gateway accepts it only on the approved `api.weather.gov` host and hourly gridpoint path. The app has no arbitrary URL-fetch endpoint. A network firewall should limit egress to HTTPS and DNS where feasible. The product should not claim global live maritime or aviation coverage from these adapters.

## Backup and restore

Run `docker compose exec gateway node apps/gateway/scripts/backup.js`. This creates a consistent SQLite backup under `/data/backups/` in the named volume. Copy the resulting `.db` off the VM after each backup; a backup left on the same VM does not protect against volume or account loss. Keep access restricted because backups contain users, sessions, observations, and decisions.

For a restore drill, stop the gateway, replace `/data/aetheris.db` from an exported backup using a one-off gateway container with the same named volume, then restart the gateway. Startup invalidates restored sessions. Verify sign-in, one observation, and one decision replay. Preserve the original database until the drill passes.

## Quota and release gate

Keep the OCI account on its Free plan; check compute, block storage, outbound transfer, and logs in the OCI console. Use a single primary host, bounded polling, small areas, and manual backups. Temporary promotional credits and Google Cloud trial resources are outside the operating plan.

Before an external pilot, run the repo tests and Arm image build in CI, exercise live adapters from the VM, check source terms and attribution, test HTTPS/auth/restore, and run a sustained workload within the free quota. **Do not label the platform fully live** until rights-cleared flight and camera sources, the requested regional coverage, and all required feed categories pass this gate. A provider outage must display delayed or unavailable status.
