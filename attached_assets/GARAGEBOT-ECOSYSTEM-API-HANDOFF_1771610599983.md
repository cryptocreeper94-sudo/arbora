# GarageBot — Ecosystem API Return Handoff for Verdara (App #28)

```
SERVICE NAME: GarageBot (Parts Aggregator & Vehicle Management)
API BASE URL: https://garagebot.io/api/ecosystem/v1
AUTHENTICATION METHOD: Trust Layer SSO JWT (Bearer token in Authorization header)

ENDPOINTS:

- GET /equipment — List all user equipment/vehicles
  - Input: None (user identified via JWT Trust Layer ID)
  - Headers: Authorization: Bearer <trust-layer-jwt>
  - Output: { success: true, trustLayerId: string, count: number, equipment: Equipment[] }
  - Example request:
    curl -H "Authorization: Bearer eyJhbG..." https://garagebot.io/api/ecosystem/v1/equipment
  - Example response:
    {
      "success": true,
      "trustLayerId": "tl-mlamvhdd-qvg07fyt",
      "count": 3,
      "equipment": [
        {
          "id": "uuid",
          "vin": "1HGBH41JXMN109186",
          "year": 2024,
          "make": "Honda",
          "model": "CRF450R",
          "trim": null,
          "vehicleType": "motorcycle",
          "engineType": "single-cylinder",
          "engineSize": "449cc",
          "fuelType": "gasoline",
          "transmission": "manual",
          "drivetrain": null,
          "bodyStyle": "dirt bike",
          "currentMileage": 1200,
          "isPrimary": false,
          "imageUrl": null,
          "createdAt": "2025-01-15T00:00:00.000Z",
          "updatedAt": "2025-02-10T00:00:00.000Z"
        }
      ]
    }

- GET /equipment/:id — Get equipment details with service history, maintenance schedule, and reminders
  - Input: Equipment ID (path parameter)
  - Headers: Authorization: Bearer <trust-layer-jwt>
  - Output: { success: true, equipment: Equipment, serviceHistory: ServiceRecord[], maintenanceSchedule: MaintenanceItem[], reminders: Reminder[] }
  - Example request:
    curl -H "Authorization: Bearer eyJhbG..." https://garagebot.io/api/ecosystem/v1/equipment/abc123
  - Example response:
    {
      "success": true,
      "equipment": {
        "id": "abc123",
        "vin": null,
        "year": 2023,
        "make": "Stihl",
        "model": "MS 500i",
        "vehicleType": "equipment",
        "engineType": "2-stroke",
        "engineSize": "79.2cc",
        "fuelType": "gasoline",
        "currentMileage": null,
        "oilType": "Stihl HP Ultra",
        "tireSize": null,
        "notes": "Professional chainsaw - arborist use"
      },
      "serviceHistory": [
        {
          "id": "sr-uuid",
          "serviceType": "Chain Replacement",
          "serviceDate": "2025-01-20T00:00:00.000Z",
          "mileage": null,
          "description": "Replaced cutting chain",
          "totalCost": "45.00",
          "nextServiceDue": "2025-07-20T00:00:00.000Z",
          "nextServiceMileage": null
        }
      ],
      "maintenanceSchedule": [
        {
          "id": "ms-uuid",
          "taskName": "Air Filter Cleaning",
          "intervalMiles": null,
          "intervalMonths": 1,
          "lastCompletedDate": "2025-01-15T00:00:00.000Z",
          "nextDueDate": "2025-02-15T00:00:00.000Z",
          "estimatedCost": "5.00",
          "priority": "normal",
          "status": "upcoming"
        }
      ],
      "reminders": [
        {
          "id": "rem-uuid",
          "serviceType": "Spark Plug Replacement",
          "reminderType": "time",
          "dueMileage": null,
          "dueDate": "2025-03-01T00:00:00.000Z",
          "isCompleted": false
        }
      ]
    }

- GET /maintenance-alerts — Get overdue and upcoming (30-day) maintenance alerts
  - Input: None (user identified via JWT Trust Layer ID)
  - Headers: Authorization: Bearer <trust-layer-jwt>
  - Output: { success: true, trustLayerId: string, alerts: { overdueCount, upcomingCount, overdue: Alert[], upcoming: Alert[] } }
  - Example request:
    curl -H "Authorization: Bearer eyJhbG..." https://garagebot.io/api/ecosystem/v1/maintenance-alerts
  - Example response:
    {
      "success": true,
      "trustLayerId": "tl-mlamvhdd-qvg07fyt",
      "alerts": {
        "overdueCount": 1,
        "upcomingCount": 2,
        "overdue": [
          {
            "id": "ms-uuid",
            "vehicleId": "vehicle-uuid",
            "taskName": "Oil Change",
            "nextDueDate": "2025-01-01T00:00:00.000Z",
            "nextDueMileage": 5000,
            "priority": "high"
          }
        ],
        "upcoming": [
          {
            "id": "ms-uuid-2",
            "vehicleId": "vehicle-uuid",
            "taskName": "Tire Rotation",
            "nextDueDate": "2025-03-01T00:00:00.000Z",
            "nextDueMileage": null,
            "priority": "normal"
          }
        ]
      }
    }

- POST /equipment — Create a new equipment entry (write access)
  - Input: { year: number, make: string, model: string, trim?: string, vehicleType?: string, engineType?: string, engineSize?: string, fuelType?: string, vin?: string, currentMileage?: number, notes?: string }
  - Headers: Authorization: Bearer <trust-layer-jwt>, Content-Type: application/json
  - Output: { success: true, equipment: { id, year, make, model, trim, vehicleType, createdAt } }
  - Required fields: year, make, model
  - Example request:
    curl -X POST -H "Authorization: Bearer eyJhbG..." -H "Content-Type: application/json" \
      -d '{"year": 2024, "make": "Husqvarna", "model": "572 XP", "vehicleType": "equipment", "engineType": "2-stroke", "notes": "Arborist chainsaw"}' \
      https://garagebot.io/api/ecosystem/v1/equipment
  - Example response:
    {
      "success": true,
      "equipment": {
        "id": "new-uuid",
        "year": 2024,
        "make": "Husqvarna",
        "model": "572 XP",
        "trim": null,
        "vehicleType": "equipment",
        "createdAt": "2025-02-20T00:00:00.000Z"
      }
    }

- PATCH /equipment/:id — Update an equipment entry (limited fields)
  - Input: { currentMileage?: number, notes?: string, engineType?: string, engineSize?: string, fuelType?: string, vehicleType?: string, trim?: string }
  - Headers: Authorization: Bearer <trust-layer-jwt>, Content-Type: application/json
  - Output: { success: true, equipment: { id, year, make, model, vehicleType, currentMileage, updatedAt } }
  - Allowed update fields: currentMileage, notes, engineType, engineSize, fuelType, vehicleType, trim
  - Example request:
    curl -X PATCH -H "Authorization: Bearer eyJhbG..." -H "Content-Type: application/json" \
      -d '{"currentMileage": 1500, "notes": "Updated after spring job"}' \
      https://garagebot.io/api/ecosystem/v1/equipment/abc123

WEBHOOKS:
- Not currently available. Verdara should poll /maintenance-alerts periodically (recommended: every 6 hours).
- Webhook support planned for future release — will notify on:
  - maintenance_overdue: When a maintenance task passes its due date
  - service_completed: When the user logs a completed service

RATE LIMITS: 120 requests/minute per Trust Layer ID, 10,000 requests/day

DATA MODEL - Equipment Record:
  - id: UUID (auto-generated)
  - vin: string | null (Vehicle Identification Number)
  - year: number (required)
  - make: string (required) — e.g., "Honda", "Stihl", "Mercury"
  - model: string (required) — e.g., "CRF450R", "MS 500i", "250 Pro XS"
  - trim: string | null
  - vehicleType: string — e.g., "car", "truck", "motorcycle", "boat", "atv", "equipment", "snowmobile", "rv"
  - engineType: string | null — e.g., "v8", "inline-4", "2-stroke", "outboard"
  - engineSize: string | null — e.g., "5.0L", "449cc", "79.2cc"
  - fuelType: string | null — e.g., "gasoline", "diesel", "electric", "2-stroke mix"
  - transmission: string | null
  - drivetrain: string | null
  - bodyStyle: string | null
  - exteriorColor: string | null
  - interiorColor: string | null
  - currentMileage: number | null (in miles or hours, depending on equipment)
  - oilType: string | null
  - oilCapacity: string | null
  - tireSize: string | null
  - isPrimary: boolean
  - imageUrl: string | null
  - notes: string | null
  - createdAt: ISO 8601 timestamp
  - updatedAt: ISO 8601 timestamp

SDK/CLIENT LIBRARY: None currently. Standard REST API with JSON responses.

ADDITIONAL NOTES:
- All endpoints require a valid Trust Layer SSO JWT in the Authorization header (Bearer scheme).
- The JWT must be signed with the shared JWT_SECRET (HS256) and contain iss: "trust-layer-sso".
- Equipment ownership is enforced — users can only access their own equipment via their Trust Layer ID.
- The vehicleType field supports ALL motorized equipment: cars, trucks, motorcycles, boats, ATVs, chainsaws, mowers, snowmobiles, RVs, etc.
- For Verdara's arborist module: log chainsaws and outdoor power equipment with vehicleType: "equipment".
- For Verdara's trip planner: query boats, ATVs, and other recreational vehicles and check maintenance-alerts before trips.
- No sandbox/test environment — use the production API with test Trust Layer accounts.
```

## Contact
**App:** GarageBot (Parts Aggregator)
**Stack:** React + Express + PostgreSQL on Replit
**SSO:** Trust Layer JWT (HS256, shared JWT_SECRET)
**Trust Layer ID format:** tl-xxxx-xxxx
**Live URL:** https://garagebot.io
