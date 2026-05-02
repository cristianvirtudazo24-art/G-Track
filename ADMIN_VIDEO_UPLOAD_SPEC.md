# G!Track Mobile App - Video Upload Implementation
**Based on Official Admin Backend Specification**

---

## Endpoint Information

**Method:** `POST`  
**Endpoint:** `/api/notifications/send`  
**Content-Type:** `multipart/form-data` ⚠️ (Critical: NOT JSON)

---

## Required Form Fields

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| **video** | File | ✅ YES | sos.mp4 | Formats: .mp4, .mov, .avi | Max 20MB |
| **student_id** | String/Number | ✅ YES | `"15"` or `15` | Student database ID |
| **target** | String | ✅ YES | `"sos"` | • `sos` = emergency upload <br> • `student_message` = normal video <br> • `blackout` = blackout alert |
| **message** | String | ✅ YES | `"Emergency - I Need Help"` | **REQUIRED** - Backend rejects if missing. Mobile app provides fallback: "Video uploaded" |

---

## Optional Telemetry Fields

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| **latitude** | Numeric | `10.2952` | GPS latitude coordinate |
| **longitude** | Numeric | `123.8955` | GPS longitude coordinate |
| **battery_level** | Integer | `85` | Battery percentage (0-100) |
| **signal** | String | `"WiFi - Good"` | Network signal status |
| **location** | String | `"123 Main St, City"` | Human-readable address |

---

## Success Response (HTTP 200 OK)

```json
{
    "success": true,
    "message": "Emergency alert received by Admin!",
    "notification_id": 105
}
```

---

## Error Responses

### Invalid Student ID (HTTP 404)
```json
{
    "success": false,
    "message": "Invalid Student ID"
}
```

### Validation Error (HTTP 422)
Triggered when:
- **message** field is missing (REQUIRED)
- Video file exceeds 20MB
- Video format is not .mp4, .mov, or .avi

```json
{
    "success": false,
    "message": "Validation error - check required fields"
}
```

---

## Test cURL Command

```bash
curl -X POST http://192.168.110.48:8007/api/notifications/send \
  -F "video=@sos.mp4" \
  -F "student_id=15" \
  -F "target=sos" \
  -F "message=Emergency - I Need Help" \
  -F "latitude=10.2952" \
  -F "longitude=123.8955" \
  -F "battery_level=85" \
  -F "signal=WiFi - Good"
```

---

## Mobile App Implementation

### Video Upload Code (TypeScript)

**File:** `services/api.ts`

```typescript
export const uploadEmergencyVideo = async (payload: {
  videoUri: string;
  studentId: string;
  message?: string;
  latitude?: string | number;
  longitude?: string | number;
  battery_level?: string | number;
  signal?: string;
  isEmergency?: boolean; // true for SOS, false for student_message
}) => {
  const { videoUri, studentId, message, latitude, longitude, battery_level, signal, isEmergency = false } = payload;

  const formData = new FormData();
  formData.append('video', { uri: videoUri, type: 'video/mp4', name: 'sos.mp4' });
  formData.append('student_id', studentId);
  
  // Use correct target based on emergency type
  formData.append('target', isEmergency ? 'sos' : 'student_message');
  
  // Message is REQUIRED - use fallback if not provided
  formData.append('message', message || 'Video uploaded');
  
  if (latitude !== undefined && latitude !== null) formData.append('latitude', String(latitude));
  if (longitude !== undefined && longitude !== null) formData.append('longitude', String(longitude));
  if (battery_level !== undefined && battery_level !== null) formData.append('battery_level', String(battery_level));
  if (signal) formData.append('signal', signal);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60-second timeout

  try {
    const response = await fetch(`${API_BASE_URL}/notifications/send`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle specific error codes per admin spec
    if (response.status === 404) {
      console.error('❌ API Error: Invalid Student ID');
      return null;
    }

    if (response.status === 422) {
      console.error('❌ API Error: Validation Error (file too large or missing required field)');
      return null;
    }

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', responseData);
      return null;
    }

    console.log('✅ Video uploaded successfully');
    return responseData;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('❌ API Error: Video Upload Failed', error.message || error);
    return null;
  }
};
```

### Video Recording (React Native)

**File:** `hooks/useEmergencyRecord.ts`

- Records **max 5-second** video
- Enforces **20MB file size limit**
- Falls back to 3-second recording if exceeds 20MB
- Automatically handles compression

### When App Calls Upload

**File:** `app/tabs/(tabs)/home.tsx`

When user clicks "I Need Help":
```typescript
const uploadResult = await uploadEmergencyVideo({
  videoUri,
  studentId: String(studentId),
  message: 'Emergency - I Need Help', // REQUIRED per admin spec
  latitude: location?.coords?.latitude,
  longitude: location?.coords?.longitude,
  battery_level: batteryPercent,
  signal: signalStrength,
  isEmergency: true, // Marks as SOS
});
```

---

## Key Implementation Details

✅ **Multipart/form-data** - Required for file upload  
✅ **Video Compression** - Local compression to stay under 20MB  
✅ **Message Field** - Always included (REQUIRED by backend)  
✅ **Target Values** - `"sos"` for emergencies, `"student_message"` for normal uploads  
✅ **Timeout Handling** - 60-second timeout using AbortController  
✅ **Error Handling** - Specific handling for 404, 422, and other errors  
✅ **Response Parsing** - Extracts `notification_id` on success  

---

## What Happens On Video Upload

1. **User clicks "I Need Help" button**
2. **App records 5-second video** with automatic compression
3. **App sends to POST `/api/notifications/send`** with multipart form data
4. **Backend validates:**
   - Student ID exists → Returns 404 if not
   - Message field is present → Returns 422 if missing
   - Video file ≤ 20MB → Returns 422 if too large
   - Video format is .mp4/.mov/.avi → Returns 422 if invalid
5. **Backend stores video** to local storage
6. **Backend returns** `{success: true, notification_id: X}`
7. **App shows confirmation** to student
8. **Admin receives notification** with video attached

---

## Important Notes

1. **Message is REQUIRED** - Backend will reject requests without it (HTTP 422)
2. **Max file size is 20MB** - Per admin specification, not 6MB
3. **Supports multiple formats** - .mp4, .mov, and .avi (check admin implementation)
4. **60-second timeout** - For uploading large files over slower networks
5. **Local storage** - Videos stored on admin's machine, not in database
6. **Response field** - Use `notification_id` from response, not `video_id`
7. **Error codes matter**:
   - **404** = Invalid Student ID
   - **422** = Validation error (missing/invalid fields, file too large)
   - **5xx** = Server error
