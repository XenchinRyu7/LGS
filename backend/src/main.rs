use enterprise_logistics_backend::{api, state::AppState};
use std::net::SocketAddr;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Load root .env or local .env
    dotenvy::dotenv().ok();
    if std::path::Path::new("../.env").exists() {
        dotenvy::from_path("../.env").ok();
    }
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "enterprise_logistics_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let mut db_pool = None;
    if let Ok(db_url) = std::env::var("DATABASE_URL") {
        if !db_url.trim().is_empty() {
            info!("📦 Initializing PostgreSQL database connection pool...");
            db_pool = enterprise_logistics_backend::db::init_db_pool(&db_url).await;
        }
    }

    let state = AppState::with_db(db_pool);
    let app = api::create_router(state);

    if let Ok(redis_url) = std::env::var("REDIS_URL") {
        if !redis_url.trim().is_empty() {
            info!("⚡ Redis configuration loaded from environment");
        }
    }

    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()
        .unwrap_or(8080);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    info!(
        "🚀 ELGS — Ethereal Logistics Management Engine listening on http://{}",
        addr
    );

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
