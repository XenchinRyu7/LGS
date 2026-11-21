use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum InvoiceStatus {
    Draft,
    Issued,
    Paid,
    Overdue,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShippingRateQuoteRequest {
    pub origin_city: String,
    pub destination_city: String,
    pub actual_weight_kg: f64,
    pub length_cm: f64,
    pub width_cm: f64,
    pub height_cm: f64,
    pub requires_cold_chain: bool,
    pub is_express: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShippingRateQuoteResponse {
    pub volumetric_weight_kg: f64,
    pub chargeable_weight_kg: f64,
    pub base_rate: f64,
    pub fuel_surcharge: f64,
    pub cold_chain_surcharge: f64,
    pub express_multiplier: f64,
    pub total_shipping_cost: f64,
    pub estimated_transit_days: u32,
}

impl ShippingRateQuoteRequest {
    pub fn calculate(&self) -> ShippingRateQuoteResponse {
        let volumetric_weight = (self.length_cm * self.width_cm * self.height_cm) / 5000.0;
        let chargeable_weight = self.actual_weight_kg.max(volumetric_weight).max(1.0);

        let distance_factor = match (self.origin_city.as_str(), self.destination_city.as_str()) {
            (a, b) if a == b => 15_000.0,
            ("Jakarta", "Bandung") | ("Bandung", "Jakarta") => 25_000.0,
            ("Jakarta", "Surabaya") | ("Surabaya", "Jakarta") => 45_000.0,
            _ => 35_000.0,
        };

        let base_rate = chargeable_weight * distance_factor;
        let fuel_surcharge = base_rate * 0.05;
        let cold_chain_surcharge = if self.requires_cold_chain {
            base_rate * 0.35
        } else {
            0.0
        };

        let express_multiplier = if self.is_express { 1.5 } else { 1.0 };
        let total = (base_rate + fuel_surcharge + cold_chain_surcharge) * express_multiplier;

        let estimated_transit_days = if self.is_express {
            1
        } else if self.origin_city == self.destination_city {
            1
        } else {
            2
        };

        ShippingRateQuoteResponse {
            volumetric_weight_kg: (volumetric_weight * 100.0).round() / 100.0,
            chargeable_weight_kg: (chargeable_weight * 100.0).round() / 100.0,
            base_rate: base_rate.round(),
            fuel_surcharge: fuel_surcharge.round(),
            cold_chain_surcharge: cold_chain_surcharge.round(),
            express_multiplier,
            total_shipping_cost: total.round(),
            estimated_transit_days,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invoice {
    pub invoice_id: Uuid,
    pub invoice_number: String,
    pub order_id: Uuid,
    pub customer_id: String,
    pub customer_name: String,
    pub subtotal: f64,
    pub tax_amount: f64,
    pub total_amount: f64,
    pub status: InvoiceStatus,
    pub created_by: Option<Uuid>,
    pub settled_by: Option<Uuid>,
    pub due_date: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}
