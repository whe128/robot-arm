# Robot Arm
A Next.js web application for visualizing and controlling 3D robot arm models. Built with React, Three.js, and URDF loader for realistic robot model rendering.

<p align="center">
  <img width="400" height="711" alt="ezgif-71c572fce7626dd4" src="https://github.com/user-attachments/assets/ab14b72c-fc79-4b07-80dc-d2a9badd5243" />
</p>

## Features

- **3D Visualization**: Interactive 3D robot arm visualization using Three.js
- **URDF Support**: Load and render robot models from URDF (Unified Robot Description Format) files
- **Modern Web Stack**: Built with Next.js 16, React 19, and Tailwind CSS
- **Responsive Design**: Works seamlessly across different screen sizes

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) 16.2.7
- **UI Library**: [React](https://react.dev) 19.2.4
- **3D Graphics**: [Three.js](https://threejs.org) 0.184.0
- **Robot Format**: [URDF Loader](https://www.npmjs.com/package/urdf-loader) 0.12.7
- **Styling**: [Tailwind CSS](https://tailwindcss.com) 4
- **Bundler**: [Node](https://nodejs.org/)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The page will auto-update as you edit files. Hot module replacement is enabled for fast development.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server

## Project Structure

```
robot-arm/
├── src/           # Source code
├── public/        # Static assets
├── app/           # Next.js app directory
├── package.json   # Project dependencies
└── README.md      # This file
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Three.js Documentation](https://threejs.org/docs/)
- [URDF Format](http://wiki.ros.org/urdf/XML)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## License

This project is open source and available under the MIT License.
