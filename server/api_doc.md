# News Personalization API Documentation

## Models:

_User_

- id: integer, primary key, auto-increment
- email: string, unique (required, email format)
- password: string (required)
- createdAt: date
- updatedAt: date

_Collection_

- id: integer, primary key, auto-increment
- userId: integer (required, foreign key)
- country: string (required)
- language: string (required)
- theme: string (required)
- createdAt: date
- updatedAt: date

## Base URL

```
https://ip-fikri-59c31.web.app/
```

## Authentication

Some endpoints require authentication. Add the following header to your requests:

```
Authorization: Bearer <your_access_token>
```

## Endpoints:

### 🔐 Authentication

#### `POST /register`

- **Description**: Register a new user
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "id": 1,
    "email": "user@example.com"
  }
  ```
- **Error Responses**:
  - **400 (Bad Request)**:
    ```json
    {
      "message": "Email is required"
    }
    ```
    ```json
    {
      "message": "Password is required"
    }
    ```
    ```json
    {
      "message": "Email already exists"
    }
    ```

---

#### `POST /login`

- **Description**: Login and get access token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cC...",
    "email": "user@example.com"
  }
  ```
- **Error Responses**:
  - **400 (Bad Request)**:
    ```json
    {
      "message": "Email is required"
    }
    ```
    ```json
    {
      "message": "Password is required"
    }
    ```
    ```json
    {
      "message": "Invalid email/password"
    }
    ```

---

#### `POST /google-login`

- **Description**: Login with Google account
- **Request Body**:
  ```json
  {
    "token": "google_id_token"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cC...",
    "email": "user@gmail.com"
  }
  ```
- **Error Responses**:
  - **400 (Bad Request)**:
    ```json
    {
      "message": "Google token is required"
    }
    ```
    ```json
    {
      "message": "Invalid Google token"
    }
    ```

---

### 📚 Collections

#### `POST /collections`

- **Description**: Create a new collection
- **Headers Required**: `Authorization: Bearer <token>`
- **Auth**: ✅
- **Request Body**:
  ```json
  {
    "country": "United States",
    "language": "English",
    "theme": "Technology"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "id": 1,
    "userId": 2,
    "country": "United States",
    "language": "English",
    "theme": "Technology",
    "updatedAt": "2025-05-01T12:00:00.000Z",
    "createdAt": "2025-05-01T12:00:00.000Z"
  }
  ```
- **Error Responses**:
  - **401 (Unauthorized)**:
    ```json
    {
      "message": "Invalid token"
    }
    ```
  - **400 (Bad Request)**:
    ```json
    {
      "message": "Country is required"
    }
    ```
    ```json
    {
      "message": "Language is required"
    }
    ```
    ```json
    {
      "message": "Theme is required"
    }
    ```

---

#### `GET /users/:userId/collections`

- **Description**: Get all collections for a user
- **URL**: `/users/1/collections`
- **Headers Required**: `Authorization: Bearer <token>`
- **Auth**: ✅
- **Success Response (200)**:
  ```json
  [
    {
      "id": 1,
      "userId": 1,
      "country": "United States",
      "language": "English",
      "theme": "Technology",
      "createdAt": "2025-05-01T12:00:00.000Z",
      "updatedAt": "2025-05-01T12:00:00.000Z"
    },
    {
      "id": 2,
      "userId": 1,
      "country": "Japan",
      "language": "Japanese",
      "theme": "Science",
      "createdAt": "2025-05-01T13:00:00.000Z",
      "updatedAt": "2025-05-01T13:00:00.000Z"
    }
  ]
  ```
- **Error Responses**:
  - **401 (Unauthorized)**:
    ```json
    {
      "message": "Invalid token"
    }
    ```
  - **403 (Forbidden)**:
    ```json
    {
      "message": "You are not authorized to access this resource"
    }
    ```

---

#### `GET /collections/:id`

- **Description**: Get a collection by ID
- **URL**: `/collections/1`
- **Headers Required**: `Authorization: Bearer <token>`
- **Auth**: ✅
- **Success Response (200)**:
  ```json
  {
    "id": 1,
    "userId": 1,
    "country": "United States",
    "language": "English",
    "theme": "Technology",
    "createdAt": "2025-05-01T12:00:00.000Z",
    "updatedAt": "2025-05-01T12:00:00.000Z"
  }
  ```
- **Error Responses**:
  - **401 (Unauthorized)**:
    ```json
    {
      "message": "Invalid token"
    }
    ```
  - **403 (Forbidden)**:
    ```json
    {
      "message": "You are not authorized to access this resource"
    }
    ```
  - **404 (Not Found)**:
    ```json
    {
      "message": "Collection with id 1 is not found"
    }
    ```

---

#### `PUT /collections/:id`

- **Description**: Update a collection
- **URL**: `/collections/1`
- **Headers Required**: `Authorization: Bearer <token>`
- **Auth**: ✅
- **Request Body**:
  ```json
  {
    "country": "Canada",
    "language": "English",
    "theme": "Sports"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "message": "Collection updated successfully"
  }
  ```
- **Error Responses**:
  - **401 (Unauthorized)**:
    ```json
    {
      "message": "Invalid token"
    }
    ```
  - **403 (Forbidden)**:
    ```json
    {
      "message": "You are not authorized to access this resource"
    }
    ```
  - **404 (Not Found)**:
    ```json
    {
      "message": "Collection with id 1 is not found"
    }
    ```
  - **400 (Bad Request)**:
    ```json
    {
      "message": "Country is required"
    }
    ```

---

#### `DELETE /collections/:id`

