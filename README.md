# Sports Tournament Management System

This is the frontend of the Sports Tournament Management System built with HTML, CSS (Bootstrap), and JavaScript.

It is designed to provide an interactive and responsive platform for tournament organizers, teams, and participants to manage sports events, registrations, and match schedules. The application features an eye-catching user interface with modern design elements and attractive color combinations.

## Features

### User Authentication

* Login / Register
* Forgot Password (Email-based reset)
* Profile Management

### Tournament Management

* Create and manage tournaments
* View tournament details and schedules
* Track tournament progress

### Team Management

* Team registration
* Manage team information
* View participating teams

### Match Management

* View match fixtures
* Update match results
* Track scores and standings

### Dashboards

* Organizer Dashboard
* Team Dashboard
* Tournament Statistics and Updates

### Responsive UI

Built using Bootstrap 5 for a clean, mobile-first design, which supports the Responsive UI design principle to provide a better user experience across all devices.

### API Integration

It is connected to the backend via REST APIs for handling tournament data, team registrations, match schedules, and user management.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/raheelanwaar03/SportsTMS-Front-End
cd SportsTMS-Front-End
```

### 2. Serve the Frontend

Build it with Docker, and open the terminal in the root folder. Run the following commands:

```bash
docker build -t sports-ui.
docker run -d -p 8080:80 --name sports-frontend sports-ui
```

Then open http://localhost:8080 in your browser. You will see the Front-End of the Sports Tournament Management System running on port 8080.

## Environment Configuration

Make sure the backend APIs are properly configured and running. The frontend communicates with the backend through REST APIs to manage tournaments, teams, matches, and user data.

## Project Highlights

* Modern and Responsive UI Design
* Tournament & Team Management
* Match Scheduling & Result Tracking
* User Authentication System
* REST API Integration
* Dockerized Deployment Support
* Mobile-Friendly User Experience
