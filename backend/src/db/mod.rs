use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::time::Duration;
use tracing::{error, info, warn};

pub async fn init_db_pool(database_url: &str) -> Option<PgPool> {
    if database_url.trim().is_empty() {
        return None;
    }

    info!("Connecting to PostgreSQL database...");
    let pool_res = PgPoolOptions::new()
        .max_connections(10)
        .min_connections(1)
        .acquire_timeout(Duration::from_secs(5))
        .connect(database_url)
        .await;

    match pool_res {
        Ok(pool) => {
            info!("Connected to PostgreSQL successfully");
            // Run automatic schema migration
            if let Err(e) = run_migrations(&pool).await {
                warn!(
                    "PostgreSQL migration warning: {}. Continuing with existing schema...",
                    e
                );
            } else {
                info!("PostgreSQL schema migrations applied successfully");
            }
            Some(pool)
        }
        Err(e) => {
            error!("PostgreSQL connection failed: {}. Running with transactional memory store fallback...", e);
            None
        }
    }
}

pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::Error> {
    let schema_sql = include_str!("../../migrations/0001_init_elgs_schema.sql");
    sqlx::raw_sql(schema_sql).execute(pool).await?;
    Ok(())
}