- **Description**: Delete a collection
- **URL**: `/collections/1`
- **Headers Required**: `Authorization: Bearer <token>`
- **Auth**: ✅
- **Success Response (200)**:
  ```json
  {
    "message": "Collection deleted successfully"
  }
  ```
- **Error Responses**:
  - **401 (Unauthorized)**:
    ```json
    {
      "message": "Invalid token"
    }
    ```
  - **403 (Forbidden)**:
    ```json
    {
      "message": "You are not authorized to access this resource"
    }
    ```
  - **404 (Not Found)**:
    ```json
    {
      "message": "Collection with id 1 is not found"
    }
    ```

---

### 📰 News

#### `GET /news/recommendations`

- **Description**: Get personalized news recommendations based on user collections
- **Headers Required**: `Authorization: Bearer <token>`
- **Auth**: ✅
- **Success Response (200)**:
  ```json
  {
    "news": [
      {
        "title": "Technology News: Major Developments in United States",
        "description": "Recent developments in Technology are making headlines across United States.",
        "url": "https://example.com/news/1",
        "urlToImage": "https://example.com/images/tech.jpg",
        "publishedAt": "2025-05-01T12:00:00.000Z",
        "source": {
          "name": "NEWS GenAI Demo"
        },
        "country": "us",
        "language": "en",
        "summary": "This is a demonstration article about Technology in United States."
      },
      {
        "title": "United States's Approach to Technology Creates Global Interest",
        "description": "Experts worldwide are discussing United States's innovative approach to Technology.",
        "url": "https://example.com/news/2",
        "urlToImage": "https://example.com/images/analysis.jpg",
        "publishedAt": "2025-04-30T12:00:00.000Z",
        "source": {
          "name": "Global Analysis"
        },
        "country": "us",
        "language": "en",
        "summary": "A detailed analysis of Technology developments in United States and their global implications."
      }
    ],
    "aiRecommendation": "# Personalized News Recommendations\n\nHere are articles selected for your interest in Technology news from United States in English.\n\n## Top Recommendations\n\n### Article #0: Technology News: Major Developments in United States\n\nThis article is relevant to your interest in Technology because it directly covers recent developments and trends in this field. The content specifically focuses on United States, presented in English, making it a perfect match for your preferences.\n\n### Article #1: United States's Approach to Technology Creates Global Interest\n\nThis article is relevant to your interest in Technology because it directly covers recent developments and trends in this field. The content specifically focuses on United States, presented in English, making it a perfect match for your preferences.\n\n## Summary\n\nThese articles provide comprehensive coverage of Technology topics from United States in English, tailored to your specific interests and preferences.",
    "userPreferences": {
      "country": "United States",
      "language": "English",
      "theme": "Technology"
    }
  }
  ```
- **Error Responses**:
  - **401 (Unauthorized)**:
    ```json
    {
      "message": "Invalid token"
    }
    ```
  - **400 (Bad Request)**:
    ```json
    {
      "message": "You need to create collections first to get personalized news recommendations"
    }
    ```
    ```json
    {
      "message": "Your collection is missing required information (country, language, or theme)"
    }
    ```
    ```json
    {
      "message": "Error fetching news: Network error"
    }
    ```
  - **200 (With specific message)**:
    ```json
    {
      "news": [],
      "message": "No news found for your preferences",
      "userPreferences": {
        "country": "United States",
        "language": "English",
        "theme": "Technology"
      }
    }
    ```
    ```json
    {
      "news": [...],
      "message": "Using demo data (API key not configured)",
      "userPreferences": {
        "country": "United States",
        "language": "English",
        "theme": "Technology"
      }
    }
    ```
    ```json
    {
      "news": [...],
      "message": "Using demo data (API requires payment)",
      "userPreferences": {
        "country": "United States",
        "language": "English",
        "theme": "Technology"
      }
    }
    ```

---

### 🤖 Gemini AI

#### `POST /gemini/generate`

- **Description**: Generate AI content using Gemini
- **Headers Required**: `Authorization: Bearer <token>`
- **Auth**: ✅
- **Request Body**:
  ```json
  {
    "prompt": "Write a summary about recent technology trends"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "content": "Recent technology trends have been dominated by advancements in artificial intelligence, with generative AI being at the forefront. Large language models like GPT-4 and Gemini have revolutionized how businesses approach automation and content creation. Additionally, quantum computing continues to make progress with more companies investing in quantum-resistant encryption. Edge computing has gained traction as IoT devices become more prevalent, allowing for faster data processing at the source rather than in centralized cloud systems. Sustainability in tech has also become a major focus, with companies developing more energy-efficient hardware and carbon-neutral data centers."
  }
  ```
- **Error Responses**:
  - **401 (Unauthorized)**:
    ```json
    {
      "message": "Invalid token"
    }
    ```
  - **400 (Bad Request)**:
    ```json
    {
      "message": "Prompt is required"
    }
    ```

---

#### `POST /gemini/summarize`

- **Description**: Summarize text content using Gemini AI
- **Headers Required**: `Authorization: Bearer <token>`
- **Auth**: ✅
- **Request Body**:
  ```json
  {
    "text": "Long article text that needs to be summarized..."
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "summary": "This article discusses the impact of artificial intelligence on modern journalism, highlighting both benefits like automated fact-checking and challenges including potential bias and job displacement. It concludes that a balanced approach integrating AI tools while maintaining human oversight is optimal for the news industry."
  }
  ```
- **Error Responses**:
  - **401 (Unauthorized)**:
    ```json
    {
      "message": "Invalid token"
    }
    ```
  - **400 (Bad Request)**:
    ```json
    {
      "message": "Text is required"
    }
    ```
