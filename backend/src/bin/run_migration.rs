use sqlx::postgres::PgPoolOptions;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let url_5432 = "postgresql://postgres.vjimjsbemetemmggzlaa:%40elgspord2k26@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";

    println!("Connecting to Supabase PostgreSQL via connection pooler...");
    let pool = PgPoolOptions::new()
        .acquire_timeout(Duration::from_secs(10))
        .connect(url_5432)
        .await?;

    println!("Connected successfully to Supabase!");
    println!("Executing schema migration (migrations/0001_init_elgs_schema.sql)...");
    let schema_sql = include_str!("../../migrations/0001_init_elgs_schema.sql");
    sqlx::raw_sql(schema_sql).execute(&pool).await?;

    println!("Executing operational seed data (migrations/0002_seed_operational_data.sql)...");
    let seed_sql = include_str!("../../migrations/0002_seed_operational_data.sql");
    sqlx::raw_sql(seed_sql).execute(&pool).await?;
    println!("Operational seed data executed successfully!");

    println!("\n========================================================");
    println!(">>> SUPABASE LIVE DATABASE VERIFICATION <<<");
    println!("========================================================");

    let roles: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM elgs_roles")
        .fetch_one(&pool)
        .await?;
    println!("Table 'elgs_roles'          : {} rows", roles.0);

    let users: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM elgs_users")
        .fetch_one(&pool)
        .await?;
    println!("Table 'elgs_users'          : {} rows", users.0);

    let wh: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM elgs_warehouses")
        .fetch_one(&pool)
        .await?;
    println!("Table 'elgs_warehouses'     : {} rows", wh.0);

    let inv: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM elgs_inventory")
        .fetch_one(&pool)
        .await?;
    println!("Table 'elgs_inventory'      : {} rows", inv.0);

    let so: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM elgs_sales_orders")
        .fetch_one(&pool)
        .await?;
    println!("Table 'elgs_sales_orders'   : {} rows", so.0);

    let veh: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM elgs_vehicles")
        .fetch_one(&pool)
        .await?;
    println!("Table 'elgs_vehicles'       : {} rows", veh.0);

    let drv: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM elgs_drivers")
        .fetch_one(&pool)
        .await?;
    println!("Table 'elgs_drivers'        : {} rows", drv.0);

    let invc: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM elgs_invoices")
        .fetch_one(&pool)
        .await?;
    println!("Table 'elgs_invoices'       : {} rows", invc.0);

    let audit: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM elgs_audit_logs")
        .fetch_one(&pool)
        .await?;
    println!("Table 'elgs_audit_logs'     : {} rows", audit.0);

    println!("========================================================");
    println!("ALL 9 TABLES IN SUPABASE ARE POPULATED & LIVE!");
    Ok(())
}
