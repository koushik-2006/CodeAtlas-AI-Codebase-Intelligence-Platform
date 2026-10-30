import { db } from "../lib/server/db";
import { parseSourceCode } from "../lib/server/code-parser";

const repoId = "tourist-management-system";
const userId = "usr_mvpeeds8_ab8848";

const files = [
  {
    path: "README.md",
    content: `# Tourist Management System (TMS)

A complete full-stack tourist and destination reservation intelligence platform.

## Architecture
- **Backend**: Node.js, Express, REST API endpoints, PostgreSQL schema
- **Frontend**: React, TypeScript, responsive reservation explorer
- **CI/CD**: GitHub Actions workflow automation (.github/workflows/deploy.yml)

## Quick Start
\`\`\`bash
# Backend setup
cd backend && npm install && npm start

# Frontend setup
cd frontend && npm install && npm run dev
\`\`\`
`,
  },
  {
    path: ".github/workflows/deploy.yml",
    content: `name: Production Deployment CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install Dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      - name: Run Backend Tests
        run: cd backend && npm test
      - name: Build Frontend
        run: cd frontend && npm run build
`,
  },
  {
    path: "backend/routes/api.js",
    content: `const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');

// Destination & Tour Endpoints
router.get('/api/v1/tours', tourController.getAllTours);
router.get('/api/v1/tours/:id', tourController.getTourById);
router.post('/api/v1/tours', tourController.createTour);
router.put('/api/v1/tours/:id', tourController.updateTour);
router.delete('/api/v1/tours/:id', tourController.deleteTour);

// Bookings & Reservations
router.post('/api/v1/bookings', tourController.createBooking);
router.get('/api/v1/bookings/user/:userId', tourController.getUserBookings);

module.exports = router;
`,
  },
  {
    path: "backend/controllers/tourController.js",
    content: `const Tour = require('../models/Tour');

exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.findAll();
    res.json({ success: true, count: tours.length, data: tours });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ success: false, message: 'Tour not found' });
    res.json({ success: true, data: tour });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({ success: true, data: newTour });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const updated = await Tour.update(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.delete(req.params.id);
    res.json({ success: true, message: 'Tour deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const booking = await Tour.createBooking(req.body);
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Tour.findBookingsByUser(req.params.userId);
    res.json({ success: true, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
`,
  },
  {
    path: "backend/models/Tour.js",
    content: `// Tour Database Model
class Tour {
  static async findAll() {
    return [
      { id: 1, title: "Himalayan Foothills Trek", durationDays: 5, price: 450 },
      { id: 2, title: "Coastal Kerala Backwaters Cruise", durationDays: 3, price: 320 },
      { id: 3, title: "Golden Triangle Cultural Heritage Tour", durationDays: 6, price: 580 },
    ];
  }

  static async findById(id) {
    const tours = await this.findAll();
    return tours.find((t) => t.id === Number(id)) || null;
  }

  static async create(data) {
    return { id: Date.now(), ...data };
  }

  static async update(id, data) {
    return { id: Number(id), ...data, updatedAt: new Date().toISOString() };
  }

  static async delete(id) {
    return true;
  }

  static async createBooking(data) {
    return { id: "bk_" + Date.now(), status: "confirmed", ...data };
  }

  static async findBookingsByUser(userId) {
    return [{ id: "bk_101", userId, tourId: 1, passengers: 2, status: "confirmed" }];
  }
}

module.exports = Tour;
`,
  },
  {
    path: "backend/database.sql",
    content: `-- PostgreSQL Database Schema for Tourist Management System
CREATE TABLE IF NOT EXISTS destinations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    description TEXT,
    climate VARCHAR(50),
    rating DECIMAL(2,1) DEFAULT 4.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tours (
    id SERIAL PRIMARY KEY,
    destination_id INT REFERENCES destinations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    duration_days INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    max_capacity INT NOT NULL,
    difficulty_level VARCHAR(50) DEFAULT 'Moderate',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    tour_id INT REFERENCES tours(id) ON DELETE RESTRICT,
    user_id VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    passengers_count INT NOT NULL DEFAULT 1,
    total_amount DECIMAL(10,2) NOT NULL,
    booking_status VARCHAR(50) DEFAULT 'confirmed',
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tours_destination ON tours(destination_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
`,
  },
  {
    path: "backend/package.json",
    content: `{
  "name": "tourist-management-backend",
  "version": "1.0.0",
  "description": "Express REST API for Tourist Management System",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.19.2",
    "pg": "^8.11.5",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^7.0.0"
  }
}
`,
  },
  {
    path: "frontend/src/App.tsx",
    content: `import React, { useState, useEffect } from 'react';
import { TourList } from './components/TourList';

export interface TourItem {
  id: number;
  title: string;
  durationDays: number;
  price: number;
}

export function App() {
  const [tours, setTours] = useState<TourItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/tours')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setTours(data.data);
      })
      .catch((err) => console.error('Failed to fetch tours:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tourist Management System</h1>
        <p className="text-gray-600">Explore curated tour destinations and itineraries</p>
      </header>
      {loading ? (
        <p>Loading destination catalogs...</p>
      ) : (
        <TourList tours={tours} />
      )}
    </div>
  );
}
`,
  },
  {
    path: "frontend/src/components/TourList.tsx",
    content: `import React from 'react';
import { TourItem } from '../App';

interface TourListProps {
  tours: TourItem[];
}

export function TourList({ tours }: TourListProps) {
  if (tours.length === 0) {
    return <div className="text-gray-500 py-4">No active tour packages found.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tours.map((t) => (
        <div key={t.id} className="border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition">
          <h2 className="text-xl font-semibold text-gray-800">{t.title}</h2>
          <div className="mt-3 flex justify-between items-center text-sm text-gray-600">
            <span>Duration: {t.durationDays} days</span>
            <span className="text-lg font-bold text-emerald-600">\${t.price}</span>
          </div>
          <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded">
            Book Destination
          </button>
        </div>
      ))}
    </div>
  );
}
`,
  },
  {
    path: "frontend/public/index.html",
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Tourist Management System</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`,
  },
  {
    path: "frontend/package.json",
    content: `{
  "name": "tourist-management-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "vite": "^5.2.11"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
`,
  },
  {
    path: "scripts/seed-database.sh",
    content: `#!/usr/bin/env bash
# Seed database schema for Tourist Management System
set -e

DB_NAME="tourist_db"
DB_USER="postgres"

echo "Initializing database: $DB_NAME..."
psql -U "$DB_USER" -d "$DB_NAME" -f backend/database.sql
echo "Database schema seeded successfully!"
`,
  },
  {
    path: "tests/api.test.ts",
    content: `describe("Tourist Management System API Suite", () => {
  it("verifies tour listing endpoint response format", async () => {
    const mockTours = [
      { id: 1, title: "Himalayan Foothills Trek", durationDays: 5, price: 450 },
    ];
    expect(mockTours).toHaveLength(1);
    expect(mockTours[0].price).toBeGreaterThan(0);
  });

  it("validates booking creation schema bounds", () => {
    const booking = {
      tourId: 1,
      customerName: "Jane Explorer",
      passengersCount: 2,
    };
    expect(booking.passengersCount).toBe(2);
  });
});
`,
  },
  {
    path: "package.json",
    content: `{
  "name": "tourist-management-system",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "backend",
    "frontend"
  ],
  "scripts": {
    "backend": "npm --workspace=backend run start",
    "frontend": "npm --workspace=frontend run dev",
    "test": "npm --workspace=backend test"
  }
}
`,
  },
];

console.log(`Seeding Tourist Management System (${files.length} real files)...`);

const repo = db.getRepository(repoId, userId);
if (repo) {
  repo.fileCount = files.length;
  repo.isIndexed = true;
  repo.status = "ready";
  repo.progress = 100;
  repo.lastAnalyzed = new Date().toISOString();
  db.saveRepository(repo);
}

const dbFiles = files.map((f, idx) => ({
  id: `tms_f_${idx}`,
  repositoryId: repoId,
  path: f.path,
  name: f.path.split("/").pop() || f.path,
  language: f.path.endsWith(".sql")
    ? "sql"
    : f.path.endsWith(".yml")
    ? "yaml"
    : f.path.endsWith(".js")
    ? "javascript"
    : f.path.endsWith(".tsx") || f.path.endsWith(".ts")
    ? "typescript"
    : f.path.endsWith(".json")
    ? "json"
    : f.path.endsWith(".sh")
    ? "shell"
    : f.path.endsWith(".html")
    ? "html"
    : "markdown",
  size: Buffer.byteLength(f.content, "utf8"),
  lineCount: f.content.split("\n").length,
  content: f.content,
}));

db.saveRepositoryFiles(repoId, dbFiles);

// Parse and seed AST symbols
const allSymbols = [];
const allRels = [];
for (const f of dbFiles) {
  const parsed = parseSourceCode(repoId, f.path, f.content);
  allSymbols.push(...parsed.symbols);
  allRels.push(...parsed.relationships);
}

db.saveCodeSymbols(repoId, allSymbols);
db.saveCodeRelationships(repoId, allRels);

if (repo) {
  repo.symbolCount = allSymbols.length;
  db.saveRepository(repo);
}

console.log(`✅ Successfully seeded: ${dbFiles.length} files, ${allSymbols.length} AST symbols, ${allRels.length} relationships!`);
