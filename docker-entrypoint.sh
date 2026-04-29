#!/bin/sh
# Container entrypoint.
#
# Runs once as root before exec'ing the app under the unprivileged `nestjs`
# user. The chown is needed because Dokploy mounts a named Docker volume at
# /app/uploads, and freshly created Docker volumes are owned by root by
# default — multer write attempts then fail with EACCES and the connection
# drops with a 502 at the proxy.
#
# This is idempotent and cheap: chown -R only re-stamps when ownership
# differs, so subsequent restarts are no-ops.
set -e

if [ -d /app/uploads ]; then
  chown -R nestjs:nodejs /app/uploads
fi

exec su-exec nestjs "$@"
