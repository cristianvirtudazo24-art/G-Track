# G!Track Laravel Integration Guide (For Admin Team)

This document provides the technical requirements for the Laravel backend to support the **G!Track-Mobile** application.

## 1. Network Requirements
The Mobile App connects to Laravel via its **Internal IP Address**.
*   **Command**: `php artisan serve --host 0.0.0.0`
*   **Port**: `8000` (Default)
*   **CORS**: Ensure your `config/cors.php` allows requests from all origins (`'*'`) or specifically from the mobile IP.

## 2. Required API Endpoints

All endpoints should be prefixed with `/api` (as per Laravel `api.php` defaults).

### A. Authentication
*   **Method**: `POST`
*   **Path**: `/login`
*   **Payload**:
    ```json
    {
      "email": "user@example.com",
      "password": "...",
      "role": "student|admin",
      "student_id": "STU123" (optional)
    }
    ```
*   **Response**: `{ "success": true, "role": "student" }`

---

### B. Student Dashboard (For Web Admin)
*   **Method**: `GET`
*   **Path**: `/students`
*   **Response**: Array of student objects
    ```json
    [
      { "id": "1", "name": "John Doe", "gender": "male", "latitude": 10.29, "longitude": 123.89, "status": "Active" }
    ]
    ```

---

### C. Alerts History
*   **Method**: `GET`
*   **Path**: `/alerts`
*   **Response**: Array of alert objects
    ```json
    [
      { "id": "101", "type": "warning", "text": "SOS Triggered", "timestamp": "2024-03-20T10:00:00Z" }
    ]
    ```

---

### D. Location Updates (Continuous Sync)
*   **Method**: `POST`
*   **Path**: `/location-updates`
*   **Payload**:
    ```json
    {
      "studentId": "...",
      "latitude": 10.29,
      "longitude": 123.89,
      "battery": 85,
      "status": "Safe",
      "timestamp": "ISO-STRING"
    }
    ```

---

### E. SOS Alerts
*   **Method**: `POST`
*   **Path**: `/sos-alert`
*   **Payload**:
    ```json
    {
      "type": "emergency|safe|help",
      "studentId": "...",
      "location": { "latitude": 10, "longitude": 123 }
    }
    ```

---

### F. Blackout Alert (Power Loss)
*   **Method**: `POST`
*   **Path**: `/blackout-alert`
*   **Payload**:
    ```json
    {
      "studentId": "...",
      "battery": 15,
      "message": "Power is out in my area"
    }
    ```

---

### G. Emergency Video Upload
*   **Method**: `POST`
*   **Path**: `/upload-video`
*   **Header**: `Content-Type: multipart/form-data`
*   **Fields**:
    *   `video`: (The file)
    *   `student_id`: "..."

## 3. Database Reminders
*   Ensure your `students` table has `latitude`, `longitude`, and `status` columns for real-time tracking.
*   Ensure your `alerts` table can store the `type` (info, warning, danger).
