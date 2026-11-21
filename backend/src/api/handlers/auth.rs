use crate::domain::rbac::UserRole;
use crate::state::AppState;
use axum::{extract::State, response::IntoResponse, Json};
use serde::Deserialize;
use serde_json::json;

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

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginPayload>,
) -> impl IntoResponse {
    let mut write = state.inner.write();
    let target_user = if let Some(role) = payload.role {
        write.users.iter().find(|u| u.role == role).cloned()
    } else if let Some(ref email) = payload.email {
        let clean = email.trim().to_lowercase();
        write
            .users
            .iter()
            .find(|u| {
                let u_email = u.email.to_lowercase();
                u_email == clean || u_email.starts_with(&clean)
            })
            .cloned()
    } else {
        None
    };

    match target_user {
        Some(user) => {
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
