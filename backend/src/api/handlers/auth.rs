use crate::domain::rbac::UserRole;
use crate::state::AppState;
use axum::{extract::State, response::IntoResponse, Json};
use serde::Deserialize;
use serde_json::json;
use sqlx::Row;

#[derive(Debug, Deserialize)]
pub struct SwitchRolePayload {
    pub role: UserRole,
}

#[derive(Debug, Deserialize)]
pub struct LoginPayload {
    pub email: Option<String>,
    pub password: Option<String>,
    pub role: Option<UserRole>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterPayload {
    pub email: String,
    pub password: Option<String>,
    pub full_name: String,
    pub role: Option<UserRole>,
    pub department: Option<String>,
}

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterPayload>,
) -> impl IntoResponse {
    let clean_email = payload.email.trim().to_lowercase();
    let domain = "@elgs.ethereal.co.id";

    // Strictly validate email domain
    if !clean_email.ends_with(domain) {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({
                "error": format!("Work email domain must strictly be {}", domain)
            })),
        );
    }

    if payload.full_name.trim().is_empty() {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "Full name is required"
            })),
        );
    }

    let mut write = state.inner.write();

    // Check if user already exists in memory
    if write
        .users
        .iter()
        .any(|u| u.email.to_lowercase() == clean_email)
    {
        return (
            axum::http::StatusCode::CONFLICT,
            Json(json!({
                "error": "User with this email already exists"
            })),
        );
    }

    let role = payload.role.unwrap_or(UserRole::WarehouseOperator);
    let department = payload
        .department
        .unwrap_or_else(|| "Logistics Operations".to_string());
    let new_user = crate::domain::rbac::AuthUser {
        user_id: uuid::Uuid::new_v4(),
        full_name: payload.full_name.trim().to_string(),
        email: clean_email.clone(),
        role: role.clone(),
        department,
    };

    // If PostgreSQL pool is available, persist user
    if let Some(ref pool) = write.db {
        let pool = pool.clone();
        let user_id = new_user.user_id;
        let email = new_user.email.clone();
        let name = new_user.full_name.clone();
        let role_str = new_user.role.as_str().to_string();
        let dept = new_user.department.clone();

        tokio::spawn(async move {
            let _ = sqlx::query(
                r#"INSERT INTO elgs_users (user_id, email, full_name, role_id, department)
                   VALUES ($1, $2, $3, $4, $5)
                   ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name"#,
            )
            .bind(user_id)
            .bind(email)
            .bind(name)
            .bind(role_str)
            .bind(dept)
            .execute(&pool)
            .await;
        });
    }

    write.users.push(new_user.clone());
    write.current_user = new_user.clone();

    let perms: Vec<_> = new_user.role.permissions().into_iter().collect();

    (
        axum::http::StatusCode::CREATED,
        Json(json!({
            "token": format!("elgs_session_{}", uuid::Uuid::new_v4()),
            "user": new_user,
            "permissions": perms,
            "message": "User registered and authenticated successfully"
        })),
    )
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginPayload>,
) -> impl IntoResponse {
    let pool_opt = state.inner.read().db.clone();
    let mut target_user = None;

    if let Some(ref pool) = pool_opt {
        if let Some(ref email) = payload.email {
            let clean = email.trim().to_lowercase();
            if let Ok(Some(row)) = sqlx::query(
                "SELECT user_id, email, full_name, role_id, department FROM elgs_users WHERE LOWER(email) = LOWER($1) AND is_active = TRUE LIMIT 1",
            )
            .bind(&clean)
            .fetch_optional(pool)
            .await
            {
                let user_id = row.get("user_id");
                let email: String = row.get("email");
                let full_name: String = row.get("full_name");
                let role_str: String = row.get("role_id");
                let department: String = row.get("department");
                let role = UserRole::from_str_opt(&role_str).unwrap_or(UserRole::WarehouseOperator);
                target_user = Some(crate::domain::rbac::AuthUser {
                    user_id,
                    full_name,
                    email,
                    role,
                    department,
                });
            }
        } else if let Some(ref role) = payload.role {
            let role_str = role.as_str();
            if let Ok(Some(row)) = sqlx::query(
                "SELECT user_id, email, full_name, role_id, department FROM elgs_users WHERE role_id = $1 AND is_active = TRUE LIMIT 1",
            )
            .bind(role_str)
            .fetch_optional(pool)
            .await
            {
                let user_id = row.get("user_id");
                let email: String = row.get("email");
                let full_name: String = row.get("full_name");
                let role_str: String = row.get("role_id");
                let department: String = row.get("department");
                let role = UserRole::from_str_opt(&role_str).unwrap_or(UserRole::WarehouseOperator);
                target_user = Some(crate::domain::rbac::AuthUser {
                    user_id,
                    full_name,
                    email,
                    role,
                    department,
                });
            }
        }
    }

    if target_user.is_none() {
        let read = state.inner.read();
        target_user = if let Some(role) = payload.role {
            read.users.iter().find(|u| u.role == role).cloned()
        } else if let Some(ref email) = payload.email {
            let clean = email.trim().to_lowercase();
            read.users
                .iter()
                .find(|u| {
                    let u_email = u.email.to_lowercase();
                    u_email == clean || u_email.starts_with(&clean)
                })
                .cloned()
        } else {
            None
        };
    }

    match target_user {
        Some(user) => {
            let mut write = state.inner.write();
            write.current_user = user.clone();
            let perms: Vec<_> = user.role.permissions().into_iter().collect();
            (
                axum::http::StatusCode::OK,
                Json(json!({
                    "token": format!("elgs_session_{}", uuid::Uuid::new_v4()),
                    "user": user,
                    "permissions": perms,
                    "message": "Authenticated successfully"
                })),
            )
        }
        None => (
            axum::http::StatusCode::UNAUTHORIZED,
            Json(json!({
                "error": "Invalid email or credentials"
            })),
        ),
    }
}

pub async fn logout() -> impl IntoResponse {
    Json(json!({
        "message": "Session terminated successfully"
    }))
}

pub async fn get_current_user(State(state): State<AppState>) -> impl IntoResponse {
    let read = state.inner.read();
    let user = read.current_user.clone();
    let perms: Vec<_> = user.role.permissions().into_iter().collect();
    Json(json!({
        "user": user,
        "permissions": perms
    }))
}

pub async fn switch_role(
    State(state): State<AppState>,
    Json(payload): Json<SwitchRolePayload>,
) -> impl IntoResponse {
    let mut write = state.inner.write();
    if let Some(target_user) = write.users.iter().find(|u| u.role == payload.role) {
        write.current_user = target_user.clone();
    }
    let updated = write.current_user.clone();
    let perms: Vec<_> = updated.role.permissions().into_iter().collect();
    Json(json!({
        "user": updated,
        "permissions": perms,
        "message": format!("Switched active session to {}", updated.full_name)
    }))
}

pub async fn list_audit_trail(State(state): State<AppState>) -> impl IntoResponse {
    let read = state.inner.read();
    let mut logs = read.audit_logs.clone();
    logs.reverse(); // Most recent first
    Json(json!({
        "audit_logs": logs,
        "total": logs.len()
    }))
}
