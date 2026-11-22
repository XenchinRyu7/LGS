use crate::domain::rbac::{AuthUser, UserRole};
use crate::state::AppState;
use sqlx::postgres::PgPoolOptions;
use sqlx::{PgPool, Row};
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

pub async fn sync_users_from_db(pool: &PgPool, state: &AppState) -> Result<usize, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT user_id, email, full_name, role_id, department FROM elgs_users WHERE is_active = TRUE",
    )
    .fetch_all(pool)
    .await?;

    let mut db_users = Vec::new();
    for row in rows {
        let user_id = row.try_get("user_id")?;
        let email: String = row.try_get("email")?;
        let full_name: String = row.try_get("full_name")?;
        let role_str: String = row
            .try_get("role_id")
            .unwrap_or_else(|_| "WarehouseOperator".to_string());
        let department: String = row
            .try_get("department")
            .unwrap_or_else(|_| "Logistics Operations".to_string());
        let role = UserRole::from_str_opt(&role_str).unwrap_or(UserRole::WarehouseOperator);

        db_users.push(AuthUser {
            user_id,
            full_name,
            email,
            role,
            department,
        });
    }

    let count = db_users.len();
    if count > 0 {
        let mut write = state.inner.write();
        if let Some(first) = db_users.first().cloned() {
            write.current_user = first;
        }
        write.users = db_users;
    }

    Ok(count)
}
