use crate::domain::rbac::UserRole;
use crate::state::AppState;
use axum::{extract::State, response::IntoResponse, Json};
use serde::Deserialize;
use serde_json::json;

#[derive(Debug, Deserialize)]
pub struct SwitchRolePayload {
    pub role: UserRole,
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
