# RuralMed (Innoveda) — System Requirements

---

## 1. Problem Statement

Rural healthcare centers face:
- Limited or no internet connectivity
- High patient load with minimal staff
- Paper-based record inefficiencies
- Lack of real-time decision support
- Poor tracking of patient history and referrals

---

## 2. System Objectives

- Digitize patient records with minimal effort
- Ensure offline-first functionality
- Provide quick access to medical history
- Enable basic clinical decision support
- Improve operational efficiency in PHCs

---

## 3. Core System Needs

### 3.1 Offline-First Architecture
- Must work without internet
- Local data persistence required
- Background sync when connection is restored

---

### 3.2 Fast Data Entry
- Minimal typing required
- Pre-filled fields where possible
- Dropdowns for common values

---

### 3.3 Data Reliability
- No data loss during connectivity issues
- Conflict resolution strategy during sync
- Timestamp-based updates

---

### 3.4 Clinical Safety
- Input validation for vitals
- Alerts for abnormal values
- Prevention of incorrect data entry

---

### 3.5 Usability in Rural Context
- Simple UI with low cognitive load
- Large touch-friendly inputs
- Clear navigation

---

### 3.6 System Transparency
- Show sync status clearly
- Indicate online/offline mode
- Feedback on every action

---

## 4. Functional Requirements

### 4.1 Authentication & User Management
- Login/logout
- Role-based access
- Session persistence

---

### 4.2 Patient Management
- Create, read, update patient records
- Search and filter functionality
- Store demographics and identifiers

---

### 4.3 Vitals & Medical Records
- Record BP, temperature, weight
- Store allergies and comorbidities
- Maintain visit history

---

### 4.4 Prescription System
- Create and store prescriptions
- Link prescriptions to patients
- View prescription history

---

### 4.5 Referral System
- Refer patients to higher centers
- Track referral details and urgency

---

### 4.6 Inventory Management
- Track drug stock levels
- Update inventory
- Display low stock alerts

---

### 4.7 Dashboard
- Overview metrics
- Recent activity
- Quick actions

---

### 4.8 Notifications
- Success/error messages
- Alerts for abnormal vitals
- System feedback

---

## 5. Non-Functional Requirements

### Performance
- Fast response (<2 seconds)

### Reliability
- Offline capability
- Data sync consistency

### Security
- Authentication
- Basic data protection

### Scalability
- Modular architecture
- Expandable backend

---

## 6. Technical Requirements

### Frontend
- React (Vite)
- Component-based UI

### Backend
- Node.js / Express
- REST APIs

### Database
- MongoDB / SQL / Firebase

### Local Storage
- IndexedDB / LocalStorage

---

## 7. Current Limitations / Gaps

### 7.1 Input Validation Gaps
- No strict validation for:
  - Temperature range
  - Blood pressure limits
- Risk of incorrect data entry

---

### 7.2 Lack of Visible System State
- No clear indication of:
  - Online/offline mode
  - Sync status
- Reduces user trust

---

### 7.3 Empty State Handling
- Dashboard appears empty without data
- No guided actions for first-time users

---

### 7.4 Limited Clinical Intelligence
- No automated alerts for:
  - High BP
  - Abnormal vitals
- No decision support

---

### 7.5 Inventory Intelligence Missing
- No predictive alerts
- Only static stock display

---

### 7.6 Interaction Feedback
- Limited user feedback:
  - No loading indicators
  - No success/error toasts

---

### 7.7 Data Visibility
- Backend connection not visible to user
- System appears static despite being dynamic

---

## 8. Required Fixes / Improvements

### 8.1 Input Validation
- Add range checks:
  - Temperature: 95–110°F
  - BP: realistic thresholds
- Show inline error messages

---

### 8.2 System Status Indicators
- Add:
  - "Offline Mode" indicator
  - "Last Synced" timestamp
- Visual sync feedback

---

### 8.3 Smart Empty States
- Replace blank states with:
  - Guidance messages
  - Action prompts

---

### 8.4 Clinical Alerts
- Highlight abnormal vitals:
  - High BP → red indicator
  - Fever → warning
- Add basic rule-based alerts

---

### 8.5 AI Assistance (Optional)
- Add simple rule engine:
  - Detect patterns in vitals
  - Suggest possible risks

---

### 8.6 Interaction Feedback
- Add:
  - Toast notifications
  - Loading spinners
  - Button feedback states

---

### 8.7 Data Seeding for Demo
- Preload sample data:
  - Patients
  - Prescriptions
  - Inventory
- Improve demo experience

---

### 8.8 Inventory Alerts
- Highlight low stock visually
- Add threshold-based warnings

---

### 8.9 UX Improvements
- Step-based form flow
- Reduce cognitive load
- Improve navigation clarity

---

## 9. Future Enhancements

- Multi-language support
- Mobile app version
- Integration with ABHA APIs
- Advanced AI diagnostics
- Telemedicine support
- Analytics dashboard for PHCs

---

## 10. Assumptions

- Users have basic digital knowledge
- System used in PHCs
- Connectivity is intermittent