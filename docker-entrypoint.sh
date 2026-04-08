#!/bin/bash
set -e

PGDATA="/var/lib/postgresql/data"

if [ -z "${DB_PASSWORD}" ]; then
    echo "[ENTRYPOINT] ERROR: DB_PASSWORD environment variable is not set. Aborting."
    exit 1
fi

export PGPASSWORD="${DB_PASSWORD}"

echo "[ENTRYPOINT] Starting wealth-tracker entrypoint script..."

# Init DB if not created
if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "[ENTRYPOINT] Initializing Postgres database in $PGDATA..."
    
    # Ensure correct ownership
    chown -R postgres:postgres "$PGDATA"
    
    # Init DB with trust for local setup
    su - postgres -c "/usr/lib/postgresql/15/bin/initdb -D $PGDATA --auth-local=trust --auth-host=trust"
    
    # Start Postgres temporarily
    echo "[ENTRYPOINT] Starting temporary Postgres instance..."
    su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D $PGDATA -o '-c listen_addresses=localhost' -w start"
    
    echo "[ENTRYPOINT] Configuring database..."
    # Create the database and set the password
    su - postgres -c "psql -h localhost -U postgres -d postgres <<EOF
ALTER USER postgres WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE ${DB_DATABASE:-wealth_tracker};
EOF"
    
    echo "[ENTRYPOINT] Verifying database creation..."
    su - postgres -c "psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw ${DB_DATABASE:-wealth_tracker}" && echo "[ENTRYPOINT] Database verified." || (echo "[ENTRYPOINT] Database creation failed!" && exit 1)

    echo "[ENTRYPOINT] Stopping temporary Postgres instance..."
    su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D $PGDATA -m fast -w stop"
    
    echo "[ENTRYPOINT] Securing Postgres configuration..."
    # Apply final security settings
    echo "host all all 0.0.0.0/0 md5" > "$PGDATA/pg_hba.conf"
    echo "host all all 127.0.0.1/32 md5" >> "$PGDATA/pg_hba.conf"
    echo "local all all trust" >> "$PGDATA/pg_hba.conf"
    echo "listen_addresses='*'" >> "$PGDATA/postgresql.auto.conf"
    echo "[ENTRYPOINT] Database initialization complete."
else
    echo "[ENTRYPOINT] Postgres data directory is already initialized."
    # Ensure ownership is correct
    /bin/chown -R postgres:postgres "$PGDATA"
fi

echo "[ENTRYPOINT] Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

