use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditRecord {
    pub audit_id: Uuid,
    pub actor_id: Uuid,
    pub actor_name: String,
    pub actor_role: String,
    pub action: String, // e.g. "ORDER_CREATED", "ORDER_UPDATED", "STOCK_OPNAME_APPROVED", "SOD_BLOCKED"
    pub resource_type: String, // "SalesOrder", "WarehouseStock", "Invoice", "FleetRoute"
    pub resource_id: String,
    pub before_state: Option<String>,
    pub after_state: Option<String>,
    pub ip_address: String,
    pub hash_signature: String,
    pub timestamp: DateTime<Utc>,
}

impl AuditRecord {
    pub fn new(
        actor_id: Uuid,
        actor_name: String,
        actor_role: String,
        action: String,
        resource_type: String,
        resource_id: String,
        before_state: Option<String>,
        after_state: Option<String>,
        ip_address: String,
    ) -> Self {
        let audit_id = Uuid::new_v4();
        let timestamp = Utc::now();

        // Non-repudiation cryptographic fingerprint simulation
        let payload = format!(
            "{}:{}:{}:{}:{}:{}",
            audit_id, actor_id, action, resource_type, resource_id, timestamp.to_rfc3339()
        );
        let hash_signature = format!("{:x}", md5_or_simple_hash(&payload));

        Self {
            audit_id,
            actor_id,
            actor_name,
            actor_role,
            action,
            resource_type,
            resource_id,
            before_state,
            after_state,
            ip_address,
            hash_signature,
            timestamp,
        }
    }
}

fn md5_or_simple_hash(input: &str) -> u128 {
    let mut hash: u128 = 0xcbf29ce484222325;
    for byte in input.bytes() {
        hash ^= byte as u128;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    hash
}
