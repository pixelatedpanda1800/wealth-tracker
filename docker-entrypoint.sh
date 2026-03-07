#!/bin/bash
set -e

PGDATA="/var/lib/postgresql/data"

# Init DB if not created
if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "Initializing Postgres database..."
    
    # Ensure correct ownership
    chown -R postgres:postgres "$PGDATA"
    
    # Init DB
    echo "postgres" > /tmp/pgpass
    chown postgres:postgres /tmp/pgpass
    su - postgres -c "/usr/lib/postgresql/15/bin/initdb -D $PGDATA --pwfile=/tmp/pgpass"
    rm /tmp/pgpass
    
    # Start Postgres temporarily to set up database
    su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D $PGDATA -o '-c listen_addresses=localhost' -w start"
    
    # Wait for Postgres to be ready
    until su - postgres -c "/usr/lib/postgresql/15/bin/pg_isready -h localhost"; do
      echo "Waiting for Postgres to be ready..."
      sleep 1
    done

    echo "Creating database..."
    su - postgres -c "psql -h localhost -c \"CREATE DATABASE wealth_tracker;\""
    
    # Stop temporary Postgres instance
    su - postgres -c "/usr/lib/postgresql/15/bin/pg_ctl -D $PGDATA -m fast -w stop"
    
    # Allow local and docker network connections
    echo "host all all 0.0.0.0/0 md5" >> "$PGDATA/pg_hba.conf"
    echo "host all all 127.0.0.1/32 md5" >> "$PGDATA/pg_hba.conf"
    echo "listen_addresses='*'" >> "$PGDATA/postgresql.auto.conf"
else
    echo "Postgres data directory is already initialized."
    # Ensure ownership is correct in case volume was mounted from somewhere else
    /bin/chown -R postgres:postgres "$PGDATA"
fi

echo "Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
